use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trace {
    #[serde(default = "schema_version")]
    pub schema_version: u8,
    #[serde(default = "default_screen")]
    pub screen: String,
    #[serde(default = "default_platform")]
    pub platform: String,
    pub events: Vec<FocusEvent>,
}

fn schema_version() -> u8 {
    1
}
fn default_screen() -> String {
    "Unknown screen".into()
}
fn default_platform() -> String {
    "iOS Simulator".into()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusEvent {
    #[serde(default)]
    pub index: usize,
    pub id: String,
    pub role: String,
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub value: String,
    #[serde(default)]
    pub hint: String,
    #[serde(default, alias = "announcement")]
    pub text: String,
    #[serde(default)]
    pub ignored: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "camelCase")]
pub struct Finding {
    pub kind: FindingKind,
    pub severity: Severity,
    pub index: usize,
    pub id: String,
    pub role: String,
    pub text: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum FindingKind {
    EmptyText,
    DuplicateText,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub event_count: usize,
    pub analyzed_count: usize,
    pub ignored_count: usize,
    pub finding_count: usize,
    pub empty_count: usize,
    pub duplicate_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub schema_version: u8,
    pub screen: String,
    pub platform: String,
    pub summary: Summary,
    pub findings: Vec<Finding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffReport {
    pub schema_version: u8,
    pub screen: String,
    pub baseline_findings: usize,
    pub current_findings: usize,
    pub new_findings: Vec<Finding>,
    pub resolved_findings: Vec<Finding>,
}

pub fn read_trace(path: &Path) -> Result<Trace, String> {
    let source = fs::read_to_string(path)
        .map_err(|error| format!("could not read {}: {error}", path.display()))?;
    parse_trace(&source).map_err(|error| format!("{}: {error}", path.display()))
}

pub fn parse_trace(source: &str) -> Result<Trace, String> {
    if let Ok(mut trace) = serde_json::from_str::<Trace>(source) {
        validate_trace(&mut trace)?;
        return Ok(trace);
    }

    let mut events = Vec::new();
    for (line_number, line) in source.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let event: FocusEvent = serde_json::from_str(line)
            .map_err(|error| format!("line {} is not a focus event: {error}", line_number + 1))?;
        events.push(event);
    }
    if events.is_empty() {
        return Err("no focus events were found; provide a trace object or JSON Lines".into());
    }
    let mut trace = Trace {
        schema_version: 1,
        screen: default_screen(),
        platform: default_platform(),
        events,
    };
    validate_trace(&mut trace)?;
    Ok(trace)
}

fn validate_trace(trace: &mut Trace) -> Result<(), String> {
    if trace.schema_version != 1 {
        return Err(format!(
            "unsupported schemaVersion {}; expected 1",
            trace.schema_version
        ));
    }
    if trace.events.is_empty() {
        return Err("the trace has no focus events".into());
    }
    let mut ids = BTreeSet::new();
    for (position, event) in trace.events.iter_mut().enumerate() {
        if event.index == 0 {
            event.index = position + 1;
        }
        if event.id.trim().is_empty() {
            return Err(format!("event {} has an empty id", event.index));
        }
        if event.role.trim().is_empty() {
            return Err(format!("event {} has an empty role", event.index));
        }
        if !ids.insert(event.id.clone()) {
            return Err(format!("event id {:?} appears more than once", event.id));
        }
    }
    Ok(())
}

fn normalized(value: &str) -> String {
    value
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}

pub fn analyze(trace: &Trace) -> Report {
    let mut findings = Vec::new();
    let mut previous: Option<&FocusEvent> = None;
    for event in &trace.events {
        if event.ignored {
            continue;
        }
        let text = normalized(&event.text);
        if text.is_empty() {
            findings.push(Finding {
                kind: FindingKind::EmptyText,
                severity: Severity::Error,
                index: event.index,
                id: event.id.clone(),
                role: event.role.clone(),
                text: event.text.clone(),
                message: "This element has empty label/value text.".into(),
            });
        } else if previous.is_some_and(|prior| normalized(&prior.text) == text) {
            findings.push(Finding {
                kind: FindingKind::DuplicateText,
                severity: Severity::Warning,
                index: event.index,
                id: event.id.clone(),
                role: event.role.clone(),
                text: event.text.clone(),
                message: format!(
                    "This duplicates the previous element's label/value text: {:?}.",
                    event.text.trim()
                ),
            });
        }
        previous = Some(event);
    }
    let empty_count = findings
        .iter()
        .filter(|f| f.kind == FindingKind::EmptyText)
        .count();
    let duplicate_count = findings.len() - empty_count;
    Report {
        schema_version: 1,
        screen: trace.screen.clone(),
        platform: trace.platform.clone(),
        summary: Summary {
            event_count: trace.events.len(),
            analyzed_count: trace.events.iter().filter(|e| !e.ignored).count(),
            ignored_count: trace.events.iter().filter(|e| e.ignored).count(),
            finding_count: findings.len(),
            empty_count,
            duplicate_count,
        },
        findings,
    }
}

fn finding_key(finding: &Finding) -> String {
    format!(
        "{:?}:{}:{}",
        finding.kind,
        finding.id,
        normalized(&finding.text)
    )
}

pub fn diff(baseline: &Trace, current: &Trace) -> DiffReport {
    let old = analyze(baseline);
    let new = analyze(current);
    let old_keys: BTreeSet<_> = old.findings.iter().map(finding_key).collect();
    let new_keys: BTreeSet<_> = new.findings.iter().map(finding_key).collect();
    DiffReport {
        schema_version: 1,
        screen: current.screen.clone(),
        baseline_findings: old.findings.len(),
        current_findings: new.findings.len(),
        new_findings: new
            .findings
            .into_iter()
            .filter(|f| !old_keys.contains(&finding_key(f)))
            .collect(),
        resolved_findings: old
            .findings
            .into_iter()
            .filter(|f| !new_keys.contains(&finding_key(f)))
            .collect(),
    }
}

pub trait HtmlReport {
    fn title(&self) -> String;
    fn summary_html(&self) -> String;
    fn rows_html(&self) -> String;
}

impl HtmlReport for Report {
    fn title(&self) -> String {
        format!("{} focus report", self.screen)
    }
    fn summary_html(&self) -> String {
        format!(
            "<p><strong>{}</strong> findings across {} scripted elements: {} empty and {} duplicate.</p>",
            self.summary.finding_count,
            self.summary.analyzed_count,
            self.summary.empty_count,
            self.summary.duplicate_count
        )
    }
    fn rows_html(&self) -> String {
        finding_rows(&self.findings, "Finding")
    }
}

impl HtmlReport for DiffReport {
    fn title(&self) -> String {
        format!("{} focus diff", self.screen)
    }
    fn summary_html(&self) -> String {
        format!(
            "<p><strong>{}</strong> new findings and <strong>{}</strong> resolved findings.</p>",
            self.new_findings.len(),
            self.resolved_findings.len()
        )
    }
    fn rows_html(&self) -> String {
        format!(
            "{}{}",
            finding_rows(&self.new_findings, "New"),
            finding_rows(&self.resolved_findings, "Resolved")
        )
    }
}

fn escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
fn finding_rows(findings: &[Finding], state: &str) -> String {
    if findings.is_empty() {
        return format!(
            "<tr><td colspan=\"5\">No {} findings.</td></tr>",
            state.to_lowercase()
        );
    }
    findings.iter().map(|f| format!("<tr><td><span class=\"pill\">{}</span></td><td>{}</td><td><code>{}</code></td><td>{}</td><td>{}</td></tr>", state, f.index, escape(&f.id), escape(&f.role), escape(&f.message))).collect()
}

pub fn render_html<T: HtmlReport>(report: &T) -> String {
    let title = escape(&report.title());
    format!(
        r#"<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>:root{{--bg:#eef8fa;--ink:#102536;--muted:#506a7a;--line:#9bb7c2;--accent:#087a68}}*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,sans-serif}}main{{width:min(100% - 32px,960px);margin:56px auto}}h1{{font-size:clamp(2rem,6vw,3.5rem);line-height:1.05}}p{{max-width:68ch}}table{{width:100%;border-collapse:collapse;background:white}}th,td{{padding:12px;text-align:left;border-bottom:1px solid var(--line)}}th{{background:#dcecef}}code{{font:14px ui-monospace,monospace}}.pill{{font-weight:700;color:var(--accent)}}@media(max-width:640px){{table,tbody,tr,td{{display:block}}thead{{position:absolute;clip:rect(0 0 0 0)}}tr{{padding:12px;border-bottom:1px solid var(--line)}}td{{border:0;padding:4px}}}}</style></head><body><main><h1>{title}</h1>{summary}<table><thead><tr><th>State</th><th>Stop</th><th>ID</th><th>Role</th><th>Message</th></tr></thead><tbody>{rows}</tbody></table></main></body></html>"#,
        summary = report.summary_html(),
        rows = report.rows_html()
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    const SAMPLE: &str = include_str!("../examples/sample-trace.json");

    #[test]
    fn finds_seeded_regressions_without_false_positive() {
        let trace = parse_trace(SAMPLE).unwrap();
        let report = analyze(&trace);
        assert_eq!(report.summary.empty_count, 1);
        assert_eq!(report.summary.duplicate_count, 1);
        assert_eq!(report.summary.ignored_count, 1);
        assert!(report.findings.iter().all(|f| f.id != "checkout.separator"));
    }

    #[test]
    fn parses_json_lines_and_assigns_indexes() {
        let trace = parse_trace("{\"id\":\"one\",\"role\":\"button\",\"text\":\"One\"}\n{\"id\":\"two\",\"role\":\"button\",\"text\":\"Two\"}").unwrap();
        assert_eq!(trace.events[1].index, 2);
    }

    #[test]
    fn html_escapes_event_data() {
        let trace = parse_trace("{\"id\":\"<bad>\",\"role\":\"button\",\"text\":\"\"}").unwrap();
        let html = render_html(&analyze(&trace));
        assert!(html.contains("&lt;bad&gt;"));
        assert!(!html.contains("<bad>"));
    }
}
