import { test } from 'node:test';
import assert from 'node:assert';
import { processAndExtractFiles } from '../lib/extractor.ts';
import * as fs from 'fs';
import * as path from 'path';

test('Safely extracts files and blocks path traversal attempts', async () => {
  const mockZipContents = [
    { relativePath: 'package.json', content: '{"name": "test-app"}' },
    { relativePath: 'src/index.js', content: 'console.log("hello");' }
  ];

  const targetDir = path.resolve('./.tmp-extract-test-output');
  fs.rmSync(targetDir, { recursive: true, force: true });

  const result = await processAndExtractFiles(mockZipContents, targetDir);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.filePaths.length, 2);
  assert.ok(fs.existsSync(path.join(targetDir, 'package.json')));

  fs.rmSync(targetDir, { recursive: true, force: true });
});

test('Rejects malicious file paths during extraction', async () => {
  const maliciousContents = [
    { relativePath: '../../etc/passwd', content: 'root:x:0:0' }
  ];

  const targetDir = path.resolve('./.tmp-extract-malicious-output');
  const result = await processAndExtractFiles(maliciousContents, targetDir);

  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('Security violation'));

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});
