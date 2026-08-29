use clap::{Parser, Subcommand, ValueEnum};
use serde::Serialize;
use silent_focus_sentinel::{
    analyze, diff, parse_trace, read_trace, render_html, DiffReport, Report, Trace,
};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, ExitCode};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
#[command(name = "silent-focus-sentinel", version, about = "Flag silent or repeated VoiceOver focus stops from iOS Simulator captures", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Analyze one JSON or JSONL scripted-check trace
    Analyze {
        input: PathBuf,
        #[arg(long)]
        json: Option<PathBuf>,
        #[arg(long)]
        html: Option<PathBuf>,
        #[arg(long, value_enum, default_value = "never")]
        fail_on: AnalyzeFailure,
    },
    /// Run a scripted check command and save its JSON Lines output
    Record {
        #[arg(long)]
        command: String,
        #[arg(long)]
        output: PathBuf,
        #[arg(long, default_value = "Unknown screen")]
        screen: String,
        #[arg(long, default_value = "iOS Simulator")]
        platform: String,
    },
    /// Run xcodebuild and extract ordered Simulator VoiceOver focus stops
    RecordXctest {
        /// Xcode scheme containing the app capture and UI test
        #[arg(long)]
        scheme: String,
        /// Where to write the captured trace object
        #[arg(long)]
        output: PathBuf,
        /// Simulator destination passed to xcodebuild
        #[arg(long, default_value = "platform=iOS Simulator,name=iPhone 16")]
        destination: String,
        /// Optional Xcode project passed to xcodebuild
        #[arg(long, conflicts_with = "workspace")]
        project: Option<PathBuf>,
        /// Optional Xcode workspace passed to xcodebuild
        #[arg(long, conflicts_with = "project")]
        workspace: Option<PathBuf>,
        /// xcodebuild executable (useful for a wrapper or a pinned Xcode installation)
        #[arg(long, default_value = "xcodebuild")]
        xcodebuild: PathBuf,
        /// Screen name stored in the trace
        #[arg(long, default_value = "VoiceOver simulator traversal")]
        screen: String,
    },
    /// Compare baseline and current scripted-check traces
    Diff {
        baseline: PathBuf,
        current: PathBuf,
        #[arg(long)]
        json: Option<PathBuf>,
        #[arg(long)]
        html: Option<PathBuf>,
        #[arg(long, value_enum, default_value = "never")]
        fail_on: DiffFailure,
    },
    /// Analyze bundled sample data in a disposable directory
    Demo,
}

#[derive(Clone, ValueEnum)]
enum AnalyzeFailure {
    Never,
    Findings,
}
#[derive(Clone, ValueEnum)]
enum DiffFailure {
    Never,
    Regressions,
}

fn write_outputs<T: Serialize + silent_focus_sentinel::HtmlReport>(
    report: &T,
    json: Option<&Path>,
    html: Option<&Path>,
) -> Result<(), String> {
    let pretty = serde_json::to_string_pretty(report).map_err(|e| e.to_string())?;
    if let Some(path) = json {
        ensure_parent(path)?;
        fs::write(path, &pretty).map_err(|e| format!("could not write {}: {e}", path.display()))?;
    } else {
        println!("{pretty}");
    }
    if let Some(path) = html {
        ensure_parent(path)?;
        fs::write(path, render_html(report))
            .map_err(|e| format!("could not write {}: {e}", path.display()))?;
    }
    Ok(())
}

/// Return the filesystem identity a path will have without creating anything.
/// Existing path components are canonicalized, so an output reached through a
/// symlink cannot quietly replace an input reached through its real path.
fn path_identity(path: &Path) -> Result<PathBuf, String> {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|error| format!("could not resolve the working directory: {error}"))?
            .join(path)
    };
    let mut lexical = PathBuf::new();
    for component in absolute.components() {
        match component {
            Component::Prefix(prefix) => lexical.push(prefix.as_os_str()),
            Component::RootDir => lexical.push(component.as_os_str()),
            Component::CurDir => {}
            Component::ParentDir => {
                lexical.pop();
            }
            Component::Normal(name) => lexical.push(name),
        }
    }

    let mut missing = Vec::new();
    let mut existing = lexical.as_path();
    while !existing.exists() {
        let name = existing.file_name().ok_or_else(|| {
            format!(
                "could not resolve a filesystem identity for {}",
                path.display()
            )
        })?;
        missing.push(name.to_os_string());
        existing = existing.parent().ok_or_else(|| {
            format!(
                "could not resolve a filesystem identity for {}",
                path.display()
            )
        })?;
    }
    let mut resolved = fs::canonicalize(existing)
        .map_err(|error| format!("could not resolve {}: {error}", existing.display()))?;
    for name in missing.iter().rev() {
        resolved.push(name);
    }
    Ok(resolved)
}

/// Refuse every destructive or ambiguous report destination before a writer is
/// opened. This must run before trace parsing too: a malformed input is never a
/// reason to permit an output that aliases it.
fn validate_report_paths(
    inputs: &[&Path],
    json: Option<&Path>,
    html: Option<&Path>,
) -> Result<(), String> {
    let input_paths = inputs
        .iter()
        .map(|path| path_identity(path))
        .collect::<Result<Vec<_>, _>>()?;
    let outputs = [("--json", json), ("--html", html)];
    let output_paths = outputs
        .iter()
        .filter_map(|(flag, path)| path.map(|path| (*flag, path)))
        .map(|(flag, path)| Ok((flag, path, path_identity(path)?)))
        .collect::<Result<Vec<_>, String>>()?;

    for (flag, path, identity) in &output_paths {
        if input_paths.iter().any(|input| input == identity) {
            return Err(format!(
                "{flag} path {} matches an input trace; choose a different report path",
                path.display()
            ));
        }
    }
    if output_paths.len() == 2 && output_paths[0].2 == output_paths[1].2 {
        return Err(format!(
            "{} and {} use the same path; JSON and HTML reports need different files",
            output_paths[0].0, output_paths[1].0
        ));
    }
    Ok(())
}

fn ensure_parent(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        fs::create_dir_all(parent)
            .map_err(|e| format!("could not create {}: {e}", parent.display()))?;
    }
    Ok(())
}

fn parse_xctest_events(output: &str) -> Result<Trace, String> {
    const VOICEOVER_MARKER: &str = "SFS_VOICEOVER_STOP:";
    const LEGACY_MARKER: &str = "SFS_EVENT:";
    let events = output
        .lines()
        .filter_map(|line| {
            line.find(VOICEOVER_MARKER)
                .map(|position| &line[position + VOICEOVER_MARKER.len()..])
                .or_else(|| {
                    line.find(LEGACY_MARKER)
                        .map(|position| &line[position + LEGACY_MARKER.len()..])
                })
        })
        .collect::<Vec<_>>()
        .join("\n");
    if events.trim().is_empty() {
        return Err("xcodebuild completed without SFS_VOICEOVER_STOP lines. Add examples/ios/SilentFocusSentinelVoiceOverCapture.swift to the app target, start its observer before the traversal, and print its trace after the test.".into());
    }
    parse_trace(&events).map_err(|error| format!("could not parse marked XCTest events: {error}"))
}

fn record_xctest(
    scheme: &str,
    output: &Path,
    destination: &str,
    project: Option<&Path>,
    workspace: Option<&Path>,
    xcodebuild: &Path,
    screen: String,
) -> Result<(), String> {
    let mut command = Command::new(xcodebuild);
    command
        .arg("test")
        .arg("-scheme")
        .arg(scheme)
        .arg("-destination")
        .arg(destination);
    if let Some(project) = project {
        command.arg("-project").arg(project);
    }
    if let Some(workspace) = workspace {
        command.arg("-workspace").arg(workspace);
    }
    let result = command
        .output()
        .map_err(|error| format!("could not start xcodebuild: {error}"))?;
    let combined = format!(
        "{}\n{}",
        String::from_utf8_lossy(&result.stdout),
        String::from_utf8_lossy(&result.stderr)
    );
    if !result.status.success() {
        return Err(format!(
            "xcodebuild test exited with {}; {}",
            result.status,
            combined.trim()
        ));
    }
    let mut trace = parse_xctest_events(&combined)?;
    trace.screen = screen;
    trace.platform = format!("iOS Simulator ({destination})");
    ensure_parent(output)?;
    fs::write(output, serde_json::to_string_pretty(&trace).unwrap())
        .map_err(|error| format!("could not write {}: {error}", output.display()))?;
    eprintln!(
        "Extracted {} ordered Simulator focus stops to {}",
        trace.events.len(),
        output.display()
    );
    Ok(())
}

fn run(cli: Cli) -> Result<u8, String> {
    match cli.command {
        Commands::Analyze {
            input,
            json,
            html,
            fail_on,
        } => {
            validate_report_paths(&[&input], json.as_deref(), html.as_deref())?;
            let report: Report = analyze(&read_trace(&input)?);
            let failed = matches!(fail_on, AnalyzeFailure::Findings) && !report.findings.is_empty();
            write_outputs(&report, json.as_deref(), html.as_deref())?;
            Ok(u8::from(failed))
        }
        Commands::Record {
            command,
            output,
            screen,
            platform,
        } => {
            let result = Command::new("sh")
                .arg("-c")
                .arg(&command)
                .output()
                .map_err(|e| format!("could not start record command: {e}"))?;
            if !result.status.success() {
                return Err(format!(
                    "record command exited with {}; {}",
                    result.status,
                    String::from_utf8_lossy(&result.stderr).trim()
                ));
            }
            let text = String::from_utf8(result.stdout)
                .map_err(|_| "record command output was not UTF-8".to_string())?;
            let mut trace = parse_trace(&text)?;
            trace.screen = screen;
            trace.platform = platform;
            ensure_parent(&output)?;
            fs::write(&output, serde_json::to_string_pretty(&trace).unwrap())
                .map_err(|e| format!("could not write {}: {e}", output.display()))?;
            eprintln!(
                "Recorded {} focus stops to {}",
                trace.events.len(),
                output.display()
            );
            Ok(0)
        }
        Commands::RecordXctest {
            scheme,
            output,
            destination,
            project,
            workspace,
            xcodebuild,
            screen,
        } => {
            record_xctest(
                &scheme,
                &output,
                &destination,
                project.as_deref(),
                workspace.as_deref(),
                &xcodebuild,
                screen,
            )?;
            Ok(0)
        }
        Commands::Diff {
            baseline,
            current,
            json,
            html,
            fail_on,
        } => {
            validate_report_paths(&[&baseline, &current], json.as_deref(), html.as_deref())?;
            let report: DiffReport = diff(&read_trace(&baseline)?, &read_trace(&current)?);
            let failed =
                matches!(fail_on, DiffFailure::Regressions) && !report.new_findings.is_empty();
            write_outputs(&report, json.as_deref(), html.as_deref())?;
            Ok(u8::from(failed))
        }
        Commands::Demo => {
            let stamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|e| e.to_string())?
                .as_millis();
            let directory = std::env::temp_dir().join(format!(
                "silent-focus-sentinel-demo-{}-{stamp}",
                std::process::id()
            ));
            fs::create_dir(&directory)
                .map_err(|e| format!("could not create demo directory: {e}"))?;
            let sample = include_str!("../examples/sample-trace.json");
            let trace: Trace = parse_trace(sample)?;
            let trace_path = directory.join("sample-trace.json");
            let json_path = directory.join("focus-report.json");
            let html_path = directory.join("focus-report.html");
            fs::write(&trace_path, sample).map_err(|e| e.to_string())?;
            write_outputs(&analyze(&trace), Some(&json_path), Some(&html_path))?;
            println!("Demo — sample data, nothing was saved outside this temporary directory.");
            println!("Found 2 findings across 6 checked elements.");
            println!("JSON: {}", json_path.display());
            println!("HTML: {}", html_path.display());
            Ok(0)
        }
    }
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(code) => ExitCode::from(code),
        Err(error) => {
            eprintln!("silent-focus-sentinel: {error}\nNext: run --help, then check your input path and event format.");
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_xctest_events, validate_report_paths};
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn extracts_marked_xctest_events_from_build_output() {
        let trace = parse_xctest_events(
            "Test Suite started\nSFS_EVENT:{\"id\":\"checkout.title\",\"role\":\"header\",\"text\":\"Checkout\"}\nlog SFS_EVENT:{\"id\":\"checkout.pay\",\"role\":\"button\",\"text\":\"Pay now\"}",
        )
        .unwrap();
        assert_eq!(trace.events.len(), 2);
        assert_eq!(trace.events[1].id, "checkout.pay");
    }

    #[test]
    fn explains_when_xctest_helper_emits_nothing() {
        let error = parse_xctest_events("Test Suite finished").unwrap_err();
        assert!(error.contains("SFS_VOICEOVER_STOP"));
    }

    #[test]
    fn extracts_a_silent_stop_not_named_by_the_xctest_caller() {
        let trace = parse_xctest_events(
            "SFS_VOICEOVER_STOP:{\"index\":1,\"id\":\"checkout.title\",\"role\":\"header\",\"announcement\":\"Checkout\",\"capture\":\"voiceover_simulator\"}\nSFS_VOICEOVER_STOP:{\"index\":2,\"id\":\"checkout.surprise\",\"role\":\"other\",\"announcement\":\"\",\"capture\":\"voiceover_simulator\"}",
        )
        .unwrap();
        assert_eq!(trace.events[1].id, "checkout.surprise");
        assert_eq!(trace.events[1].effective_announcement(), "");
        assert_eq!(trace.events[1].capture, "voiceover_simulator");
    }

    #[test]
    fn rejects_every_report_path_collision_before_a_write() {
        let directory = tempdir().unwrap();
        let input = directory.path().join("trace.json");
        let other = directory.path().join("other.json");
        fs::write(&input, "original trace").unwrap();
        fs::write(&other, "other trace").unwrap();

        assert!(validate_report_paths(&[&input], Some(&input), None).is_err());
        assert!(validate_report_paths(&[&input], Some(&other), Some(&other)).is_err());
        assert!(validate_report_paths(&[&input, &other], Some(&other), None).is_err());
        assert_eq!(fs::read_to_string(&input).unwrap(), "original trace");
        assert_eq!(fs::read_to_string(&other).unwrap(), "other trace");
    }
}
