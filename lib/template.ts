import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface WrapperMetadata {
  appName: string;
  applicationId: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeGradleString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function humanizeName(value: string): string {
  const cleaned = value
    .replace(/^@[^/]+\//, '')
    .replace(/[-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'GeneratedApp';

  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeApplicationId(value: string): string {
  const segments = value
    .toLowerCase()
    .split('.')
    .map((segment) => segment.replace(/[^a-z0-9_]/g, ''))
    .filter(Boolean);

  if (segments.length < 2) {
    return `com.builder.${segments[0] || 'generatedapp'}`;
  }

  if (!/^[a-z_]/.test(segments[0])) {
    segments.unshift('app');
  }

  return segments.join('.');
}

function findProjectIcon(projectDir: string): string | null {
  const preferredNames = [
    'icon.png',
    'logo.png',
    'favicon.png',
    'icon.webp',
    'logo.webp',
    'favicon.ico',
  ];

  const preferredDirs = [
    projectDir,
    path.join(projectDir, 'public'),
    path.join(projectDir, 'src'),
    path.join(projectDir, 'src/assets'),
    path.join(projectDir, 'assets'),
  ];

  const candidates: string[] = [];

  for (const dir of preferredDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const fullPath = path.join(dir, entry.name);
        const lower = entry.name.toLowerCase();

        if (preferredNames.includes(lower)) {
          candidates.push(fullPath);
        }
      }
    } catch {
      // Ignore unreadable directories.
    }
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

function copyProjectIcon(
  projectDir: string,
  drawableDir: string,
): string | null {
  const sourceIcon = findProjectIcon(projectDir);

  if (!sourceIcon) {
    return null;
  }

  const extension = path.extname(sourceIcon).toLowerCase();

  if (!['.png', '.webp'].includes(extension)) {
    return null;
  }

  const destination = path.join(
    drawableDir,
    'ic_launcher_custom' + extension,
  );

  try {
    fs.copyFileSync(sourceIcon, destination);
    console.log(`Using project icon: ${sourceIcon}`);
    return extension;
  } catch {
    return null;
  }
}

function deriveWrapperMetadata(
  projectDir: string,
  requestedAppName: string,
): WrapperMetadata {
  let packageJson: Record<string, any> = {};
  const packageJsonPath = path.join(projectDir, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf8'),
      );
    } catch {
      // Keep safe defaults when an input package.json cannot be parsed.
    }
  }

  let htmlTitle = '';
  const indexHtmlPath = path.join(projectDir, 'index.html');

  if (fs.existsSync(indexHtmlPath)) {
    try {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

      if (titleMatch?.[1]) {
        htmlTitle = titleMatch[1].replace(/\s+/g, ' ').trim();
      }
    } catch {
      // Keep safe defaults when index.html cannot be read.
    }
  }

  const configuredName =
    typeof packageJson.productName === 'string' &&
    packageJson.productName.trim()
      ? packageJson.productName
      : typeof packageJson.displayName === 'string' &&
          packageJson.displayName.trim()
        ? packageJson.displayName
        : htmlTitle
          ? htmlTitle
          : typeof packageJson.name === 'string' &&
              packageJson.name.trim()
            ? packageJson.name
            : requestedAppName;

  const configuredId =
    typeof packageJson.android?.applicationId === 'string'
      ? packageJson.android.applicationId
      : `com.builder.${configuredName}`;

  return {
    appName: humanizeName(configuredName),
    applicationId: normalizeApplicationId(configuredId),
  };
}

export function injectAndroidWrapper(
  projectDir: string,
  webOutputDir?: string,
  appName: string = 'GeneratedApp',
): void {
  const metadata = deriveWrapperMetadata(projectDir, appName);
  const safeAppName = escapeXml(metadata.appName);
  const gradleAppName = escapeGradleString(metadata.appName);
  const packageName = metadata.applicationId;
  const mainDir = path.join(projectDir, 'app/src/main');
  const javaDir = path.join(mainDir, 'java', ...packageName.split('.'));
  const assetsDir = path.join(mainDir, 'assets/www');
  const drawableDir = path.join(mainDir, 'res/drawable');
  const mipmapDir = path.join(mainDir, 'res/mipmap-hdpi');
  const mipmapMdpiDir = path.join(mainDir, 'res/mipmap-mdpi');
  const mipmapXhdpiDir = path.join(mainDir, 'res/mipmap-xhdpi');
  const mipmapXxhdpiDir = path.join(mainDir, 'res/mipmap-xxhdpi');
  const mipmapXxxhdpiDir = path.join(mainDir, 'res/mipmap-xxxhdpi');
  const mipmapAnyDir = path.join(mainDir, 'res/mipmap-anydpi-v26');

  fs.mkdirSync(javaDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(drawableDir, { recursive: true });
  fs.mkdirSync(mipmapDir, { recursive: true });
  fs.mkdirSync(mipmapMdpiDir, { recursive: true });
  fs.mkdirSync(mipmapXhdpiDir, { recursive: true });
  fs.mkdirSync(mipmapXxhdpiDir, { recursive: true });
  fs.mkdirSync(mipmapXxxhdpiDir, { recursive: true });
  fs.mkdirSync(mipmapAnyDir, { recursive: true });

  const projectIconExtension = copyProjectIcon(projectDir, drawableDir);

  if (projectIconExtension) {
    const sourceIcon = path.join(
      drawableDir,
      'ic_launcher_custom' + projectIconExtension,
    );

    try {
      const { execFileSync } = require('child_process');
      execFileSync('python', ['-c', `
from PIL import Image
from pathlib import Path
import sys

src = Path(sys.argv[1])
root = Path(sys.argv[2])

im = Image.open(src).convert("RGBA")
im.thumbnail((432, 432), Image.Resampling.LANCZOS)

canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
x = (512 - im.width) // 2
y = (512 - im.height) // 2
canvas.alpha_composite(im, (x, y))

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in sizes.items():
    out = root / "res" / folder / "ic_launcher.png"
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(out, "PNG")

fg = root / "res" / "drawable" / "ic_launcher_foreground.png"
fg_canvas = Image.new("RGBA", (108, 108), (0, 0, 0, 0))
fg_src = Image.open(src).convert("RGBA")

px = fg_src.load()
w, h = fg_src.size
corners = [px[0,0], px[w-1,0], px[0,h-1], px[w-1,h-1]]
bg = tuple(sum(c[i] for c in corners) // len(corners) for i in range(4))

for y in range(h):
    for x in range(w):
        r,g,b,a = px[x,y]
        distance = abs(r-bg[0]) + abs(g-bg[1]) + abs(b-bg[2])
        if distance < 35 and not (r > 180 and g > 180 and b > 180):
            px[x,y] = (r,g,b,0)

bbox = fg_src.getchannel("A").getbbox()
if bbox:
    fg_src = fg_src.crop(bbox)
    fg_src.thumbnail((82, 82), Image.Resampling.LANCZOS)
    fg_x = (108 - fg_src.width) // 2
    fg_y = (108 - fg_src.height) // 2
    fg_canvas.alpha_composite(fg_src, (fg_x, fg_y))

fg_canvas.save(fg, "PNG")
`, sourceIcon, mainDir], { stdio: 'ignore' });
    } catch {
      // Keep the original project icon as fallback.
    }
  }

  const sourceDir = webOutputDir || projectDir;

  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const srcPath = path.join(sourceDir, file);
      const destPath = path.join(assetsDir, file);
      try {
        fs.cpSync(srcPath, destPath, { recursive: true, force: true });
      } catch (err) {}
    }
  }

  const homeDir = process.env.HOME || '/data/data/com.termux/files/home';
  const keystoreDir = path.join(homeDir, '.android');
  const keystorePath = path.join(keystoreDir, 'debug.keystore');

  if (!fs.existsSync(keystorePath)) {
    fs.mkdirSync(keystoreDir, { recursive: true });
    try {
      console.log('Generating local debug.keystore...');
      execSync(`keytool -genkey -v -keystore "${keystorePath}" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "C=US, O=Android, CN=Android Debug"`, { stdio: 'ignore' });
    } catch (e) {
      console.error("Failed to generate keystore:", e);
    }
  }

  const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  if (!sdkPath) {
    throw new Error(
      'ANDROID_HOME or ANDROID_SDK_ROOT must be set before generating the Android wrapper',
    );
  }
  fs.writeFileSync(
    path.join(projectDir, 'local.properties'),
    `sdk.dir=${sdkPath}`
  );

  const configuredAapt2 =
    process.env.AAPT2_PATH || '/data/data/com.termux/files/usr/bin/aapt2';
  const aapt2Line = fs.existsSync(configuredAapt2)
    ? `android.aapt2FromMavenOverride=${configuredAapt2}\n`
    : '';
  fs.writeFileSync(
    path.join(projectDir, 'gradle.properties'),
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
${aapt2Line}`
  );

  fs.writeFileSync(
    path.join(projectDir, 'settings.gradle'),
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${gradleAppName}"
include ':app'`
  );

  fs.writeFileSync(
    path.join(drawableDir, 'ic_launcher.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#6750A4"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M58,12L25,61h24l-5,35 34,-50h-24z" />
</vector>`
  );

  if (projectIconExtension) {
    fs.writeFileSync(
      path.join(mipmapAnyDir, 'ic_launcher.xml'),
      `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
    );

    const valuesDir = path.join(mainDir, 'res/values');
    fs.mkdirSync(valuesDir, { recursive: true });

    fs.writeFileSync(
      path.join(valuesDir, 'ic_launcher_colors.xml'),
      `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#6750A4</color>
</resources>`
    );
  }

  const launcherIconResource = projectIconExtension
    ? `@mipmap/ic_launcher`
    : '@drawable/ic_launcher';

  fs.writeFileSync(
    path.join(mainDir, 'AndroidManifest.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${packageName}">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="${safeAppName}"
        android:icon="${launcherIconResource}"
        android:roundIcon="${launcherIconResource}"
        android:allowBackup="true"
        android:supportsRtl="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  );

  fs.writeFileSync(
    path.join(javaDir, 'MainActivity.java'),
    `package ${packageName};

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import org.json.JSONArray;
import org.json.JSONObject;
import androidx.documentfile.provider.DocumentFile;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int DIRECTORY_PICKER_REQUEST_CODE = 1002;
    private ValueCallback<Uri[]> filePathCallback;
    private WebView directoryWebView;
    private Uri directoryTreeUri;

    private final class DirectoryBridge {
        private String cleanPath(String value) {
            if (value == null || value.length() == 0) return "";
            String normalized = value.replace('\\\\', '/');
            while (normalized.startsWith("/")) normalized = normalized.substring(1);
            while (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);
            if (normalized.length() == 0) return "";
            String[] parts = normalized.split("/");
            StringBuilder out = new StringBuilder();
            for (String part : parts) {
                if (part.length() == 0 || ".".equals(part)) continue;
                if ("..".equals(part)) throw new IllegalArgumentException("Invalid path");
                if (out.length() > 0) out.append('/');
                out.append(part);
            }
            return out.toString();
        }
        private DocumentFile root() { return directoryTreeUri == null ? null : DocumentFile.fromTreeUri(MainActivity.this, directoryTreeUri); }
        private DocumentFile document(String relativePath) {
            DocumentFile current = root();
            if (current == null) return null;
            String clean = cleanPath(relativePath);
            if (clean.length() == 0) return current;
            for (String part : clean.split("/")) { if (current == null || !current.isDirectory()) return null; current = current.findFile(part); }
            return current;
        }
        private DocumentFile parent(String relativePath) { String clean = cleanPath(relativePath); int slash = clean.lastIndexOf('/'); return document(slash < 0 ? "" : clean.substring(0, slash)); }
        private String leaf(String relativePath) { String clean = cleanPath(relativePath); int slash = clean.lastIndexOf('/'); return slash < 0 ? clean : clean.substring(slash + 1); }
        @JavascriptInterface public void pickDirectory() {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
            try { startActivityForResult(intent, DIRECTORY_PICKER_REQUEST_CODE); } catch (ActivityNotFoundException error) { notifyDirectoryResult(false); }
        }
        @JavascriptInterface public String list(String relativePath) {
            try { DocumentFile dir = document(relativePath); if (dir == null || !dir.isDirectory()) return "[]"; JSONArray result = new JSONArray(); for (DocumentFile child : dir.listFiles()) { JSONObject item = new JSONObject(); item.put("name", child.getName() == null ? "" : child.getName()); item.put("kind", child.isDirectory() ? "directory" : "file"); item.put("size", child.isFile() ? child.length() : 0); result.put(item); } return result.toString(); } catch (Exception error) { return "[]"; }
        }
        @JavascriptInterface public String readFile(String relativePath) {
            try { DocumentFile file = document(relativePath); if (file == null || !file.isFile()) return ""; InputStream input = getContentResolver().openInputStream(file.getUri()); if (input == null) return ""; ByteArrayOutputStream output = new ByteArrayOutputStream(); byte[] buffer = new byte[8192]; int count; while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count); input.close(); return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP); } catch (Exception error) { return ""; }
        }
        @JavascriptInterface public boolean createDirectory(String relativePath) {
            try { DocumentFile existing = document(relativePath); if (existing != null) return existing.isDirectory(); DocumentFile parent = parent(relativePath); return parent != null && parent.isDirectory() && parent.createDirectory(leaf(relativePath)) != null; } catch (Exception error) { return false; }
        }
        @JavascriptInterface public boolean createFile(String relativePath, String mimeType) {
            try { DocumentFile existing = document(relativePath); if (existing != null) return existing.isFile(); DocumentFile parent = parent(relativePath); return parent != null && parent.isDirectory() && parent.createFile(mimeType == null || mimeType.length() == 0 ? "application/octet-stream" : mimeType, leaf(relativePath)) != null; } catch (Exception error) { return false; }
        }
        @JavascriptInterface public boolean writeFile(String relativePath, String base64Data, String mimeType) {
            try { DocumentFile file = document(relativePath); if (file == null || !file.isFile()) { if (!createFile(relativePath, mimeType)) return false; file = document(relativePath); } if (file == null) return false; byte[] data = Base64.decode(base64Data == null ? "" : base64Data, Base64.DEFAULT); OutputStream output = getContentResolver().openOutputStream(file.getUri(), "wt"); if (output == null) return false; output.write(data); output.close(); return true; } catch (Exception error) { return false; }
        }
        @JavascriptInterface public boolean remove(String relativePath) { try { DocumentFile file = document(relativePath); return file != null && file.delete(); } catch (Exception error) { return false; } }
        @JavascriptInterface public String getRootName() { DocumentFile root = root(); return root == null || root.getName() == null ? "Selected folder" : root.getName(); }
        private void notifyDirectoryResult(boolean ok) { if (directoryWebView != null) directoryWebView.post(() -> directoryWebView.evaluateJavascript("window.__androidDirectoryPickerResult(" + (ok ? "true" : "false") + ");", null)); }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        directoryWebView = webView;
        webView.addJavascriptInterface(new DirectoryBridge(), "AndroidDirectoryBridge");

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/", new WebViewAssetLoader.PathHandler() {
                private final AssetManager assets = getAssets();

                private String mimeType(String path) {
                    if (path.endsWith(".html")) return "text/html";
                    if (path.endsWith(".css")) return "text/css";
                    if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript";
                    if (path.endsWith(".json")) return "application/json";
                    if (path.endsWith(".svg")) return "image/svg+xml";
                    if (path.endsWith(".png")) return "image/png";
                    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
                    if (path.endsWith(".webp")) return "image/webp";
                    if (path.endsWith(".ico")) return "image/x-icon";
                    if (path.endsWith(".woff2")) return "font/woff2";
                    if (path.endsWith(".woff")) return "font/woff";
                    if (path.endsWith(".ttf")) return "font/ttf";
                    return "application/octet-stream";
                }

                @Override
                public WebResourceResponse handle(String path) {
                    if (path == null || path.contains("..") || path.startsWith("/")) {
                        return null;
                    }

                    try {
                        InputStream stream = assets.open("www/" + path);
                        return new WebResourceResponse(mimeType(path), "UTF-8", stream);
                    } catch (Exception error) {
                        return null;
                    }
                }
            })
            .build();

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                Intent intent;
                try {
                    intent = params.createIntent();
                } catch (Exception ignored) {
                    intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                }

                intent.setAction(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(params.getAcceptTypes() != null && params.getAcceptTypes().length > 0
                        && params.getAcceptTypes()[0] != null && !params.getAcceptTypes()[0].isEmpty()
                        ? params.getAcceptTypes()[0]
                        : "*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);

                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                    return true;
                } catch (ActivityNotFoundException error) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, String url) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript("(function(){if(window.__androidDirectoryBridgeInstalled)return;window.__androidDirectoryBridgeInstalled=true;function B(s){var r=atob(s||'');var a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a;}function J(a,b){return a?a+'/'+b:b;}function F(p,n){var h={kind:'file',name:n,__androidPath:p};h.getFile=function(){return Promise.resolve(new File([B(AndroidDirectoryBridge.readFile(p))],n,{type:'application/octet-stream'}));};h.createWritable=function(){var c=[];return Promise.resolve({write:function(d){if(typeof d==='string')d=new TextEncoder().encode(d);if(d instanceof Blob)return d.arrayBuffer().then(function(x){c.push(new Uint8Array(x));});if(d instanceof ArrayBuffer)d=new Uint8Array(d);if(ArrayBuffer.isView(d))c.push(new Uint8Array(d.buffer,d.byteOffset,d.byteLength));return Promise.resolve();},close:function(){var n=0;c.forEach(function(x){n+=x.length});var o=new Uint8Array(n),q=0;c.forEach(function(x){o.set(x,q);q+=x.length});var s='';for(var i=0;i<o.length;i++)s+=String.fromCharCode(o[i]);return AndroidDirectoryBridge.writeFile(p,btoa(s),'application/octet-stream')?Promise.resolve():Promise.reject(new Error('write failed'));},abort:function(){c=[];return Promise.resolve();}})};return h;}function D(p,n){var h={kind:'directory',name:n||AndroidDirectoryBridge.getRootName(),__androidPath:p};h.queryPermission=function(){return Promise.resolve('granted')};h.requestPermission=function(){return Promise.resolve('granted')};h.getFileHandle=function(n,o){var q=J(p,n),a=JSON.parse(AndroidDirectoryBridge.list(p)||'[]'),x=a.find(function(v){return v.name===n&&v.kind==='file'});if(x||o&&o.create&&AndroidDirectoryBridge.createFile(q,'application/octet-stream'))return Promise.resolve(F(q,n));return Promise.reject(new DOMException('Not found','NotFoundError'));};h.getDirectoryHandle=function(n,o){var q=J(p,n),a=JSON.parse(AndroidDirectoryBridge.list(p)||'[]'),x=a.find(function(v){return v.name===n&&v.kind==='directory'});if(x||o&&o.create&&AndroidDirectoryBridge.createDirectory(q))return Promise.resolve(D(q,n));return Promise.reject(new DOMException('Not found','NotFoundError'));};h.removeEntry=function(n){return AndroidDirectoryBridge.remove(J(p,n))?Promise.resolve():Promise.reject(new DOMException('remove failed','InvalidModificationError'));};h.entries=function(){var a=JSON.parse(AndroidDirectoryBridge.list(p)||'[]'),i=0;return{next:function(){if(i>=a.length)return Promise.resolve({done:true});var x=a[i++],q=J(p,x.name),v=x.kind==='directory'?D(q,x.name):F(q,x.name);return Promise.resolve({done:false,value:[x.name,v]});},[Symbol.asyncIterator]:function(){return this;}}};h.values=function(){var e=h.entries();return{next:function(){return e.next().then(function(x){return x.done?x:{done:false,value:x.value[1]};});},[Symbol.asyncIterator]:function(){return this;}}};h.keys=function(){var e=h.entries();return{next:function(){return e.next().then(function(x){return x.done?x:{done:false,value:x.value[0]};});},[Symbol.asyncIterator]:function(){return this;}}};return h;}window.__androidDirectoryPickerResolve=null;window.__androidDirectoryPickerResult=function(ok){var r=window.__androidDirectoryPickerResolve;window.__androidDirectoryPickerResolve=null;if(r)r(ok?D('',''):null);};window.showDirectoryPicker=function(){return new Promise(function(r){window.__androidDirectoryPickerResolve=r;AndroidDirectoryBridge.pickDirectory();});};})();",null);
            }
        });

        webView.loadUrl("https://appassets.androidplatform.net/index.html");
        setContentView(webView);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        if (requestCode == DIRECTORY_PICKER_REQUEST_CODE) {
            boolean ok = resultCode == RESULT_OK && data != null && data.getData() != null;
            if (ok) {
                directoryTreeUri = data.getData();
                try {
                    int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    getContentResolver().takePersistableUriPermission(directoryTreeUri, flags);
                } catch (Exception ignored) {}
            }
            if (directoryWebView != null) {
                directoryWebView.post(() -> directoryWebView.evaluateJavascript(
                    "window.__androidDirectoryPickerResult(" + (ok ? "true" : "false") + ");", null));
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }
}`
  );

  fs.writeFileSync(
    path.join(projectDir, 'build.gradle'),
    `plugins {
    id 'com.android.application' version '8.7.3' apply false
}`
  );

  fs.writeFileSync(
    path.join(projectDir, 'app/build.gradle'),
    `plugins { 
    id 'com.android.application' 
}
android {
    namespace '${packageName}'
    compileSdk 34
    defaultConfig {
        applicationId "${packageName}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    signingConfigs {
        debug {
            storeFile file("${keystorePath}")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
            v1SigningEnabled true
            v2SigningEnabled true
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }
}
dependencies {
    implementation 'androidx.webkit:webkit:1.12.1'
    implementation 'androidx.documentfile:documentfile:1.0.1'
}`
  );
}
