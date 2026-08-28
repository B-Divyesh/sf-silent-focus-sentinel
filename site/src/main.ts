import './style.css';

type Route = '/' | '/demo' | '/privacy' | '/terms' | '/404';

const sample = [
  { index: 1, id: 'checkout.title', role: 'header', speech: 'Checkout, heading', state: 'ok' },
  { index: 2, id: 'checkout.address', role: 'button', speech: 'Delivery address, 14 Oak Street, button', state: 'ok' },
  { index: 3, id: 'checkout.promo', role: 'button', speech: 'No announcement', state: 'silent' },
  { index: 4, id: 'checkout.total-label', role: 'staticText', speech: 'Total, $42.00', state: 'ok' },
  { index: 5, id: 'checkout.total-value', role: 'staticText', speech: 'Total, $42.00', state: 'duplicate' },
  { index: 6, id: 'checkout.separator', role: 'image', speech: 'Ignored decorative stop', state: 'ignored' },
  { index: 7, id: 'checkout.pay', role: 'button', speech: 'Pay now, button', state: 'ok' },
] as const;

const titles: Record<Route, string> = {
  '/': 'Silent Focus Sentinel — catch silent focus stops',
  '/demo': 'Demo — Silent Focus Sentinel',
  '/privacy': 'Privacy — Silent Focus Sentinel',
  '/terms': 'Terms — Silent Focus Sentinel',
  '/404': 'Page not found — Silent Focus Sentinel',
};

const descriptions: Record<Route, string> = {
  '/': 'Catch silent and repeated VoiceOver focus stops in scripted iOS simulator runs. Review local JSON and HTML reports.',
  '/demo': 'Review a sample iOS focus traversal with one silent stop and one repeated announcement.',
  '/privacy': 'How Silent Focus Sentinel handles focus traces and site data.',
  '/terms': 'Terms for using Silent Focus Sentinel.',
  '/404': 'This page does not exist. Return to Silent Focus Sentinel.',
};

const mark = `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M4 16h5m4 0h3m7 0h5"/><circle cx="19.5" cy="16" r="3.5"/><circle class="void" cx="9.5" cy="16" r="2.5"/></svg>`;

function shell(content: string, demo = false) {
  return `
    <a class="skip" href="#main">Skip to content</a>
    ${demo ? `<aside class="demo-bar" aria-label="Demo status"><span><strong>Demo</strong> — sample data, nothing is saved</span><span><button class="text-button" data-reset>Reset demo</button><a href="/#install" data-link>Start for real</a></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link>${mark}<span>Silent Focus Sentinel</span></a>
      <nav aria-label="Main navigation"><a href="/demo" data-link>Demo</a><a href="/#install" data-link>Install</a><a href="/privacy" data-link>Privacy</a></nav>
    </header>
    <main id="main" tabindex="-1">${content}</main>
    <footer><div><a class="wordmark" href="/" data-link>${mark}<span>Silent Focus Sentinel</span></a><p>Local checks for silent VoiceOver focus stops.</p></div><nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://hello-factory.sociobot.in/">Built by Param Factory <span class="sr-only">(external site)</span></a></nav><p class="build">v0.1.0 · build 2026.08.28</p></footer>
    <div class="sr-only" aria-live="polite" id="route-status"></div>`;
}

function trace(showDetail = false) {
  return `<section class="trace-panel" aria-labelledby="trace-title">
    <div class="panel-head"><div><span class="eyebrow">CURRENT RUN · CHECKOUT</span><h2 id="trace-title">${showDetail ? 'Two stops need review' : 'See the silence in sequence'}</h2></div><span class="result-count">2 findings</span></div>
    <ol class="trace-list">${sample.map((item) => `<li class="trace-item ${item.state}"><span class="node" aria-hidden="true"></span><div class="trace-copy"><span class="trace-index">${String(item.index).padStart(2, '0')} · ${item.role}</span><strong>${item.speech}</strong>${showDetail ? `<code>${item.id}</code>` : ''}</div><span class="state-label">${item.state === 'ok' ? 'Clear' : item.state === 'silent' ? 'Silent' : item.state === 'duplicate' ? 'Repeated' : 'Ignored'}</span></li>`).join('')}</ol>
    ${showDetail ? `<div class="report-actions"><button data-download>Download sample JSON</button><span role="status" id="download-status"></span></div>` : `<a class="inline-link" href="/demo" data-link>Open the full sample report <span aria-hidden="true">→</span></a>`}
  </section>`;
}

function home() {
  return shell(`
    <section class="hero">
      <div class="hero-copy"><span class="eyebrow">LOCAL iOS ACCESSIBILITY CHECK</span><h1>Catch silent VoiceOver focus stops</h1><p class="dek">For iOS teams checking a scripted focus run before confusing silence reaches users.</p><div class="hero-actions"><a class="primary" href="/demo" data-link>Try it with sample data</a><span>Loads a finished focus report</span></div><ul class="facts"><li>No upload</li><li>Runs locally</li><li>Free and open source</li></ul></div>
      <figure class="hero-art"><img src="/focus-landscape.webp" width="1200" height="800" fetchpriority="high" alt="A glowing focus trail with one coral gap showing a silent stop."/><figcaption>Clear stops glow aqua. Silence leaves a coral void.</figcaption></figure>
    </section>
    <div class="signal-divider" aria-hidden="true"><span></span><i></i><span></span><i class="danger"></i><span></span></div>
    ${trace()}
    <section class="workflow" aria-labelledby="workflow-title"><span class="eyebrow">THREE COMMANDS</span><h2 id="workflow-title">Move from swipe order to review</h2><ol><li><span>01</span><div><h3>Record the traversal</h3><p>Run the included XCTest helper in an iOS Simulator.</p><code>silent-focus-sentinel record-xctest --scheme "…"</code></div></li><li><span>02</span><div><h3>Check each stop</h3><p>Find empty speech and repeated adjacent announcements.</p><code>silent-focus-sentinel analyze trace.json</code></div></li><li><span>03</span><div><h3>Compare the release</h3><p>Review new and resolved findings in CI.</p><code>silent-focus-sentinel diff baseline.json current.json</code></div></li></ol></section>
    <section class="terminal-section" aria-labelledby="terminal-title"><div><span class="eyebrow">REAL BUNDLED SAMPLE</span><h2 id="terminal-title">Run it before setup</h2><p>The demo copies a checkout trace into a temporary directory. It writes both report formats there.</p></div><div class="terminal" aria-label="Terminal recording transcript"><div class="terminal-top"><i></i><i></i><i></i><span>sentinel — demo</span></div><pre><span class="prompt">$</span> silent-focus-sentinel demo

Demo — sample data, nothing was saved
outside this temporary directory.

<span class="coral">● 1 silent announcement</span>
<span class="amber">● 1 repeated announcement</span>
<span class="aqua">✓ 1 decorative stop ignored</span>

JSON: /tmp/…/focus-report.json
HTML: /tmp/…/focus-report.html</pre></div></section>
    <section class="limits" aria-labelledby="limits-title"><div><span class="eyebrow">CLEAR BOUNDARIES</span><h2 id="limits-title">Your test drives the simulator</h2></div><div><p>The included XCTest helper records each scripted stop. It does not call private VoiceOver APIs.</p><p>It checks silent and repeated speech. It does not certify WCAG conformance.</p><p>Set <code>ignored: true</code> for an intentional decorative stop.</p></div></section>
    <section class="install" id="install" aria-labelledby="install-title"><span class="eyebrow">RUST 1.85+</span><h2 id="install-title">Install one local binary</h2><div class="command"><code tabindex="0" aria-label="Install command">cargo install --git https://github.com/B-Divyesh/sf-silent-focus-sentinel</code><button data-copy aria-label="Copy install command">Copy</button></div><p>No account or runtime service is required.</p></section>`);
}

function demo() {
  return shell(`<section class="page-intro"><span class="eyebrow">BUNDLED CHECKOUT TRACE</span><h1>Review a sample focus run</h1><p>Seven stops show one silence, one repetition, and one intentional ignore.</p></section>${trace(true)}<section class="demo-notes" aria-labelledby="demo-notes"><h2 id="demo-notes">What this sample proves</h2><ul><li>The empty promo button is marked silent.</li><li>The second total is marked repeated.</li><li>The decorative separator is ignored.</li></ul><a class="primary" href="/#install" data-link>Install the CLI</a></section>`, true);
}

function policy(kind: 'privacy' | 'terms') {
  const privacy = kind === 'privacy';
  return shell(`<article class="prose"><span class="eyebrow">LAST UPDATED · AUGUST 28, 2026</span><h1>${privacy ? 'Your traces stay on your machine' : 'Use the tool as provided'}</h1>${privacy ? `<h2>CLI data</h2><p>The CLI reads the trace paths you provide. It writes reports only to paths you choose or to its demo directory.</p><h2>Website data</h2><p>This site stores no focus traces, cookies, or browser data. It sends no analytics events.</p><h2>Network access</h2><p>The CLI makes no network requests. The site loads its files from this domain only.</p>` : `<h2>License</h2><p>Silent Focus Sentinel is free software under the MIT license.</p><h2>Purpose</h2><p>The tool helps teams review focus announcements. It does not certify legal or WCAG compliance.</p><h2>Warranty</h2><p>The software is provided without warranty. Review findings with your own accessibility testing process.</p>`}<h2>Questions</h2><p>Open an issue in the <a href="https://github.com/B-Divyesh/sf-silent-focus-sentinel">project repository <span class="sr-only">(external site)</span></a>.</p></article>`);
}

function notFound() { return shell(`<section class="lost"><div class="lost-node" aria-hidden="true">?</div><span class="eyebrow">FOCUS LEFT THE TRACE</span><h1>This page does not exist</h1><p>The address points past the last known stop.</p><a class="primary" href="/" data-link>Return to the start</a></section>`); }

function resolveRoute(): Route {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/' || path === '/demo' || path === '/privacy' || path === '/terms' ? path : '/404';
}

function render(focusHeading = false) {
  const route = resolveRoute();
  document.title = titles[route];
  document.querySelector('meta[name="description"]')?.setAttribute('content', descriptions[route]);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://silent-focus-sentinel.sociobot.in${route === '/404' ? window.location.pathname : route}`);
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
    history.pushState({}, '', url.pathname + url.hash);
    render(true);
    if (url.hash) requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView());
  }));
  document.querySelector<HTMLButtonElement>('[data-reset]')?.addEventListener('click', () => { render(); document.querySelector<HTMLElement>('[data-reset]')?.focus(); });
  document.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    await navigator.clipboard.writeText('cargo install --git https://github.com/B-Divyesh/sf-silent-focus-sentinel');
    button.textContent = 'Copied';
  });
  document.querySelector<HTMLButtonElement>('[data-download]')?.addEventListener('click', () => {
    const payload = { schemaVersion: 1, screen: 'Checkout', platform: 'iOS Simulator 18.2', events: sample.map(({ speech, state, ...event }) => ({ ...event, announcement: state === 'silent' || state === 'ignored' ? '' : speech, ignored: state === 'ignored' })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sample-trace.json'; link.click(); URL.revokeObjectURL(url);
    const status = document.querySelector('#download-status'); if (status) status.textContent = 'Sample JSON downloaded.';
  });
}

window.addEventListener('popstate', () => render(true));
render();
