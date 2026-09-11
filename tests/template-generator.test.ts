import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFromTemplate } from '../lib/template-generator.js';
import { analyzeProjectFiles } from '../lib/analyzer.js';

test('generate web-basic and variables applied', async ()=>{
  const gen = await generateFromTemplate('web-basic', { projectName: 'MyProj', appName: 'My App', packageName: 'com.example.myapp' });
  assert(gen.success, `Generation failed: ${gen.error}`);
  assert(gen.projectPath, 'projectPath missing');
  assert(Array.isArray(gen.filePaths) && gen.filePaths.length > 0);

  // ensure index.html contains APP_NAME
  const indexPath = gen.filePaths.find(p => p.endsWith('index.html'));
  assert(indexPath, 'index.html not found');
  const content = (await import('fs')).readFileSync(indexPath, 'utf8');
  assert(content.includes('My App'));

  // analyze
  const analysis = analyzeProjectFiles(gen.filePaths);
  assert(analysis.projectType === 'Plain HTML/JS' || analysis.projectType === 'React/Vite Web App');
});

test('invalid package name rejected', async ()=>{
  const gen = await generateFromTemplate('web-basic', { projectName: 'X', packageName: 'Invalid-Package' });
  assert(!gen.success);
});

test('path traversal in template blocked', async ()=>{
  // This repository's templates are safe; we simulate by passing bad template id
  const gen = await generateFromTemplate('../etc/passwd' as any, { projectName: 'X' });
  assert(!gen.success);
});
