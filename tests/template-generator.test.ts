import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateFromTemplate } from '../lib/template-generator.js';
import { analyzeProjectFiles } from '../lib/analyzer.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'uzab-template-test-'));
}

test('generate web-basic and variables applied', async () => {
  const gen = await generateFromTemplate('web-basic', {
    projectName: 'MyProj',
    appName: 'My App',
    packageName: 'com.example.myapp'
  });
  assert(gen.success, `Generation failed: ${gen.error}`);
  assert(gen.projectPath, 'projectPath missing');
  assert(Array.isArray(gen.filePaths) && gen.filePaths.length > 0);

  const indexPath = gen.filePaths.find(p => p.endsWith('index.html'));
  assert(indexPath, 'index.html not found');
  const content = fs.readFileSync(indexPath, 'utf8');
  assert(content.includes('My App'));

  const analysis = analyzeProjectFiles(gen.filePaths);
  assert(analysis.projectType === 'Plain HTML/JS' || analysis.projectType === 'React/Vite Web App');
});

test('absolute output directory is used as the exact generation destination', async () => {
  const root = makeTempDir();
  const outputDir = path.join(root, 'web-basic-output');
  const gen = await generateFromTemplate('web-basic', {
    projectName: 'GeneratedApp',
    appName: 'Generated App',
    outputDir
  });

  assert(gen.success, `Generation failed: ${gen.error}`);
  assert.equal(gen.projectPath, path.resolve(outputDir));
  assert(fs.existsSync(path.join(outputDir, 'index.html')));
  assert(gen.filePaths?.every(p => {
    const resolved = path.resolve(p);
    const base = path.resolve(outputDir);
    return resolved.startsWith(base + path.sep);
  }));
});

test('relative output directory is resolved safely', async () => {
  const outputDir = `.tmp-uzab-template-relative-${Date.now()}`;
  try {
    const gen = await generateFromTemplate('web-basic', {
      projectName: 'RelativeApp',
      outputDir
    });
    assert(gen.success, `Generation failed: ${gen.error}`);
    assert.equal(gen.projectPath, path.resolve(process.cwd(), outputDir));
    assert(fs.existsSync(path.join(gen.projectPath!, 'index.html')));
  } finally {
    fs.rmSync(path.resolve(process.cwd(), outputDir), { recursive: true, force: true });
  }
});

test('output path containing parent segments cannot escape the resolved destination', async () => {
  const root = makeTempDir();
  const outputDir = path.join(root, 'nested', '..', 'generated');
  const gen = await generateFromTemplate('web-basic', {
    projectName: 'TraversalCheck',
    outputDir
  });
  assert(gen.success, `Generation failed: ${gen.error}`);
  const resolvedRoot = path.resolve(outputDir);
  assert(gen.filePaths?.every(p => {
    const resolved = path.resolve(p);
    return resolved.startsWith(resolvedRoot + path.sep);
  }));
});

test('existing output directory is rejected instead of overwritten', async () => {
  const root = makeTempDir();
  const outputDir = path.join(root, 'existing');
  fs.mkdirSync(outputDir, { recursive: true });
  const gen = await generateFromTemplate('web-basic', {
    projectName: 'ExistingApp',
    outputDir
  });
  assert(!gen.success);
  assert.match(gen.error || '', /already exists/);
});

test('invalid package name rejected', async () => {
  const gen = await generateFromTemplate('web-basic', { projectName: 'X', packageName: 'Invalid-Package' });
  assert(!gen.success);
});

test('project names containing path separators are rejected', async () => {
  const gen = await generateFromTemplate('web-basic', { projectName: '../escape' });
  assert(!gen.success);
  assert.match(gen.error || '', /path separators/);
});

test('path traversal in template id is blocked', async () => {
  const gen = await generateFromTemplate('../etc/passwd' as any, { projectName: 'X' });
  assert(!gen.success);
});
