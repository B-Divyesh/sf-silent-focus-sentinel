use clap::{Parser, Subcommand, ValueEnum};
use serde::Serialize;
use silent_focus_sentinel::{
    analyze, diff, parse_trace, read_trace, render_html, DiffReport, Report, Trace,
};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
#[command(name = "silent-focus-sentinel", version, about = "Catch silent and repeated announcements in scripted iOS focus traversals", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Analyze one JSON or JSONL focus trace
    Analyze {
        input: PathBuf,
        #[arg(long)]
        json: Option<PathBuf>,
        #[arg(long)]
        html: Option<PathBuf>,
        #[arg(long, value_enum, default_value = "never")]
        fail_on: AnalyzeFailure,
    },
    /// Run a scripted traversal command and save its JSON Lines output
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
    /// Compare baseline and current focus traces
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

fn ensure_parent(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        fs::create_dir_all(parent)
            .map_err(|e| format!("could not create {}: {e}", parent.display()))?;
    }
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
        Commands::Diff {
            baseline,
            current,
            json,
            html,
            fail_on,
        } => {
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
            println!("Found 2 issues across 6 checked focus stops.");
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
