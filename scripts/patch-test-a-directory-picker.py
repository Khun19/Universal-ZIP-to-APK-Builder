from pathlib import Path

p = Path('lib/template.ts')
s = p.read_text()

def rep(old: str, new: str, label: str) -> None:
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, got {count}')
    s = s.replace(old, new, 1)

rep('import android.os.Bundle;\nimport android.webkit.ValueCallback;', 'import android.os.Bundle;\nimport android.util.Base64;\nimport android.webkit.JavascriptInterface;\nimport android.webkit.ValueCallback;', 'imports')

rep('import java.io.InputStream;\n\npublic class MainActivity extends Activity {\n    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;\n    private ValueCallback<Uri[]> filePathCallback;', '''import java.io.ByteArrayOutputStream;
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
    }''', 'bridge class')

rep('webView.getSettings().setDomStorageEnabled(true);', 'webView.getSettings().setDomStorageEnabled(true);\n        directoryWebView = webView;\n        webView.addJavascriptInterface(new DirectoryBridge(), "AndroidDirectoryBridge");', 'bridge registration')

js = '''
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript("(function(){if(window.__androidDirectoryBridgeInstalled)return;window.__androidDirectoryBridgeInstalled=true;function B(s){var r=atob(s||'');var a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a;}function J(a,b){return a?a+'/'+b:b;}function F(p,n){var h={kind:'file',name:n,__androidPath:p};h.getFile=function(){return Promise.resolve(new File([B(AndroidDirectoryBridge.readFile(p))],n,{type:'application/octet-stream'}));};h.createWritable=function(){var c=[];return Promise.resolve({write:function(d){if(typeof d==='string')d=new TextEncoder().encode(d);if(d instanceof Blob)return d.arrayBuffer().then(function(x){c.push(new Uint8Array(x));});if(d instanceof ArrayBuffer)d=new Uint8Array(d);if(ArrayBuffer.isView(d))c.push(new Uint8Array(d.buffer,d.byteOffset,d.byteLength));return Promise.resolve();},close:function(){var n=0;c.forEach(function(x){n+=x.length});var o=new Uint8Array(n),q=0;c.forEach(function(x){o.set(x,q);q+=x.length});var s='';for(var i=0;i<o.length;i++)s+=String.fromCharCode(o[i]);return AndroidDirectoryBridge.writeFile(p,btoa(s),'application/octet-stream')?Promise.resolve():Promise.reject(new Error('write failed'));},abort:function(){c=[];return Promise.resolve();}})};return h;}function D(p,n){var h={kind:'directory',name:n||AndroidDirectoryBridge.getRootName(),__androidPath:p};h.queryPermission=function(){return Promise.resolve('granted')};h.requestPermission=function(){return Promise.resolve('granted')};h.getFileHandle=function(n,o){var q=J(p,n),a=JSON.parse(AndroidDirectoryBridge.list(p)||'[]'),x=a.find(function(v){return v.name===n&&v.kind==='file'});if(x||o&&o.create&&AndroidDirectoryBridge.createFile(q,'application/octet-stream'))return Promise.resolve(F(q,n));return Promise.reject(new DOMException('Not found','NotFoundError'));};h.getDirectoryHandle=function(n,o){var q=J(p,n),a=JSON.parse(AndroidDirectoryBridge.list(p)||'[]'),x=a.find(function(v){return v.name===n&&v.kind==='directory'});if(x||o&&o.create&&AndroidDirectoryBridge.createDirectory(q))return Promise.resolve(D(q,n));return Promise.reject(new DOMException('Not found','NotFoundError'));};h.removeEntry=function(n){return AndroidDirectoryBridge.remove(J(p,n))?Promise.resolve():Promise.reject(new DOMException('remove failed','InvalidModificationError'));};h.entries=function(){var a=JSON.parse(AndroidDirectoryBridge.list(p)||'[]'),i=0;return{next:function(){if(i>=a.length)return Promise.resolve({done:true});var x=a[i++],q=J(p,x.name),v=x.kind==='directory'?D(q,x.name):F(q,x.name);return Promise.resolve({done:false,value:[x.name,v]});},[Symbol.asyncIterator]:function(){return this;}}};h.values=function(){var e=h.entries();return{next:function(){return e.next().then(function(x){return x.done?x:{done:false,value:x.value[1]};});},[Symbol.asyncIterator]:function(){return this;}}};h.keys=function(){var e=h.entries();return{next:function(){return e.next().then(function(x){return x.done?x:{done:false,value:x.value[0]};});},[Symbol.asyncIterator]:function(){return this;}}};return h;}window.__androidDirectoryPickerResolve=null;window.__androidDirectoryPickerResult=function(ok){var r=window.__androidDirectoryPickerResolve;window.__androidDirectoryPickerResolve=null;if(r)r(ok?D('',''):null);};window.showDirectoryPicker=function(){return new Promise(function(r){window.__androidDirectoryPickerResolve=r;AndroidDirectoryBridge.pickDirectory();});};})();",null);
            }
'''
marker = '''            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, String url) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }
'''
rep(marker, marker + js, 'page finished')

rep('''        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);''', '''        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
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
        super.onActivityResult(requestCode, resultCode, data);''', 'activity result')

rep("implementation 'androidx.webkit:webkit:1.12.1'", "implementation 'androidx.webkit:webkit:1.12.1'\n    implementation 'androidx.documentfile:documentfile:1.0.1'", 'dependency')
p.write_text(s)
print('patched', p)
