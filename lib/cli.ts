import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { safeExtractAdmZip } from './security/src/index.ts';
import { handleBuildRequest } from './server.ts';
import { listTemplates } from './template-registry';
import { generateFromTemplate } from './template-generator';

function getFlag(argv: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const value = argv.find(a => a.startsWith(prefix));
  return value ? value.slice(prefix.length) : undefined;
}

function deriveProjectName(outputDir: string): string {
  const base = path.basename(path.resolve(outputDir));
  if (!base) throw new Error('Output directory must have a project name');
  return base;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('Usage: pnpm tsx lib/cli.ts <command> [args]');
    console.error('Commands:');
    console.error('  templates:list');
    console.error('  templates:info <id>');
    console.error('  templates:create <id> <output-dir> [--project-name="MyProject"] [--app-name="App"] [--package="com.example.app"]');
    console.error('  build-zip <path-to-zip>');
    process.exit(1);
  }

  const cmd = argv[0];

  if (cmd === 'templates:list') {
    try {
      console.log(JSON.stringify(listTemplates(), null, 2));
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
    const tmpl = listTemplates().find(t => t.id === id);
    if (!tmpl) {
      console.error('Template not found:', id);
      process.exit(1);
    }
    console.log(JSON.stringify(tmpl, null, 2));
    return;
  }

  if (cmd === 'templates:create') {
    const id = argv[1];
    const outputDir = argv[2];
    if (!id || !outputDir) {
      console.error('Usage: templates:create <id> <output-dir> [--project-name] [--app-name] [--package]');
      process.exit(1);
    }

    const projectName = getFlag(argv, '--project-name') || deriveProjectName(outputDir);
    const appName = getFlag(argv, '--app-name');
    const packageName = getFlag(argv, '--package');

    try {
      const gen = await generateFromTemplate(id, { projectName, appName, packageName, outputDir });
      if (!gen.success || !gen.projectPath || !gen.filePaths) {
        console.error('Generation failed:', gen.error);
        process.exit(1);
      }
      console.log('Project generated at:', gen.projectPath);
      console.log('Generated files:', gen.filePaths.length);
      console.log('Starting build...');

      // The core build controller expects ZIP-style relative file entries.
      // Generated templates already live under projectPath, so convert their
      // absolute filesystem paths to safe project-relative paths at this
      // pipeline boundary. The legacy ZIP flow remains unchanged.
      const relativeFilePaths = gen.filePaths.map(filePath => {
        const relative = path.relative(gen.projectPath!, filePath);
        if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error(`Generated file escaped project root: ${filePath}`);
        }
        return relative.split(path.sep).join('/');
      });

      const result = await handleBuildRequest({
        projectPath: gen.projectPath,
        filePaths: relativeFilePaths,
        appName,
      });
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

  // Legacy CLI behaviour: build from zip.
  const zipArg = argv[0];
  const zipPath = path.resolve(zipArg);
  if (!fs.existsSync(zipPath)) {
    console.error(`File not found: ${zipPath}`);
    process.exit(1);
  }

  const buildId = `cli-build-${Date.now()}`;
  const workDir = path.resolve(`.workspace/${buildId}`);

  console.log(`\n📦 ZIP  : ${zipPath}`);
  console.log(`📁 Work : ${workDir}\n`);

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
    const outDir = path.resolve('output');
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
