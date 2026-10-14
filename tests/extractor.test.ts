import { test } from 'node:test';
import assert from 'node:assert';
import { processAndExtractFiles } from '../lib/extractor.ts';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function temporaryDirectory(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('Safely extracts normal files inside the destination', async () => {
  const parent = temporaryDirectory('builder-extract-safe-');
  const targetDir = path.join(parent, 'output');
  try {
    const result = await processAndExtractFiles(
      [
        { relativePath: 'package.json', content: '{"name":"test-app"}' },
        { relativePath: 'src/index.js', content: 'console.log("hello");' },
      ],
      targetDir,
    );

    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.filePaths, ['package.json', 'src/index.js']);
    assert.strictEqual(
      fs.readFileSync(path.join(targetDir, 'src/index.js'), 'utf8'),
      'console.log("hello");',
    );
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('Rejects traversal, absolute, Windows drive, and NUL paths', async () => {
  const parent = temporaryDirectory('builder-extract-malicious-');
  const targetDir = path.join(parent, 'output');
  const maliciousPaths = [
    '../../etc/passwd',
    '/tmp/outside.txt',
    'C:\\Windows\\win.ini',
    '\\\\server\\share\\payload.txt',
    'bad\0name.txt',
  ];

  try {
    for (const relativePath of maliciousPaths) {
      const result = await processAndExtractFiles(
        [{ relativePath, content: 'should not be written' }],
        targetDir,
      );
      assert.strictEqual(result.success, false, `accepted unsafe path: ${JSON.stringify(relativePath)}`);
      assert.ok(result.error?.includes('Security violation'));
    }
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('Rejects a symlinked parent directory that points outside the destination', async () => {
  const parent = temporaryDirectory('builder-extract-symlink-parent-');
  const targetDir = path.join(parent, 'output');
  const outsideDir = path.join(parent, 'outside');
  fs.mkdirSync(targetDir);
  fs.mkdirSync(outsideDir);
  fs.symlinkSync(outsideDir, path.join(targetDir, 'escape'), 'dir');

  try {
    const result = await processAndExtractFiles(
      [{ relativePath: 'escape/payload.txt', content: 'outside write' }],
      targetDir,
    );
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Security violation'));
    assert.strictEqual(fs.existsSync(path.join(outsideDir, 'payload.txt')), false);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('Rejects an existing symlink file and preserves the external target', async () => {
  const parent = temporaryDirectory('builder-extract-symlink-file-');
  const targetDir = path.join(parent, 'output');
  const outsideFile = path.join(parent, 'outside.txt');
  fs.mkdirSync(targetDir);
  fs.writeFileSync(outsideFile, 'original');
  fs.symlinkSync(outsideFile, path.join(targetDir, 'payload.txt'));

  try {
    const result = await processAndExtractFiles(
      [{ relativePath: 'payload.txt', content: 'malicious overwrite' }],
      targetDir,
    );
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Security violation'));
    assert.strictEqual(fs.readFileSync(outsideFile, 'utf8'), 'original');
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
