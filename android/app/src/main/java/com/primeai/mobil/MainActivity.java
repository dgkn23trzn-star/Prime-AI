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
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
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
import java.io.IOException;
import java.io.InputStream;
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

    private WebView web;
    private ValueCallback<Uri[]> pendingFiles;
    /* Ekranda gösterme izni verilince asistan kendiliğinden açılsın. */
    private boolean assistantPending = false;

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
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
