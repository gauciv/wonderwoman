// Cross-platform replacement for `env -u ELECTRON_RUN_AS_NODE <cmd>`
// Unsets ELECTRON_RUN_AS_NODE so Electron boots as a real app, then spawns the given command.
const { spawn } = require('child_process');

delete process.env.ELECTRON_RUN_AS_NODE;

const args = process.argv.slice(2);
const child = spawn(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

child.on('exit', (code) => process.exit(code ?? 1));
