import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  detectVitePluginPwaUsage,
  findGeneratedWorkboxBundle,
  getPwaLockfileStabilizeArgs,
  getPwaWorkboxInstallArgs,
  hasInstalledPackage,
  buildWebProject,
  patchGeneratedWorkboxTerser,
  findWebBuildOutputDir,
  inspectPwaBuildOutput,
  isMinimumReleaseAgeViolation,
  sanitizeNpmLockfile,
  verifyGeneratedWorkboxTerserPatch,
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

test('PWA lockfile stabilization is scoped and only overrides minimum release age for that command', () => {
  assert.deepStrictEqual(getPwaLockfileStabilizeArgs(), [
    'install',
    '--lockfile-only',
    '--ignore-workspace',
    '--dangerously-allow-all-builds',
    '--config.minimum-release-age=0',
  ]);
  assert.ok(!getPwaLockfileStabilizeArgs().includes('--config.strict-peer-dependencies=false'));
});

test('recognizes only the pnpm minimum-release-age violation', () => {
  assert.strictEqual(isMinimumReleaseAgeViolation('ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION adm-zip@0.6.1'), true);
  assert.strictEqual(isMinimumReleaseAgeViolation('ERR_PNPM_FETCH_404 package not found'), false);
});

test('checks whether workbox-window exists in the generated project', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-workbox-'));
  fs.mkdirSync(path.join(targetDir, 'node_modules', 'workbox-window'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'node_modules', 'workbox-window', 'package.json'), '{}');

  assert.strictEqual(hasInstalledPackage(targetDir, 'workbox-window'), true);
  assert.strictEqual(hasInstalledPackage(targetDir, 'workbox-build'), false);

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('patches the generated Workbox Terser invocation idempotently', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-workbox-patch-'));
  const bundlePath = path.join(targetDir, 'node_modules', 'workbox-build', 'build', 'lib', 'bundle.js');
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  fs.writeFileSync(bundlePath, 'const plugin = plugin_terser_1.default)({\n  mangle: { minify: true }\n});');

  assert.strictEqual(findGeneratedWorkboxBundle(targetDir), bundlePath);
  assert.strictEqual(patchGeneratedWorkboxTerser(targetDir).changed, true);
  assert.match(fs.readFileSync(bundlePath, 'utf8'), /plugin_terser_1\.default\)\(\{\s*maxWorkers: 1,\s*mangle:/);
  assert.strictEqual(verifyGeneratedWorkboxTerserPatch(targetDir), bundlePath);
  assert.strictEqual(patchGeneratedWorkboxTerser(targetDir).changed, false);

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('patches the legacy Workbox Terser invocation', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-workbox-legacy-'));
  const bundlePath = path.join(targetDir, 'node_modules', 'workbox-build', 'build', 'lib', 'bundle.js');
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  fs.writeFileSync(bundlePath, 'terser({\n  mangle: { minify: true }\n});');

  patchGeneratedWorkboxTerser(targetDir);
  assert.match(fs.readFileSync(bundlePath, 'utf8'), /terser\(\{\s*maxWorkers: 1,\s*mangle:/);

  fs.rmSync(targetDir, { recursive: true, force: true });
});


test('finds only a usable web build output containing index.html', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-web-output-'));
  fs.mkdirSync(path.join(targetDir, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'dist', 'assets.txt'), 'not a web entry point');
  fs.mkdirSync(path.join(targetDir, 'build'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'build', 'index.html'), '<!doctype html>');

  assert.strictEqual(findWebBuildOutputDir(targetDir), path.join(targetDir, 'build'));
  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('returns undefined when build output folders exist without index.html', () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-web-output-empty-'));
  fs.mkdirSync(path.join(targetDir, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'dist', 'app.js'), 'console.log(1)');

  assert.strictEqual(findWebBuildOutputDir(targetDir), undefined);
  fs.rmSync(targetDir, { recursive: true, force: true });
});

function copyFixtureDist(name: string): string {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), `zip2apk-${name}-`));
  const fixtureDir = path.resolve('tests/fixtures/pwa-dist');
  fs.cpSync(fixtureDir, targetDir, { recursive: true });
  return targetDir;
}

function copyVitePwaProjectFixture(): string {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip2apk-vite-pwa-project-'));
  const fixtureDir = path.resolve('tests/fixtures/vite-pwa-project');
  fs.cpSync(fixtureDir, targetDir, { recursive: true });
  return targetDir;
}

test('builds and validates the tracked Vite PWA project fixture', { timeout: 180_000 }, async () => {
  const targetDir = copyVitePwaProjectFixture();

  try {
    const build = await buildWebProject(targetDir);

    assert.strictEqual(build.success, true, build.error || build.logs.join('\n'));
    assert.ok(build.outputDir);
    assert.ok(fs.existsSync(path.join(build.outputDir, 'index.html')));
    assert.ok(fs.existsSync(path.join(build.outputDir, 'manifest.webmanifest')));
    assert.ok(fs.existsSync(path.join(build.outputDir, 'sw.js')));
    assert.ok(fs.existsSync(path.join(build.outputDir, 'registerSW.js')));
    assert.ok(fs.existsSync(path.join(build.outputDir, 'icon.svg')));
    assert.ok(fs.readdirSync(path.join(build.outputDir, 'assets')).some((entry) => entry.endsWith('.js')));
    assert.ok(build.logs.some((log) => log.includes('PWA manifest verified')));
    assert.ok(build.logs.some((log) => log.includes('PWA service worker verified')));
    assert.ok(build.logs.some((log) => log.includes('generated Workbox Terser maxWorkers: 1')));
  } finally {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

test('validates fixture-backed Vite PWA output', () => {
  const targetDir = copyFixtureDist('pwa-valid');

  const result = inspectPwaBuildOutput(targetDir);

  assert.strictEqual(result.success, true);
  assert.ok(result.manifestPath?.endsWith('manifest.webmanifest'));
  assert.ok(result.registerScriptPath?.endsWith('registerSW.js'));
  assert.ok(result.serviceWorkerPath?.endsWith('sw.js'));
  assert.ok(result.logs.some((log) => log.includes('PWA manifest verified')));
  assert.ok(result.logs.some((log) => log.includes('PWA service worker verified')));

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('fails PWA output validation when the manifest is missing', () => {
  const targetDir = copyFixtureDist('pwa-missing-manifest');
  fs.rmSync(path.join(targetDir, 'manifest.webmanifest'));

  const result = inspectPwaBuildOutput(targetDir);

  assert.strictEqual(result.success, false);
  assert.match(result.error || '', /manifest/i);

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('fails PWA output validation when the service worker target is invalid', () => {
  const targetDir = copyFixtureDist('pwa-invalid-service-worker');
  fs.writeFileSync(path.join(targetDir, 'sw.js'), 'console.log("not a service worker");\n');

  const result = inspectPwaBuildOutput(targetDir);

  assert.strictEqual(result.success, false);
  assert.match(result.error || '', /service-worker code/i);

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('fails PWA output validation when the service worker target file is missing', () => {
  const targetDir = copyFixtureDist('pwa-missing-service-worker');
  fs.rmSync(path.join(targetDir, 'sw.js'));

  const result = inspectPwaBuildOutput(targetDir);

  assert.strictEqual(result.success, false);
  assert.match(result.error || '', /service worker registration target is missing/i);

  fs.rmSync(targetDir, { recursive: true, force: true });
});
