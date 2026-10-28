package com.primeai.mobil;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Ses köprüsü: yanıtları okumak (TTS) ve mikrofonla dinlemek.
 *
 * JS tarafı: PrimeVoice.profiles(), speak(text, id, rate), stop(),
 * micAvailable(), listen(lang), listenStop(), busy()
 * Geri bildirim: window.__primeVoice('{"type":"partial|final|error|start","text":"..."}')
 *
 * Altı ses profili cihazın TTS motoruyla üretilir: üç kadın, üç erkek.
 * Cinsiyet, ton (pitch) ve hız ile ayrışır; cihazda birden çok ses varsa
 * farklı sesler de dağıtılır.
 */
public class Voice {

    private final Context ctx;
    private final WebView web;
    private final Handler ui = new Handler(Looper.getMainLooper());

    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private String pendingSpeak = null;
    private volatile boolean speaking = false;
    private volatile String activeProfile = "k1";

    private SpeechRecognizer sr;
    private boolean wantListen = false;
    private String listenLang = "tr-TR";

    /* Profil → ton ve hız. */
    private static final String[] IDS = {"k1", "k2", "k3", "e1", "e2", "e3"};
    private static final String[] LABELS = {
            "Kadın 1 · sıcak", "Kadın 2 · canlı", "Kadın 3 · sakin",
            "Erkek 1 · derin", "Erkek 2 · doğal", "Erkek 3 · ağır"
    };
    private static final float[] PITCH = {1.16f, 1.30f, 1.08f, 0.80f, 0.92f, 0.66f};
    private static final float[] RATE = {1.00f, 1.06f, 0.92f, 0.98f, 1.02f, 0.90f};

    public Voice(Context ctx, WebView web) {
        this.ctx = ctx;
        this.web = web;
        initTts();
    }

    private void initTts() {
        try {
            tts = new TextToSpeech(ctx.getApplicationContext(), status -> {
                if (status != TextToSpeech.SUCCESS || tts == null) return;
                ttsReady = true;
                try { tts.setLanguage(Locale.getDefault()); } catch (Exception ignored) { }
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { speaking = true; }
                    @Override public void onDone(String id) { speaking = false; }
                    @Override public void onError(String id) { speaking = false; }
                });
                final String queued = pendingSpeak;
                pendingSpeak = null;
                if (queued != null) speakNow(queued, activeProfile, 1.0f);
            });
        } catch (Exception ignored) {
            tts = null;
        }
    }

    private void toJs(String json) {
        try {
            final String code = "window.__primeVoice&&window.__primeVoice(" + JSONObject.quote(json) + ")";
            ui.post(() -> {
                try { web.evaluateJavascript(code, null); } catch (Exception ignored) { }
            });
        } catch (Exception ignored) { }
    }

    private void event(String type, String text) {
        try {
            JSONObject o = new JSONObject();
            o.put("type", type);
            if (text != null) o.put("text", text);
            toJs(o.toString());
        } catch (Exception ignored) { }
    }

    /* ------------------------------ TTS ------------------------------ */

    @JavascriptInterface
    public String profiles() {
        JSONArray arr = new JSONArray();
        try {
            for (int i = 0; i < IDS.length; i++) {
                JSONObject o = new JSONObject();
                o.put("id", IDS[i]);
                o.put("label", LABELS[i]);
                arr.put(o);
            }
        } catch (Exception ignored) { }
        return arr.toString();
    }

    @JavascriptInterface
    public boolean ready() {
        return ttsReady;
    }

    @JavascriptInterface
    public boolean speaking() {
        return speaking;
    }

    @JavascriptInterface
    public void speak(final String text, final String id, final float rate) {
        if (text == null || text.trim().isEmpty()) return;
        activeProfile = id == null ? "k1" : id;
        final float speed = rate <= 0f ? 1.0f : rate;
        if (!ttsReady || tts == null) {
            pendingSpeak = text;
            return;
        }
        speakNow(text, activeProfile, speed);
    }

    private void speakNow(String text, String id, float speed) {
        try {
            int idx = 0;
            for (int i = 0; i < IDS.length; i++) if (IDS[i].equals(id)) idx = i;
            float pitch = PITCH[idx];
            float rate = RATE[idx] * (speed <= 0f ? 1f : speed);
            tts.setPitch(pitch);
            tts.setSpeechRate(rate);
            applyVoice(idx);
            speaking = true;
            Bundle p = new Bundle();
            p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1f);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, p, "prime-" + System.currentTimeMillis());
        } catch (Exception e) {
            speaking = false;
        }
    }

    /** Cihazda birden çok ses varsa profillere dağıtır; yoksa varsayılan kalır. */
    private void applyVoice(int idx) {
        try {
            if (tts == null) return;
            List<android.speech.tts.Voice> list = new ArrayList<>();
            for (android.speech.tts.Voice v : tts.getVoices()) {
                if (v.getLocale() != null && v.getLocale().getLanguage().equals(Locale.getDefault().getLanguage())) {
                    list.add(v);
                }
            }
            if (list.size() < 2) return;
            tts.setVoice(list.get(idx % list.size()));
        } catch (Exception ignored) { }
    }

    @JavascriptInterface
    public void stop() {
        try { if (tts != null) tts.stop(); } catch (Exception ignored) { }
        speaking = false;
        pendingSpeak = null;
    }

    /* ---------------------------- Mikrofon ---------------------------- */

    @JavascriptInterface
    public boolean micAvailable() {
        try {
            return SpeechRecognizer.isRecognitionAvailable(ctx);
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public void listen(final String lang) {
        listenLang = (lang == null || lang.trim().isEmpty()) ? "tr-TR" : lang.trim();
        ui.post(this::startRecognizer);
    }

    @JavascriptInterface
    public void listenStop() {
        wantListen = false;
        ui.post(() -> {
            try { if (sr != null) sr.stopListening(); } catch (Exception ignored) { }
            event("end", null);
        });
    }

    private void startRecognizer() {
        if (sr == null) {
            if (!micAvailable()) { event("error", "Bu cihazda konuşma tanıma yok."); return; }
            sr = SpeechRecognizer.createSpeechRecognizer(ctx);
            sr.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) { event("start", null); }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float rmsdB) { }
                @Override public void onBufferReceived(byte[] buffer) { }
                @Override public void onEndOfSpeech() { }

                @Override
                public void onError(int error) {
                    /* Sessizlik/kısa süre: yeniden dinlemeye devam edilir. */
                    boolean soft = error == SpeechRecognizer.ERROR_NO_MATCH
                            || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                            || error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY;
                    if (wantListen && soft) {
                        ui.postDelayed(() -> { if (wantListen) reallyStart(); }, 350);
                        return;
                    }
                    wantListen = false;
                    event("error", describe(error));
                }

                @Override public void onResults(Bundle results) {
                    String text = firstResult(results);
                    if (text != null && !text.isEmpty()) event("final", text);
                    if (wantListen) ui.postDelayed(() -> { if (wantListen) reallyStart(); }, 250);
                }

                @Override public void onPartialResults(Bundle partial) {
                    String text = firstResult(partial);
                    if (text != null && !text.isEmpty()) event("partial", text);
                }

                @Override public void onEvent(int eventType, Bundle params) { }
            });
        }
        wantListen = true;
        reallyStart();
    }

    private void reallyStart() {
        try {
            android.content.Intent i = new android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, listenLang);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1200);
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 800);
            if (sr != null) sr.startListening(i);
        } catch (Exception e) {
            event("error", "Mikrofon başlatılamadı.");
            wantListen = false;
        }
    }

    private String firstResult(Bundle b) {
        try {
            ArrayList<String> list = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (list != null && !list.isEmpty()) return list.get(0);
        } catch (Exception ignored) { }
        return null;
    }

    private String describe(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO: return "Ses kaydı hatası.";
            case SpeechRecognizer.ERROR_CLIENT: return "Mikrofon hatası.";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Mikrofon izni yok.";
            case SpeechRecognizer.ERROR_NETWORK: return "İnternet yok; konuşma tanıma çevrimiçi çalışır.";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Konuşma tanıma zaman aşımı.";
            case SpeechRecognizer.ERROR_NO_MATCH: return "Söyleneni anlayamadım.";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Mikrofon meşgul.";
            case SpeechRecognizer.ERROR_SERVER: return "Konuşma tanıma sunucusu yanıt vermedi.";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "Ses duyulmadı.";
            default: return "Konuşma tanıma hatası (" + error + ").";
        }
    }

    /** Uygulama kapanırken kaynakları bırakır. */
    public void shutdown() {
        wantListen = false;
        try { if (sr != null) { sr.destroy(); sr = null; } } catch (Exception ignored) { }
        try { if (tts != null) { tts.stop(); tts.shutdown(); tts = null; } } catch (Exception ignored) { }
        ttsReady = false;
    }

}
