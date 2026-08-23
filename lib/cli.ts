import { runBuildPipeline } from './pipeline.ts';

export async function executeCLI() {
  const buildId = `cli-build-${Date.now()}`;

  console.log(`====================================================`);
  console.log(`🚀 Universal ZIP-to-APK Builder Engine [${buildId}]`);
  console.log(`====================================================\n`);

  // Sample upload payload for CLI execution test
  const sampleFiles = [
    { relativePath: 'package.json', content: '{"name": "demo-react-app"}' },
    { relativePath: 'vite.config.ts', content: 'export default {}' },
    { relativePath: 'index.html', content: '<html><body><h1>APK Builder Demo</h1></body></html>' }
  ];

  console.log('📦 Processing uploaded project files...');
  const result = await runBuildPipeline({
    buildId,
    files: sampleFiles
  });

  console.log('\n📊 --- BUILD RESULT SUMMARY ---');
  console.log(`Status: ${result.success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  console.log(`Project Type: ${result.projectType || 'N/A'}`);
  console.log(`Build Strategy: ${result.strategyName || 'N/A'}`);
  console.log(`Output Artifact: ${result.outputPath || 'N/A'}`);

  console.log('\n📜 --- REAL-TIME BUILD LOGS ---');
  result.logs.forEach(log => console.log(`  > ${log}`));
  console.log(`\n====================================================`);

  return result;
}

executeCLI();
