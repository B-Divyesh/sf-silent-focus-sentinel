import { copyFile, mkdir } from 'node:fs/promises';

await copyFile('dist/site/index.html', 'dist/site/404.html');
for (const route of ['demo', 'privacy', 'terms']) {
  await mkdir(`dist/site/${route}`, { recursive: true });
  await copyFile('dist/site/index.html', `dist/site/${route}/index.html`);
}
