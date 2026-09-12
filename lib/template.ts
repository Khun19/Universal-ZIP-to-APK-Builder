import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface WrapperMetadata {
  appName: string;
  applicationId: string;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function escapeGradleString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function humanizeName(value: string): string {
  const cleaned = value.replace(/^@[^/]+\//, '').replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'GeneratedApp';
  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeApplicationId(value: string): string {
  const segments = value.toLowerCase().split('.').map((segment) => segment.replace(/[^a-z0-9_]/g, '')).filter(Boolean);
  if (segments.length < 2) return `com.builder.${segments[0] || 'generatedapp'}`;
  if (!/^[a-z_]/.test(segments[0])) segments.unshift('app');
  return segments.join('.');
}

function findProjectIcon(projectDir: string): string | null {
  const preferredNames = ['icon.png', 'logo.png', 'favicon.png', 'icon.webp', 'logo.webp', 'favicon.ico'];
  const preferredDirs = [projectDir, path.join(projectDir, 'public'), path.join(projectDir, 'src'), path.join(projectDir, 'src/assets'), path.join(projectDir, 'assets')];
  const candidates: string[] = [];
  for (const dir of preferredDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        if (preferredNames.includes(entry.name.toLowerCase())) candidates.push(path.join(dir, entry.name));
      }
    } catch {}
  }
  return candidates[0] || null;
}

function copyProjectIcon(projectDir: string, drawableDir: string): string | null {
  const sourceIcon = findProjectIcon(projectDir);
  if (!sourceIcon) return null;
  const extension = path.extname(sourceIcon).toLowerCase();
  if (!['.png', '.webp'].includes(extension)) return null;
  const destination = path.join(drawableDir, 'ic_launcher_custom' + extension);
  try {
    fs.copyFileSync(sourceIcon, destination);
    console.log(`Using project icon: ${sourceIcon}`);
    return extension;
  } catch {
    return null;
  }
}

function deriveWrapperMetadata(projectDir: string, requestedAppName: string): WrapperMetadata {
  let packageJson: Record<string, any> = {};
  const packageJsonPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try { packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')); } catch {}
  }

  let htmlTitle = '';
  const indexHtmlPath = path.join(projectDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    try {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch?.[1]) htmlTitle = titleMatch[1].replace(/\s+/g, ' ').trim();
    } catch {}
  }

  const configuredName = typeof packageJson.productName === 'string' && packageJson.productName.trim()
    ? packageJson.productName
    : typeof packageJson.displayName === 'string' && packageJson.displayName.trim()
      ? packageJson.displayName
      : htmlTitle
        ? htmlTitle
        : typeof packageJson.name === 'string' && packageJson.name.trim()
          ? packageJson.name
          : requestedAppName;

  const configuredId = typeof packageJson.android?.applicationId === 'string'
    ? packageJson.android.applicationId
    : `com.builder.${configuredName}`;

  return { appName: humanizeName(configuredName), applicationId: normalizeApplicationId(configuredId) };
}

export function injectAndroidWrapper(projectDir: string, webOutputDir?: string, appName: string = 'GeneratedApp'): void {
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

  for (const dir of [javaDir, assetsDir, drawableDir, mipmapDir, mipmapMdpiDir, mipmapXhdpiDir, mipmapXxhdpiDir, mipmapXxxhdpiDir, mipmapAnyDir]) fs.mkdirSync(dir, { recursive: true });

  const projectIconExtension = copyProjectIcon(projectDir, drawableDir);
  if (projectIconExtension) {
    const sourceIcon = path.join(drawableDir, 'ic_launcher_custom' + projectIconExtension);
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
sizes = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}
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
    } catch {}
  }

  const sourceDir = webOutputDir || projectDir;
  if (fs.existsSync(sourceDir)) {
    for (const file of fs.readdirSync(sourceDir)) {
      try { fs.cpSync(path.join(sourceDir, file), path.join(assetsDir, file), { recursive: true, force: true }); } catch {}
    }
  }

  const homeDir = process.env.HOME || '/data/data/com.termux/files/home';
  const keystoreDir = path.join(homeDir, '.android');
  const keystorePath = path.join(keystoreDir, 'debug.keystore');
  if (!fs.existsSync(keystorePath)) {
    fs.mkdirSync(keystoreDir, { recursive: true });
    try { execSync(`keytool -genkey -v -keystore "${keystorePath}" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "C=US, O=Android, CN=Android Debug"`, { stdio: 'ignore' }); } catch (e) { console.error('Failed to generate keystore:', e); }
  }

  const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  if (!sdkPath) throw new Error('ANDROID_HOME or ANDROID_SDK_ROOT must be set before generating the Android wrapper');
  fs.writeFileSync(path.join(projectDir, 'local.properties'), `sdk.dir=${sdkPath}`);

  const configuredAapt2 = process.env.AAPT2_PATH || '/data/data/com.termux/files/usr/bin/aapt2';
  const aapt2Line = fs.existsSync(configuredAapt2) ? `android.aapt2FromMavenOverride=${configuredAapt2}\n` : '';
  fs.writeFileSync(path.join(projectDir, 'gradle.properties'), `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.enableJetifier=true\n${aapt2Line}`);
  fs.writeFileSync(path.join(projectDir, 'settings.gradle'), `pluginManagement {\n    repositories {\n        google()\n        mavenCentral()\n        gradlePluginPortal()\n    }\n}\ndependencyResolutionManagement {\n    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)\n    repositories {\n        google()\n        mavenCentral()\n    }\n}\nrootProject.name = "${gradleAppName}"\ninclude ':app'`);
  fs.writeFileSync(path.join(drawableDir, 'ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">\n    <path android:fillColor="#6750A4" android:pathData="M0,0h108v108h-108z" />\n    <path android:fillColor="#FFFFFF" android:pathData="M58,12L25,61h24l-5,35 34,-50h-24z" />\n</vector>`);

  if (projectIconExtension) {
    fs.writeFileSync(path.join(mipmapAnyDir, 'ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background" />\n    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n</adaptive-icon>`);
    const valuesDir = path.join(mainDir, 'res/values');
    fs.mkdirSync(valuesDir, { recursive: true });
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_colors.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#6750A4</color>\n</resources>`);
  }

  const launcherIconResource = projectIconExtension ? '@mipmap/ic_launcher' : '@drawable/ic_launcher';
  fs.writeFileSync(path.join(mainDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${packageName}">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <application android:label="${safeAppName}" android:icon="${launcherIconResource}" android:roundIcon="${launcherIconResource}" android:allowBackup="true" android:supportsRtl="true">\n        <activity android:name=".MainActivity" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity>\n    </application>\n</manifest>`);

  fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), `package ${packageName};

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.InputStream;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1002;
    private ValueCallback<Uri[]> filePathCallback;
    private PermissionRequest pendingWebPermissionRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);

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
                    if (path == null || path.contains("..") || path.startsWith("/")) return null;
                    try {
                        InputStream stream = assets.open("www/" + path);
                        return new WebResourceResponse(mimeType(path), "UTF-8", stream);
                    } catch (Exception error) { return null; }
                }
            })
            .build();

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsCamera = false;
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) { wantsCamera = true; break; }
                    }
                    if (!wantsCamera) { request.deny(); return; }
                    pendingWebPermissionRequest = request;
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                        pendingWebPermissionRequest = null;
                    } else {
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent;
                try { intent = params.createIntent(); } catch (Exception ignored) { intent = new Intent(Intent.ACTION_OPEN_DOCUMENT); }
                intent.setAction(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(params.getAcceptTypes() != null && params.getAcceptTypes().length > 0 && params.getAcceptTypes()[0] != null && !params.getAcceptTypes()[0].isEmpty() ? params.getAcceptTypes()[0] : "*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try { startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE); return true; }
                catch (ActivityNotFoundException error) { filePathCallback.onReceiveValue(null); filePathCallback = null; return false; }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) { return assetLoader.shouldInterceptRequest(request.getUrl()); }
            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) { return assetLoader.shouldInterceptRequest(Uri.parse(url)); }
        });

        setContentView(webView);
        webView.loadUrl("https://appassets.androidplatform.net/index.html");

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != CAMERA_PERMISSION_REQUEST_CODE || pendingWebPermissionRequest == null) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            pendingWebPermissionRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            pendingWebPermissionRequest.deny();
        }
        pendingWebPermissionRequest = null;
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
        super.onActivityResult(requestCode, resultCode, data);
    }
}`);

  fs.writeFileSync(path.join(projectDir, 'build.gradle'), `plugins {\n    id 'com.android.application' version '8.7.3' apply false\n}`);
  fs.writeFileSync(path.join(projectDir, 'app/build.gradle'), `plugins {\n    id 'com.android.application'\n}\nandroid {\n    namespace '${packageName}'\n    compileSdk 34\n    defaultConfig {\n        applicationId "${packageName}"\n        minSdk 24\n        targetSdk 34\n        versionCode 1\n        versionName "1.0"\n    }\n    signingConfigs {\n        debug {\n            storeFile file("${keystorePath}")\n            storePassword "android"\n            keyAlias "androiddebugkey"\n            keyPassword "android"\n            v1SigningEnabled true\n            v2SigningEnabled true\n        }\n    }\n    buildTypes { debug { signingConfig signingConfigs.debug } }\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_21\n        targetCompatibility JavaVersion.VERSION_21\n    }\n}\ndependencies {\n    implementation 'androidx.webkit:webkit:1.12.1'\n}`);
}
