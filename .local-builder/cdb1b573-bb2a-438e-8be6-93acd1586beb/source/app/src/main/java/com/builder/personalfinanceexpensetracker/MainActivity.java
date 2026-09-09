package com.builder.personalfinanceexpensetracker;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.InputStream;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);

        // Serve bundled files over a stable HTTPS-like origin. This makes
        // root-relative Vite/React assets such as /assets/index.js resolve
        // inside the APK instead of becoming file:///assets/... URLs.
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
                        return new WebResourceResponse(
                            mimeType(path),
                            "UTF-8",
                            stream
                        );
                    } catch (Exception error) {
                        return null;
                    }
                }
            })
            .build();

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
                return assetLoader.shouldInterceptRequest(android.net.Uri.parse(url));
            }
        });

        webView.loadUrl("https://appassets.androidplatform.net/index.html");
        setContentView(webView);
    }
}