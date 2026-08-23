import { createServer, IncomingMessage, ServerResponse } from 'http';
import formidable from 'formidable';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { executeBuildJob } from './worker.ts';
import { URL } from 'url';

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

  // 2. APK ဖိုင်ကို Download ဆွဲရန် Endpoint အသစ်
  if (req.method === 'GET' && req.url?.startsWith('/api/download')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const apkPath = url.searchParams.get('path');

    if (apkPath && fs.existsSync(apkPath) && apkPath.endsWith('.apk')) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="app-wrapper-debug.apk"'
      });
      const stream = fs.createReadStream(apkPath);
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
        zip.extractAllTo(workspaceDir, true);

        console.log(`🚀 Building APK...`);
        const result = await executeBuildJob(workspaceDir, {
          strategyName: 'web-wrapper',
          outputArtifact: 'app-wrapper-debug.apk',
          buildId: buildId
        });

        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'APK Build Successful',
            buildId: buildId,
            apkPath: result.outputPath
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'APK Build Failed', logs: result.logs }));
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
