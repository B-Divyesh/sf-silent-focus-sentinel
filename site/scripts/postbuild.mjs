import { copyFile } from 'node:fs/promises';

await copyFile('dist/site/index.html', 'dist/site/404.html');
