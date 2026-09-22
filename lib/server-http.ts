import { createServer, IncomingMessage, ServerResponse } from 'http';
import formidable from 'formidable';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import { listTemplates, getTemplate } from './template-registry';
import { generateFromTemplate } from './template-generator';
import { handleBuildRequest } from './server.ts';

const PORT = 3000;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Dashboard ကို Serve လုပ်မည့်အပိုင်း
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const htmlPath = path.join(process.cwd(), 'dashboard.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Dashboard not found.');
    }
    return;
  }

  // Templates list
  if (req.method === 'GET' && req.url === '/api/templates') {
    try {
      const templates = listTemplates();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(templates));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e?.message || 'Failed to load templates' }));
    }
    return;
  }

  // Template info
  if (req.method === 'GET' && req.url?.startsWith('/api/templates/')) {
    const parts = req.url.split('/');
    const id = parts[parts.length - 1];
    const tmpl = getTemplate(id);
    if (!tmpl) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown template' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tmpl));
    return;
  }

  // POST /api/templates/:id/generate
  if (req.method === 'POST' && req.url?.startsWith('/api/templates/') && req.headers['content-type']?.includes('application/json')) {
    const parts = req.url.split('/');
    const id = parts[parts.length - 2] === 'templates' ? parts[parts.length - 1] : parts[parts.length - 1];
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const projectName = parsed.projectName;
        const appName = parsed.appName;
        const packageName = parsed.packageName;
        if (!projectName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'projectName is required' }));
          return;
        }
        const gen = await generateFromTemplate(id, { projectName, appName, packageName });
        if (!gen.success || !gen.projectPath || !gen.filePaths) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: gen.error || 'Generation failed' }));
          return;
        }

        // Now reuse the existing build pipeline
        const buildResp = await handleBuildRequest({ projectPath: gen.projectPath, filePaths: gen.filePaths, appName });
        if (buildResp.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Build successful', apkPath: buildResp.outputPath, logs: buildResp.logs }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: buildResp.error, logs: buildResp.logs }));
        }
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e?.message || 'Unknown error' }));
      }
    });
    return;
  }

  // 2. APK ဖိုင်ကို Download ဆွဲရန် Endpoint အသစ်
  if (req.method === 'GET' && req.url?.startsWith('/api/download')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const apkPath = url.searchParams.get('path');
    const workspaceRoot = path.resolve(process.cwd(), '.workspace');

    let resolvedApkPath = '';
    try {
      if (apkPath) {
        resolvedApkPath = fs.realpathSync(apkPath);
      }
    } catch {
      resolvedApkPath = '';
    }

    const isInsideWorkspace =
      resolvedApkPath.startsWith(workspaceRoot + path.sep);

    if (
      isInsideWorkspace &&
      fs.existsSync(resolvedApkPath) &&
      resolvedApkPath.endsWith('.apk')
    ) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="app-wrapper-debug.apk"'
      });
      const stream = fs.createReadStream(resolvedApkPath);
      stream.pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('APK not found or invalid path.');
    }
    return;
  }

  // 3. ZIP Upload လက်ခံမည့်အပိုင်း
  if (req.method === 'POST' && req.url === '/api/upload-zip') {
    const form = formidable({ maxFileSize: 50 * 1024 * 1024, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Upload failed', details: err.message }));
        return;
      }

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!uploadedFile) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No zip file provided.' }));
        return;
      }

      try {
        const buildId = `zip-build-${Date.now()}`;
        const workspaceDir = path.join(process.cwd(), '.workspace', buildId);
        
          console.log(`\n📦 [${buildId}] Extracting...`);
          const zip = new AdmZip(uploadedFile.filepath);
          const extraction = (await import('./security/src/index.ts')).safeExtractAdmZip(zip, workspaceDir);
          const filePaths = extraction.filePaths;

        console.log(`🚀 Analyzing and preparing isolated repair workspace...`);
        const uploadedName =
          typeof uploadedFile.originalFilename === 'string'
            ? uploadedFile.originalFilename.replace(/\.zip$/i, '')
            : 'GeneratedApp';
        const result = await handleBuildRequest({
          projectPath: workspaceDir,
          filePaths,
          appName: uploadedName,
          inputZipPath: uploadedFile.filepath,
        });

        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'APK Build Successful',
            buildId: buildId,
            apkPath: result.outputPath,
            projectType: result.projectType,
            repairIssues: result.repairIssues,
            repairEvidence: result.repairEvidence,
            logs: result.logs,
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: result.error ?? 'APK Build Failed', buildReady: result.buildReady, blocker: result.blocker, repairIssues: result.repairIssues, repairEvidence: result.repairEvidence, logs: result.logs }));
        }
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server Error', details: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
});
