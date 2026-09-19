import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { safeExtractAdmZip } from './security/src/index.ts';
import { handleBuildRequest } from './server.ts';
import { listTemplates } from './template-registry';
import { generateFromTemplate } from './template-generator';

async function main() {
  const argv = process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === '--'));
  if (argv.length === 0) {
    console.error('Usage: pnpm tsx lib/cli.ts <command> [args]');
    console.error('Commands:');
    console.error('  templates:list');
    console.error('  templates:info <id>');
    console.error('  templates:create <id> <project-name> [--app-name="App"] [--package="com.example.app"]');
    console.error('  build-zip <path-to-zip>');
    process.exit(1);
  }

  const cmd = argv[0];

  if (cmd === 'templates:list') {
    try {
      const templates = listTemplates();
      console.log(JSON.stringify(templates, null, 2));
    } catch (e: any) {
      console.error('Failed to list templates:', e?.message || e);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'templates:info') {
    const id = argv[1];
    if (!id) {
      console.error('templates:info requires a template id');
      process.exit(1);
    }
    const templates = listTemplates();
    const tmpl = templates.find(t => t.id === id);
    if (!tmpl) {
      console.error('Template not found:', id);
      process.exit(1);
    }
    console.log(JSON.stringify(tmpl, null, 2));
    return;
  }

  if (cmd === 'templates:create') {
    const id = argv[1];
    const projectName = argv[2];
    if (!id || !projectName) {
      console.error('Usage: templates:create <id> <project-name> [--app-name] [--package]');
      process.exit(1);
    }
    // parse optional flags
    const appNameFlag = argv.find(a => a.startsWith('--app-name='));
    const packageFlag = argv.find(a => a.startsWith('--package='));
    const appName = appNameFlag ? appNameFlag.split('=')[1] : undefined;
    const packageName = packageFlag ? packageFlag.split('=')[1] : undefined;

    try {
      const gen = await generateFromTemplate(id, { projectName, appName, packageName });
      if (!gen.success || !gen.projectPath || !gen.filePaths) {
        console.error('Generation failed:', gen.error);
        process.exit(1);
      }
      console.log('Project generated at:', gen.projectPath);
      console.log('Starting build...');
      const result = await handleBuildRequest({ projectPath: gen.projectPath, filePaths: gen.filePaths, appName });
      result.logs.forEach(l => console.log('>', l));
      if (result.success && result.outputPath) {
        console.log('\n✅ APK →', result.outputPath);
      } else {
        console.error('\n❌ Build failed:', result.error);
        process.exit(1);
      }
    } catch (e: any) {
      console.error('Error:', e?.message || e);
      process.exit(1);
    }
    return;
  }

  // legacy CLI behaviour: build from zip
  const zipArg = argv[0];
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

  const zipBaseName = path.basename(zipPath, path.extname(zipPath));
  const result = await handleBuildRequest({ projectPath: workDir, filePaths, appName: zipBaseName });

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
