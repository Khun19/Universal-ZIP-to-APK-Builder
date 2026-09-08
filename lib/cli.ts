import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { validateZipEntry } from './analyzer.ts';
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

  // 1. Extract ZIP — binary-safe
  let zip: AdmZip;
  try { zip = new AdmZip(zipPath); }
  catch (e: any) { console.error(`Bad ZIP: ${e.message}`); process.exit(1); }

  fs.mkdirSync(workDir, { recursive: true });
  const filePaths: string[] = [];

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const rel = entry.entryName.replace(/\\/g, '/');
    if (!validateZipEntry(rel)) {
      console.error(`Blocked path: ${rel}`); process.exit(1);
    }
    const canonicalWorkDir = fs.realpathSync(workDir);
    const dest = path.resolve(canonicalWorkDir, rel);
    if (
      !dest.startsWith(canonicalWorkDir + path.sep) &&
      dest !== canonicalWorkDir
    ) {
      console.error(`Blocked path breakout: ${rel}`); process.exit(1);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, entry.getData());
    filePaths.push(rel);
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
