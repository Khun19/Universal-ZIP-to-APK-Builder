import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export function injectAndroidWrapper(projectDir: string, appName: string = 'GeneratedApp'): void {
  const mainDir = path.join(projectDir, 'app/src/main');
  const javaDir = path.join(mainDir, 'java/com/builder/app');
  const assetsDir = path.join(mainDir, 'assets/www');

  fs.mkdirSync(javaDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  if (fs.existsSync(projectDir)) {
    const files = fs.readdirSync(projectDir);
    for (const file of files) {
      if (['app', 'build', '.gradle', 'artifacts', 'gradlew'].includes(file)) continue;
      const srcPath = path.join(projectDir, file);
      const destPath = path.join(assetsDir, file);
      try {
        if (fs.existsSync(srcPath) && srcPath !== path.join(projectDir, 'app')) {
          if (!fs.existsSync(destPath)) fs.cpSync(srcPath, destPath, { recursive: true, force: true });
        }
      } catch (err) {}
    }
  }

  // --- GUARANTEED KEYSTORE GENERATION ---
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

  // 0. local.properties
  const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  fs.writeFileSync(
    path.join(projectDir, 'local.properties'),
    `sdk.dir=${sdkPath}`
  );

  // 0.5 gradle.properties
  const aapt2Path = '/data/data/com.termux/files/usr/bin/aapt2';
  fs.writeFileSync(
    path.join(projectDir, 'gradle.properties'),
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.aapt2FromMavenOverride=${aapt2Path}`
  );

  // 1. settings.gradle
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
rootProject.name = "${appName}"
include ':app'`
  );

  // 2. AndroidManifest.xml
  fs.writeFileSync(
    path.join(mainDir, 'AndroidManifest.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.builder.app">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="${appName}" android:allowBackup="true" android:supportsRtl="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  );

  // 3. MainActivity.java
  fs.writeFileSync(
    path.join(javaDir, 'MainActivity.java'),
    `package com.builder.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
        setContentView(webView);
    }
}`
  );

  // 4. Root build.gradle
  fs.writeFileSync(
    path.join(projectDir, 'build.gradle'),
    `plugins {
    id 'com.android.application' version '8.7.0' apply false
}`
  );

  // 5. app/build.gradle (Forces V1 and V2 Signing)
  fs.writeFileSync(
    path.join(projectDir, 'app/build.gradle'),
    `plugins { 
    id 'com.android.application' 
}
android {
    namespace 'com.builder.app'
    compileSdk 33
    defaultConfig {
        applicationId "com.builder.app"
        minSdk 24
        targetSdk 33
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
}`
  );
}
