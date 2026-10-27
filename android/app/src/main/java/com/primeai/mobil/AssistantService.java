package com.primeai.mobil;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Ana ekranda duran asistan: orb penceresi (küçük, dokunulabilir) ve yanıt
 * balonu penceresi (yazı + mikrofon + sesli okuma). Uygulama kapansa da yaşar.
 */
public class AssistantService extends Service {

    public static final String ACTION_START = "com.primeai.mobil.assistant.START";
    public static final String ACTION_STOP = "com.primeai.mobil.assistant.STOP";
    public static final String PREFS = "primeai";
    public static final String KEY_WANT = "assistant_want";
    public static final String KEY_X = "assistant_x";
    public static final String KEY_Y = "assistant_y";
    public static final String KEY_SIZE = "assistant_size_dp";

    private static final String CHANNEL = "prime-ai-asistan";
    private static final int NOTIF_ID = 7411;
    private static final String HOST = "appassets.androidplatform.net";
    private static final float ORB_DP = 72f;
    private static final float PANEL_DP = 320f;

    /** Anahtarın gerçek durumu: uygulama tarafı bunu okuyor. */
    public static volatile boolean running = false;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private WindowManager win;
    private WebView orbWeb;
    private WebView panelWeb;
    private WindowManager.LayoutParams orbLp;
    private WindowManager.LayoutParams panelLp;
    private float density = 1f;
    private int orbPx = 0;
    private boolean panelVisible = false;
    private boolean speaking = false;

    private SpeechRecognizer sr;
    private boolean listening = false;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String queuedSpeech = null;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        density = getResources().getDisplayMetrics().density;
        startInForeground();
        win = (WindowManager) getSystemService(WINDOW_SERVICE);
        orbPx = Math.round(Math.max(44, prefs().getInt(KEY_SIZE, (int) ORB_DP)) * density);
        addOrbWindow();
        addPanelWindow();
        prepareTts();
        running = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            hideAssistant();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        stopListening();
        if (tts != null) {
            try { tts.stop(); tts.shutdown(); } catch (Exception ignored) { }
            tts = null;
        }
        if (sr != null) {
            try { sr.destroy(); } catch (Exception ignored) { }
            sr = null;
        }
        removeView(orbWeb);
        removeView(panelWeb);
        orbWeb = null;
        panelWeb = null;
        super.onDestroy();
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS, MODE_PRIVATE);
    }

    /* --------------------------- Bildirim --------------------------- */

    private PendingIntent flagsPi(Intent intent, int code) {
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) f |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this, code, intent, f);
    }

    private void startInForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "PRIME AI asistanı", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Top ana ekranda dururken görünen bildirim.");
            ch.setShowBadge(false);
            try { nm.createNotificationChannel(ch); } catch (Exception ignored) { }
        }
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int pf = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pf |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent openPi = PendingIntent.getActivity(this, 0, open, pf);
        PendingIntent stopPi = flagsPi(new Intent(this, AssistantService.class).setAction(ACTION_STOP), 1);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) b = new Notification.Builder(this, CHANNEL);
        else b = new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_stat_prime)
                .setContentTitle("PRIME AI asistanı açık")
                .setContentText("Topa dokunup sorabilirsin · kapatmak için buradan")
                .setContentIntent(openPi)
                .setOngoing(true)
                .setPriority(Notification.PRIORITY_LOW)
                .addAction(new Notification.Action.Builder(null, "Kapat", stopPi).build());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) b.setColor(0xFFE23B2E);

        Notification n = b.build();
        if (Build.VERSION.SDK_INT >= 34) {
            int type = ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE;
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            }
            startForeground(NOTIF_ID, n, type);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    /* --------------------------- Pencereler --------------------------- */

    private WindowManager.LayoutParams params(int w, int h) {
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(w, h, type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        return lp;
    }

    private WebView makeWeb(String role) {
        WebView web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new Bridge("orb".equals(role)), "PrimeOverlay");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && HOST.equals(uri.getHost())) return serveAsset(uri.getPath());
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String scheme = uri.getScheme();
                if (("https".equals(scheme) || "http".equals(scheme)) && !HOST.equals(uri.getHost())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                    } catch (Exception ignored) { }
                    return true;
                }
                return false;
            }
        });
        web.loadUrl("https://" + HOST + "/assistant.html?role=" + role);
        web.setAlpha(0f);
        web.animate().alpha(1f).setDuration(220).start();
        return web;
    }

    private void addOrbWindow() {
        orbWeb = makeWeb("orb");
        orbLp = params(orbPx, orbPx);
        int screenW = getResources().getDisplayMetrics().widthPixels;
        int screenH = getResources().getDisplayMetrics().heightPixels;
        orbLp.x = prefs().getInt(KEY_X, Math.max(0, screenW - orbPx - Math.round(14 * density)));
        orbLp.y = prefs().getInt(KEY_Y, Math.round(screenH * 0.42f));
        clampOrb();
        try { win.addView(orbWeb, orbLp); } catch (Exception e) { toast("Top ekrana eklenemedi."); }
    }

    private void addPanelWindow() {
        panelWeb = makeWeb("panel");
        panelLp = params(1, 1);
        panelLp.flags |= WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        panelLp.x = 0;
        panelLp.y = 0;
        try { win.addView(panelWeb, panelLp); } catch (Exception ignored) { }
    }

    private void removeView(View v) {
        if (v == null || win == null) return;
        try { win.removeView(v); } catch (Exception ignored) { }
    }

    private void clampOrb() {
        int screenW = getResources().getDisplayMetrics().widthPixels;
        int screenH = getResources().getDisplayMetrics().heightPixels;
        if (orbLp.x < 0) orbLp.x = 0;
        if (orbLp.y < 0) orbLp.y = 0;
        if (orbLp.x + orbLp.width > screenW) orbLp.x = Math.max(0, screenW - orbLp.width);
        if (orbLp.y + orbLp.height > screenH) orbLp.y = Math.max(0, screenH - orbLp.height);
    }

    /** Topun boyutu değişince pencereyi ve konumu günceller. */
    private void setOrbSize(int dp) {
        if (dp < 40 || dp > 120) return;
        orbPx = Math.round(dp * density);
        if (orbLp.width == orbPx && orbLp.height == orbPx) return;
        orbLp.width = orbPx;
        orbLp.height = orbPx;
        clampOrb();
        try { win.updateViewLayout(orbWeb, orbLp); } catch (Exception ignored) { }
        prefs().edit().putInt(KEY_SIZE, dp).apply();
        layoutPanel();
    }

    private void moveOrbBy(int dxPx, int dyPx) {
        orbLp.x += dxPx;
        orbLp.y += dyPx;
        clampOrb();
        try { win.updateViewLayout(orbWeb, orbLp); } catch (Exception ignored) { }
        prefs().edit().putInt(KEY_X, orbLp.x).putInt(KEY_Y, orbLp.y).apply();
        layoutPanel();
    }

    /** Balon pencere boyutunu sayfadan gelen ölçüyle ayarlar. */
    private void setPanelSize(int wDp, int hDp) {
        boolean show = wDp > 8 && hDp > 8;
        int w = Math.round(Math.min(wDp, PANEL_DP) * density);
        int h = Math.round(hDp * density);
        int screenW = getResources().getDisplayMetrics().widthPixels;
        if (w > screenW - Math.round(16 * density)) w = screenW - Math.round(16 * density);
        boolean changed = panelLp.width != Math.max(1, w) || panelLp.height != Math.max(1, h) || show != panelVisible;
        if (!changed) return;
        panelVisible = show;
        panelLp.width = show ? Math.max(1, w) : 1;
        panelLp.height = show ? Math.max(1, h) : 1;
        if (show) {
            panelLp.flags &= ~WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        } else {
            panelLp.flags |= WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        }
        layoutPanel();
    }

    /** Balonu topun üstüne ya da altına, ekrana sığacak biçimde yerleştirir. */
    private void layoutPanel() {
        if (panelLp == null || orbLp == null) return;
        int screenW = getResources().getDisplayMetrics().widthPixels;
        int screenH = getResources().getDisplayMetrics().heightPixels;
        int pxW = panelLp.width;
        int x = orbLp.x + orbLp.width / 2 - pxW / 2;
        if (x < Math.round(8 * density)) x = Math.round(8 * density);
        if (x + pxW > screenW - Math.round(8 * density)) x = screenW - Math.round(8 * density) - pxW;
        if (x < 0) x = 0;
        int below = orbLp.y + orbLp.height + Math.round(8 * density);
        int y;
        if (below + panelLp.height < screenH - Math.round(12 * density)) {
            y = below;
        } else {
            y = Math.max(Math.round(12 * density), orbLp.y - panelLp.height - Math.round(8 * density));
            if (y + panelLp.height > screenH - Math.round(8 * density)) {
                y = Math.max(Math.round(8 * density), screenH - Math.round(8 * density) - panelLp.height);
            }
        }
        panelLp.x = x;
        panelLp.y = y;
        panelLp.gravity = Gravity.TOP | Gravity.START;
        panelLp.horizontalWeight = 0f;
        try {
            win.updateViewLayout(panelWeb, panelLp);
        } catch (Exception ignored) { }
        try { panelWeb.setAlpha(panelVisible ? 1f : 0f); } catch (Exception ignored) { }
    }

    /* --------------------------- Ses ve konuşma --------------------------- */

    private void prepareTts() {
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS && tts != null) {
                try { tts.setLanguage(new Locale("tr", "TR")); } catch (Exception ignored) { }
                ttsReady = true;
                if (queuedSpeech != null) {
                    tts.speak(queuedSpeech, TextToSpeech.QUEUE_FLUSH, null, "prime");
                    queuedSpeech = null;
                }
            }
        });
    }

    private void speakText(String text) {
        String clean = String.valueOf(text == null ? "" : text).replaceAll("[*#`>_~]", " ").trim();
        if (clean.isEmpty()) return;
        if (!ttsReady || tts == null) { queuedSpeech = clean; return; }
        sending(true);
        Bundle p = new Bundle();
        p.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "prime");
        tts.setOnUtteranceProgressListener(new android.speech.tts.UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onDone(String id) { sending(false); }
            @Override public void onError(String id) { sending(false); }
        });
        tts.speak(clean, TextToSpeech.QUEUE_FLUSH, p, "prime");
    }

    private boolean micAllowed() {
        return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void startListening() {
        if (listening) return;
        if (!micAllowed()) {
            toJs(orbWeb, "__primeSpeech('denied','')");
            toJs(panelWeb, "__primeSpeech('denied','')");
            toast("Sesle sormak için mikrofon izni gerekiyor.");
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            toJs(panelWeb, "__primeSpeech('unavailable','')");
            return;
        }
        if (tts != null) { try { tts.stop(); } catch (Exception ignored) { } }
        if (sr == null) {
            sr = SpeechRecognizer.createSpeechRecognizer(this);
            sr.setRecognitionListener(new Listener());
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toString());
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        listening = true;
        toJs(orbWeb, "__primeState('listen')");
        toJs(panelWeb, "__primeSpeech('start','')");
        try {
            sr.startListening(i);
        } catch (Exception e) {
            listening = false;
            toJs(panelWeb, "__primeSpeech('error','Dinleme başlatılamadı')");
        }
    }

    private void stopListening() {
        if (!listening || sr == null) return;
        listening = false;
        try { sr.stopListening(); } catch (Exception ignored) { }
        try { sr.cancel(); } catch (Exception ignored) { }
        toJs(orbWeb, "__primeState('idle')");
    }

    private void sending(boolean busy) {
        speaking = busy;
        toJs(orbWeb, "__primeState('" + (busy ? "talk" : "idle") + "')");
    }

    private class Listener implements RecognitionListener {
        @Override public void onReadyForSpeech(Bundle params) { }
        @Override public void onBeginningOfSpeech() { }
        @Override public void onRmsChanged(float rms) { }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onEndOfSpeech() { }

        @Override
        public void onPartialResults(Bundle partial) {
            String text = first(partial);
            if (text != null) toJs(panelWeb, "__primeSpeech('partial'," + quote(text) + ")");
        }

        @Override
        public void onResults(Bundle results) {
            listening = false;
            String text = first(results);
            toJs(orbWeb, "__primeState('idle')");
            if (text == null || text.trim().isEmpty()) {
                toJs(panelWeb, "__primeSpeech('none','')");
            } else {
                toJs(panelWeb, "__primeSpeech('final'," + quote(text) + ")");
            }
        }

        @Override
        public void onError(int error) {
            listening = false;
            toJs(orbWeb, "__primeState('idle')");
            String kind = (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)
                    ? "none" : "error";
            toJs(panelWeb, "__primeSpeech('" + kind + "','" + errorText(error) + "')");
        }

        @Override public void onEvent(int type, Bundle params) { }
    }

    private String errorText(int error) {
        if (error == SpeechRecognizer.ERROR_AUDIO) return "Ses kaydı sorunu";
        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) return "Mikrofon izni yok";
        if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) return "İnternet yok";
        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) return "Tanıma meşgul";
        if (error == SpeechRecognizer.ERROR_SERVER) return "Tanıma sunucusu yanıt vermedi";
        if (error == SpeechRecognizer.ERROR_CLIENT) return "Tanıma durdu";
        return "Dinlenemedi (" + error + ")";
    }

    private String first(Bundle b) {
        if (b == null) return null;
        ArrayList<String> list = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (list == null || list.isEmpty()) return null;
        return list.get(0);
    }

    /* --------------------------- Yardımcılar --------------------------- */

    private static String quote(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') sb.append('\\').append(c);
            else if (c == '\n' || c == '\r' || c == '\t') sb.append(' ');
            else sb.append(c);
        }
        return sb.append('"').toString();
    }

    private void toJs(final WebView web, final String js) {
        if (web == null) return;
        ui.post(() -> {
            try { web.evaluateJavascript("(function(){try{" + js + "}catch(e){}})();", null); }
            catch (Exception ignored) { }
        });
    }

    private void toast(final String text) {
        ui.post(() -> Toast.makeText(getApplicationContext(), text, Toast.LENGTH_SHORT).show());
    }

    private void hideAssistant() {
        prefs().edit().putBoolean(KEY_WANT, false).apply();
        toJs(orbWeb, "__primeStopped()");
        toJs(panelWeb, "__primeStopped()");
        stopSelf();
    }

    private class Bridge {
        private final boolean orb;

        Bridge(boolean orb) {
            this.orb = orb;
        }

        @JavascriptInterface
        public String role() {
            return orb ? "orb" : "panel";
        }

        @JavascriptInterface
        public String locale() {
            return Locale.getDefault().getLanguage();
        }

        @JavascriptInterface
        public int orbSize() {
            return Math.round(orbPx / density);
        }

        @JavascriptInterface
        public void size(final int dp) {
            ui.post(() -> setOrbSize(dp));
        }

        @JavascriptInterface
        public void moveBy(final int dx, final int dy) {
            ui.post(() -> moveOrbBy(dx, dy));
        }

        @JavascriptInterface
        public void panelSize(final int w, final int h) {
            ui.post(() -> setPanelSize(w, h));
        }

        @JavascriptInterface
        public void setTyping(final boolean on) {
            ui.post(() -> {
                if (on) panelLp.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                else panelLp.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                try { win.updateViewLayout(panelWeb, panelLp); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public void listen() {
            ui.post(AssistantService.this::startListening);
        }

        @JavascriptInterface
        public void stopListen() {
            ui.post(AssistantService.this::stopListening);
        }

        @JavascriptInterface
        public void speak(final String text) {
            ui.post(() -> speakText(text));
        }

        @JavascriptInterface
        public void stopSpeak() {
            ui.post(() -> {
                if (tts != null) { try { tts.stop(); } catch (Exception ignored) { } }
                sending(false);
            });
        }

        @JavascriptInterface
        public void openApp() {
            ui.post(() -> {
                try {
                    Intent i = new Intent(AssistantService.this, MainActivity.class);
                    i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    startActivity(i);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public void hidePanel() {
            ui.post(() -> setPanelSize(0, 0));
        }

        /** Top uzun basıldığında balon dinlemeden açılır. */
        @JavascriptInterface
        public void openPanel() {
            ui.post(() -> toJs(panelWeb, "__primePanel('open')"));
        }

        @JavascriptInterface
        public void stopAssistant() {
            ui.post(AssistantService.this::hideAssistant);
        }
    }

    /* --------------------------- Varlıklar --------------------------- */

    private WebResourceResponse serveAsset(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/assistant.html";
        try {
            InputStream in = getAssets().open("www" + path);
            String mime = mimeOf(path);
            if (mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json")) {
                return new WebResourceResponse(mime, "utf-8", in);
            }
            return new WebResourceResponse(mime, null, in);
        } catch (IOException e) {
            byte[] body = "Bulunamadi".getBytes(StandardCharsets.UTF_8);
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
}
