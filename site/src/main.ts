import './style.css';

type Route = '/' | '/demo' | '/privacy' | '/terms' | '/404';

const sample = [
  { index: 1, id: 'checkout.title', role: 'header', text: 'Checkout', state: 'ok' },
  { index: 2, id: 'checkout.address', role: 'button', text: 'Delivery address, 14 Oak Street', state: 'ok' },
  { index: 3, id: 'checkout.promo', role: 'button', text: 'Empty label/value text', state: 'empty' },
  { index: 4, id: 'checkout.total-label', role: 'staticText', text: 'Total, $42.00', state: 'ok' },
  { index: 5, id: 'checkout.total-value', role: 'staticText', text: 'Total, $42.00', state: 'duplicate' },
  { index: 6, id: 'checkout.separator', role: 'image', text: 'Ignored decorative element', state: 'ignored' },
  { index: 7, id: 'checkout.pay', role: 'button', text: 'Pay now', state: 'ok' },
] as const;

const metadata: Record<Route, { title: string; description: string; canonical: string }> = {
  '/': { title: 'Silent Focus Sentinel — flag empty iOS text', description: 'Flag empty or duplicate label/value text in an app-defined XCTest order. Review local JSON and HTML reports.', canonical: 'https://silent-focus-sentinel.sociobot.in/' },
  '/demo': { title: 'Demo — Silent Focus Sentinel', description: 'Review seven sample XCTest elements with empty text, duplicate text, and an intentional ignore.', canonical: 'https://silent-focus-sentinel.sociobot.in/demo' },
  '/privacy': { title: 'Privacy — Silent Focus Sentinel', description: 'Read how Silent Focus Sentinel handles local trace files and website data.', canonical: 'https://silent-focus-sentinel.sociobot.in/privacy' },
  '/terms': { title: 'Terms — Silent Focus Sentinel', description: 'Read the license, purpose, and warranty terms for Silent Focus Sentinel.', canonical: 'https://silent-focus-sentinel.sociobot.in/terms' },
  '/404': { title: 'Page not found — Silent Focus Sentinel', description: 'This page does not exist. Return to Silent Focus Sentinel.', canonical: 'https://silent-focus-sentinel.sociobot.in/404.html' },
};

const mark = `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M4 16h5m4 0h3m7 0h5"/><circle cx="19.5" cy="16" r="3.5"/><circle class="void" cx="9.5" cy="16" r="2.5"/></svg>`;

function shell(content: string, demoMode = false) {
  return `
    <a class="skip" href="#main">Skip to content</a>
    ${demoMode ? `<aside class="demo-bar" aria-label="Demo status"><span><strong>Demo</strong> — sample data, nothing is saved</span><span><button class="text-button" data-reset>Reset demo</button><a href="/#install" data-link>Start for real</a></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link>${mark}<span>Silent Focus Sentinel</span></a>
      <nav aria-label="Main navigation"><a href="/?demo=1" data-link>Demo</a><a href="/#install" data-link>Install</a><a href="/privacy" data-link>Privacy</a></nav>
    </header>
    <main id="main" tabindex="-1">${content}</main>
    <footer><div><a class="wordmark" href="/" data-link>${mark}<span>Silent Focus Sentinel</span></a><p>Local checks for empty or duplicate label/value text.</p></div><nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://hello-factory.sociobot.in/">Built by Param Factory <span class="sr-only">(external site)</span></a></nav><p class="build">v0.1.0 · build 2026.08.29</p></footer>
    <div class="sr-only" aria-live="polite" id="route-status"></div>`;
}

function trace(showDetail = false) {
  return `<section class="trace-panel" aria-labelledby="trace-title">
    <div class="panel-head"><div><span class="eyebrow">SAMPLE RUN · CHECKOUT</span><h2 id="trace-title">${showDetail ? 'Two elements need review' : 'Sample elements and findings'}</h2></div><span class="result-count">2 findings</span></div>
    <ol class="trace-list">${sample.map((item) => `<li class="trace-item ${item.state}"><span class="node" aria-hidden="true"></span><div class="trace-copy"><span class="trace-index">${String(item.index).padStart(2, '0')} · ${item.role}</span><strong>${item.text}</strong>${showDetail ? `<code>${item.id}</code>` : ''}</div><span class="state-label">${item.state === 'ok' ? 'Populated' : item.state === 'empty' ? 'Empty' : item.state === 'duplicate' ? 'Duplicate' : 'Ignored'}</span></li>`).join('')}</ol>
    ${showDetail ? `<div class="report-actions"><button data-download>Download sample JSON</button><span role="status" id="download-status"></span></div>` : `<a class="inline-link" href="/?demo=1" data-link>Open the full sample report <span aria-hidden="true">→</span></a>`}
  </section>`;
}

function home() {
  return shell(`
    <section class="hero">
      <div class="hero-copy"><span class="eyebrow">LOCAL iOS ACCESSIBILITY CHECK</span><h1>Flag empty text in scripted iOS checks</h1><p class="dek">For iOS teams comparing labels and values in an app-defined XCTest order.</p><div class="hero-actions"><a class="primary" href="/?demo=1" data-link>Try it with sample data</a><span>Loads a finished report</span></div><ul class="facts"><li>No upload</li><li>Works without an account</li><li>MIT licensed</li></ul></div>
      <figure class="hero-art"><img src="/focus-landscape.webp" width="1200" height="800" fetchpriority="high" alt="A luminous sequence of check points with one coral gap."/><figcaption>Aqua marks populated text. Coral marks empty label/value text.</figcaption></figure>
    </section>
    <div class="signal-divider" aria-hidden="true"><span></span><i></i><span></span><i class="danger"></i><span></span></div>
    ${trace()}
    <section class="workflow" aria-labelledby="workflow-title"><span class="eyebrow">THREE COMMANDS</span><h2 id="workflow-title">How the CLI checks a scripted run</h2><ol><li><span>01</span><div><h3>Mark each element</h3><p>Use the XCTest helper in your app-defined order.</p><code>SilentFocusSentinel.record(element, id: "…", role: "…")</code></div></li><li><span>02</span><div><h3>Extract the text</h3><p>Run xcodebuild and collect each marked label and value.</p><code>silent-focus-sentinel record-xctest --scheme "…"</code></div></li><li><span>03</span><div><h3>Review the findings</h3><p>Compare empty or duplicate text with your baseline.</p><code>silent-focus-sentinel diff baseline.json current.json</code></div></li></ol></section>
    <section class="terminal-section" aria-labelledby="terminal-title"><div><span class="eyebrow">BUNDLED SAMPLE</span><h2 id="terminal-title">Run the bundled CLI demo</h2><p>The demo copies a checkout trace into a new temporary directory. It writes both report formats there.</p></div><div class="terminal" aria-label="Terminal recording transcript"><div class="terminal-top"><i></i><i></i><i></i><span>sentinel — demo</span></div><pre><span class="prompt">$</span> silent-focus-sentinel demo

Demo — sample data, nothing was saved
outside this temporary directory.

<span class="coral">● 1 empty text finding</span>
<span class="amber">● 1 duplicate text finding</span>
<span class="aqua">✓ 1 decorative element ignored</span>

JSON: /tmp/…/focus-report.json
HTML: /tmp/…/focus-report.html</pre></div></section>
    <section class="limits" aria-labelledby="limits-title"><div><span class="eyebrow">CLEAR BOUNDARIES</span><h2 id="limits-title">Know what the check measures</h2></div><div><p>The helper reads each selected element's public XCTest label and string value.</p><p>It does not observe the VoiceOver cursor, speech, traits, or hints.</p><p>It does not certify WCAG conformance. Ignore an intentional decorative element with <code>ignored: true</code>.</p></div></section>
    <section class="install" id="install" aria-labelledby="install-title"><span class="eyebrow">RUST 1.85+</span><h2 id="install-title">Install one local binary</h2><div class="command"><code tabindex="0" aria-label="Install command">cargo install --git https://github.com/B-Divyesh/sf-silent-focus-sentinel</code><button data-copy>Copy install command</button></div><p>Run every command without an account or runtime service.</p></section>`);
}

function demo() {
  return shell(`<section class="page-intro"><span class="eyebrow">BUNDLED CHECKOUT TRACE</span><h1>Review a sample scripted check</h1><p>Seven elements show empty text, duplicate text, and one intentional ignore.</p></section>${trace(true)}<section class="demo-notes" aria-labelledby="demo-notes"><h2 id="demo-notes">What this sample shows</h2><ul><li>The promo button has empty label/value text.</li><li>The second total has duplicate label/value text.</li><li>The decorative separator is ignored.</li></ul><a class="primary" href="/#install" data-link>Install the CLI</a></section>`, true);
}

function policy(kind: 'privacy' | 'terms') {
  const privacy = kind === 'privacy';
  return shell(`<article class="prose"><span class="eyebrow">LAST UPDATED · AUGUST 29, 2026</span><h1>${privacy ? 'Your traces stay on your machine' : 'Use the tool as provided'}</h1>${privacy ? `<h2>CLI data</h2><p>The CLI reads the trace paths you provide. It writes reports only to chosen paths or a new demo directory.</p><h2>Website data</h2><p>This site stores no trace data, cookies, or browser data. It loads no third-party scripts, fonts, or analytics.</p><h2>Network access</h2><p>The CLI has no telemetry and makes no network requests. The site loads its files from this domain only.</p>` : `<h2>License</h2><p>Silent Focus Sentinel is free software under the MIT license.</p><h2>Purpose</h2><p>The tool checks label/value text from selected XCTest elements. It does not observe VoiceOver or certify WCAG compliance.</p><h2>Warranty</h2><p>The software is provided without warranty. Review findings with your own accessibility testing process.</p>`}<h2>Questions</h2><p>Open an issue in the <a href="https://github.com/B-Divyesh/sf-silent-focus-sentinel">project repository <span class="sr-only">(external site)</span></a>.</p></article>`);
}

function notFound() {
  return shell(`<section class="lost"><div class="lost-node" aria-hidden="true">?</div><h1>This page does not exist</h1><p>Check the address, or return to the home page.</p><a class="primary" href="/" data-link>Return home</a></section>`);
}

function resolveRoute(): Route {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/' && new URLSearchParams(window.location.search).get('demo') === '1') return '/demo';
  return path === '/' || path === '/demo' || path === '/privacy' || path === '/terms' ? path : '/404';
}

function setMetadata(route: Route) {
  const current = metadata[route];
  document.title = current.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', current.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', current.canonical);
  const values: Record<string, string> = { 'og:title': current.title, 'og:description': current.description, 'og:url': current.canonical, 'twitter:title': current.title, 'twitter:description': current.description };
  for (const [name, value] of Object.entries(values)) document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.setAttribute('content', value);
}

function render(focusHeading = false) {
  const route = resolveRoute();
  setMetadata(route);
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = route === '/' ? home() : route === '/demo' ? demo() : route === '/privacy' || route === '/terms' ? policy(route.slice(1) as 'privacy' | 'terms') : notFound();
  bindActions();
  if (focusHeading) {
    window.scrollTo(0, 0);
    const heading = app.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
    const status = document.querySelector('#route-status');
    if (status && heading) status.textContent = heading.textContent;
  }
}

function bindActions() {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach((link) => link.addEventListener('click', (event) => {
    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    history.pushState({}, '', url.pathname + url.search + url.hash);
    render(true);
    if (url.hash) requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView());
  }));
  document.querySelector<HTMLButtonElement>('[data-reset]')?.addEventListener('click', () => { render(); document.querySelector<HTMLElement>('[data-reset]')?.focus(); });
  document.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText('cargo install --git https://github.com/B-Divyesh/sf-silent-focus-sentinel');
      button.textContent = 'Install command copied';
    } catch {
      button.textContent = 'Select and copy the command';
      document.querySelector<HTMLElement>('.command code')?.focus();
    }
  });
  document.querySelector<HTMLButtonElement>('[data-download]')?.addEventListener('click', () => {
    const payload = { schemaVersion: 1, screen: 'Checkout', platform: 'iOS Simulator 18.2', events: sample.map(({ text, state, ...event }) => ({ ...event, text: state === 'empty' || state === 'ignored' ? '' : text, ignored: state === 'ignored' })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-trace.json';
    link.click();
    URL.revokeObjectURL(url);
    const status = document.querySelector('#download-status');
    if (status) status.textContent = 'Sample JSON downloaded.';
  });
}

window.addEventListener('popstate', () => render(true));
render();
