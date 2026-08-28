import { spawnSync } from 'node:child_process';

const playwrightArgs = process.argv.slice(2);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npm', ['run', 'test:unit']);
run('npm', ['run', 'build']);
run('npm', ['run', 'test:e2e', '--', ...playwrightArgs]);
