package com.primeai.mobil;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

    /* WebView içindeki uygulama bu adresten yüklenir: https olduğu için
       localStorage ve service worker normal bir site gibi çalışır. */
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int PICK_FILE = 1001;
    private static final int REQ_OVERLAY = 2001;
    private static final int REQ_PERMS = 2002;
    private static final int REQ_MEDIA = 2003;

    private WebView web;
    private Voice voice;
    private ValueCallback<Uri[]> pendingFiles;
    /* Ekranda gösterme izni verilince asistan kendiliğinden açılsın. */
    private boolean assistantPending = false;

    /* Güncelleme: APK arka planda indirilir, sonra kurulum ekranı açılır. */
    private volatile String updState = "idle";   // idle | downloading | ready | needs_permission | installing | error
    private volatile int updPct = 0;
    private volatile long updReceived = 0;
    private volatile long updTotal = 0;
    private volatile String updError = "";
    private volatile File updFile = null;
    private volatile boolean updDownloading = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        Window window = getWindow();
        window.setStatusBarColor(0xFF08080C);
        window.setNavigationBarColor(0xFF08080C);

        web = new WebView(this);
        web.setBackgroundColor(0xFF08080C);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            s.setSafeBrowsingEnabled(true);
        }

        web.addJavascriptInterface(new Bridge(), "PrimeAndroid");
        voice = new Voice(this, web);
        web.addJavascriptInterface(voice, "PrimeVoice");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && HOST.equals(uri.getHost())) {
                    return serveAsset(uri.getPath());
                }
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String scheme = uri.getScheme();
                if (("https".equals(scheme) || "http".equals(scheme)) && !HOST.equals(uri.getHost())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) {
                        Toast.makeText(MainActivity.this, "Bağlantı açılamadı.", Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }
                return false;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            /* Kamera ve mikrofon istekleri: izin verilmişse WebView'e geçirilir. */
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                final String[] resources = request.getResources();
                runOnUiThread(() -> {
                    ArrayList<String> ask = new ArrayList<>();
                    for (String r : resources) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)
                                && !hasPermission(Manifest.permission.CAMERA)) {
                            ask.add(Manifest.permission.CAMERA);
                        }
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r) && !hasMic()) {
                            ask.add(Manifest.permission.RECORD_AUDIO);
                        }
                    }
                    if (!ask.isEmpty()) {
                        requestPermissions(ask.toArray(new String[0]), REQ_MEDIA);
                        request.deny();
                        return;
                    }
                    request.grant(resources);
                });
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFiles != null) {
                    pendingFiles.onReceiveValue(null);
                }
                pendingFiles = callback;
                try {
                    startActivityForResult(params.createIntent(), PICK_FILE);
                    return true;
                } catch (Exception e) {
                    pendingFiles = null;
                    Toast.makeText(MainActivity.this, "Görsel seçici açılamadı.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        setContentView(web);
        if (state == null) {
            web.loadUrl(START_URL);
        } else {
            web.restoreState(state);
        }
    }

    private WebResourceResponse serveAsset(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
        try {
            InputStream in = getAssets().open("www" + path);
            String mime = mimeOf(path);
            if (mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json")) {
                return new WebResourceResponse(mime, "utf-8", in);
            }
            return new WebResourceResponse(mime, null, in);
        } catch (IOException e) {
            byte[] body = "Bulunamadı".getBytes(StandardCharsets.UTF_8);
            return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(body));
        }
    }

    private String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/manifest+json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private class Bridge {
        @JavascriptInterface
        public boolean isApp() {
            return true;
        }

        /* ------------------ Asistan tuşu (ana ekranda yüzen top) ------------------ */

        /** Asistanın gerçek durumu: anahtar, izinler ve servis çalışıyor mu. */
        @JavascriptInterface
        public String assistantState() {
            SharedPreferences p = getSharedPreferences(AssistantService.PREFS, MODE_PRIVATE);
            boolean overlay = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(MainActivity.this);
            boolean mic = hasMic();
            boolean notif = Build.VERSION.SDK_INT < 33 || hasPermission(Manifest.permission.POST_NOTIFICATIONS);
            JSONObject o = new JSONObject();
            try {
                o.put("want", p.getBoolean(AssistantService.KEY_WANT, false));
                o.put("overlay", overlay);
                o.put("mic", mic);
                o.put("notif", notif);
                o.put("running", AssistantService.running);
            } catch (Exception ignored) { }
            return o.toString();
        }

        /** Ayarlardaki anahtar: açar (izin ister, uygulamayı küçültür), kapatır. */
        @JavascriptInterface
        public String setAssistant(final boolean on) {
            final SharedPreferences p = getSharedPreferences(AssistantService.PREFS, MODE_PRIVATE);
            p.edit().putBoolean(AssistantService.KEY_WANT, on).apply();
            runOnUiThread(() -> {
                if (on) enableAssistant();
                else disableAssistant();
            });
            return assistantState();
        }

        /** Sessiz eşitleme: ayar açıksa top yoksa yeniden kurulur, uygulama küçültülmez. */
        @JavascriptInterface
        public String ensureAssistant() {
            final SharedPreferences p = getSharedPreferences(AssistantService.PREFS, MODE_PRIVATE);
            final boolean want = p.getBoolean(AssistantService.KEY_WANT, false);
            final boolean overlay = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(MainActivity.this);
            if (want && overlay && !AssistantService.running) {
                runOnUiThread(() -> startAssistantService());
            }
            return assistantState();
        }

        /* ------------------------- güncelleme (APK) ------------------------- */

        /** İndirme/kurulum durumu: { state, pct, received, total, error, canInstall } */
        @JavascriptInterface
        public String updateState() {
            return updateStateJson().toString();
        }

        /** APK'yı arka planda indirir; ilerleme updateState() ile okunur. */
        @JavascriptInterface
        public String downloadUpdate(final String url, final String name) {
            if (updDownloading) return updateStateJson().toString();
            if (url == null || !url.startsWith("https://")) {
                updState = "error";
                updError = "indirme adresi geçersiz";
                return updateStateJson().toString();
            }
            updDownloading = true;
            updState = "downloading";
            updPct = 0;
            updReceived = 0;
            updTotal = 0;
            updError = "";
            final String fileName = (name == null || name.trim().isEmpty()
                    ? "PRIME-AI-Mobil.apk"
                    : name.trim()).replaceAll("[^A-Za-z0-9._-]", "_");
            new Thread(new Runnable() {
                @Override
                public void run() { downloadApk(url, fileName); }
            }, "prime-update").start();
            return updateStateJson().toString();
        }

        /** İndirilen APK'yı kurar; izin yoksa ayarları açar ve needs_permission döner. */
        @JavascriptInterface
        public String installUpdate() {
            final File apk = updFile;
            if (apk == null || !apk.exists()) {
                updState = "error";
                updError = "indirilen dosya yok";
                return updateStateJson().toString();
            }
            if (!canInstallPackages()) {
                updState = "needs_permission";
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() { openInstallSettings(); }
                });
                return updateStateJson().toString();
            }
            updState = "installing";
            runOnUiThread(new Runnable() {
                @Override
                public void run() { launchInstaller(apk); }
            });
            return updateStateJson().toString();
        }

        /** Kurulum izni ayarlarını açar. */
        @JavascriptInterface
        public String openUpdateSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { openInstallSettings(); }
            });
            return updateStateJson().toString();
        }

        /* ------------------------- kamera izni ------------------------- */

        /** "granted" | "ask": izin yoksa istenir, sonuç __primeMediaGranted ile bildirilir. */
        @JavascriptInterface
        public String ensureCamera() {
            if (hasPermission(Manifest.permission.CAMERA)) return "granted";
            runOnUiThread(() -> requestPermissions(
                    new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO}, REQ_MEDIA));
            return "ask";
        }

        @JavascriptInterface
        public boolean hasCamera() {
            return hasPermission(Manifest.permission.CAMERA);
        }

        @JavascriptInterface
        public void setDark(final boolean dark) {
            runOnUiThread(() -> {
                int color = dark ? 0xFF08080C : 0xFFFFFFFF;
                Window w = getWindow();
                w.setStatusBarColor(color);
                w.setNavigationBarColor(color);
                View decor = w.getDecorView();
                int flags = decor.getSystemUiVisibility();
                if (dark) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                } else {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                }
                decor.setSystemUiVisibility(flags);
            });
        }
    }

    /* ------------------------- güncelleme yardımcıları ------------------------- */

    private JSONObject updateStateJson() {
        JSONObject o = new JSONObject();
        try {
            o.put("state", updState);
            o.put("pct", updPct);
            o.put("received", updReceived);
            o.put("total", updTotal);
            o.put("error", updError);
            o.put("canInstall", canInstallPackages());
        } catch (Exception ignored) { }
        return o;
    }

    /** Android 8+: bilinmeyen kaynaklardan kurulum izni verilmiş mi. */
    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        return getPackageManager().canRequestPackageInstalls();
    }

    private void openInstallSettings() {
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()));
            startActivity(i);
            Toast.makeText(this, "PRIME AI'ya bu kaynaktan uygulama kurma izni ver.", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            try {
                startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS));
            } catch (Exception ignored) {
                Toast.makeText(this, "Kurulum izni ayarları açılamadı.", Toast.LENGTH_LONG).show();
            }
        }
    }

    /** APK'yı kendi ContentProvider'ımız üzerinden kurulum ekranına verir. */
    private void launchInstaller(File apk) {
        try {
            Uri uri = UpdateProvider.uriFor(this, apk);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            updState = "error";
            updError = "kurulum açılamadı: " + e.getMessage();
        }
    }

    /** APK'yı indirir; yönlendirmeleri izler, ilerlemeyi alanlara yazar. */
    private void downloadApk(String url, String fileName) {
        File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = new File(getFilesDir(), "updates");
        if (!dir.exists()) dir.mkdirs();
        File target = new File(dir, fileName);
        File part = new File(dir, fileName + ".part");
        HttpURLConnection conn = null;
        try {
            URL next = new URL(url);
            for (int hop = 0; hop < 6; hop++) {
                HttpURLConnection c = (HttpURLConnection) next.openConnection();
                c.setInstanceFollowRedirects(false);
                c.setConnectTimeout(20000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", "PRIME-AI-Mobile");
                int code = c.getResponseCode();
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    String location = c.getHeaderField("Location");
                    c.disconnect();
                    if (location == null) throw new IOException("yönlendirme adresi yok");
                    next = new URL(next, location);
                    continue;
                }
                if (code != 200) {
                    c.disconnect();
                    throw new IOException("HTTP " + code);
                }
                conn = c;
                break;
            }
            if (conn == null) throw new IOException("bağlantı kurulamadı");

            long total = conn.getContentLengthLong();
            updTotal = total > 0 ? total : 0;
            if (target.exists()) target.delete();
            if (part.exists()) part.delete();

            InputStream in = conn.getInputStream();
            FileOutputStream out = new FileOutputStream(part);
            byte[] buffer = new byte[64 * 1024];
            long received = 0;
            int read;
            long last = 0;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
                received += read;
                updReceived = received;
                long now = System.currentTimeMillis();
                if (now - last > 150) {
                    last = now;
                    updPct = updTotal > 0 ? (int) Math.min(100, received * 100 / updTotal) : 0;
                }
            }
            out.flush();
            out.close();
            in.close();

            if (received < 100 * 1024) throw new IOException("indirilen dosya eksik görünüyor");
            if (!part.renameTo(target)) throw new IOException("dosya taşınamadı");
            updPct = 100;
            updReceived = received;
            updTotal = received;
            updFile = target;
            updState = "ready";
        } catch (Exception e) {
            updState = "error";
            updError = String.valueOf(e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
            part.delete();
        } finally {
            if (conn != null) conn.disconnect();
            updDownloading = false;
        }
    }

    private boolean hasPermission(String name) {
        return checkSelfPermission(name) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasMic() {
        return hasPermission(Manifest.permission.RECORD_AUDIO);
    }

    private boolean canOverlay() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this);
    }

    /** Asistanı açar: önce ekranda gösterme izni, sonra mikrofon/bildirim, sonra top. */
    private void enableAssistant() {
        if (!canOverlay()) {
            assistantPending = true;
            try {
                Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
                startActivityForResult(i, REQ_OVERLAY);
            } catch (Exception e) {
                Toast.makeText(this, "Ekranda gösterme izni açılamadı. Ayarlar → Uygulamalar → PRIME AI → Diğer izinler.", Toast.LENGTH_LONG).show();
            }
            return;
        }
        requestAssistantPermissions();
    }

    private void requestAssistantPermissions() {
        List<String> need = new ArrayList<>();
        if (!hasMic()) need.add(Manifest.permission.RECORD_AUDIO);
        if (Build.VERSION.SDK_INT >= 33 && !hasPermission(Manifest.permission.POST_NOTIFICATIONS)) {
            need.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        startAssistantService();
        if (!need.isEmpty()) requestPermissions(need.toArray(new String[0]), REQ_PERMS);
        minimizeApp();
    }

    private void startAssistantService() {
        try {
            Intent i = new Intent(this, AssistantService.class).setAction(AssistantService.ACTION_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(i);
            else startService(i);
        } catch (Exception e) {
            Toast.makeText(this, "Asistan başlatılamadı: " + e.getClass().getSimpleName(), Toast.LENGTH_LONG).show();
        }
    }

    private void disableAssistant() {
        assistantPending = false;
        try {
            stopService(new Intent(this, AssistantService.class));
        } catch (Exception ignored) { }
    }

    /** Uygulama kapanır, top ana ekranda kalır. */
    private void minimizeApp() {
        moveTaskToBack(true);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (assistantPending && canOverlay()) {
            assistantPending = false;
            requestAssistantPermissions();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_MEDIA) {
            final boolean cam = hasPermission(Manifest.permission.CAMERA);
            try {
                web.evaluateJavascript("window.__primeMediaGranted&&window.__primeMediaGranted(" + cam + ")", null);
            } catch (Exception ignored) { }
            return;
        }
        if (requestCode == REQ_PERMS) {
            if (!hasMic()) Toast.makeText(this, "Mikrofon izni olmadan top dinleyemez; istediğinde Ayarlar'dan açabilirsin.", Toast.LENGTH_LONG).show();
            if (hasMic()) {
                /* Mikrofon izni sonradan verildiyse servis mikrofon türüyle yeniden başlar;
                   böylece uygulama kapalıyken de top dinleyebilir. */
                stopService(new Intent(this, AssistantService.class));
            }
            if (!AssistantService.running) startAssistantService();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_OVERLAY) {
            if (canOverlay()) {
                assistantPending = false;
                requestAssistantPermissions();
            } else {
                assistantPending = false;
                Toast.makeText(this, "İzin verilmedi: top ana ekranda görünmez.", Toast.LENGTH_LONG).show();
            }
            return;
        }
        if (requestCode == PICK_FILE) {
            if (pendingFiles != null) {
                pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingFiles = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web == null) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript(
                "(function(){try{return !!(window.__primeBack && window.__primeBack());}catch(e){return false;}})()",
                value -> {
                    if (!"true".equals(value)) {
                        if (web != null && web.canGoBack()) {
                            web.goBack();
                        } else {
                            finish();
                        }
                    }
                });
    }

    @Override
    protected void onDestroy() {
        if (voice != null) {
            voice.shutdown();
            voice = null;
        }
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
