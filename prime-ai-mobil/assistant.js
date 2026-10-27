/* ==========================================================================
   PRIME AI · Asistan topu ve balonu
   Telefonda ana ekranda duran top; mikrofonla soru sorulur, yanıt balonda
   akar ve istenirse sesli okunur. Kayıtlar uygulamayla aynı yerden okunur:
   anahtar, model ve sohbet ayarları PRIME AI uygulamasındakiyle ortaktır.
   Bu balon bilerek kısa ve konuşma dilinde yanıt verir; kod yazmaz.
   ========================================================================== */
'use strict';

const STORE = 'primeai.mobil.v1';
const SOUND_KEY = 'primeai.assistant.sound';
const THREAD_KEY = 'primeai.assistant.thread';
const THREAD_MAX = 8;
const SILENCE_MS = 1250;

const P = {
  gemini:     { kind: 'gemini',    base: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash' },
  anthropic:  { kind: 'anthropic', base: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-5-haiku-latest' },
  openai:     { kind: 'openai',    base: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  groq:       { kind: 'openai',    base: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  openrouter: { kind: 'openai',    base: 'https://openrouter.ai/api/v1', defaultModel: 'openrouter/auto' },
  mistral:    { kind: 'openai',    base: 'https://api.mistral.ai/v1', defaultModel: 'mistral-small-latest' },
  deepseek:   { kind: 'openai',    base: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  xai:        { kind: 'openai',    base: 'https://api.x.ai/v1', defaultModel: 'grok-3-mini' },
  together:   { kind: 'openai',    base: 'https://api.together.ai/v1', defaultModel: '' },
  perplexity: { kind: 'openai',    base: 'https://api.perplexity.ai/v1', defaultModel: 'sonar' },
  cerebras:   { kind: 'openai',    base: 'https://api.cerebras.ai/v1', defaultModel: '' },
  fireworks:  { kind: 'openai',    base: 'https://api.fireworks.ai/inference/v1', defaultModel: '' }
};

const LANGS = { tr: 'Türkçe', en: 'English', de: 'Deutsch', ru: 'Русский', ja: '日本語' };

const native = (window.PrimeOverlay && typeof window.PrimeOverlay.panelSize === 'function')
  || (window.PrimeOverlay && typeof window.PrimeOverlay.role === 'function')
  ? window.PrimeOverlay : null;

const query = new URLSearchParams(location.search);
const role = native && typeof native.role === 'function' ? native.role() : (query.get('role') || 'panel');

/* ----------------------------- Köprü (köprü yoksa tarayıcı) ----------------------------- */

const bridge = {
  isNative: !!native,
  size(dp) { if (native) native.size(dp); },
  moveBy(dx, dy) { if (native) native.moveBy(dx, dy); },
  panelSize(w, h) { if (native) native.panelSize(w, h); },
  setTyping(on) { if (native) native.setTyping(on); },
  listen() {
    if (native) { native.listen(); return; }
    startWebSpeech();
  },
  stopListen() {
    if (native) { native.stopListen(); return; }
    stopWebSpeech();
  },
  speak(text) {
    if (native) { native.speak(text); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR';
      speechSynthesis.speak(u);
    } catch { /* yok */ }
  },
  stopSpeak() {
    if (native) { native.stopSpeak(); return; }
    try { speechSynthesis.cancel(); } catch { /* yok */ }
  },
  openApp() {
    if (native) { native.openApp(); return; }
    location.href = 'index.html';
  },
  hidePanel() { if (native) native.hidePanel(); },
  openPanel() { if (native) native.openPanel(); },
  stopAssistant() {
    if (native) { native.stopAssistant(); return; }
    hidePanel();
  }
};

/* ----------------------------- Kayıtlı durum ----------------------------- */

function readState() {
  try { const s = JSON.parse(localStorage.getItem(STORE) || '{}'); return s && typeof s === 'object' ? s : {}; }
  catch { return {}; }
}
function activeSlot() {
  const s = readState();
  const apis = Array.isArray(s.apis) ? s.apis.filter((a) => a && a.key && P[a.provider]) : [];
  if (!apis.length) return null;
  return apis.find((a) => a.sid === s.activeSid) || apis[0];
}
function modelOf(slot) {
  return String(slot.model || '').trim() || (P[slot.provider] ? P[slot.provider].defaultModel : '');
}
function soundOn() {
  const raw = localStorage.getItem(SOUND_KEY);
  if (raw === '0') return false;
  if (raw === '1') return true;
  return readState().soundOn !== false;
}
function setSound(on) { try { localStorage.setItem(SOUND_KEY, on ? '1' : '0'); } catch { /* yok */ } }

function thread() {
  try {
    const list = JSON.parse(localStorage.getItem(THREAD_KEY) || '[]');
    return Array.isArray(list) ? list.filter((m) => m && m.content) : [];
  } catch { return []; }
}
function threadPush(roleName, content) {
  const list = thread();
  list.push({ role: roleName, content: String(content || '').slice(0, 4000) });
  while (list.length > THREAD_MAX) list.shift();
  try { localStorage.setItem(THREAD_KEY, JSON.stringify(list)); } catch { /* yok */ }
}

/* Topun ve balonun söyleyeceği kısa cevaplar buradan besleniyor. */
function assistantPrompt() {
  const s = readState();
  const parts = [];
  if (String(s.systemPrompt || '').trim()) parts.push(String(s.systemPrompt).trim());
  parts.push('Yanıtlarını ' + (LANGS[s.replyLang || 'tr'] || 'Türkçe') + ' ver.');
  parts.push('Sesli asistan balonundasın: kısa konuş, en fazla üç cümle kur; uzun listeler yazma.');
  parts.push('Kod yazma, kod bloğu gösterme, kod örneği verme. Kod istenirse kısaca “Kod yazmayı bu balondan yapamıyorum, PRIME AI uygulamasını açıp oradan sorabilirsin.” de.');
  parts.push('Düz yazı kullan; başlık, madde imi, yıldız ve tablo kullanma.');
  return parts.join('\n\n');
}

/* ----------------------------- API ----------------------------- */

function authHeaders(cfg, key) {
  if (cfg.kind === 'anthropic') {
    return { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
  }
  return { Authorization: 'Bearer ' + key };
}

function bodyOf(slot, history) {
  const cfg = P[slot.provider];
  const model = modelOf(slot);
  const sys = assistantPrompt();
  if (cfg.kind === 'gemini') {
    const body = {
      contents: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    };
    /* 2.5 serisi düşünmeye token ayırıyor; bütçe verilmezse yanıt boş dönebiliyor. */
    if (/^gemini-2[.]5-flash/i.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
    else if (/^gemini-2[.]5-pro/i.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: 128 };
    if (sys) body.systemInstruction = { parts: [{ text: sys }] };
    return body;
  }
  if (cfg.kind === 'anthropic') {
    return { model, max_tokens: 1024, stream: true, system: sys, messages: history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) };
  }
  const msgs = history.map((m) => ({ role: m.role, content: m.content }));
  if (sys) msgs.unshift({ role: 'system', content: sys });
  return { model, messages: msgs, stream: true, temperature: 0.7, max_tokens: 1024 };
}

async function streamAnswer(slot, history, onText, signal) {
  const cfg = P[slot.provider];
  const model = modelOf(slot);
  if (!model) throw new Error('Model seçilmemiş. Uygulamadan bir model seç.');
  const key = String(slot.key || '').trim();
  let chars = 0;
  let why = '';
  const fed = (text) => { if (text) { chars += text.length; onText(text); } };

  const url = cfg.kind === 'gemini'
    ? cfg.base + '/models/' + encodeURIComponent(model) + ':streamGenerateContent?alt=sse'
    : (cfg.kind === 'anthropic' ? cfg.base + '/messages' : cfg.base + '/chat/completions');
  const headers = cfg.kind === 'gemini' ? { 'x-goog-api-key': key } : authHeaders(cfg, key);

  const res = await fetch(url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    body: JSON.stringify(bodyOf(slot, history)),
    signal
  });
  if (!res.ok) throw new Error(await httpError(res));
  if (!res.body) throw new Error('Yanıt akışı açılamadı.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const consume = (block) => {
    for (const line of block.split(/\r?\n/)) {
      const text = line.trim();
      if (!text.startsWith('data:')) continue;
      const raw = text.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      let chunk;
      try { chunk = JSON.parse(raw); } catch { continue; }
      if (chunk.error) { why = String((chunk.error && chunk.error.message) || ''); continue; }
      if (cfg.kind === 'gemini') {
        const cand = (chunk.candidates || [])[0] || {};
        if (cand.finishReason) why = String(cand.finishReason);
        if ((chunk.promptFeedback || {}).blockReason) why = String(chunk.promptFeedback.blockReason);
        for (const part of (cand.content || {}).parts || []) if (part.text) fed(part.text);
      } else if (cfg.kind === 'anthropic') {
        if (chunk.type === 'error' && chunk.error) why = String(chunk.error.message || '');
        if (chunk.type === 'content_block_delta' && chunk.delta && chunk.delta.type === 'text_delta' && chunk.delta.text) fed(chunk.delta.text);
      } else {
        const choice = (chunk.choices || [])[0] || {};
        if (choice.finish_reason) why = String(choice.finish_reason);
        const d = choice.delta || {};
        if (typeof d.content === 'string') fed(d.content);
      }
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    for (const b of blocks) consume(b);
  }
  if (buffer.trim()) consume(buffer);
  if (!chars) throw new Error(emptyReason(model, why));
}

async function httpError(res) {
  let detail = '';
  try {
    const j = await res.json();
    detail = String((j.error && j.error.message) || j.message || '').slice(0, 160);
  } catch { /* gövde yok */ }
  const map = { 400: 'İstek reddedildi', 401: 'Anahtar geçersiz', 403: 'Yetki yok', 404: 'Model bulunamadı', 429: 'Kota doldu', 500: 'Sağlayıcı hatası', 503: 'Sağlayıcı meşgul' };
  return (map[res.status] || 'Bağlantı hatası (' + res.status + ')') + (detail ? ': ' + detail : '');
}

function emptyReason(model, why) {
  const w = String(why || '');
  if (w === 'MAX_TOKENS') return 'Yanıt token sınırına takıldı (' + model + '). Daha kısa bir soruyla tekrar dene.';
  if (w === 'SAFETY' || w === 'PROHIBITED_CONTENT' || w === 'BLOCKLIST' || w === 'RECITATION') return 'İçerik filtresi yanıtı engelledi (' + w + '). Soruyu farklı sor.';
  if (w) return 'Yanıt gelmedi: ' + w + '. Tekrar dene.';
  return 'Model boş yanıt döndürdü. Uygulamadan başka bir model seç.';
}

function isQuota(err) {
  const s = String((err && err.message) || err || '').toLowerCase();
  return /(\b429\b|quota|kota|resource_exhausted|rate[ _-]?limit|too many requests)/.test(s);
}

/* ----------------------------- Top ----------------------------- */

function initOrb() {
  const stage = document.getElementById('orbStage');
  const orb = document.getElementById('orb');
  stage.hidden = false;
  const s = readState();
  const size = Math.max(44, Math.min(96, Number(s.orbSize) || 56));
  bridge.size(size);
  document.body.dataset.state = 'idle';
  if (s.orbLife === false) orb.style.animation = 'none';

  let total = 0;
  let moved = false;
  let pressTimer = null;
  let held = null;
  let last = null;

  const point = (e) => ({ x: e.clientX, y: e.clientY });

  orb.addEventListener('pointerdown', (e) => {
    try { orb.setPointerCapture(e.pointerId); } catch { /* yok */ }
    total = 0;
    moved = false;
    held = true;
    last = point(e);
    if (pressTimer) clearTimeout(pressTimer);
    /* Uzun basış: balonu dinlemeden açar (son yanıt ve düğmeler görünür). */
    pressTimer = setTimeout(() => {
      if (!moved) bridge.openPanel();
    }, 620);
  });

  orb.addEventListener('pointermove', (e) => {
    if (!held) return;
    const p = point(e);
    const dx = Math.round(p.x - last.x);
    const dy = Math.round(p.y - last.y);
    last = p;
    if (!dx && !dy) return;
    total += Math.abs(dx) + Math.abs(dy);
    if (total > 6) moved = true;
    bridge.moveBy(dx, dy);
  });

  const finish = () => {
    if (!held) return;
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    const wasMoved = moved;
    held = null;
    if (wasMoved) return;
    toggleListen();
  };

  orb.addEventListener('pointerup', finish);
  orb.addEventListener('pointercancel', () => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    held = null;
  });
  orb.addEventListener('lostpointercapture', finish);
  orb.addEventListener('contextmenu', (e) => e.preventDefault());

  /* Konuşurken ya da dinlerken top kıpırdar. */
  window.__primeState = (state) => {
    document.body.dataset.state = ['listen', 'talk', 'idle'].includes(state) ? state : 'idle';
  };
  window.__primeStopped = () => {
    document.body.dataset.state = 'idle';
  };
}

let orbListening = false;
function toggleListen() {
  if (orbListening) {
    orbListening = false;
    bridge.stopListen();
    document.body.dataset.state = 'idle';
    return;
  }
  orbListening = true;
  bridge.listen();
}

/* ----------------------------- Balon ----------------------------- */

const panelEl = document.getElementById('panel');
const replyEl = document.getElementById('reply');
const liveEl = document.getElementById('live');
const hintEl = document.getElementById('hint');
const dotEl = document.getElementById('dot');
const titleEl = document.getElementById('panelTitle');
const micBtn = document.getElementById('micBtn');
const micText = document.getElementById('micText');
const typeBtn = document.getElementById('typeBtn');
const sayBtn = document.getElementById('sayBtn');
const appBtn = document.getElementById('appBtn');
const closeBtn = document.getElementById('closeBtn');
const askForm = document.getElementById('askForm');
const askInput = document.getElementById('askInput');

let panelShown = false;
let panelBusy = false;
let listening = false;
let silenceTimer = null;
let job = null;

function sizePanel() {
  if (role !== 'panel') return;
  if (panelEl.hidden) { bridge.panelSize(0, 0); return; }
  const w = Math.max(200, Math.min(320, Math.round((window.screen && screen.width) || 320) - 16));
  panelEl.style.width = w + 'px';
  bridge.panelSize(w, Math.ceil(panelEl.getBoundingClientRect().height));
}

function showPanel() {
  if (!panelEl.hidden) { sizePanel(); return; }
  panelEl.hidden = false;
  panelShown = true;
  sizePanel();
}
function hidePanel() {
  panelEl.hidden = true;
  panelShown = false;
  stopListening();
  closeAskForm();
  bridge.hidePanel();
}

function hint(text) {
  if (!text) { hintEl.hidden = true; return; }
  hintEl.hidden = false;
  hintEl.textContent = text;
  sizePanel();
}

function setBusy(on, title) {
  panelBusy = on;
  titleEl.textContent = title || (on ? 'Düşünüyor…' : 'PRIME AI');
  micBtn.disabled = on;
  sizePanel();
}

function stopListening() {
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = null;
  if (!listening) return;
  listening = false;
  micText.textContent = 'Konuş';
  micBtn.classList.remove('on');
  bridge.stopListen();
  sizePanel();
}

function startListening() {
  showPanel();
  showHintIfNeeded();
  if (!activeSlot()) {
    hint('API anahtarı yok: “Uygulama”ya dokunup Ayarlar → API bölümünden anahtar ekle.');
    return;
  }
  listening = true;
  micText.textContent = 'Durdur';
  micBtn.classList.add('on');
  liveEl.hidden = false;
  liveEl.textContent = 'Dinliyorum…';
  hint('');
  bridge.listen();
  sizePanel();
}

function showHintIfNeeded() {
  const slot = activeSlot();
  if (!slot) hint('API anahtarı yok: “Uygulama”ya dokunup Ayarlar → API bölümünden anahtar ekle.');
  else hint('');
}

/* Balonu ekranın doğru yerinde tutmak için pencere ölçüsü tazelenir. */
function refreshSize() {
  if (role !== 'panel') return;
  if (!panelEl.hidden) sizePanel();
}

function commitTranscript(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  stopListening();
  liveEl.hidden = false;
  liveEl.textContent = '“' + clean + '”';
  ask(clean);
}

function onSpeech(kind, text) {
  showPanel();
  if (kind === 'start') {
    if (!listening) {
      listening = true;
      micText.textContent = 'Durdur';
      micBtn.classList.add('on');
    }
    liveEl.hidden = false;
    liveEl.textContent = 'Dinliyorum…';
    sizePanel();
    return;
  }
  if (kind === 'partial') {
    liveEl.hidden = false;
    liveEl.textContent = String(text || '');
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => commitTranscript(liveEl.textContent), SILENCE_MS);
    sizePanel();
    return;
  }
  if (kind === 'final') { commitTranscript(text); return; }
  if (kind === 'none') {
    stopListening();
    liveEl.hidden = false;
    liveEl.textContent = 'Sesini duyamadım.';
    sizePanel();
    return;
  }
  if (kind === 'denied') {
    stopListening();
    hint('Mikrofon izni yok: telefon Ayarları → Uygulamalar → PRIME AI → İzinler.');
    return;
  }
  if (kind === 'unavailable') {
    stopListening();
    hint('Bu telefonda konuşma tanıma yok; balondaki “Yaz” düğmesini kullan.');
    return;
  }
  if (kind === 'error') {
    stopListening();
    hint('Dinlenemedi: ' + String(text || 'bilinmeyen sorun'));
    return;
  }
}

async function ask(text) {
  const question = String(text || '').trim();
  if (!question || panelBusy) return;
  showPanel();
  hint('');
  liveEl.hidden = false;
  liveEl.textContent = '“' + question + '”';
  replyEl.textContent = '';
  setBusy(true, 'Düşünüyor…');

  if (job) { try { job.abort(); } catch { /* yok */ } }
  const ctl = new AbortController();
  job = ctl;

  const history = thread().concat([{ role: 'user', content: question }]);
  let slot = activeSlot();
  if (!slot) {
    setBusy(false);
    hint('API anahtarı yok: “Uygulama”ya dokunup Ayarlar → API bölümünden anahtar ekle.');
    return;
  }

  let answer = '';
  let lastError = null;
  const tried = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await streamAnswer(slot, history, (part) => {
        answer += part;
        replyEl.textContent = answer + '▍';
        refreshSize();
      }, ctl.signal);
      break;
    } catch (err) {
      if (ctl.signal.aborted) break;
      lastError = err;
      if (!isQuota(err) || answer) break;
      tried.push(slot.sid);
      const s = readState();
      const next = (s.apis || []).find((a) => a && a.key && P[a.provider] && !tried.includes(a.sid));
      if (!next) break;
      slot = next;
    }
  }

  setBusy(false);
  if (ctl.signal.aborted && !answer) { hint('İstek durduruldu.'); return; }
  if (!answer) {
    hint(lastError ? String(lastError.message || lastError) : 'Yanıt gelmedi. Tekrar dene.');
    return;
  }
  replyEl.textContent = answer.trim();
  threadPush('user', question);
  threadPush('assistant', answer.trim());
  refreshSize();
  if (soundOn()) bridge.speak(answer.trim());
}

/* ----------------------------- Düğmeler ----------------------------- */

function toggleAskForm(on) {
  const show = typeof on === 'boolean' ? on : askForm.hidden;
  askForm.hidden = !show;
  typeBtn.classList.toggle('on', show);
  bridge.setTyping(show);
  if (show) setTimeout(() => askInput.focus(), 60);
  sizePanel();
}
function closeAskForm() {
  if (askForm.hidden) return;
  askForm.hidden = true;
  typeBtn.classList.remove('on');
  bridge.setTyping(false);
}

function paintSound() {
  const on = soundOn();
  sayBtn.classList.toggle('on', on);
  sayBtn.textContent = on ? '🔊 Sesli' : '🔇 Sessiz';
}

/* Tarayıcı yedeği: mikrofon ve sesli okuma tarayıcının kendi araçlarıyla. */
let webSpeech = null;
function startWebSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onSpeech('unavailable', ''); return; }
  try {
    webSpeech = new SR();
    webSpeech.lang = 'tr-TR';
    webSpeech.interimResults = true;
    webSpeech.continuous = false;
    webSpeech.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) text += e.results[i][0].transcript;
      onSpeech(e.results[e.results.length - 1].isFinal ? 'final' : 'partial', text);
    };
    webSpeech.onerror = () => onSpeech('error', 'tarayıcı dinleyemedi');
    webSpeech.onend = () => { if (listening) onSpeech('none', ''); };
    webSpeech.start();
  } catch {
    onSpeech('unavailable', '');
  }
}
function stopWebSpeech() {
  if (!webSpeech) return;
  try { webSpeech.stop(); } catch { /* yok */ }
  webSpeech = null;
}

function initPanel() {
  panelEl.hidden = true;
  panelEl.style.width = '300px';
  paintSound();

  const s = readState();
  if (s.orbLife === false) document.body.classList.add('no-life');

  micBtn.addEventListener('click', () => {
    if (listening) stopListening();
    else startListening();
  });
  typeBtn.addEventListener('click', () => toggleAskForm());
  sayBtn.addEventListener('click', () => {
    if (soundOn()) { setSound(false); bridge.stopSpeak(); }
    else setSound(true);
    paintSound();
  });
  appBtn.addEventListener('click', () => bridge.openApp());
  closeBtn.addEventListener('click', () => hidePanel());
  document.getElementById('stopBtn').addEventListener('click', () => bridge.stopAssistant());

  askForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = askInput.value.trim();
    askInput.value = '';
    closeAskForm();
    if (text) ask(text);
  });

  askInput.addEventListener('focus', () => bridge.setTyping(true));
  askInput.addEventListener('blur', () => { if (askForm.hidden) bridge.setTyping(false); });

  new ResizeObserver(() => { if (!panelEl.hidden && !panelBusy) sizePanel(); }).observe(panelEl);

  /* Kapanınca son yanıt korunur: balon yeniden açıldığında görünür. */
  const last = thread().filter((m) => m.role === 'assistant').pop();
  if (last) replyEl.textContent = last.content;

  window.__primeSpeech = onSpeech;
  window.__primeState = (state) => { document.body.dataset.state = state === 'talk' ? 'talk' : 'idle'; };
  window.__primePanel = (mode) => {
    if (mode === 'open') { showPanel(); showHintIfNeeded(); }
    else hidePanel();
  };
  window.__primeStopped = () => hidePanel();

  /* Tarayıcıda denemek için: köprü yoksa balon açık başlar. */
  if (!bridge.isNative) showPanel();
}

/* ----------------------------- Başlangıç ----------------------------- */

if (role === 'orb') initOrb();
else initPanel();
