const { execSync } = require('node:child_process');
const { rmSync } = require('node:fs');

rmSync('.tmp-platform-tests', { recursive: true, force: true });
execSync([
  './node_modules/.bin/tsc',
  '--module', 'commonjs',
  '--target', 'es2020',
  '--esModuleInterop',
  '--moduleResolution', 'node',
  '--skipLibCheck',
  '--outDir', '.tmp-platform-tests',
  'src/lib/platform/bootstrap.ts',
  'src/lib/platform/modules.ts',
  'src/lib/platform/permissions.ts',
  'src/lib/platform/route-access.ts',
  'src/lib/platform/server-guards.ts',
  'src/lib/platform/session-store.ts',
  'src/lib/platform/session.ts',
  'src/lib/platform/types.ts'
].join(' '), { stdio: 'inherit' });
execSync('node --test src/lib/platform/__tests__/platform-core.test.js', {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: '.tmp-platform-tests',
  },
});
