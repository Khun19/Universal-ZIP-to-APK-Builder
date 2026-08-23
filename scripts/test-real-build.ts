import { runBuildPipeline } from '../lib/pipeline.ts';
import * as fs from 'fs';
import * as path from 'path';

async function testRealBuild() {
  const buildId = `real-build-${Date.now()}`;
  console.log(`====================================================`);
  console.log(`🚀 Starting Real APK Build Test [${buildId}]`);
  console.log(`====================================================\n`);

  const sampleFiles = [
    { relativePath: 'package.json', content: '{"name": "real-test-app", "version": "1.0.0"}' },
    { relativePath: 'index.html', content: '<html><body><h1>Hello from Real APK Build!</h1></body></html>' }
  ];

  console.log('📦 Running build pipeline with Android SDK...');
  const result = await runBuildPipeline({
    buildId,
    files: sampleFiles
  });

  console.log('\n📊 --- REAL BUILD SUMMARY ---');
  console.log(`Status: ${result.success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  console.log(`Project Type: ${result.projectType || 'N/A'}`);
  console.log(`Strategy: ${result.strategyName || 'N/A'}`);
  console.log(`Output APK Path: ${result.outputPath || 'N/A'}`);

  console.log('\n📜 --- BUILD LOGS ---');
  result.logs.forEach(log => console.log(`  > ${log}`));
  console.log(`====================================================`);
}

testRealBuild();
