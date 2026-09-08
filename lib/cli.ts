import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { safeExtractAdmZip } from './security/src/index.ts';
import { handleBuildRequest } from './server.ts';

async function main() {
  const zipArg = process.argv[2];

  if (!zipArg) {
    console.error('Usage: pnpm tsx lib/cli.ts <path-to-zip>');
    process.exit(1);
  }

  const zipPath = path.resolve(zipArg);
  if (!fs.existsSync(zipPath)) {
    console.error(`File not found: ${zipPath}`);
    process.exit(1);
  }

  const buildId  = `cli-build-${Date.now()}`;
  const workDir  = path.resolve(`.workspace/${buildId}`);

  console.log(`\n📦 ZIP  : ${zipPath}`);
  console.log(`📁 Work : ${workDir}\n`);

    // 1. Secure ZIP extraction
    let filePaths: string[];
    try {
      const zip = new AdmZip(zipPath);
      const extraction = safeExtractAdmZip(zip, workDir);
      filePaths = extraction.filePaths;
    } catch (e: any) {
      console.error(`Blocked ZIP: ${e.message}`);
      process.exit(1);
    }

    console.log(`Extracted ${filePaths.length} files.\n`);


  // 2. Analyze + Strategy + Build  (server.ts handles it all)
  const zipBaseName = path.basename(zipPath, path.extname(zipPath));
  const result = await handleBuildRequest({
    projectPath: workDir,
    filePaths,
    appName: zipBaseName,
  });

  result.logs.forEach(l => console.log('>', l));

  if (result.success && result.outputPath) {
    const outDir  = path.resolve('output');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${buildId}.apk`);
    fs.copyFileSync(result.outputPath, outFile);

    console.log(`\n✅ APK → ${outFile}`);
    console.log(`\nInstall:`);
    console.log(`  cp "${outFile}" /sdcard/Download/${buildId}.apk`);
  } else {
    console.error(`\n❌ FAILED: ${result.error}`);
    process.exit(1);
  }
}

main();
