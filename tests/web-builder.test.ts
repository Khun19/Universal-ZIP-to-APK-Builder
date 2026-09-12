import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  detectVitePluginPwaUsage,
  getPwaWorkboxInstallArgs,
  hasInstalledPackage,
  sanitizeNpmLockfile,
} from '../lib/web-builder.ts';

test('removes Replit internal resolved URLs while preserving integrity', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-web-builder-'));
  const lockfilePath = path.join(targetDir, 'package-lock.json');

  fs.writeFileSync(lockfilePath, JSON.stringify({
    lockfileVersion: 3,
    packages: {
      '': { name: 'fixture', version: '1.0.0' },
      'update-browserslist-db': {
        version: '1.3.3',
        resolved: 'http://package-firewall.replit.internal/npm/update-browserslist-db/-/update-browserslist-db-1.3.3.tgz',
        integrity: 'sha512-test-integrity'
      },
      'public-package': {
        version: '1.0.0',
        resolved: 'https://registry.npmjs.org/public-package/-/public-package-1.0.0.tgz',
        integrity: 'sha512-public-integrity'
      }
    }
  }, null, 2));

  assert.strictEqual(sanitizeNpmLockfile(targetDir), 1);

  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  assert.strictEqual(lockfile.packages['update-browserslist-db'].resolved, undefined);
  assert.strictEqual(lockfile.packages['update-browserslist-db'].integrity, 'sha512-test-integrity');
  assert.strictEqual(lockfile.packages['public-package'].resolved, 'https://registry.npmjs.org/public-package/-/public-package-1.0.0.tgz');

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('does not modify a lockfile without Replit internal URLs', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-web-builder-'));
  const lockfilePath = path.join(targetDir, 'package-lock.json');
  const original = JSON.stringify({ lockfileVersion: 3, packages: { foo: { version: '1.0.0' } } }, null, 2);
  fs.writeFileSync(lockfilePath, original);

  assert.strictEqual(sanitizeNpmLockfile(targetDir), 0);
  assert.strictEqual(fs.readFileSync(lockfilePath, 'utf8'), original);

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('detects vite-plugin-pwa from package dependencies', () => {
  assert.strictEqual(
    detectVitePluginPwaUsage('/tmp/fixture', { devDependencies: { 'vite-plugin-pwa': '^1.3.0' } }),
    true,
  );
  assert.strictEqual(
    detectVitePluginPwaUsage('/tmp/fixture', { dependencies: { vite: '^7.0.0' } }),
    false,
  );
});

test('detects vite-plugin-pwa from Vite config when it is not declared directly', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-pwa-config-'));
  fs.writeFileSync(
    path.join(targetDir, 'vite.config.ts'),
    "import { VitePWA } from 'vite-plugin-pwa';\nexport default { plugins: [VitePWA()] };\n",
  );

  assert.strictEqual(detectVitePluginPwaUsage(targetDir, {}), true);
  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('build repair installs workbox-window with the required pnpm flags', () => {
  assert.deepStrictEqual(getPwaWorkboxInstallArgs(), [
    'add',
    'workbox-window',
    '--ignore-workspace',
    '--dangerously-allow-all-builds',
  ]);
});

test('checks whether workbox-window exists in the generated project', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-workbox-'));
  fs.mkdirSync(path.join(targetDir, 'node_modules', 'workbox-window'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'node_modules', 'workbox-window', 'package.json'), '{}');

  assert.strictEqual(hasInstalledPackage(targetDir, 'workbox-window'), true);
  assert.strictEqual(hasInstalledPackage(targetDir, 'workbox-build'), false);

  fs.rmSync(targetDir, { recursive: true, force: true });
});
