import { mkdir, readFile, writeFile } from 'node:fs/promises';

const origin = 'https://silent-focus-sentinel.sociobot.in';
const routes = [
  { output: 'demo/index.html', title: 'Demo — Silent Focus Sentinel', description: 'Review a captured VoiceOver traversal with silent, repeated, and ignored focus stops.', canonical: `${origin}/demo` },
  { output: 'privacy/index.html', title: 'Privacy — Silent Focus Sentinel', description: 'Read how Silent Focus Sentinel handles local trace files and website data.', canonical: `${origin}/privacy` },
  { output: 'terms/index.html', title: 'Terms — Silent Focus Sentinel', description: 'Read the license, purpose, and warranty terms for Silent Focus Sentinel.', canonical: `${origin}/terms` },
  { output: '404.html', title: 'Page not found — Silent Focus Sentinel', description: 'This page does not exist. Return to Silent Focus Sentinel.', canonical: `${origin}/404.html` },
];

const root = await readFile('dist/site/index.html', 'utf8');

function replaceMeta(html, selector, value) {
  const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const pattern = new RegExp(`(<meta\\s+(?:name|property)="${selector}"\\s+content=")[^"]*("\\s*/?>)`);
  return html.replace(pattern, `$1${escaped}$2`);
}

for (const route of routes) {
  let html = root.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*("\s*\/?>)/, `$1${route.canonical}$2`);
  for (const field of ['description', 'og:description', 'twitter:description']) html = replaceMeta(html, field, route.description);
  for (const field of ['og:title', 'twitter:title']) html = replaceMeta(html, field, route.title);
  html = replaceMeta(html, 'og:url', route.canonical);
  const target = `dist/site/${route.output}`;
  await mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
  await writeFile(target, html);
}
