/* ============================================================
   PRIME AI — tarayıcıda ve masaüstünde çalışan yapay zeka sohbeti
   Hesaplar, anahtarlar ve sohbetler yalnızca bu cihazda saklanır.
   ============================================================ */
'use strict';

/* ----------------------------- Sağlayıcılar ----------------------------- */
/* kind: gemini | openai | anthropic   ·   needsKey false ise anahtar sorulmaz */
const PROVIDERS = {
  gemini:    { label: 'Google Gemini', badge: 'GE', kind: 'gemini',
               keyUrl: 'https://aistudio.google.com/apikey', keyUrlLabel: 'aistudio.google.com/apikey',
               keyHint: 'Ücretsiz katman var. Anahtar AIza ile başlar.', prefer: ['flash', 'pro'] },
  openai:    { label: 'OpenAI', badge: 'OP', kind: 'openai',
               keyUrl: 'https://platform.openai.com/api-keys', keyUrlLabel: 'platform.openai.com/api-keys',
               keyHint: 'Anahtar sk- ile başlar.', prefer: ['mini', 'gpt'] },
  anthropic: { label: 'Anthropic (Claude)', badge: 'AN', kind: 'anthropic',
               keyUrl: 'https://console.anthropic.com/settings/keys', keyUrlLabel: 'console.anthropic.com/settings/keys',
               keyHint: 'Anahtar sk-ant- ile başlar.', prefer: ['sonnet', 'haiku', 'opus'] },
  groq:      { label: 'Groq', badge: 'GR', kind: 'openai',
               keyUrl: 'https://console.groq.com/keys', keyUrlLabel: 'console.groq.com/keys',
               keyHint: 'Ücretsiz katman var. Anahtar gsk_ ile başlar.', prefer: ['versatile', 'instant', 'oss'] },
  openrouter:{ label: 'OpenRouter', badge: 'OR', kind: 'openai',
               keyUrl: 'https://openrouter.ai/keys', keyUrlLabel: 'openrouter.ai/keys',
               keyHint: 'Tek anahtarla birçok model. Ücretsiz: openrouter/free', prefer: ['free', 'flash'] },
  mistral:   { label: 'Mistral AI', badge: 'MI', kind: 'openai',
               keyUrl: 'https://console.mistral.ai/api-keys', keyUrlLabel: 'console.mistral.ai/api-keys',
               keyHint: 'Ücretsiz deneme katmanı var.', prefer: ['mistral', 'large', 'small'] },
  deepseek:  { label: 'DeepSeek', badge: 'DS', kind: 'openai',
               keyUrl: 'https://platform.deepseek.com/api_keys', keyUrlLabel: 'platform.deepseek.com/api_keys',
               keyHint: 'Uygun fiyatlı. Anahtar sk- ile başlar.', prefer: ['chat', 'reasoner'] },
  xai:       { label: 'xAI (Grok)', badge: 'XA', kind: 'openai',
               keyUrl: 'https://console.x.ai', keyUrlLabel: 'console.x.ai',
               keyHint: 'Anahtar xai- ile başlar.', prefer: ['grok'] },
  together:  { label: 'Together AI', badge: 'TG', kind: 'openai',
               keyUrl: 'https://api.together.ai/settings/api-keys', keyUrlLabel: 'api.together.ai/settings/api-keys',
               keyHint: 'Açık kaynak modeller. Ücretsiz katman var.', prefer: ['instruct', 'chat'] },
  perplexity:{ label: 'Perplexity', badge: 'PX', kind: 'openai',
               keyUrl: 'https://www.perplexity.ai/settings/api', keyUrlLabel: 'perplexity.ai/settings/api',
               keyHint: 'Web araması destekli modeller.', prefer: [] },
  cerebras:  { label: 'Cerebras', badge: 'CB', kind: 'openai',
               keyUrl: 'https://cloud.cerebras.ai', keyUrlLabel: 'cloud.cerebras.ai',
               keyHint: 'Çok hızlı çıkarım, ücretsiz katman var. csk- ile başlar.', prefer: ['llama', 'qwen'] },
  fireworks: { label: 'Fireworks AI', badge: 'FW', kind: 'openai',
               keyUrl: 'https://fireworks.ai/account/api-keys', keyUrlLabel: 'fireworks.ai/account/api-keys',
               keyHint: 'fw_ ile başlar. Model kimlikleri accounts/fireworks/... biçimindedir.',
               prefer: ['instruct', 'chat'] },
  ollama:    { label: 'Ollama (bu bilgisayar)', labelEn: 'Ollama (this computer)', badge: 'OL', kind: 'openai',
               needsKey: false,
               keyHint: 'Kendi bilgisayarınızda çalışır, anahtar gerekmez. Önce "ollama serve" açık olmalı.',
               prefer: ['llama', 'qwen', 'mistral', 'gemma'] }
};

const BASE_URLS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  mistral: 'https://api.mistral.ai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  xai: 'https://api.x.ai/v1',
  together: 'https://api.together.ai/v1',
  perplexity: 'https://api.perplexity.ai/router/v1',
  cerebras: 'https://api.cerebras.ai/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
  ollama: 'http://localhost:11434/v1'
};

const ACCENTS = [
  { id: 'alev',      name: 'Alev',        a: '#ff3b30', b: '#ff9500' },
  { id: 'gunbatimi', name: 'Gün batımı',  a: '#f43f5e', b: '#f59e0b' },
  { id: 'okyanus',   name: 'Okyanus',     a: '#2563eb', b: '#06b6d4' },
  { id: 'orman',     name: 'Orman',       a: '#059669', b: '#84cc16' },
  { id: 'mor',       name: 'Mor',         a: '#7c3aed', b: '#ec4899' },
  { id: 'altin',     name: 'Altın',       a: '#d97706', b: '#fbbf24' },
  { id: 'buz',       name: 'Buz',         a: '#0284c7', b: '#8b5cf6' }
];

/* API anahtarının biçiminden sağlayıcıyı tanıma — "API ekle"de sağlayıcı otomatik seçilir. */
const KEY_PREFIXES = [
  ['sk-ant-', 'anthropic'],
  ['sk-or-', 'openrouter'],
  ['sk-proj-', 'openai'],
  ['sk-svcacct-', 'openai'],
  ['gsk_', 'groq'],
  ['csk-', 'cerebras'],
  ['fw_', 'fireworks'],
  ['xai-', 'xai'],
  ['pplx-', 'perplexity'],
  ['tgp_v1_', 'together'],
  ['AIza', 'gemini']
];

function detectProviderFromKey(key) {
  const k = String(key || '').trim();
  if (k.length < 8) return null;
  for (const [prefix, id] of KEY_PREFIXES) {
    if (k.startsWith(prefix)) return id;
  }
  // DeepSeek de "sk-" kullanır ve OpenAI'dan ayırt edilemez; OpenAI varsayılır.
  if (/^sk-[A-Za-z0-9_-]{16,}$/.test(k)) return 'openai';
  return null;
}

const EMOJIS = ['😀','😄','😁','😊','🙂','😉','😍','🤩','😎','🤔','😅','😂','🤣','😮','😢','😤','🤯','😴','🥳','😇',
                '👍','👎','👏','🙌','🙏','💪','🤝','✌️','👀','🧠','🔥','✨','⭐','🌟','🎉','🎯','💡','🚀','⚡','💯',
                '❤️','🧡','💛','💚','💙','💜','🖤','🤍','✅','❌','⚠️','📌','📎','🔍','📷','🖼️','🎨','📝','📊','⏰',
                '☕','🍕','🍎','🌍','🌙','☀️','🌈','🐱','🐶','🌸'];

const DEFAULT_SETTINGS = {
  provider: 'gemini',
  apis: [], activeApiId: null,
  keys: {}, models: {}, model: {},
  systemPrompt: '', temperature: 0.7, maxTokens: 4096, brief: true,
  theme: 'dark', accent: 'alev',
  useEmoji: false, imageSearch: true, videoHelp: true,
  keySoundOn: true, keySoundLevel: 70,
  lang: 'tr', avatar: '',
  ballColor: 'gri', ballPos: null,
  access: [],
  micDeviceId: '',
  assistant: {
    sleepOn: true, sleepEvery: 7, sleepLen: 60,
    face: 'varsayilan', faces: [], accessory: 'yok',
    voice: { on: false, engine: 'gemini', gvoice: 'mix', gender: 'kadin', pitch: 1.1, rate: 1, volume: 1, pick: '', elevenKey: '', elevenModel: 'eleven_flash_v2_5', elevenVoice: '' }
  },
  camera: {
    enabled: false, deviceId: '', creatorPhoto: '', captures: [],
    alarm: true, countdown: 5, autoClose: true
  },
  google: { key: '', cx: '' }
};

const USERS_KEY = 'primeai.users';
const SESSION_KEY = 'primeai.session';

/* ----------------------------- Yardımcılar ----------------------------- */
const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }        // depolama dolu: çağıran taraf kullanıcıyı uyarabilir
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* Türkçe/İngilizce karşılaştırma için sadeleştirme: “Chrome’u” → "chromeu". */
function foldTr(s) {
  return String(s == null ? '' : s).toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* Asistanın kendi yazdığı metinde emoji görünmez: model yine emoji üretirse
   yazıya yazılmadan önce buradan temizlenir. Emoji yalnızca kullanıcının
   kendi mesajlarında (emoji seçicisi) kalır. */
function stripEmoji(s) {
  const t = String(s == null ? '' : s);
  if (!t) return '';
  return t
    .replace(/[0-9#*]\uFE0F?\u20E3/g, '')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0F\u200D\u20E3]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/[ \t]+$/gm, '');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(msg, isError) {
  const node = document.createElement('div');
  node.className = 'toast' + (isError ? ' err' : '');
  node.textContent = translateText(msg);
  $('toastWrap').appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s ease, transform .3s ease';
    node.style.opacity = '0'; node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 320);
  }, isError ? 5200 : 3000);
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/* ----------------------------------------------------------------------
   YAZMA SESİ — kullanıcının verdiği referans kayıttaki gerçek tuş vuruşları.
   Kayıttan tek tek kesilen 21 vuruş assets/typing/ altında durur; her basışta
   rastgele biri, hafif perde ve sağ/sol değişimiyle çalınır. Dosyalar
   yüklenene kadar aşağıdaki sentez yedek olarak kullanılır.
   ---------------------------------------------------------------------- */
let clickCtx = null;
let clickLast = -1;          // ilk tuş da duyulsun (yeni context 0'dan başlar)
const TYPING_SAMPLE_COUNT = 21;
let typingSamples = [];
let typingLoadStarted = false;

function ensureClickCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!clickCtx) clickCtx = new Ctx();
  if (clickCtx.state === 'suspended') clickCtx.resume().catch(() => {});
  return clickCtx;
}

/* Örnekleri bir kez yükler; dosya yoksa sentez sesi kullanılmaya devam eder. */
function loadTypingSamples() {
  if (typingLoadStarted) return;
  typingLoadStarted = true;
  const ctx = ensureClickCtx();
  if (!ctx) return;
  const urls = [];
  for (let i = 1; i <= TYPING_SAMPLE_COUNT; i++) {
    urls.push('assets/typing/key-' + String(i).padStart(2, '0') + '.wav');
  }
  Promise.all(urls.map(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    return await ctx.decodeAudioData(await res.arrayBuffer());
  })).then((list) => {
    typingSamples = list.filter(Boolean);
  }).catch(() => { typingSamples = []; });
}

/* Rastgele bir vuruş çalar; hazır örnek yoksa false döner. */
function playTypingSample() {
  if (!typingSamples.length) return false;
  const ctx = ensureClickCtx();
  if (!ctx) return false;
  const src = ctx.createBufferSource();
  src.buffer = typingSamples[(Math.random() * typingSamples.length) | 0];
  src.playbackRate.value = 0.95 + Math.random() * 0.1;   // hafif perde farkı
  const gain = ctx.createGain();
  gain.gain.value = (0.42 + Math.random() * 0.1) * keySoundGain();
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.3;
    src.connect(gain).connect(pan).connect(ctx.destination);
  } else {
    src.connect(gain).connect(ctx.destination);
  }
  src.start();
  return true;
}

/* Ayarlardaki klavye sesi: 0–100 arası düzey ve tam susturma. */
function keySoundLevel() {
  const v = Number(settings && settings.keySoundLevel);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) / 100 : 0.7;
}
function keySoundOn() {
  return !(settings && settings.keySoundOn === false) && keySoundLevel() > 0;
}
/* Varsayılan %70 düzeyi eski ses seviyesiyle aynı kalsın (%100 biraz daha yüksek). */
function keySoundGain() {
  return Math.min(1.5, keySoundLevel() / 0.7);
}

function typingClick() {
  if (!keySoundOn()) return;
  if (!typingLoadStarted) loadTypingSamples();
  if (playTypingSample()) return;
  typingClickSynth();
}

/* “Sesi dinle”: örnekler hazır değilse kısa süre bekleyip çalar. */
function previewKeySound() {
  if (!keySoundOn()) {
    toast(t('Ses kapalı. Önce “Yazarken ses çıkar”ı açın.'));
    return;
  }
  loadTypingSamples();
  if (playTypingSample()) return;
  setTimeout(() => { if (keySoundOn()) playTypingSample(); }, 600);
}

function typingClickSynth() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!clickCtx) clickCtx = new Ctx();
    if (clickCtx.state === 'suspended') clickCtx.resume().catch(() => {});

    const now = clickCtx.currentTime;
    if (now - clickLast < 0.018) return;      // çok hızlı tuşlarda üst üste binmesin
    clickLast = now;

    /* Çıkış: her basış hafifçe sağa/sola kayar, ses tek noktadan gelmez. */
    const out = clickCtx.createGain();
    out.gain.value = 0.92 * keySoundGain();
    if (clickCtx.createStereoPanner) {
      const pan = clickCtx.createStereoPanner();
      pan.pan.value = (Math.random() * 2 - 1) * 0.35;
      out.connect(pan).connect(clickCtx.destination);
    } else {
      out.connect(clickCtx.destination);
    }

    /* 1) Gövde: alçak geçiren gürültü — tuşun tok “thock” darbesi. */
    const dur = 0.05 + Math.random() * 0.028;
    const len = Math.round(clickCtx.sampleRate * dur);
    const buf = clickCtx.createBuffer(1, len, clickCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.4);
    }
    const body = clickCtx.createBufferSource();
    body.buffer = buf;
    const low = clickCtx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 380 + Math.random() * 300;      // alçak, yumuşak
    low.Q.value = 0.6 + Math.random() * 0.5;
    const bodyGain = clickCtx.createGain();
    bodyGain.gain.value = 0.17;
    body.connect(low).connect(bodyGain).connect(out);
    body.start(now);

    /* 2) Rezonans: gövdenin tahta “tok”u — her tuşta farklı merkez. */
    const hollow = clickCtx.createBufferSource();
    hollow.buffer = buf;
    const band = clickCtx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 190 + Math.random() * 190;
    band.Q.value = 1.6 + Math.random() * 1.3;
    const bandGain = clickCtx.createGain();
    bandGain.gain.value = 0.1;
    hollow.connect(band).connect(bandGain).connect(out);
    hollow.start(now);

    /* 3) Ton: yumuşak, alçak perde; hafifçe düşerek söner. */
    const osc = clickCtx.createOscillator();
    osc.type = 'sine';
    const base = 118 + Math.random() * 76;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.7, now + 0.11);
    const toneGain = clickCtx.createGain();
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.085, now + 0.008);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(toneGain).connect(out);
    osc.start(now);
    osc.stop(now + 0.16);

    /* 4) Kısa üst tık: tuşun kendini belli etmesi için çok kısık. */
    const tickLen = Math.round(clickCtx.sampleRate * 0.008);
    const tickBuf = clickCtx.createBuffer(1, tickLen, clickCtx.sampleRate);
    const tickData = tickBuf.getChannelData(0);
    for (let i = 0; i < tickLen; i++) {
      tickData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tickLen, 2.2);
    }
    const tick = clickCtx.createBufferSource();
    tick.buffer = tickBuf;
    const high = clickCtx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 2600 + Math.random() * 1800;
    const tickGain = clickCtx.createGain();
    tickGain.gain.value = 0.022;
    tick.connect(high).connect(tickGain).connect(out);
    tick.start(now);
  } catch { /* ses aygıtı yoksa sessiz devam */ }
}

/* ======================================================================
   DİL — arayüz Türkçe, İngilizce, Almanca, Rusça ve Japonca. Sözlük
   i18n.js'te; anahtar, ekrandaki Türkçe metnin kendisidir. Kullanıcı ve
   model içeriği (.messages) çevrilmez.
   ====================================================================== */
const LANG_PACK = (typeof window !== 'undefined' && window.PRIME_I18N) ||
  { tr: {}, en: {}, de: {}, ru: {}, ja: {} };
const LANG_LIST = (((typeof window !== 'undefined' && window.PRIME_LANGS) || []).map((l) => l.code));
const LANG_KEY = 'prime.lang';      // seçilen dil cihazda saklanır
const LANG_SCOPES = ['#langScreen', '#authScreen', '#introScreen', '.sidebar', '.topbar', '.welcome',
  '.composer-wrap', '#settingsModal', '#aboutModal', '#consoleDrawer', '#camAlarm', '#camPermit'];

/* Anahtarlar (Türkçe metinler) ve her dilin ters sözlüğü: çevrilmiş bir
   metinden Türkçe anahtara dönmek için kullanılır (diller arası geçiş). */
const LANG_KEYS = new Set(Object.keys(LANG_PACK.en || {}));
const LANG_REVERSE = {};
for (const code of Object.keys(LANG_PACK)) {
  const map = {};
  const src = LANG_PACK[code] || {};
  for (const key of Object.keys(src)) {
    const value = src[key];
    if (value && value !== key && !LANG_KEYS.has(value) && !map[value]) map[value] = key;
  }
  LANG_REVERSE[code] = map;
}

let langNow = '';                    // bu oturumda seçilen dil
function langStored() {
  try { return localStorage.getItem(LANG_KEY) || ''; } catch { return ''; }
}
function langValid(code) { return !!code && LANG_LIST.indexOf(code) >= 0; }

function lang() {
  if (langValid(langNow)) return langNow;
  const stored = langStored();
  if (langValid(stored)) return stored;
  if (settings && langValid(settings.lang)) return settings.lang;
  return 'tr';
}

/* İlk açılış dil ekranı yalnızca hiç dil seçilmemişse açılır. */
function langChosen() { return langValid(langStored()) || langValid(langNow); }

/* Bir metnin Türkçe anahtarını bulur; yoksa null döner. */
function langKeyOf(text) {
  if (LANG_KEYS.has(text)) return text;
  for (const code of Object.keys(LANG_REVERSE)) {
    const hit = LANG_REVERSE[code][text];
    if (hit) return hit;
  }
  return null;
}

/* Anahtarı seçili dile çevirir; çeviri eksikse İngilizceye, o da yoksa
   Türkçeye düşer — arayüz hiçbir dilde boş kalmaz. */
function langValue(key, code) {
  const pack = LANG_PACK[code] || {};
  return pack[key] || (LANG_PACK.en && LANG_PACK.en[key]) || key;
}

/* Tek bir metni çevirir; sözlükte yoksa olduğu gibi bırakır. */
function translateText(text) {
  const raw = String(text == null ? '' : text);
  const key = raw.replace(/\s+/g, ' ').trim();
  if (!key) return raw;
  const base = langKeyOf(key);
  if (!base) return raw;
  return langValue(base, lang());
}

/* Kısa çeviri yardımcısı: t('Türkçe metin') → seçili dil. */
function t(tr) { return translateText(tr); }

/* Satır içi kısa metin: sözlükte varsa seçili dile çevrilir; yoksa Türkçe
   dışındaki dillerde İngilizce karşılığı gösterilir (Türkçe metin sızmasın). */
function tx(tr, en) {
  const code = lang();
  if (code === 'tr') return tr;
  const key = langKeyOf(tr);
  const hit = key ? (LANG_PACK[code] || {})[key] : '';
  return hit || en;
}

/* Dili değiştirir: cihazda saklar, hesap ayarına da yazar, arayüzü çevirir. */
function setLanguage(code) {
  if (!langValid(code)) return false;
  langNow = code;
  try { localStorage.setItem(LANG_KEY, code); } catch { /* yok */ }
  if (settings) settings.lang = code;
  if (currentUser) persist();
  applyLang();
  return true;
}

/* Metin düğümünde yalnızca içeriği çevirir, baştaki/sondaki boşluğu korur. */
function translateNodeText(value) {
  const m = String(value == null ? '' : value).match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m) return value;
  const core = m[2];
  if (!core) return value;
  const out = translateText(core);
  return out === core ? value : m[1] + out + m[3];
}

function i18nSkip(node) {
  const elNode = node && node.nodeType === 3 ? node.parentElement : node;
  if (!elNode || !elNode.closest) return true;
  return !!elNode.closest('[data-no-i18n], #history, #greetName, .user-info, .account-info, .messages, #toastWrap');
}

/* Arayüzdeki bütün görünür metinleri seçili dile getirir. */
function applyLang() {
  document.documentElement.lang = lang();
  for (const scope of LANG_SCOPES) {
    const root = document.querySelector(scope);
    if (!root) continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (i18nSkip(node)) continue;
      node.nodeValue = translateNodeText(node.nodeValue);
    }
    root.querySelectorAll('[title],[aria-label],[placeholder]').forEach((elNode) => {
      if (i18nSkip(elNode)) return;
      for (const attr of ['title', 'aria-label', 'placeholder']) {
        const raw = elNode.getAttribute(attr);
        if (!raw) continue;
        const out = translateText(raw);
        if (out !== raw) elNode.setAttribute(attr, out);
      }
    });
  }
  const langSeg = $('langSeg');
  if (langSeg) langSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.langVal === lang()));
}

/* Kısa yanıt: varsayılan olarak açık. Uzun giriş, tekrar ve özet olmadan
   doğrudan cevap istenir; ayrıntı istenirse yine uzun yazılabilir. */
const BRIEF_PROMPTS = {
  tr: 'Yanıtlarını kısa tut: uzun giriş, tekrar ve gereksiz özet yazma; çoğu soruda birkaç cümle ya da en fazla 4-5 kısa madde yeter. Kullanıcı ayrıntı, adım adım anlatım ya da uzun kod isterse gerektiği kadar yaz.',
  en: 'Keep answers short: no long intros, repetition or needless summaries; a few sentences or at most 4-5 short bullets are usually enough. Write more only when the user asks for detail, step-by-step help or longer code.',
  de: 'Antworte kurz: keine langen Einleitungen, Wiederholungen oder unnötigen Zusammenfassungen; meist reichen ein paar Sätze oder höchstens 4-5 kurze Stichpunkte. Schreibe nur mehr, wenn der Nutzer Details, eine Schritt-für-Schritt-Erklärung oder längeren Code möchte.',
  ru: 'Отвечай коротко: без длинных вступлений, повторов и лишних итогов; обычно достаточно нескольких предложений или максимум 4–5 коротких пунктов. Пиши подробнее, только если пользователь просит деталей, пошагового объяснения или длинного кода.',
  ja: '回答は短くまとめてください。長い前置き・繰り返し・不要な要約は書かず、多くの質問では数文か最大4〜5個の短い箇条書きで十分です。ユーザーが詳細や手順ごとの説明、長いコードを求めた場合だけ長く書いてください。'
};

function briefOn() { return settings.brief !== false; }
function briefPrompt() { return BRIEF_PROMPTS[lang()] || BRIEF_PROMPTS.tr; }

/* Yapay zekânın yanıt dili seçilen dille aynı olur. */
const LANG_PROMPTS = {
  tr: 'Kullanıcı açıkça başka bir dil istemedikçe Türkçe yanıt ver.',
  en: 'Reply in English unless the user explicitly asks for another language. Your tone stays warm, friendly and helpful.',
  de: 'Antworte auf Deutsch, außer der Nutzer möchte ausdrücklich eine andere Sprache. Dein Ton bleibt warm, freundlich und hilfsbereit.',
  ru: 'Отвечай по-русски, если пользователь явно не попросит другой язык. Тон остаётся тёплым, дружелюбным и полезным.',
  ja: 'ユーザーが明示的に別の言語を求めない限り、日本語で答えてください。口調は温かく、親しみやすく、役に立つものにしてください。'
};

function languagePrompt() { return LANG_PROMPTS[lang()] || LANG_PROMPTS.tr; }

function tonePrompt() {
  return lang() === 'tr'
    ? TONE_PROMPT
    : 'Tone: warm, friendly and helpful, like a good friend. Use short sentences and avoid needless formality.';
}

/* ======================================================================
   KONSOL — uygulamanın yaptığı işler ve hatalar burada listelenir.
   Kayıtlar hem panelde hem gerçek geliştirici konsolunda görünür.
   ====================================================================== */
const LOGS = [];
const LOG_MAX = 400;
let logSeq = 0;
let logErrOnly = false;
let logClosedAt = 0;

function logClock(at) {
  const d = new Date(at);
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function logDetailText(detail) {
  if (detail == null) return '';
  if (detail instanceof Error) return String(detail.stack || detail.message || detail).slice(0, 1400);
  if (typeof detail === 'string') return detail.slice(0, 1400);
  try { return JSON.stringify(detail).slice(0, 1000); } catch { return String(detail).slice(0, 300); }
}

function logLine(level, message, detail) {
  const entry = {
    n: ++logSeq, level, msg: String(message == null ? '' : message),
    detail: logDetailText(detail), at: Date.now()
  };
  LOGS.push(entry);
  if (LOGS.length > LOG_MAX) LOGS.shift();
  /* Gerçek konsola da yaz (masaüstü uygulamasında DevTools'ta görünür) */
  try {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn('[PRIME AI]', entry.msg, detail === undefined || detail === null ? '' : detail);
  } catch { /* konsol yok */ }
  /* Hata olduğunda panel kendiliğinden açılır (kullanıcı yeni kapattıysa sadece rozet yanar) */
  let autoOpened = false;
  if (level === 'error' && $('consoleDrawer') && $('consoleDrawer').hidden &&
      ($('introScreen').hidden || $('introScreen').classList.contains('done')) &&
      Date.now() - logClosedAt > 20000) {
    openConsole();          // panel tüm kayıtları çizer
    autoOpened = true;
  }
  if (!autoOpened) pushConsoleRow(entry);   // aksi hâlde satır iki kez düşerdi
  updateConsoleBadge();
  return entry;
}

const logInfo = (m, d) => logLine('info', m, d);
const logWarn = (m, d) => logLine('warn', m, d);
const logError = (m, d) => logLine('error', m, d);

function logLevelLabel(level) { return t(level === 'error' ? 'HATA' : level === 'warn' ? 'UYARI' : 'BİLGİ'); }

function logRowHtml(e) {
  return '<div class="log-row ' + (e.level === 'error' ? 'err' : e.level) + '" data-log="' + e.n + '">' +
    '<span class="log-time">' + logClock(e.at) + '</span>' +
    '<span class="log-lvl">' + logLevelLabel(e.level) + '</span>' +
    '<span class="log-msg">' + escapeHtml(e.msg) +
      (e.detail ? '<span class="log-detail">' + escapeHtml(e.detail) + '</span>' : '') +
    '</span></div>';
}

function logVisible(e) { return !logErrOnly || e.level === 'error'; }

function pushConsoleRow(e) {
  const body = $('consoleBody');
  if (!body || $('consoleDrawer').hidden || !logVisible(e)) return;
  const empty = body.querySelector('.console-empty');
  if (empty) empty.remove();
  body.insertAdjacentHTML('beforeend', logRowHtml(e));
  if (body.scrollHeight - body.scrollTop - body.clientHeight < 120) body.scrollTop = body.scrollHeight;
}

function renderConsole() {
  const body = $('consoleBody');
  if (!body) return;
  const list = LOGS.filter(logVisible);
  body.innerHTML = list.length ? list.map(logRowHtml).join('')
    : '<div class="console-empty">' + (logErrOnly ? 'Hata kaydı yok.' : 'Henüz kayıt yok.') + '</div>';
  body.scrollTop = body.scrollHeight;
  updateConsoleBadge();
}

function updateConsoleBadge() {
  const errors = LOGS.filter((e) => e.level === 'error').length;
  const badge = $('consoleBadge');
  if (badge) {
    badge.hidden = errors === 0;
    badge.textContent = errors > 99 ? '99+' : String(errors);
  }
  const count = $('consoleCount');
  if (count) {
    count.textContent = LOGS.length + (errors ? ' · ' + errors + ' hata' : '');
    count.classList.toggle('bad', errors > 0);
  }
}

function openConsole() {
  const drawer = $('consoleDrawer');
  if (!drawer) return;
  drawer.hidden = false;
  renderConsole();
}
function closeConsole() {
  const drawer = $('consoleDrawer');
  if (!drawer) return;
  drawer.hidden = true;
  logClosedAt = Date.now();
}
function toggleConsole() { if ($('consoleDrawer').hidden) openConsole(); else closeConsole(); }

/* Konsol düğmeleri açılışta bağlanır: giriş ekranındaki hatalar da görülebilsin. */
function bindConsole() {
  if ($('consoleBtn')) $('consoleBtn').onclick = () => toggleConsole();
  if ($('consoleHide')) $('consoleHide').onclick = () => closeConsole();
  if ($('consoleClear')) $('consoleClear').onclick = () => { LOGS.length = 0; openConsole(); logInfo('Konsol temizlendi.'); };
  if ($('consoleErrOnly')) $('consoleErrOnly').onclick = (e) => {
    logErrOnly = !logErrOnly;
    e.currentTarget.setAttribute('aria-pressed', logErrOnly ? 'true' : 'false');
    renderConsole();
  };
}

/* ----------------------------- Açılış animasyonu ----------------------------- */
const INTRO_MS = 2150;
let introTimer = 0;

function finishIntro() {
  const s = $('introScreen');
  if (!s || s.classList.contains('done')) return;
  clearTimeout(introTimer);
  s.classList.add('done');
  logInfo('Açılış animasyonu tamamlandı.');
  setTimeout(() => { s.hidden = true; }, 500);
}

function initIntro() {
  const s = $('introScreen');
  if (!s) return;
  const slot = $('introLogo');
  if (slot && !slot.firstChild) slot.innerHTML = LOGO_SVG;
  s.addEventListener('click', finishIntro);
  addEventListener('keydown', finishIntro, { once: true });
  introTimer = setTimeout(finishIntro, INTRO_MS);
}

/* Yakalanmayan hatalar ve CSP engelleri de konsola düşer */
function installLogging() {
  addEventListener('error', (e) => {
    if (e && e.target && e.target !== window && (e.target.src || e.target.href)) {
      logWarn('Kaynak yüklenemedi: ' + (e.target.src || e.target.href));
      return;
    }
    logError('Yakalanmayan hata: ' + ((e && e.message) || 'bilinmeyen'), e && e.error);
  });
  addEventListener('unhandledrejection', (e) => {
    const r = e && e.reason;
    logError('İşlenmeyen söz hatası: ' + ((r && r.message) || r), r instanceof Error ? r : null);
  });
  document.addEventListener('securitypolicyviolation', (e) => {
    logWarn('CSP engeli: ' + e.violatedDirective + ' → ' + e.blockedURI);
  });
}

const LOGO_SVG = `<svg viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <mask id="primeAiGap"><rect width="200" height="200" fill="#fff"/><rect x="69" y="140" width="62" height="48" rx="10" fill="#000"/></mask>
    <path id="primeAiArc" d="M 44 100 A 56 56 0 0 1 156 100"/>
  </defs>
  <g mask="url(#primeAiGap)" fill="none" stroke="currentColor" stroke-width="11"><circle cx="100" cy="100" r="79"/></g>
  <g mask="url(#primeAiGap)" fill="none" stroke="currentColor" stroke-width="3.4" opacity=".5"><circle cx="100" cy="100" r="64"/></g>
  <text font-family="Helvetica Neue, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3.4" fill="currentColor">
    <textPath href="#primeAiArc" startOffset="50%" text-anchor="middle">PRIME</textPath></text>
  <text x="100" y="124" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="70" font-weight="800" letter-spacing="-1" fill="currentColor">PR</text>
  <text x="100" y="172" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="29" font-weight="800" letter-spacing="1.5" style="fill:var(--accent)">AI</text>
</svg>`;

/* Yeni sohbet ekranındaki logo: tıklanınca titrer, kızarmaya başlar ve
   arkasından duman çıkar. Duman taneleri tıklama başına üretilip silinir
   (kalıcı DOM düğümü kalmaz). Tanenin yönü, boyu ve süresi her seferinde
   farklı olsun diye rastgele seçilir. */
let logoHotTimer = 0;

function puffLogo(slot) {
  if (!slot) return;
  slot.querySelectorAll('.puff').forEach((n) => n.remove());   // önceki turdan kalan olmasın
  slot.classList.remove('shake', 'hot');
  void slot.offsetWidth;                                       // animasyon yeniden başlasın
  slot.classList.add('shake', 'hot');
  const sade = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const adet = sade ? 0 : 9;
  for (let i = 0; i < adet; i++) {
    const p = el('span', 'puff');
    const yon = i % 2 ? 1 : -1;
    p.style.setProperty('--ox', (Math.round(Math.random() * 34 - 17)) + 'px');   // logodan sağa/sola kaçık
    p.style.setProperty('--oy', (4 + Math.round(Math.random() * 38)) + 'px');    // duman yüksekliği boyunca
    p.style.setProperty('--dx', (yon * (9 + Math.round(Math.random() * 17))) + 'px');
    p.style.setProperty('--rise', (48 + Math.round(Math.random() * 34)) + 'px');
    p.style.setProperty('--dur', (1000 + Math.round(Math.random() * 620)) + 'ms');
    p.style.setProperty('--delay', Math.round(i * 55 + Math.random() * 40) + 'ms');
    p.style.setProperty('--grow', (1.9 + Math.random() * 1.5).toFixed(2));
    slot.appendChild(p);
    setTimeout(() => p.remove(), 2600);                        // animasyon bitince tane silinir
  }
  clearTimeout(logoHotTimer);
  logoHotTimer = setTimeout(() => slot.classList.remove('shake', 'hot'), 1900);
}

/* ----------------------------- Markdown ----------------------------- */
function codeBlockHtml(b) {
  const lang = b.lang ? b.lang.replace(/[^\w+#.-]/g, '') : 'code';
  return '<div class="code-block">' +
    '<div class="code-head"><span class="code-lang">' + escapeHtml(lang) + '</span>' +
    '<button type="button" class="copy-btn" data-copy>' +
    '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>Kopyala</button></div>' +
    '<pre><code>' + escapeHtml(b.code) + '</code></pre></div>';
}

function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+[^\s<.,;:])/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
}

function renderMarkdown(src) {
  const blocks = [];
  let text = String(src).replace(/```([\w+#.-]*)\r?\n?([\s\S]*?)```/g, (_m, lang, code) => {
    blocks.push({ lang: (lang || '').trim(), code: code.replace(/\n$/, '') });
    return '\u0000CB' + (blocks.length - 1) + '\u0000';
  });
  text = escapeHtml(text);

  const lines = text.split(/\r?\n/);
  const out = [];
  let listType = null, para = [];

  const flush = () => { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } };
  const closeList = () => { if (listType) { out.push('</' + listType + '>'); listType = null; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { flush(); closeList(); continue; }

    const cb = line.match(/^\u0000CB(\d+)\u0000$/);
    if (cb) { flush(); closeList(); out.push(codeBlockHtml(blocks[+cb[1]])); continue; }

    if (line.includes('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1].trim())) {
      const cell = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cell(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|')) { rows.push(cell(lines[i].trim())); i++; }
      i--;
      flush(); closeList();
      out.push('<table><thead><tr>' + head.map((c) => '<th>' + inlineMd(c) + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => '<td>' + inlineMd(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }

    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flush(); closeList();
      out.push('<h' + m[1].length + '>' + inlineMd(m[2]) + '</h' + m[1].length + '>');
      continue;
    }
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line)) { flush(); closeList(); out.push('<hr>'); continue; }
    if ((m = line.match(/^&gt;\s?(.*)$/))) { flush(); closeList(); out.push('<blockquote>' + inlineMd(m[1]) + '</blockquote>'); continue; }
    if ((m = line.match(/^[-*+]\s+(.*)$/))) {
      flush();
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
      out.push('<li>' + inlineMd(m[1]) + '</li>');
      continue;
    }
    if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      flush();
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
      out.push('<li>' + inlineMd(m[1]) + '</li>');
      continue;
    }
    closeList();
    para.push(inlineMd(line));
  }
  flush(); closeList();
  return out.join('');
}

function balanceFences(s) {
  return ((s.match(/```/g) || []).length % 2 === 1) ? s + '\n```' : s;
}

/* ----------------------------- Görsel arama ----------------------------- */
const IMAGE_NOUNS = ['fotoğraf', 'fotograf', 'foto\u011fraf', 'foto', 'resim', 'görsel', 'gorsel', 'image', 'images', 'photo', 'photos', 'picture', 'pictures', 'png', 'jpg', 'jpeg', 'wallpaper'];
const SHOW_WORDS = ['göster', 'goster', 'bul', 'ara', 'gösterir', 'show', 'find', 'search', 'ekle', 'ver', 'istiyorum'];
const SELF_WORDS = ['kendini', 'kendi foto', 'senin foto', 'senin resmin', 'senin görselin', 'prime ai', 'kendin', 'senin resm'];

const QUERY_STOP = new Set(['bana', 'bir', 'tane', 'göster', 'goster', 'bul', 'ara', 'araştır', 'arastir', 'ekle', 'ver',
  'istiyorum', 'lütfen', 'lutfen', 'acaba', 'internetten', 'internet', 'google', 'google\'dan', 'google dan',
  'fotoğraf', 'fotograf', 'fotoğraflar', 'fotograflar', 'foto', 'resim', 'resimler', 'resmi', 'görsel', 'gorsel',
  'görseller', 'gorseller', 'görselini', 'gorselini', 'image', 'images', 'photo', 'photos', 'picture', 'pictures',
  'show', 'find', 'search', 'me', 'the', 'a', 'an', 'of', 'for', 'and', 'birkaç', 'birkac', 'şu', 'su', 'bu',
  'nasıl', 'nasil', 'olan', 'ile', 'için', 'icin', 'mi', 'mı', 'mu', 'mü', 'misin', 'mısın', 'misiniz']);

function detectImageIntent(text) {
  const t = String(text).toLowerCase();
  const hasNoun = IMAGE_NOUNS.some((w) => t.includes(w));
  if (!hasNoun) return null;
  const q = extractImageQuery(t);
  const self = SELF_WORDS.some((w) => t.includes(w));
  return { query: q || t, self };
}

function extractImageQuery(text) {
  const cleaned = text
    .replace(/[?!.,;:"'()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter((w) => {
    if (!w) return false;
    if (QUERY_STOP.has(w)) return false;
    if (/^(foto|resim|g[oö]rsel|image|photo|picture)/i.test(w)) return false;  // çekim eklerini de at
    if (!/[\p{L}\p{N}]/u.test(w)) return false;                               // emoji/sembolleri at
    return true;
  });
  return words.join(' ').trim();
}

/* Türkçe çekim ekleri aramada eşleşmeyi bozuyor ("kırmızı pandanın" → 0 sonuç) */
/* Yalnızca belirsizliği düşük, uzun ekler atılır:
sa 'panda' → 'pan' veya 'kırmızı' → 'kırmız' gibi bozulmalar olmaz. */
const TR_SUFFIXES = ['larında', 'lerinde', 'ların', 'lerin', 'ndan', 'nden', 'nın', 'nin', 'nun', 'nün',
  'ları', 'leri', 'dan', 'den', 'tan', 'ten'];

function stripTrSuffix(word) {
  for (const s of TR_SUFFIXES) {
    if (word.length - s.length >= 3 && word.endsWith(s)) return word.slice(0, -s.length);
  }
  return word;
}

function queryCandidates(query) {
  const words = String(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const stripped = words.map(stripTrSuffix).filter(Boolean);
  const list = [query, stripped.join(' ')];
  if (words.length > 1) list.push(words[words.length - 1]);
  if (stripped.length > 1) list.push(stripped[stripped.length - 1]);
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))].slice(0, 4);
}

function fetchTimeout(ms) {
  try { return AbortSignal.timeout(ms); } catch { return undefined; }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Yazarken görünen animasyon: klasik üç nokta, ama bize özgü —
   noktalar tek renk değil, uygulamanın kendi degradesini taşır ve sırayla
   hafifçe yükselip parlar. Sade, küçük ve tamamen CSS (resim yok). */
function genNode() {
  const n = el('div', 'gen');
  n.setAttribute('role', 'status');
  n.setAttribute('aria-label', 'PRIME AI yazıyor');
  n.innerHTML = '<span class="gen-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '<span class="gen-text">PRIME AI yazıyor</span>';
  return n;
}

/* Çalışmayan bir şeyde yardım yolu seçimi (video mu, yazı mı) */
async function searchWikimedia(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=640' +
    '&gsrsearch=' + encodeURIComponent(query + ' filetype:bitmap');
  const res = await fetch(url, { signal: fetchTimeout(8000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const pages = Object.values((data.query && data.query.pages) || {});
  return pages
    .map((p) => {
      const info = (p.imageinfo || [])[0];
      if (!info || !info.thumburl) return null;
      const raw = String(p.title || '');
      // Commons dosya alanında PDF/DjVu/SVG de var; yalnızca gerçek fotoğrafları al
      if (/\.(pdf|djvu|svg|tif|tiff|ogv|webm|wav|oga|stl|xml|json)$/i.test(raw)) return null;
      return {
        thumb: info.thumburl,
        full: info.url || info.thumburl,
        title: raw.replace(/^File:/, '').replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, ''),
        page: info.descriptionurl || info.url
      };
    })
    .filter(Boolean);
}

async function searchOpenverse(query) {
  const url = 'https://api.openverse.org/v1/images/?page_size=6&q=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: fetchTimeout(8000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return (data.results || [])
    .map((r) => {
      const thumb = r.thumbnail || r.url;
      if (!thumb) return null;
      return { thumb, full: r.url || thumb, title: r.title || query, page: r.foreign_landing_url || r.url };
    })
    .filter(Boolean);
}

/* Google'ın resmi görsel araması (Custom Search JSON API).
   Anahtar + arama motoru kimliği (cx) gerekir; CORS, bizim kaynağımıza izin veriyor. */
async function searchGoogle(query, key, cx) {
  const url = 'https://www.googleapis.com/customsearch/v1?searchType=image&safe=active&num=8' +
    '&key=' + encodeURIComponent(key) + '&cx=' + encodeURIComponent(cx) + '&q=' + encodeURIComponent(query);
  const res = await fetch(url, { signal: fetchTimeout(8000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return (data.items || [])
    .map((it) => {
      const img = it.image || {};
      const full = it.link || img.thumbnailLink;
      if (!full) return null;
      return {
        thumb: img.thumbnailLink || img.thumbnailUrl || full,
        full,
        title: String(it.title || query).replace(/\s+/g, ' ').trim(),
        page: img.contextLink || full
      };
    })
    .filter(Boolean);
}

function googleCfg() {
  const g = settings.google || {};
  const key = String(g.key || '').trim();
  const cx = String(g.cx || '').trim();
  return key && cx ? { key, cx } : null;
}

async function searchImages(query) {
  const candidates = queryCandidates(query);
  const sources = [];
  const g = googleCfg();
  if (g) sources.push(['Google Görseller', (q) => searchGoogle(q, g.key, g.cx)]);
  sources.push(['Wikimedia Commons', searchWikimedia], ['Openverse', searchOpenverse]);
  logInfo('Görsel arama: "' + query + '" · kaynak sırası: ' + sources.map((s) => s[0]).join(' → '));
  for (const source of sources) {
    const [label, fn] = source;
    // Adayları paralel dene, sonuç sırasına göre ilk dolu olanı kullan
    const settled = await Promise.allSettled(candidates.map((c) => fn(c)));
    for (let i = 0; i < settled.length; i++) {
      const r = settled[i];
      if (r.status === 'fulfilled' && r.value.length) {
        logInfo('Görseller bulundu: ' + r.value.length + ' sonuç · kaynak: ' + label + ' · arama: "' + candidates[i] + '"');
        return { source: label, images: r.value, query: candidates[i] };
      }
    }
    const bad = settled.find((r) => r.status === 'rejected');
    logWarn('Sonuç yok: ' + label +
      (bad ? ' (' + ((bad.reason && bad.reason.message) || bad.reason) + ')' : ''));
  }
  logWarn('Görsel bulunamadı: "' + query + '"');
  return { source: null, images: [], query: candidates[0] || query };
}

function galleryNode(images, source, query) {
  const wrap = el('div', 'gallery');
  const grid = el('div', 'gallery-grid');
  images.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gallery-item';
    b.title = (img.title || '') + ' — büyütmek için tıklayın';
    const im = document.createElement('img');
    im.loading = 'lazy';
    im.alt = img.title || '';
    im.referrerPolicy = 'no-referrer';
    im.src = img.thumb;
    im.addEventListener('load', () => im.classList.add('loaded'));
    im.addEventListener('error', () => { if (im.src !== img.full) im.src = img.full; else b.remove(); });
    b.appendChild(im);
    const hint = el('span', 'zoom-hint');
    hint.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M20 20l-4.4-4.4"/></svg>Büyüt';
    b.appendChild(hint);
    b.onclick = () => openLightbox(images, i);
    grid.appendChild(b);
  });
  wrap.appendChild(grid);
  const cap = el('div', 'gallery-cap');
  cap.innerHTML = '<svg viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M3 5h18v14H3z"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-6 8"/></svg>' +
    images.length + ' görsel · kaynak: ' + escapeHtml(source || 'bilinmiyor') +
    (query ? ' · arama: «' + escapeHtml(query) + '»' : '') +
    ' · büyütmek için bir fotoğrafa tıklayın';
  wrap.appendChild(cap);
  return wrap;
}

/* ======================================================================
   SOHBET YARDIMI — yardım istenen konuyla ilgili video bağlantısı
   ====================================================================== */
/* Masaüstü köprüsü (artık yalnızca sürüm/platform bilgisi taşır) */
function desktop() { return (typeof window !== 'undefined' && window.PRIME_DESKTOP) || null; }

/* Tek başına yeterli olan yardım sözcükleri */
const HELP_STRONG = /(yard[ıi]m|destek|ipucu|ipuç|tavsiye|öner[iy]|oneri|öğren|ogren|öğret|ogret|anlat|açıkla|acikla|neden|niçin|nicin|çöz[üu]m|cozum|düzelt|duzelt|hata|sorun|problem|ne yapmal|adım adım|adim adim|nereden başla|nerden başla)/i;
/* Bir şeyin çalışmadığını anlatan mesajlar: önce nasıl yardım edileceği sorulur. */
const PROBLEM_WORDS = /(çalışm[ıi]yor|calism[iy]yor|çal[ıi]şmad|calismad|bozuk|hata ver|hatas[ıi]|error|aç[ıi]lm[ıi]yor|acilm[iy]yor|yüklenm[iy]yor|yuklenm[iy]yor|donuyor|donma|kapan[ıi]yor|işe yaram|ise yaram|olm[uy]yor|vermiyor|gitmiyor|k[ıi]r[ıi]ld|çök[üu]yor|cokuyor|başarısız|basarisiz|yanl[ıi]ş sonuç|hata ald)/i;

/* "video ile anlat" · "sen anlat" seçimleri */
const VIDEO_CHOICE = /(video\s*(ile|olsun|at|atsana|atabilir\w*|bul|göster|goster|gönder|gonder|koy|ekle|bırak|birak|paylaş|paylas|ver|ister|isterim|istiyorum|izle)|videolu\s*anlat|videosunu\s*(at|göster|goster)|^\s*video\s*[.!…]*$)/i;
const EXPLAIN_CHOICE = /(sen\s*anlat|kendin\s*anlat|yaz[ıi]yla\s*anlat|metin\s*olarak\s*anlat|anlat[ıi]ver|anlat\s*(işte|iste|bakal[ıi]m|yeter)|^\s*(sadece|sade|yalnızca|yalnizca|sen|kendin)?\s*anlat\s*[.!…]*$)/i;

function resolveVideoChoice(text) {
  const t = String(text || '').trim();
  if (t.length > 60) return null;                 // uzun mesajlar seçim değildir
  if (EXPLAIN_CHOICE.test(t)) return 'explain';
  if (VIDEO_CHOICE.test(t)) return 'video';
  return null;
}

/* Bunlar ancak bir eylem sözcüğüyle birlikte yardım isteği sayılır ("hava nasıl?" değil) */
const HELP_WEAK = /(\bnas[ıi]l\b|ne\s*şekilde|ne\s*sekilde|nedir|ne demek|hangi yolla)/i;
const HELP_ACTION = /(yap|eder|edil|olur|kullan|başla|basla|kur|çalış|calis|yaz|oluştur|olustur|hazırla|hazirla|öğren|ogren)/i;
/* "bana yılan oyunu yap" gibi üretme istekleri de yardım isteğidir */
const HELP_MAKE = /(yap|yazar|yaz|oluştur|olustur|kur|hazırla|hazirla|tasarla|çiz)/i;

/* Soru ve yardım kalıpları çıkarılır, geriye video aranacak konu kalır. */
const TOPIC_STOP = new Set(['bana', 'bir', 'bu', 'şu', 'su', 'ben', 'sen', 'mi', 'mı', 'mu', 'mü', 'misin', 'mısın',
  'musun', 'müsün', 'misiniz', 'mısınız', 'nasıl', 'nasil', 'neden', 'niçin', 'nicin', 'niye', 'ne', 'neyle', 'nasılki',
  'yardım', 'yardim', 'yardımcı', 'eder', 'ederim', 'edebilir', 'olur', 'lütfen', 'lutfen', 'acaba', 'çok', 'cok',
  'daha', 'en', 'gibi', 'kadar', 'için', 'icin', 'ile', 've', 'ama', 'ancak', 'var', 'yok', 'olabilir', 'istiyorum',
  'isterim', 'öğrenmek', 'ogrenmek', 'anlat', 'anlatır', 'açıkla', 'acikla', 'göster', 'goster', 'verir', 'hangi',
  'nerden', 'nereden', 'başlamalıyım', 'baslamaliyim', 'yapmalıyım', 'yapmaliyim', 'yapayım', 'yapayim', 'yaparım',
  'yaparim', 'yapmak', 'yapmayı', 'yapmayi', 'yapılır', 'yapilir', 'etmek', 'yolu', 'yöntem', 'yontem', 'konusunda',
  'hakkında', 'hakkinda', 'tam', 'olarak', 'adım', 'adim', 'basit', 'kolay', 'sana', 'birşey', 'tanesi',
  /* "bir de video at" gibi ekler aramaya girmesin */
  'video', 'videoyu', 'videosu', 'videolar', 'izle', 'izlerim', 'izleyeyim', 'bırak', 'birak', 'bıraksana',
  'biraksana', 'at', 'atsana', 'youtube', 'youtubeda', 'kısaca', 'kisaca', 'ayrıca', 'ayrica',
  /* yardım sözcüklerinin kendisi konu değildir */
  'tavsiye', 'ver', 'başlarım', 'baslarim', 'başlamak', 'baslamak', 'başlar', 'baslar',
  'yap', 'yapar', 'yaparmısın', 'yazar', 'yazarmısın', 'oluştur', 'hazırla', 'hazirla', 'kur']);

/* "-yı/-yi/-yu/-yü" belirtme hâli arama sorgusunu bozuyor: "okumayı" → "okuma".
   Yalnızca en az 4 harf kalan sözcüklerde uygulanır ("panda" → "pand" olmaz). */
const TOPIC_TRAILING = ['yı', 'yi', 'yu', 'yü'];

function topicWord(w) {
  const base = stripTrSuffix(w);
  for (const s of TOPIC_TRAILING) {
    if (base.endsWith(s) && base.length - s.length >= 4) return base.slice(0, -s.length);
  }
  return base;
}

function extractTopicQuery(text) {
  const cleaned = String(text || '').toLowerCase()
    .replace(/[?!.,;:"'()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter((w) => {
    if (!w || TOPIC_STOP.has(w)) return false;
    if (w.length < 3) return false;
    if (!/[\p{L}\p{N}]/u.test(w)) return false;
    return true;
  });
  const stripped = words.map(topicWord).filter(Boolean);
  /* Ekleri temizlenmiş biçim daha iyi arama sonucu verir; önce o denenir. */
  const list = [...new Set([stripped.join(' '), words.join(' ')])].filter((s) => s.replace(/\s/g, '').length >= 3);
  return (list[0] || '').slice(0, 90).trim();
}

function detectHelpIntent(text) {
  const raw = String(text || '').trim();
  if (raw.length < 8) return null;                  // "selam" gibi kısa mesajlara video eklenmez
  const help = HELP_STRONG.test(raw) ||
    (HELP_WEAK.test(raw) && HELP_ACTION.test(raw)) ||
    (raw.length >= 14 && HELP_MAKE.test(raw) && HELP_ACTION.test(raw));
  if (!help) return null;
  const query = extractTopicQuery(raw);
  if (!query || query.replace(/\s/g, '').length < 3) return null;
  return { query };
}

function detectProblemIntent(text) {
  const raw = String(text || '').trim();
  if (raw.length < 6 || !PROBLEM_WORDS.test(raw)) return null;
  const query = extractTopicQuery(raw);
  return { query: query && query.replace(/\s/g, '').length >= 3 ? query : raw.slice(0, 70) };
}

/* Sohbetteki en son konu: "video ile anlat" seçildiğinde hangi konu için olduğu buradan bulunur. */
function lastTopicFromChat(chat) {
  const list = (chat && chat.messages) || [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].topic) return list[i].topic;
  }
  return null;
}

/* Masaüstü uygulamasında gerçek videoyu ana süreç bulur (anahtar gerekmez).
   Tarayıcıda yalnızca Google anahtarı varsa YouTube Data API denenir. */
async function findVideoFor(query) {
  const d = desktop();
  if (d && typeof d.findVideo === 'function') {
    const res = await d.findVideo(query, lang());
    if (res && res.ok && res.video) return res.video;
    if (res && !res.ok) logWarn('Video araması başarısız: ' + res.error);
    return null;
  }
  const key = String(((settings.google || {}).key) || '').trim();
  if (!key) {
    logWarn('Gerçek video seçimi masaüstü uygulamasında çalışır (tarayıcıda anahtar gerekir).');
    return null;
  }
  const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1' +
    '&relevanceLanguage=' + lang() + '&safeSearch=moderate&q=' + encodeURIComponent(query) + '&key=' + encodeURIComponent(key);
  const res = await fetch(url, { signal: fetchTimeout(8000) });
  if (!res.ok) throw new Error(await httpError(res));
  const data = await res.json();
  const it = ((data.items || [])[0]) || null;
  const id = it && ((it.id || {}).videoId || '');
  if (!id) return null;
  const sn = it.snippet || {};
  const thumbs = sn.thumbnails || {};
  return {
    url: 'https://www.youtube.com/watch?v=' + id,
    title: String(sn.title || query),
    channel: String(sn.channelTitle || ''),
    thumb: ((thumbs.medium || thumbs.default || {}).url) || 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'
  };
}

/* Videoyu bulur, kartı tazeler ve sohbete kaydeder. Mesaj gönderilirken beklenmez,
   akışla paralel çalışır — bu yüzden yanıt gecikmez. */
async function lookUpVideos(msg, node) {
  const v = msg.video;
  if (!v) return;
  try {
    const video = await findVideoFor(v.query);
    v.video = video || null;
    v.state = video ? 'ready' : 'none';
    if (video) logInfo('Video seçildi: "' + video.title + '" · ' + (video.channel || 'kanal bilinmiyor') + ' · ' + video.url);
    else logWarn('Bu konu için uygun video bulunamadı: "' + v.query + '"');
  } catch (err) {
    v.video = null;
    v.state = 'none';
    logWarn('Video araması başarısız: ' + ((err && err.message) || err));
  }
  refreshVideoBody(node, v);
  save(ukey('chats'), chats);
}

/* Video kimliği: gömülü oynatıcı ve kapak fotoğrafı için. */
function youtubeId(v) {
  const m = String((v && (v.url || v.id)) || '')
    .match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : (v && /^[A-Za-z0-9_-]{11}$/.test(String(v.id || '')) ? v.id : '');
}

function videoCardHtml(v) {
  if (!v || v.state === 'loading') {
    return '<span class="video-card loading"><span class="video-thumb"><span class="video-skel"></span></span>' +
      '<span class="video-info"><span class="video-skel line"></span><span class="video-skel line short"></span></span></span>';
  }
  if (v.state === 'ready' && v.video) {
    const x = v.video;
    const id = youtubeId(x);
    const thumb = x.thumb || (id ? 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' : '');
    const meta = [x.channel, x.duration, x.views].filter(Boolean).join(' · ');
    return '<a class="video-card" href="' + escapeHtml(x.url) + '" target="_blank" rel="noopener noreferrer"' +
      (id ? ' data-video-id="' + escapeHtml(id) + '"' : '') + '>' +
      '<span class="video-thumb">' +
        (thumb ? '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />' : '') +
        '<span class="video-play"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg></span>' +
        (x.duration ? '<span class="video-time">' + escapeHtml(x.duration) + '</span>' : '') +
      '</span>' +
      '<span class="video-info">' +
        '<span class="video-kicker">' + escapeHtml(v.kicker || t('Al sana yardım ediyom 😎 · bu videoya bak')) + '</span>' +
        '<strong class="video-name">' + escapeHtml(x.title || v.query) + '</strong>' +
        (meta ? '<small class="video-meta">' + escapeHtml(meta) + '</small>' : '') +
        '<span class="video-go">' + escapeHtml(t('Videoyu aç ↗')) + '</span>' +
      '</span></a>';
  }
  return '<span class="video-none">' + escapeHtml(t('Bu konu için uygun bir video bulamadım. Konuyu biraz açar mısın?')) + '</span>';
}

/* Video kartına tıklanınca: ayara göre uygulama içinde oynat ya da tarayıcıda aç.
   Masaüstünde adres, geçerli http kaynağı veren yerel oynatıcı sayfasıdır
   (doğrudan app:// gömme YouTube'da "Hata 153" ile açılmıyor). */
async function openVideoPlayer(card, id) {
  const wrap = card.closest('.video-wrap');
  if (!wrap) return;
  wrap.querySelectorAll('.video-player').forEach((p) => p.remove());
  const imza = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7);
  wrap.dataset.playerToken = imza;
  const player = el('div', 'video-player');
  const frame = document.createElement('iframe');
  let kaynak = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
  const d = desktop();
  if (d && typeof d.videoPlayerUrl === 'function') {
    try {
      const res = await d.videoPlayerUrl(id);
      if (res && res.url) kaynak = res.url;
    } catch { /* yerel oynatıcı yoksa doğrudan gömme denenir */ }
  }
  if (!wrap.isConnected || wrap.dataset.playerToken !== imza) return;
  frame.src = kaynak;
  frame.title = t('Video oynatıcı');
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  player.appendChild(frame);
  const bar = el('div', 'video-player-bar');
  const ext = document.createElement('a');
  ext.href = card.getAttribute('href') || '#';
  ext.target = '_blank';
  ext.rel = 'noopener noreferrer';
  ext.className = 'video-player-link';
  ext.textContent = t('Tarayıcıda aç ↗');
  const close = el('button', 'mini-btn', t('Videoyu kapat'));
  close.type = 'button';
  close.onclick = () => player.remove();
  bar.append(ext, close);
  player.appendChild(bar);
  wrap.appendChild(player);
  player.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function videoNode(video) {
  const wrap = el('div', 'video-wrap');
  wrap.innerHTML = '<div class="video-body">' + videoCardHtml(video) + '</div>';
  return wrap;
}

function refreshVideoBody(node, video) {
  const body = node && node.querySelector('.video-body');
  if (body) body.innerHTML = videoCardHtml(video);
}

/* Konuşma tarzı: her yanıtta samimi, yardımsever bir arkadaş tonu. */
const TONE_PROMPT = 'Konuşma tarzın: samimi, sıcak ve yardımsever bir arkadaş gibi. Kısa cümleler kur, gereksiz resmîlikten kaçın.';

function helpSystemPrompt(query, video) {
  const q = String(query || '').trim();
  if (lang() !== 'tr') {
    const lines = [
      q ? 'The user wants help with "' + q + '".'
        : 'The user wants a video but did not say the topic; briefly ask what it is.',
      'Write like a warm, encouraging friend; phrases like "here’s a hand", "watch this", "we’ve got this" work if they feel natural.',
      'Give steps in a short numbered list and add a small example when useful.'
    ];
    if (video) {
      lines.push('I added a video card below: "' + video.title + '" (' + (video.channel || 'YouTube') + ').');
      lines.push('At the END of your reply mention that video by name with a friendly line like "give this a watch too". Do not write the URL; the card has it.');
    } else {
      lines.push('A video card is loading (or none was found). Do not mention a video; the card appears on its own if available.');
    }
    return lines.join('\n');
  }
  const satir = [
    q ? 'Kullanıcı "' + q + '" konusunda senden yardım istiyor.'
      : 'Kullanıcı bir konuda video istedi ama konuyu yazmadı; önce hangi konu olduğunu kısaca sor.',
    'Samimi, motive edici bir arkadaş gibi yaz; "Al sana yardım ediyom", "bak şimdi", "hallediyoruz", "sen de yaparsın" gibi ifadeler doğal duruyorsa kullan.',
    'Adımları kısa ve numaralı ver, mümkünse küçük bir örnek ekle.'
  ];
  if (video) {
    satir.push('Konunun altına "' + video.title + '" (' + (video.channel || 'YouTube') + ') adlı videoyu ekledim.');
    satir.push('Yanıtının EN SONUNDA bu videoyu adıyla anıp "bu videoya da bakabilirsin" gibi samimi bir cümle yaz. Bağlantıyı kendin yazma, kart hâlinde zaten ekli.');
  } else {
    satir.push('Konuyla ilgili video kartı hazırlanıyor (ya da bulunamadı). Videodan söz etme; kart varsa kendiliğinden görünür.');
  }
  return satir.join('\n');
}

/* Kullanıcı bir şeyin çalışmadığını söylediğinde: kısa açıklama + YAZIYLA "video mu, anlatayım mı?" sorusu.
   Düğme yoktur; kullanıcı cevabı yazarak verir ("video at" ya da "anlat"). */
function problemSystemPrompt(query) {
  if (lang() !== 'tr') {
    return [
      'The user says something is not working / is broken regarding "' + query + '".',
      'First give the likely cause in 1-2 friendly sentences.',
      'Then ASK IN WRITING: "Want me to find a video about this, or should I explain it step by step — which one?"',
      'Do not start explaining the solution yet; end with a short question and wait. There are no buttons on screen.',
      'If the user writes "video", a video is added; if they write "explain", you explain in text. For now just ask.'
    ].join('\n');
  }
  return [
    'Kullanıcı "' + query + '" konusunda bir şeyin çalışmadığını/bozuk olduğunu söylüyor.',
    'Önce 1-2 cümleyle olası nedeni samimi bir dille söyle.',
    'Sonra YAZARAK sor: "İstersen bu konuda bir video bulup atayım, istersen adım adım ben anlatayım — hangisi olsun?"',
    'Sorarken çözümü anlatmaya başlama; kısa bir soru cümlesiyle bitir ve cevabı bekle. Ekranda düğme yoktur.',
    'Kullanıcı "video at" gibi yazarsa video eklenir, "anlat" yazarsa yazıyla anlatılır; şimdilik sadece sor.'
  ].join('\n');
}

/* Kullanıcı "sen anlat" dediğinde: videosuz, ayrıntılı anlatım */
function explainSystemPrompt(query) {
  const q = String(query || '').trim();
  if (lang() !== 'tr') {
    return [
      q ? 'The user does not want a video for "' + q + '"; they want your own explanation.'
        : 'The user wants a written explanation but did not give the topic; ask briefly what it is.',
      q ? 'Do not mention video at all. Explain step by step like a friendly friend.'
        : 'Ask one short question and wait; do not start a long explanation.',
      'Use numbered steps, one sentence each, and add a small example at the end.',
      'Optionally close with a line like "tell me where you get stuck".'
    ].join('\n');
  }
  return [
    q ? 'Kullanıcı "' + q + '" konusunda video istemedi; kendi anlatmanı istedi.'
      : 'Kullanıcı yazıyla anlatılmasını istedi ama konuyu yazmadı; önce hangi konu olduğunu kısaca sor.',
    q ? 'Videodan hiç söz etme. Samimi bir arkadaş gibi, adım adım ve anlaşılır anlat.'
      : 'Konu gelene kadar kısa bir soru sor, uzun anlatıma girme.',
    'Numaralı adımlar kullan, her adım tek cümle olsun, sonunda küçük bir örnek ver.',
    'Gerekirse en sonda "takıldığın yer olursa yaz" gibi bir cümle ekle.'
  ].join('\n');
}

/* ----------------------------- Hesaplar ----------------------------- */
let currentUser = null;
let authSwitch = null;               // hesap değiştirme / yeni hesap akışı

function ukey(name) { return 'primeai.u.' + (currentUser ? currentUser.id : 'guest') + '.' + name; }

async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(salt + '::' + password + '::primeai');
  if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
    const buf = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0x811c9dc5;                       // güvenli bağlam yoksa yedek karma
  for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193); }
  return 'fnv' + (h >>> 0).toString(16);
}

function loadSession() {
  return load(SESSION_KEY, null) || (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  })();
}
function saveSession(userId, remember) {
  const value = JSON.stringify({ userId, at: Date.now() });
  try {
    if (remember) { localStorage.setItem(SESSION_KEY, value); sessionStorage.removeItem(SESSION_KEY); }
    else { sessionStorage.setItem(SESSION_KEY, value); localStorage.removeItem(SESSION_KEY); }
  } catch { /* yok */ }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch { /* yok */ }
}

function authMode() { return $('authForm').dataset.mode || 'login'; }

function setAuthMode(mode) {
  $('authForm').dataset.mode = mode;
  document.querySelectorAll('.auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.authTab === mode));
  $('authPass2Field').hidden = mode !== 'register';
  $('authSubmit').textContent = mode === 'register' ? 'Hesap oluştur' : 'Giriş yap';
  $('authPass').setAttribute('autocomplete', mode === 'register' ? 'new-password' : 'current-password');
  $('authError').hidden = true;
  $('authName').focus();
}

function authError(message) {
  const e = $('authError');
  e.textContent = message;
  e.hidden = !message;
  if (message) logWarn('Giriş reddedildi: ' + message);
}

function showAuth() {
  const ls = $('langScreen');
  if (ls) ls.hidden = true;
  authSwitch = null;
  if ($('authSwitchBar')) $('authSwitchBar').hidden = true;
  $('authName').readOnly = false;
  document.querySelectorAll('.auth-tab').forEach((b) => { b.hidden = false; });
  $('authScreen').hidden = false;
  $('app').hidden = true;
  setAuthMode('login');
  deferFocus($('authName'));
}

function deferFocus(node) { setTimeout(() => { try { node.focus(); } catch { /* yok */ } }, 60); }

/* Ad karşılaştırması: büyük/küçük harf, Türkçe İ/ı ve birleşik/ayrık
   karakter farkları hesabın bulunmasını engellemesin. */
function sameUserName(a, b) {
  const x = String(a == null ? '' : a).normalize('NFC').trim();
  const y = String(b == null ? '' : b).normalize('NFC').trim();
  if (!x || !y) return false;
  if (x.toLowerCase() === y.toLowerCase()) return true;
  return foldTr(x) === foldTr(y);
}

function findUser(name) {
  const users = load(USERS_KEY, []);
  if (!Array.isArray(users)) return null;
  return users.find((u) => u && sameUserName(u.name, name)) || null;
}

/* Şifre kontrolü: yeni kayıtlarda tuzlu SHA-256, çok eski kayıtlarda düz
   şifre alanı (bir kez doğrulanınca tuzlu kayda yükseltilir). */
async function passwordMatches(user, pass) {
  if (!user) return false;
  if (user.hash && user.salt) {
    const hash = await hashPassword(pass, user.salt);
    return hash === user.hash;
  }
  if (user.pass) return String(user.pass) === String(pass);
  return false;
}

async function upgradeUserHash(userId, pass) {
  const users = load(USERS_KEY, []);
  const u = Array.isArray(users) ? users.find((x) => x && x.id === userId) : null;
  if (!u) return;
  u.salt = uid() + uid();
  u.hash = await hashPassword(pass, u.salt);
  delete u.pass;
  save(USERS_KEY, users);
  logInfo('Eski hesap kaydı güncellendi: ' + u.name);
}

async function submitAuth() {
  const mode = authMode();
  const name = $('authName').value.trim();
  const pass = $('authPass').value;
  const pass2 = $('authPass2').value;
  const remember = $('authRemember').checked;
  const users = load(USERS_KEY, []);
  if (!Array.isArray(users)) save(USERS_KEY, []);

  if (name.length < 3) return authError(t('Kullanıcı adı en az 3 karakter olmalı.'));
  if (pass.length < 4) return authError(t('Şifre en az 4 karakter olmalı.'));
  if (!/^[\p{L}\p{N}._-]+$/u.test(name)) return authError(t('Kullanıcı adında yalnızca harf, rakam, nokta, tire ve alt çizgi kullanın.'));

  const existing = findUser(name);

  /* Hesap değiştirme ya da yeni hesap ekleme akışı başarıyla biterse
     oturum değiştirilir ve uygulama o hesabın verisiyle yeniden açılır. */
  const finish = (user) => {
    currentUser = user;
    saveSession(user.id, remember);
    if (authSwitch) {
      logInfo('Hesap değiştirildi: ' + user.name);
      location.reload();
      return;
    }
    startApp();
    toast('Tekrar hoş geldiniz, ' + user.name + '!');
  };

  if (mode === 'register') {
    if (existing) {
      /* Ad var: şifre doğruysa yeni hesap açmaya gerek yok, giriş yapılır. */
      if (await passwordMatches(existing, pass)) {
        logInfo('Mevcut hesapla giriş yapıldı: ' + existing.name);
        finish(existing);
        return;
      }
      return authError(t('Bu kullanıcı adı zaten var. Giriş yapmak için doğru şifreyi girin.'));
    }
    if (pass !== pass2) return authError(t('Şifreler birbiriyle uyuşmuyor.'));
    const salt = uid() + uid();
    const hash = await hashPassword(pass, salt);
    const user = { id: uid(), name, salt, hash, createdAt: Date.now() };
    users.push(user);
    save(USERS_KEY, users);
    logInfo('Hesap oluşturuldu: ' + name);
    currentUser = user;
    saveSession(user.id, remember);
    if (authSwitch) { location.reload(); return; }
    startApp();
    toast('Hesap oluşturuldu. Hoş geldiniz, ' + name + '!');
    return;
  }

  if (!existing) {
    /* Ad bulunamadı: kayıtlı adlar gösterilir, böylece yazım farkı görülür. */
    const names = users.map((u) => u && u.name).filter(Boolean).slice(0, 4);
    return authError(names.length
      ? tx('Böyle bir hesap yok. Kayıtlı hesaplar: ', 'No such account. Saved accounts: ') + names.join(', ')
      : t('Böyle bir hesap yok. "Hesap oluştur" sekmesini kullanın.'));
  }

  if (!(await passwordMatches(existing, pass))) {
    return authError(tx('Şifre hatalı. Hesap: ', 'Wrong password. Account: ') + existing.name);
  }
  if (!existing.hash) await upgradeUserHash(existing.id, pass);
  logInfo('Giriş yapıldı: ' + existing.name + ' · oturum: ' + (remember ? 'kalıcı' : 'bu pencere'));
  finish(existing);
}

/* ------------------------- Hesap değiştirme ------------------------- */
/* Profil alanındaki ya da üst çubuktaki hesap düğmesi bu pencereyi açar. */
function beginAccountSwitch(name, mode) {
  closeAccounts();
  authSwitch = { name: String(name || '').trim() };
  $('app').hidden = true;
  $('authScreen').hidden = false;
  setAuthMode(mode === 'register' ? 'register' : 'login');
  /* Belirli bir hesaba geçilirken sekme yok: ad sabit, sadece şifre istenir. */
  document.querySelectorAll('.auth-tab').forEach((b) => { b.hidden = !!authSwitch.name; });
  if ($('authSwitchText')) $('authSwitchText').textContent = authSwitch.name ? t('Hesap değiştir') : t('Hesap gir');
  if ($('authSwitchBar')) $('authSwitchBar').hidden = false;
  $('authName').value = authSwitch.name;
  $('authName').readOnly = !!authSwitch.name;
  $('authPass').value = '';
  $('authPass2').value = '';
  $('authError').hidden = true;
  deferFocus(authSwitch.name ? $('authPass') : $('authName'));
}

function cancelAccountSwitch() {
  if (!authSwitch) return;
  authSwitch = null;
  if ($('authSwitchBar')) $('authSwitchBar').hidden = true;
  $('authScreen').hidden = true;
  $('authName').value = '';
  $('authName').readOnly = false;
  $('authPass').value = '';
  $('authPass2').value = '';
  $('authError').hidden = true;
  $('accountsModal').classList.remove('open');
  $('app').hidden = false;
  deferFocus($('input'));
}

function renderAccounts() {
  const list = $('accountsList');
  if (!list) return;
  list.textContent = '';
  const users = (load(USERS_KEY, []) || []).filter((u) => u && u.name);
  const others = users.filter((u) => !currentUser || u.id !== currentUser.id);

  users.forEach((u) => {
    const row = el('button', 'account-item');
    row.type = 'button';
    const av = el('span', 'user-avatar', String(u.name).slice(0, 1).toUpperCase());
    const info = el('span', 'account-item-info');
    info.appendChild(el('strong', null, u.name));
    info.appendChild(el('small', null, currentUser && u.id === currentUser.id ? t('şu an') : t('Geç')));
    row.append(av, info);
    if (currentUser && u.id === currentUser.id) row.classList.add('is-current');
    row.onclick = () => {
      if (currentUser && u.id === currentUser.id) { closeAccounts(); return; }
      beginAccountSwitch(u.name, 'login');
    };
    list.appendChild(row);
  });

  if ($('accountsHint')) {
    $('accountsHint').textContent = others.length
      ? ''
      : t('Bu cihazda başka hesap yok. “Hesap gir” ile başka bir hesaba geçin.');
  }
  if ($('accountsTitle')) $('accountsTitle').textContent = t('Hesaplar');
  if ($('accountsSignInBtn')) $('accountsSignInBtn').textContent = t('Hesap gir');
  if ($('accountsNewBtn')) $('accountsNewBtn').textContent = t('Yeni hesap');
  const sub = $('accountsModal') && $('accountsModal').querySelector('.modal-sub');
  if (sub) sub.textContent = t('Bu cihazdaki hesaplar. Geçmek için şifrenizi girin.');
}

function openAccounts() {
  renderAccounts();
  const m = $('accountsModal');
  if (!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
}

function closeAccounts() {
  const m = $('accountsModal');
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
}

function logout() {
  if (currentUser) logInfo('Çıkış yapıldı: ' + currentUser.name);
  clearSession();
  location.reload();
}

function deleteAccount() {
  if (!currentUser) return;
  if (!confirm('Hesabınız ve tüm sohbetleriniz bu cihazdan silinecek. Emin misiniz?')) return;
  logWarn('Hesap silindi: ' + currentUser.name + ' · sohbetler temizlendi');
  const users = load(USERS_KEY, []).filter((u) => u.id !== currentUser.id);
  save(USERS_KEY, users);
  try {
    const prefix = 'primeai.u.' + currentUser.id + '.';
    Object.keys(localStorage).filter((k) => k.startsWith(prefix)).forEach((k) => localStorage.removeItem(k));
  } catch { /* yok */ }
  clearSession();
  location.reload();
}

/* ----------------------------- Durum ----------------------------- */
let settings = freshDefaults();
let chats = [];
let activeId = null;
let streaming = null;
let extraSystem = '';            // istek başına ek sistem talimatı (yardım/video/görsel)
let draft = null;                // düzenlenen ya da yeni API kaydı
let pendingImages = [];          // yazı kutusuna eklenmiş, henüz gönderilmemiş görseller
let lastThemeLogged = '';        // tema bildirimini yalnızca değiştiğinde logla

/* DEFAULT_SETTINGS içindeki nesneler paylaşılmamalı: her yüklemede taze kopya üretilir,
   aksi hâlde bir hesabın verisi sonraki hesaba sızabilir (startApp iki kez çalışırsa). */
function freshDefaults() {
  return Object.assign({}, DEFAULT_SETTINGS, {
    apis: [], keys: {}, models: {}, model: {},
    google: { key: '', cx: '' },
    access: [],
    micDeviceId: '',
    assistant: Object.assign({}, DEFAULT_SETTINGS.assistant, {
      faces: [], voice: Object.assign({}, DEFAULT_SETTINGS.assistant.voice)
    }),
    camera: Object.assign({}, DEFAULT_SETTINGS.camera, { captures: [] })
  });
}

function persist() { save(ukey('settings'), settings); }
function activeChat() { return chats.find((c) => c.id === activeId) || null; }

function getProvider(id) { return PROVIDERS[id] || PROVIDERS.gemini; }
function providerName(cfg) { return lang() !== 'tr' && cfg && cfg.labelEn ? cfg.labelEn : ((cfg && cfg.label) || ''); }
function requiresKey(cfg) { return (cfg || providerCfg()).needsKey !== false; }

/* ----------------------------- API kayıtları ----------------------------- */
/* Birden çok API saklanabilir; aynı sağlayıcıdan kaç tane olursa olsun her biri ayrı kayıttır. */
function slots() { return settings.apis || (settings.apis = []); }
function slotById(sid) { return slots().find((s) => s.sid === sid) || null; }
function slotByProvider(id) { return slots().find((s) => s.provider === id) || null; }
function slotReady(s) {
  if (!s) return false;
  if (!s.model) return false;
  return !!s.key || getProvider(s.provider).needsKey === false;
}
function activeSlot() { return slotById(settings.activeApiId) || slots()[0] || null; }
function providerCfg() { const s = activeSlot(); return getProvider(s ? s.provider : (settings.provider || 'gemini')); }
function currentKey(idOrSid) {
  const s = idOrSid ? (slotById(idOrSid) || slotByProvider(idOrSid)) : activeSlot();
  return String((s && s.key) || '').trim();
}
function currentModel(idOrSid) {
  const s = idOrSid ? (slotById(idOrSid) || slotByProvider(idOrSid)) : activeSlot();
  return String((s && s.model) || '').trim();
}
function currentBase(id) {
  const s = activeSlot();
  const pid = id || (s ? s.provider : settings.provider);
  return BASE_URLS[pid] || '';
}
function configuredProviders() { return [...new Set(slots().filter(slotReady).map((s) => s.provider))]; }
function isConfigured() { return slotReady(activeSlot()); }
function pickActiveSlot() {
  const list = slots();
  if (!list.length) { settings.activeApiId = null; return; }
  if (list.some((s) => s.sid === settings.activeApiId)) return;
  settings.activeApiId = (list.find(slotReady) || list[0]).sid;
}
/* Eski sürümden (settings.keys/model) API kayıtlarına geçiş */
function migrateApis() {
  if (!Array.isArray(settings.apis)) settings.apis = [];
  for (const s of settings.apis) {
    if (!s.sid) s.sid = uid();
    if (!s.provider || !PROVIDERS[s.provider]) s.provider = 'gemini';
    s.key = String(s.key || '');
    s.model = String(s.model || '');
  }
  if (!settings.apis.length) {
    const keys = settings.keys || {};
    const models = settings.model || {};
    for (const id of Object.keys(PROVIDERS)) {
      const key = String(keys[id] || '').trim();
      const model = String(models[id] || '').trim();
      if (key || (PROVIDERS[id].needsKey === false && model)) {
        settings.apis.push({ sid: uid(), provider: id, key, model });
      }
    }
  }
  if (!Array.isArray(settings.models)) settings.models = settings.models || {};
  settings.google = Object.assign({ key: '', cx: '' }, settings.google || {});
  pickActiveSlot();
}

/* ----------------------------- Tema ----------------------------- */

function resolvedTheme() {
  const pref = settings.theme || 'dark';
  if (pref === 'system') return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  return pref === 'light' ? 'light' : 'dark';
}

function applyTheme() {
  const t = resolvedTheme();
  const root = document.documentElement;
  root.setAttribute('data-theme', t);
  root.setAttribute('data-accent', settings.accent || 'alev');
  const meta = $('metaThemeColor');
  if (meta) meta.setAttribute('content', t === 'light' ? '#ffffff' : '#000000');
  const seg = $('themeSeg');
  if (seg) seg.querySelectorAll('[data-theme-val]').forEach((b) => b.classList.toggle('active', b.dataset.themeVal === (settings.theme || 'dark')));
  const grid = $('accentGrid');
  if (grid) grid.querySelectorAll('[data-accent-val]').forEach((b) => b.classList.toggle('active', b.dataset.accentVal === (settings.accent || 'alev')));
  const stamp = t + '/' + (settings.accent || 'alev');
  if (lastThemeLogged && lastThemeLogged !== stamp) {
    logInfo('Tema: ' + (settings.theme || 'dark') + ' → görünüm ' + t + ' · renk: ' + (settings.accent || 'alev'));
  }
  lastThemeLogged = stamp;
}

/* ----------------------------- Model listesi ----------------------------- */
function rankModels(ids, prefer) {
  const score = (m) => {
    const l = m.toLowerCase();
    let s = 0;
    (prefer || []).forEach((p, i) => { if (l.includes(p)) s += ((prefer.length - i) * 10); });
    if (/chat|instruct|latest/.test(l)) s += 2;
    if (/embed|whisper|tts|image|vision|audio|rerank|moderation|dall|stable|guard/.test(l)) s -= 60;
    if (/preview|experimental|beta/.test(l)) s -= 3;
    return s;
  };
  return [...new Set(ids)].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
}

function authHeaders(cfg, key) {
  const h = {};
  if (cfg.kind === 'anthropic') {
    if (key) h['x-api-key'] = key;
    h['anthropic-version'] = '2023-06-01';
    h['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (key) h.Authorization = 'Bearer ' + key;
  return h;
}

function extraHeaders(base) {
  if (String(base).indexOf('openrouter.ai') !== -1) {
    return { 'HTTP-Referer': location.origin || 'https://localhost', 'X-Title': 'PRIME AI' };
  }
  return {};
}

async function httpError(res) {
  let detail = '';
  try {
    const txt = await res.text();
    try {
      const j = JSON.parse(txt);
      detail = (j.error && (j.error.message || j.error)) || j.message || txt;
    } catch { detail = txt; }
  } catch { /* yok */ }
  detail = String(detail || '').slice(0, 300);
  if (res.status === 401 || res.status === 403) return 'Anahtar reddedildi (' + res.status + '). ' + detail;
  if (res.status === 404) return 'Bulunamadı (404). Model adı hatalı olabilir. ' + detail;
  if (res.status === 429) return 'Çok fazla istek (429). Biraz bekleyin. ' + detail;
  return 'HTTP ' + res.status + ' ' + detail;
}

async function fetchModels(providerId, key) {
  const cfg = getProvider(providerId);
  const base = currentBase(providerId);
  if (requiresKey(cfg) && !key) throw new Error('API anahtarı gerekli.');

  if (cfg.kind === 'gemini') {
    const res = await fetch(base + '/models?key=' + encodeURIComponent(key) + '&pageSize=200');
    if (!res.ok) throw new Error(await httpError(res));
    const data = await res.json();
    const ids = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => (m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
    if (!ids.length) throw new Error('Bu anahtar için model bulunamadı.');
    return rankModels(ids, cfg.prefer);
  }

  const res = await fetch(base + '/models', { headers: Object.assign(authHeaders(cfg, key), extraHeaders(base)) });
  if (!res.ok) throw new Error(await httpError(res));
  const data = await res.json();
  const ids = (data.data || []).map((m) => m.id).filter(Boolean);
  if (!ids.length) throw new Error('Bu sunucu model listesi döndürmedi.');
  return rankModels(ids, cfg.prefer);
}

/* ----------------------------- SSE ----------------------------- */
async function sseFetch(url, headers, payload, onData, signal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    body: JSON.stringify(payload),
    signal
  });
  if (!res.ok) throw new Error(await httpError(res));
  if (!res.body) throw new Error('Sunucu akış gövdesi döndürmedi.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const consume = (block) => {
    const data = block.split(/\r?\n/).filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim()).join('\n');
    if (data && data !== '[DONE]') onData(data);
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() || '';
    for (const p of parts) consume(p);
  }
  buffer += decoder.decode();
  if (buffer.trim()) consume(buffer);
}

/* ----------------------------- İstek gövdeleri ----------------------------- */


/* `extra` verilmezse istek başına eklenen talimat (extraSystem) kullanılır;
   masaüstü topu kendi kısa yanıt talimatını verir, ana sohbeti etkilemez. */
function effectiveSystemPrompt(extra) {
  const ek = extra === undefined ? extraSystem : extra;
  let s = (settings.systemPrompt || '').trim();
  s += (s ? '\n\n' : '') + tonePrompt();
  s += (s ? '\n\n' : '') + languagePrompt();
  if (briefOn()) s += (s ? '\n\n' : '') + briefPrompt();
  if (ek) s += (s ? '\n\n' : '') + ek;
  return s.trim();
}

/* ----------------------------- Görsel parçaları -----------------------------
   Görseller data URL olarak saklanır ("data:image/jpeg;base64,....").
   Her sağlayıcı görseli farklı biçimde ister; aşağıdaki üç yardımcı bu farkı kapatır. */
function messageImages(m) {
  return Array.isArray(m && m.images) ? m.images.filter((i) => i && i.dataUrl) : [];
}
function base64Of(dataUrl) {
  const s = String(dataUrl || '');
  const i = s.indexOf(',');
  return i >= 0 ? s.slice(i + 1) : s;
}
function mimeOf(im) {
  const m = String((im && im.mime) || '');
  return /^image\/[a-z0-9.+-]+$/i.test(m) ? m : 'image/jpeg';
}

function buildGeminiBody(messages, extra) {
  const body = {
    contents: messages.map((m) => {
      const parts = [];
      for (const im of messageImages(m)) {
        parts.push({ inline_data: { mime_type: mimeOf(im), data: base64Of(im.dataUrl) } });
      }
      if (m.content) parts.push({ text: m.content });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    })
  };
  const sys = effectiveSystemPrompt(extra);
  if (sys) body.systemInstruction = { parts: [{ text: sys }] };
  const gen = { temperature: Number(settings.temperature) };
  const max = Number(settings.maxTokens);
  if (max > 0) gen.maxOutputTokens = max;
  body.generationConfig = gen;
  return body;
}

function buildOpenAIBody(model, messages, extra) {
  const msgs = messages.map((m) => {
    const imgs = messageImages(m);
    if (!imgs.length) return { role: m.role, content: m.content };
    const parts = [];
    if (m.content) parts.push({ type: 'text', text: m.content });
    for (const im of imgs) parts.push({ type: 'image_url', image_url: { url: im.dataUrl } });
    return { role: m.role, content: parts };
  });
  const sys = effectiveSystemPrompt(extra);
  if (sys) msgs.unshift({ role: 'system', content: sys });
  return { model, messages: msgs, stream: true, temperature: Number(settings.temperature) };
}

function buildAnthropicBody(model, messages, extra) {
  const body = {
    model,
    max_tokens: Number(settings.maxTokens) > 0 ? Number(settings.maxTokens) : 4096,
    temperature: Number(settings.temperature),
    stream: true,
    messages: messages.map((m) => {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      const imgs = messageImages(m);
      if (!imgs.length) return { role, content: m.content };
      const content = imgs.map((im) => ({
        type: 'image',
        source: { type: 'base64', media_type: mimeOf(im), data: base64Of(im.dataUrl) }
      }));
      if (m.content) content.push({ type: 'text', text: m.content });
      return { role, content };
    })
  };
  const sys = effectiveSystemPrompt(extra);
  if (sys) body.system = sys;
  return body;
}

/* ----------------- kotası dolan anahtardan otomatik geçiş -----------------
   Bir anahtar kota/limit hatası (429, quota, billing…) verdiyse 24 saat
   atlanır; sıradaki hazır ve kullanılmamış kayıt kendiliğinden devreye girer.
   Aynı istek hiç metin gelmeden yeni anahtarla bir kez daha denenir. */
const API_USED_UP_MS = 24 * 60 * 60 * 1000;

function isQuotaError(err) {
  const s = String((err && err.message) || err || '').toLowerCase();
  return /(\b429\b|quota|kota|resource_exhausted|rate[ _-]?limit|too many requests|insufficient_quota|billing|credit balance|exceeded your current)/.test(s);
}

function slotUsedUp(s) {
  if (!s || !s.usedUpAt) return false;
  return Date.now() - Number(s.usedUpAt) < API_USED_UP_MS;
}

function markSlotUsedUp(s) {
  if (!s) return;
  s.usedUpAt = Date.now();
  persist();
}

function slotLabel(s) {
  if (!s) return '';
  const cfg = getProvider(s.provider);
  return providerName(cfg) + (s.model ? ' · ' + s.model : '');
}

/* Etkin kayıttan sonra sıradaki hazır, kullanılmamış kayıt (deneneler atlanır). */
function nextApiSlot(tried) {
  const skip = new Set((tried || []).map((s) => s && s.sid));
  return slots().find((s) => s && s.sid !== settings.activeApiId && !skip.has(s.sid) && slotReady(s) && !slotUsedUp(s)) || null;
}

/* Etkin API'yi değiştir; ekrandaki kart, rozet ve uyarı hemen güncellenir. */
function useApiSlot(slot) {
  if (!slot) return;
  settings.activeApiId = slot.sid;
  settings.provider = slot.provider;
  persist();
  updateBanner();
  updateChip();
  if ($('apiGrid')) renderApiGrid();
}

async function streamOnce(slot, history, onText, signal, extra) {
  const cfg = getProvider(slot.provider);
  const base = currentBase(slot.provider);
  const key = String(slot.key || '').trim();
  const model = String(slot.model || '').trim();

  if (!model) throw new Error('Model seçilmedi. Ayarlar → API Yeri → modelleri getir.');
  if (requiresKey(cfg) && !key) throw new Error('API anahtarı girilmedi.');

  if (cfg.kind === 'gemini') {
    await sseFetch(base + '/models/' + encodeURIComponent(model) + ':streamGenerateContent?alt=sse',
      { 'x-goog-api-key': key }, buildGeminiBody(history, extra), (raw) => {
        let chunk; try { chunk = JSON.parse(raw); } catch { return; }
        const parts = (((chunk.candidates || [])[0] || {}).content || {}).parts || [];
        for (const p of parts) if (p.text) onText(p.text);
      }, signal);
    return;
  }

  if (cfg.kind === 'anthropic') {
    await sseFetch(base + '/messages', authHeaders(cfg, key), buildAnthropicBody(model, history, extra), (raw) => {
      let j; try { j = JSON.parse(raw); } catch { return; }
      if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta' && j.delta.text) onText(j.delta.text);
    }, signal);
    return;
  }

  await sseFetch(base + '/chat/completions', Object.assign(authHeaders(cfg, key), extraHeaders(base)),
    buildOpenAIBody(model, history, extra), (raw) => {
      let chunk; try { chunk = JSON.parse(raw); } catch { return; }
      const d = (((chunk.choices || [])[0] || {}).delta) || {};
      if (typeof d.content === 'string') onText(d.content);
    }, signal);
}

async function streamReply(history, onText, signal, extra) {
  const tried = [];
  let emitted = false;
  const emit = (t) => { if (t) emitted = true; onText(t); };

  for (;;) {
    let slot = activeSlot();
    if (!slotReady(slot)) {
      throw new Error(!currentModel()
        ? 'Model seçilmedi. Ayarlar → API Yeri → modelleri getir.'
        : 'API anahtarı girilmedi.');
    }

    /* Elle seçilmiş kayıt da tükenmişse baştan sıradakine geç. */
    if (slotUsedUp(slot)) {
      tried.push(slot);
      const next = nextApiSlot(tried);
      if (!next) throw new Error(lang() !== 'tr'
        ? 'All API keys are out of quota. Add a new key in Settings → API.'
        : 'Tüm API anahtarlarının kotası doldu. Ayarlar → API Yerinden yeni bir anahtar ekleyin.');
      const msg = lang() !== 'tr'
        ? slotLabel(slot) + ' is out of quota — switched to ' + slotLabel(next) + '.'
        : slotLabel(slot) + ' kotası doldu — ' + slotLabel(next) + ' anahtarına geçildi.';
      useApiSlot(next);
      toast(msg);
      logInfo(msg);
      slot = next;
    }

    try {
      return await streamOnce(slot, history, emit, signal, extra);
    } catch (err) {
      if (signal && signal.aborted) throw err;
      if (!isQuotaError(err)) throw err;

      /* Kota bitti: bu kaydı işaretle, sıradakiyle devam et. */
      markSlotUsedUp(slot);
      tried.push(slot);
      if (emitted) throw err;   // metin akmaya başladı: tekrar etmek yazıyı çiftler

      const next = nextApiSlot(tried);
      if (!next) {
        throw new Error(lang() !== 'tr'
          ? 'All API keys are out of quota. Add a new key in Settings → API.'
          : 'Tüm API anahtarlarının kotası doldu. Ayarlar → API Yerinden yeni bir anahtar ekleyin.');
      }
      const msg = lang() !== 'tr'
        ? slotLabel(slot) + ' is out of quota — switched to ' + slotLabel(next) + ' automatically.'
        : slotLabel(slot) + ' kotası doldu — otomatik olarak ' + slotLabel(next) + ' anahtarına geçildi.';
      useApiSlot(next);
      toast(msg);
      logInfo(msg);
    }
  }
}

/* ======================================================================
   ERİŞİM — adlandırılmış uygulama ve klasörler
   Ayarlar → Erişim'de seçilen yollar burada tutulur. Topa “aç isim” ya da
   “kapat isim” yazılınca yapay zekâya gitmeden yerel komut çalışır; top bu
   sırada titrer. Kapatma yalnızca yolu birebir eşleşen süreçleri sonlandırır.
   ====================================================================== */
const ACCESS_VERBS = {
  ac: 'open', open: 'open', baslat: 'open', calistir: 'open',
  kapat: 'close', close: 'close', kapa: 'close'
};
const ACCESS_POLITE = ['lutfen', 'please', 'hemen', 'simdi', 'bir', 'the'];

function accessItems() {
  if (!Array.isArray(settings.access)) settings.access = [];
  return settings.access;
}

function accessBaseName(p) {
  const base = String(p || '').split(/[\\/]/).pop() || '';
  return base.replace(/\.[^.]+$/, '') || base;
}

function uniqueAccessName(base, skipId) {
  const clean = String(base || '').trim().slice(0, 40) || 'Erişim';
  const used = new Set(accessItems().filter((x) => x.id !== skipId).map((x) => foldTr(x.name)));
  let name = clean; let i = 2;
  while (used.has(foldTr(name))) { name = clean + ' ' + i; i += 1; }
  return name;
}

function addAccess(pathValue, kind) {
  const p = String(pathValue || '').trim();
  if (!p) return null;
  const item = {
    id: uid(), name: uniqueAccessName(accessBaseName(p)), path: p,
    kind: kind === 'folder' ? 'folder' : 'app'
  };
  accessItems().push(item);
  persist();
  renderAccessList();
  logInfo('Erişim eklendi: ' + item.name + ' · ' + (item.kind === 'folder' ? 'klasör' : 'uygulama'));
  return item;
}

function removeAccess(id) {
  const i = accessItems().findIndex((x) => x.id === id);
  if (i < 0) return;
  const [item] = accessItems().splice(i, 1);
  persist();
  renderAccessList();
  logInfo('Erişim kaldırıldı: ' + item.name);
}

function renameAccess(id, name) {
  const item = accessItems().find((x) => x.id === id);
  if (!item) return;
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean) { renderAccessList(); return; }
  item.name = uniqueAccessName(clean, id);
  persist();
  renderAccessList();
}

async function pickAccess(kind) {
  const d = desktop();
  if (!d || !d.pickShortcut) {
    toast('Erişim yalnızca masaüstü uygulamasında kullanılabilir.', true);
    return;
  }
  let res = null;
  try { res = await d.pickShortcut(kind); }
  catch (err) { res = { ok: false, error: String((err && err.message) || err) }; }
  if (!res || !res.ok) {
    if (res && res.error) {
      logError('Erişim seçilemedi', res.error);
      toast('Seçilemedi: ' + res.error, true);
    }
    return;
  }
  const item = addAccess(res.path, res.kind || kind);
  if (item) toast('Erişim eklendi: ' + item.name);
}

function renderAccessList() {
  const list = $('accessList');
  if (!list) return;
  const items = accessItems();
  list.innerHTML = '';
  if (!items.length) {
    list.appendChild(el('div', 'access-empty', t('Henüz bir erişim eklenmedi.')));
  }
  for (const item of items) {
    const row = el('div', 'access-row');
    row.dataset.id = item.id;
    const icon = el('span', 'access-icon');
    icon.innerHTML = item.kind === 'folder'
      ? '<svg viewBox="0 0 24 24"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l1.8 2.2h9.2A1.5 1.5 0 0 1 21 9.7v8.8A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>'
      : '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 4v5"/></svg>';
    const main = el('div', 'access-main');
    const input = el('input', 'access-name');
    input.value = item.name;
    input.maxLength = 40;
    input.setAttribute('aria-label', t('Erişim adı'));
    input.title = t('İsmi değiştirmek için yazın');
    input.onchange = () => renameAccess(item.id, input.value);
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } };
    const p = el('span', 'access-path', item.path);
    p.title = item.path;
    main.append(input, p);
    const del = el('button', 'icon-btn ghost access-del');
    del.type = 'button';
    del.title = t('Kaldır');
    del.setAttribute('aria-label', t('Kaldır'));
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4.8h6V7M6.5 7l.8 12.2h9.4L17.5 7M10 10.5v6M14 10.5v6"/></svg>';
    del.onclick = () => removeAccess(item.id);
    row.append(icon, main, del);
    list.appendChild(row);
  }
  const hint = $('accessHint');
  if (hint) {
    hint.textContent = items.length
      ? t('Top hâlindeyken “aç isim” ya da “kapat isim” yazın. Kayıtlı: ') + items.map((x) => '“' + x.name + '”').join(', ')
      : t('Top komutları için önce bir uygulama ya da klasör ekleyin.');
  }
  const d = desktop();
  ['accessAddApp', 'accessAddFolder'].forEach((id) => {
    const b = $(id);
    if (b) b.disabled = !d || !d.pickShortcut;
  });
}

/* “aç chrome”, “chrome'u kapat”, “open notepad” gibi kısa komutlar. */
function accessIntent(text) {
  const words = foldTr(text).split(' ').filter(Boolean);
  if (words.length < 2) return null;
  const first = words[0];
  const last = words[words.length - 1];
  let action = null;
  let restWords = null;
  if (ACCESS_VERBS[first]) { action = ACCESS_VERBS[first]; restWords = words.slice(1); }
  else if (ACCESS_VERBS[last]) { action = ACCESS_VERBS[last]; restWords = words.slice(0, -1); }
  else return null;
  const rest = restWords.filter((w) => !ACCESS_POLITE.includes(w)).join(' ').trim();
  if (rest.length < 2) return null;
  return { action, rest };
}

function matchAccess(rest) {
  const q = foldTr(rest);
  if (!q) return null;
  let best = null;
  let bestScore = 0;
  for (const item of accessItems()) {
    const n = foldTr(item.name);
    if (!n) continue;
    let score = 0;
    if (n === q) score = 100;
    else if (q.startsWith(n)) score = 80 + n.length;        // "chrome'u aç"
    else if (q.includes(n)) score = 60 + n.length;          // "google chrome aç"
    else if (n.includes(q) && q.length >= 3) score = 40 + q.length;
    if (score > bestScore) { best = item; bestScore = score; }
  }
  return best;
}

function ballSay(id, text) {
  const d = desktop();
  if (d && d.ballStream) d.ballStream(id, text);
  if (d && d.ballFinish) d.ballFinish(id, '');
}

async function runAccessCommand(id, text) {
  const d = desktop();
  if (!d || !d.openShortcut) return false;
  const intent = accessIntent(text);
  if (!intent) return false;
  const items = accessItems();
  const item = matchAccess(intent.rest);
  if (!item) {
    ballSay(id, items.length
      ? '“' + intent.rest + '” adında kayıtlı bir erişim yok. Kayıtlılar: ' + items.map((x) => x.name).join(', ') + '.'
      : 'Önce Ayarlar → Uygulama Ayarları → Erişim bölümünden bir uygulama ya da klasör ekleyin.');
    return true;
  }
  if (intent.action === 'close') {
    if (item.kind === 'folder') {
      ballSay(id, item.name + (lang() !== 'tr'
        ? ' is a folder; windows can’t be closed from here.'
        : ' bir klasör; klasör penceresini buradan kapatamıyorum.'));
      return true;
    }
    if (!d.closeShortcut) { ballSay(id, t('Bu sürümde kapatma desteklenmiyor.')); return true; }
    logInfo('Top: kapatılıyor · ' + item.name);
    let res = null;
    try { res = await d.closeShortcut(item.path); }
    catch (err) { res = { ok: false, error: String((err && err.message) || err) }; }
    if (res && res.ok) {
      logInfo('Top: kapatıldı · ' + item.name);
      ballSay(id, item.name + (tx(' kapatıldı.', ' closed.')));
    } else {
      const err = (res && res.error) || 'unknown';
      logWarn('Top: kapatılamadı · ' + item.name + ' · ' + err);
      if (err === 'not-running') ballSay(id, item.name + (tx(' çalışmıyor görünüyor.', ' doesn’t seem to be running.')));
      else if (err === 'blocked') ballSay(id, item.name + (tx(' güvenlik için kapatılamıyor.', ' can’t be closed for safety.')));
      else ballSay(id, item.name + (tx(' kapatılamadı: ', ' couldn’t be closed: ')) + err);
    }
    return true;
  }
  logInfo('Top: açılıyor · ' + item.name);
  let res = null;
  try { res = await d.openShortcut(item.path); }
  catch (err) { res = { ok: false, error: String((err && err.message) || err) }; }
  if (res && res.ok) {
    logInfo('Top: açıldı · ' + item.name);
    /* Açıldıktan sonra asistan ekrana bakar (yalnızca görsel model varsa). */
    if (item.kind !== 'folder' && await lookAfterOpen(id, item)) return true;
    ballSay(id, item.name + (tx(' açıldı.', ' opened.')));
  } else {
    const err = (res && res.error) || 'unknown';
    logError('Top: açılamadı · ' + item.name, err);
    ballSay(id, item.name + (tx(' açılamadı: ', ' couldn’t be opened: ')) + err);
  }
  return true;
}

/* ======================================================================
   ASİSTAN EYLEMLERİ — topa verilen komutlar
   1) "kendini kapat"  → asistan kendini kapatır (top uygulamaya döner).
   2) Kayıtlı "aç/kapat <isim>" → yerel eylem (yukarıda, yapay zekâ gerekmez).
      Açıldıktan sonra asistan ekran görüntüsü alıp ne gördüğüne bakar ve
      uygulamanın içinde açılabilecek mantıklı bir şey varsa önerir.
   3) Kayıtlı olmayan emir gibiler → yapay zekâ güvenli bir eylem üretir;
      riskliyse (çalıştır / kayıtsız hedef) kullanıcıdan onay ister.
   ====================================================================== */
let pendingAction = null;      // onay bekleyen eylem (performAction nesnesi)

function ballStreamOnly(id, text) { const d = desktop(); if (d && d.ballStream) d.ballStream(id, text); }
function ballFinishOnly(id) { const d = desktop(); if (d && d.ballFinish) d.ballFinish(id, ''); }
function isUrl(u) { return /^https?:\/\//i.test(String(u || '').trim()); }

/* "kendini kapat" / "close yourself" gibi ifadeler. */
function selfCloseIntent(text) {
  const f = foldTr(text).replace(/[.!?,;]+$/g, '').trim();
  if (!f) return false;
  if (/^(kendini|seni|kendinizi|kendime) kapat/.test(f)) return true;
  if (/\b(kendini|seni|kendinizi) kapat\b/.test(f)) return true;
  if (/\bkapat (kendini|seni|kendinizi)\b/.test(f)) return true;
  return /^(kapan|quit|close yourself|close self|selfclose)$/.test(f);
}

/* Metin emir gibi mi görünüyor (soru değil)? */
const CMD_LEAD = ['ac', 'aç', 'baslat', 'başlat', 'calistir', 'çalıştır', 'kapat', 'calistirabilir', 'acabilir',
  'open', 'launch', 'run', 'start', 'close', 'quit', 'execute', 'sil', 'delete', 'remove', 'olustur', 'oluştur', 'create', 'make'];
function looksLikeCommand(text) {
  const f = foldTr(text).trim();
  const first = f.split(/\s+/)[0] || '';
  if (CMD_LEAD.includes(first)) return true;
  return /^(ac|baslat|calistir|kapat|open|run|start|launch|quit|execute|sil|create)\b/.test(f);
}

/* Yapay zekânın döndürdüğü eylem JSON'unu ayrıştır. */
function parseActionJson(raw) {
  const m = String(raw || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    if (!o || typeof o !== 'object') return null;
    const action = String(o.action || '').toLowerCase().trim();
    if (!['open', 'close', 'run', 'selfclose', 'answer'].includes(action)) return null;
    return {
      action,
      target: String(o.target || '').trim(),
      command: String(o.command || '').trim(),
      needsConfirm: action === 'run' ? true : (o.needsConfirm === true || o.needsConfirm === 'true'),
      say: String(o.say || '').trim()
    };
  } catch { return null; }
}

/* "Ekrana bakma" yanıtının JSON'unu ayrıştır: { description, nextAction }. */
function parseLookJson(raw) {
  const m = String(raw || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    if (!o || typeof o !== 'object') return null;
    let next = null;
    const n = o.nextAction;
    if (n && typeof n === 'object' && String(n.action || '').toLowerCase() === 'open' && n.target) {
      next = { action: 'open', target: String(n.target).trim(), needsConfirm: n.needsConfirm !== false, say: String(n.say || '').trim() };
    }
    return { description: String(o.description || '').trim(), nextAction: next };
  } catch { return null; }
}

function notFoundMsg(target) {
  const names = accessItems().map((x) => x.name);
  return lang() !== 'tr'
    ? 'No registered access named “' + target + '”.' + (names.length ? ' Registered: ' + names.join(', ') + '.' : '')
    : '“' + target + '” adında kayıtlı bir erişim yok.' + (names.length ? ' Kayıtlılar: ' + names.join(', ') + '.' : '');
}

/* Kayıtlı bir uygulamayı aç ve istenirse ekrana bak. */
async function openRegistered(id, item) {
  const d = desktop();
  logInfo('Top: açılıyor · ' + item.name);
  let res = null;
  try { res = await d.openShortcut(item.path); }
  catch (err) { res = { ok: false, error: String((err && err.message) || err) }; }
  if (res && res.ok) {
    logInfo('Top: açıldı · ' + item.name);
    if (item.kind !== 'folder' && await lookAfterOpen(id, item)) return true;
    ballSay(id, item.name + (tx(' açıldı.', ' opened.')));
    return true;
  }
  const err = (res && res.error) || 'unknown';
  logError('Top: açılamadı · ' + item.name, err);
  ballSay(id, item.name + (tx(' açılamadı: ', ' couldn’t be opened: ')) + err);
  return true;
}

function openUrlAction(id, url) {
  const d = desktop();
  if (!d.openExternalUrl) { ballSay(id, t('Bu sürümde URL açma desteklenmiyor.')); return true; }
  logInfo('Top: URL açılıyor · ' + url);
  return d.openExternalUrl(url).then((res) => {
    if (res && res.ok) { ballSay(id, 'Açıldı: ' + url); return true; }
    ballSay(id, 'Açılamadı: ' + url + ((res && res.error) ? ' · ' + res.error : ''));
    return true;
  }).catch((err) => { ballSay(id, 'Açılamadı: ' + url + ' · ' + ((err && err.message) || err)); return true; });
}

function runConfirmedCommand(id, act) {
  const d = desktop();
  const cmd = act.command || '';
  if (!cmd || !d.runShellCommand) { ballSay(id, 'Çalıştırılacak komut yok.'); return true; }
  ballSay(id, 'Çalıştırılıyor: ' + cmd + ' …');
  logInfo('Top: komut çalıştırılıyor · ' + cmd);
  return d.runShellCommand(cmd).then((res) => {
    if (res && res.ok) {
      const out = String(res.stdout || '').trim();
      ballSay(id, 'Komut tamam.' + (out ? '\n' + out.slice(0, 600) : ''));
      logInfo('Top: komut tamam · ' + cmd);
    } else {
      const e = String((res && (res.stderr || res.error)) || 'bilinmeyen hata');
      ballSay(id, 'Komut başarısız: ' + e.slice(0, 300));
      logWarn('Top: komut başarısız · ' + cmd + ' · ' + e);
    }
    return true;
  }).catch((err) => { ballSay(id, 'Komut başarısız: ' + ((err && err.message) || err)); return true; });
}

function proposeAction(id, act) {
  pendingAction = act;
  const label = act.action === 'run' ? (act.command || '') : (act.target || '');
  const verb = { open: 'açayım', close: 'kapatayım', run: 'çalıştırayım', selfclose: 'kendimi kapatsın' }[act.action] || 'yapayım';
  const head = act.say ? act.say + '\n\n' : '';
  ballSay(id, head + 'Şunu ' + verb + ': ' + label + '?\nEvet / Hayır yazın.');
  logInfo('Top: onay bekleyen eylem · ' + act.action + ' · ' + label);
  return true;
}

async function performAction(id, act) {
  if (!act) return false;
  if (act.needsConfirm && !act._confirmed) return proposeAction(id, act);
  switch (act.action) {
    case 'selfclose': {
      const d = desktop();
      ballSay(id, act.say || (tx('Kendimi kapatıyorum.', 'Closing myself.')));
      setTimeout(() => { try { d.ballReturn(); } catch {} }, 650);
      return true;
    }
    case 'run':
      return runConfirmedCommand(id, act);
    case 'open': {
      const item = matchAccess(act.target);
      if (item) return openRegistered(id, item);
      if (isUrl(act.target)) return openUrlAction(id, act.target);
      ballSay(id, act.say || notFoundMsg(act.target));
      return true;
    }
    case 'close': {
      const item = matchAccess(act.target);
      if (item && dHasClose(item)) {
        logInfo('Top: kapatılıyor · ' + item.name);
        const d = desktop();
        return d.closeShortcut(item.path).then((res) => {
          if (res && res.ok) { ballSay(id, item.name + (tx(' kapatıldı.', ' closed.'))); }
          else { ballSay(id, item.name + (tx(' kapatılamadı: ', ' couldn’t be closed: ')) + ((res && res.error) || 'unknown')); }
          return true;
        }).catch((err) => { ballSay(id, item.name + ' kapatılamadı: ' + ((err && err.message) || err)); return true; });
      }
      ballSay(id, act.say || notFoundMsg(act.target));
      return true;
    }
    default:
      return false;
  }
}

function dHasClose(item) { const d = desktop(); return item && item.kind !== 'folder' && !!(d && d.closeShortcut); }

/* Onay bekleyen eylemi "evet"/"hayır" ile çöz. */
async function resolvePendingAction(id, text) {
  const f = foldTr(text).replace(/[.!?,;]+$/g, '').trim();
  if (/^(evet|yes|onay|onayla|tamam|devam|yap|ok|peki)$/.test(f)) {
    const act = pendingAction; pendingAction = null;
    act._confirmed = true;
    logInfo('Top: eylem onaylandı · ' + act.action);
    return performAction(id, act);
  }
  if (/^(hayir|no|iptal|vazgec|cancel|yok|gerek yok)$/.test(f)) {
    pendingAction = null;
    ballSay(id, tx('Tamam, vazgeçtim.', 'Okay, cancelled.'));
    return true;
  }
  pendingAction = null;    // başka bir şey dedi: eylemi düşür, sohbete bırak
  return false;
}

/* Yapay zekâya güvenli bir eylem üretdir. */
async function generateAssistantAction(text) {
  const names = accessItems().map((x) => x.name);
  const extra = 'Kullanıcı masaüstünde bir komut verdi. Bu komutu yerine getirecek eylemi üret. ' +
    'Yalnızca geçerli bir JSON nesnesi döndür, başka hiçbir şey yazma. Şema: ' +
    '{"action":"open|close|run|selfclose|answer","target":"hedef","command":"komut","needsConfirm":true,"say":"kısa mesaj"}. ' +
    'action=open bir uygulama/klasör/URL açar; action=close kayıtlı bir uygulamayı kapatır; ' +
    'action=run bir komut çalıştırır (command alanına yazar; needsConfirm HER ZAMAN true); ' +
    'action=selfclose asistanın kendini kapatmasını sağlar; action=answer gerçek bir komut değilse sadece yanıtlar. ' +
    'needsConfirm: run için her zaman true; open/close hedefi kayıtlı listedeyse false, değilse (URL dahil) true. ' +
    'Kayıtlı erişim isimleri: ' + (names.length ? names.join(', ') : '(yok)') + '.';
  let acc = '';
  await streamReply([{ role: 'user', content: text }], (t0) => { acc += t0; }, undefined, extra);
  return parseActionJson(acc);
}

async function runAssistantAction(id, text) {
  let act = null;
  try { act = await generateAssistantAction(text); }
  catch (err) { logWarn('Top: eylem üretilemedi · ' + ((err && err.message) || err)); return false; }
  if (!act) return false;
  if (act.action === 'answer') { ballSay(id, act.say || (tx('Tamam.', 'Okay.'))); return true; }
  return performAction(id, act);
}

/* Uygulama açıldıktan sonra: ekran görüntüsü al, ne olduğuna bak ve
   uygulamanın içinde açılabilecek mantıklı bir şey varsa kullanıcıya öner. */
async function lookAfterOpen(id, item) {
  const d = desktop();
  if (!d || !d.captureScreen || !looksVisionModel(currentModel())) return false;
  await new Promise((r) => setTimeout(r, 750));           // uygulama açılsın
  let shot = null;
  try { shot = await d.captureScreen(item.name); }
  catch { shot = null; }
  if (!shot || !shot.ok || !shot.dataUrl) return false;
  ballStreamOnly(id, item.name + (tx(' açıldı. Ekrana bakıyorum…\n\n', ' opened. Looking at the screen…\n\n')));
  const extra = 'Bir masaüstü uygulaması açıldı ve ekran görüntüsü gönderiliyor. ' +
    'Yalnızca geçerli bir JSON nesnesi döndür: ' +
    '{"description":"ne görüldüğü ve ne yapılabileceği (1-2 cümle)","nextAction":{"action":"open","target":"...","needsConfirm":true,"say":"..."} veya null}. ' +
    'nextAction, uygulamanın içinde açılabilecek mantıklı ve güvenli bir şey (ör. bir URL) ise onu öner; emin değilsen null yaz.';
  let acc = '';
  try {
    await streamReply(
      [{ role: 'user', content: 'Bu ekran görüntüsünde ne görüyor?', images: [{ dataUrl: shot.dataUrl, mime: 'image/png' }] }],
      (t0) => { acc += t0; }, undefined, extra);
  } catch (err) {
    logWarn('Top: ekrana bakma başarısız · ' + ((err && err.message) || err));
    ballFinishOnly(id);
    return true;
  }
  const parsed = parseLookJson(acc);
  const desc = (parsed && parsed.description) || acc.trim() || (tx('Açık görünüyor.', 'Looks open.'));
  ballStreamOnly(id, desc);
  const nxt = parsed && parsed.nextAction;
  if (nxt && nxt.action === 'open' && nxt.target) {
    pendingAction = { action: 'open', target: nxt.target, needsConfirm: true, say: nxt.say || '' };
    ballStreamOnly(id, '\n\nŞunu da açayım mı: ' + nxt.target + '? (evet/hayır)');
  }
  d.ballFinish(id, '');
  logInfo('Top: ekrana bakıldı · ' + item.name);
  return true;
}

/* ======================================================================
   KAMERA — yaratıcı belleği, güvenlik uyarısı ve fotoğraflı giriş
   Kameradan alınan kare, bellekteki yaratıcı fotoğrafıyla görsel model
   üzerinden karşılaştırılır. Eşleşmezse kırmızı uyarı ve geri sayım başlar.
   ====================================================================== */
const CAM_DEFAULTS = {
  enabled: false, deviceId: '', creatorPhoto: '', captures: [], absences: [],
  alarm: true, countdown: 5, autoClose: true, idleMin: 10, permission: false
};
/* Kamera beta: açılmadan önce 3 saniyelik izin sorusu gösterilir. */
const CAM_PERMIT_SECS = 3;
const CAM_SHOT_LIMIT = 36;
const CAM_CAPTURE_MS = 30000;      // yaratıcı kontrolü 30 saniyede bir yapılır
const CAM_ABSENCE_MS = 60000;      // insan yokken en fazla 1 dakikada bir kare
const CAM_ABSENCE_LIMIT = 36;
const CAM_DIFF_MAX = 5;            // bu kadar farklı kareler “aynı” sayılır
const CAM_DIFF_SCOPE = 8;          // son kaç kayıtla karşılaştırılır
const CAM_IDLE_MIN = 10;           // boşta kameranın kapanma süresi (dakika)
const CAM_CAPTURE_MIN_LEN = 512;   // klasöre yalnızca gerçek kareler yazılır
const CAM_SHOT_THUMB = 260;
const CAM_CARD_LIMIT = 6;      // sohbette biriken tanıma kartı sayısı

function camSettings() {
  if (!settings.camera || typeof settings.camera !== 'object') settings.camera = {};
  for (const k of Object.keys(CAM_DEFAULTS)) {
    if (settings.camera[k] === undefined) {
      settings.camera[k] = (k === 'captures' || k === 'absences') ? [] : CAM_DEFAULTS[k];
    }
  }
  if (!Array.isArray(settings.camera.captures)) settings.camera.captures = [];
  if (!Array.isArray(settings.camera.absences)) settings.camera.absences = [];
  /* Uygulama yeniden açıldığında 1 dakikalık yokluk aralığı korunur. */
  if (!camLastAbsenceAt && settings.camera.absences.length) {
    camLastAbsenceAt = Number(settings.camera.absences[0].at) || 0;
  }
  /* Kaldırılan açılış girişi alanları eski kayıtlardan temizlenir. */
  ['gatePhoto', 'password', 'loginEnabled'].forEach((k) => { delete settings.camera[k]; });
  return settings.camera;
}

function camSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

let camDevices = [];
let camStream = null;
let camGuardStream = null;
let camGuardVideo = null;
let camMonitorTimer = null;
let camChecking = false;
let camAlarmTimer = null;
/* Son “yokluk” kaydı; uygulama yeniden açılsa da 1 dakikalık aralık korunur. */
let camLastAbsenceAt = 0;
/* Son tanıma durumu: ok = yaratıcı, bad = tanınmayan, '' = kimse yok. */
let camWho = '';
/* Son insan/hareket zamanı: kamera boşta kalınca kapanır. */
let camLastActivityAt = 0;
/* İzin sorusu: aynı anda yalnızca bir tane açılır. */
let camPermitAsk = null;      // { promise, resolve }
let camPermitTimer = null;
let camPermitTick = null;

/* Kamera yalnızca açık izin varsa kullanılabilir. */
function camAllowed() {
  return camSettings().permission === true;
}

function camSetTabVisible(show) {
  const tab = document.querySelector('.settings-tab[data-panel="kamera"]');
  if (tab) tab.hidden = !show;
}

/* Kamerayı ve bütün izleme işlerini durdurur. */
function camStopAll() {
  try { stopCamGuard(true); } catch { /* yok */ }
  try { closeCamStage(); } catch { /* yok */ }
}

/* İzin durumunu arayüze uygular: sekme yalnızca izinliyken görünür. */
function camApplyPermission() {
  const allowed = camAllowed();
  camSetTabVisible(allowed);
  if (!allowed) {
    camStopAll();
    const active = document.querySelector('.settings-tab.active');
    if ($('panelKamera')) $('panelKamera').hidden = true;
    if (active && active.dataset.panel === 'kamera') switchPanel('api');
  }
  renderCamGuardHint();
}

/* Geri sayım: büyük sayı + kalan süre cümlesi. */
function camPaintPermit(left) {
  const countEl = $('camPermitCount');
  if (countEl) countEl.textContent = String(Math.max(0, left));
  const hint = $('camPermitHint');
  if (hint) {
    hint.textContent = lang() !== 'tr'
      ? 'Without your answer the camera stays off. Time left: ' + Math.max(0, left) + ' s.'
      : 'Yanıt vermezseniz kamera açılmaz. Kalan süre: ' + Math.max(0, left) + ' sn.';
  }
}

/* İzin sorusu: 3 saniye içinde “İzin ver” denmezse kendiliğinden kapanır. */
function camAskPermission() {
  if (camAllowed()) return Promise.resolve(true);
  if (camPermitAsk) return camPermitAsk.promise;
  const box = $('camPermit');
  if (!box) return Promise.resolve(false);
  const countEl = $('camPermitCount');
  box.hidden = false;
  document.body.classList.add('cam-permit-on');
  applyLang();
  let left = CAM_PERMIT_SECS;
  camPaintPermit(left);
  if (camPermitTick) clearInterval(camPermitTick);
  camPermitTick = setInterval(() => {
    left -= 1;
    camPaintPermit(Math.max(0, left));
    if (left <= 0) camClosePermit(false);
  }, 1000);
  if (camPermitTimer) clearTimeout(camPermitTimer);
  camPermitTimer = setTimeout(() => camClosePermit(false), CAM_PERMIT_SECS * 1000);
  let resolveAsk;
  const promise = new Promise((resolve) => { resolveAsk = resolve; });
  camPermitAsk = { promise, resolve: resolveAsk };
  setTimeout(() => { const yes = $('camPermitYes'); if (yes) yes.focus(); }, 30);
  return promise;
}

function camClosePermit(allow) {
  const box = $('camPermit');
  if (box) box.hidden = true;
  document.body.classList.remove('cam-permit-on');
  if (camPermitTimer) { clearTimeout(camPermitTimer); camPermitTimer = null; }
  if (camPermitTick) { clearInterval(camPermitTick); camPermitTick = null; }
  const ask = camPermitAsk;
  camPermitAsk = null;
  if (!ask) return;
  if (allow) {
    const c = camSettings();
    c.permission = true;
    persist();
    camApplyPermission();
    logInfo('Kamera izni verildi');
    toast('Kamera izni verildi.');
  } else {
    logInfo('Kamera izni verilmedi');
  }
  ask.resolve(!!allow);
}

/* İzni geri al: kamera kapanır, izleme durur ve bölüm gizlenir. */
function camRevokePermission() {
  const c = camSettings();
  c.permission = false;
  c.enabled = false;
  persist();
  camStopAll();
  camSetTabVisible(false);
  if ($('panelKamera')) $('panelKamera').hidden = true;
  const active = document.querySelector('.settings-tab.active');
  if (active && active.dataset.panel === 'kamera') switchPanel('api');
  renderCamGuardHint();
  logInfo('Kamera izni geri alındı');
  toast('Kamera izni geri alındı.');
}

/* Kamera aygıtlarını listeler. ask=true ise önce izin istenir; etiketler
   ancak izinden sonra dolar. */
async function refreshCamDevices(ask) {
  const sel = $('camSelect');
  const status = $('camStatus');
  if (!sel) return;
  if (!camAllowed()) return;          // izin yoksa kamera listesi de istenmez
  if (!camSupported()) {
    sel.innerHTML = '<option value="">' + t('Kamera bulunamadı') + '</option>';
    sel.disabled = true;
    if (status) status.textContent = t('Bu ortamda kamera desteği yok.');
    return;
  }
  sel.disabled = false;
  if (ask) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((tr) => tr.stop());
    } catch (err) {
      logWarn('Kamera izni alınamadı: ' + ((err && err.message) || err));
    }
  }
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    camDevices = all.filter((d) => d.kind === 'videoinput');
  } catch (err) {
    camDevices = [];
    logWarn('Kameralar listelenemedi: ' + ((err && err.message) || err));
  }
  sel.innerHTML = '';
  const def = document.createElement('option');
  def.value = '';
  def.textContent = t('Varsayılan kamera');
  sel.appendChild(def);
  camDevices.forEach((d, i) => {
    const o = document.createElement('option');
    o.value = d.deviceId;
    o.textContent = d.label || (t('Kamera') + ' ' + (i + 1));
    sel.appendChild(o);
  });
  const c = camSettings();
  if (c.deviceId && !camDevices.some((d) => d.deviceId === c.deviceId)) c.deviceId = '';
  sel.value = c.deviceId || '';
  if (status) {
    if (!camDevices.length) status.textContent = t('Kamera bulunamadı. Cihazı bağlayıp yenileyin.');
    else if (!camDevices.some((d) => d.label)) status.textContent = t('Cihaz adları için kameraya izin verin (Yenile).');
    else status.textContent = (lang() !== 'tr'
      ? camDevices.length + ' camera(s) found.'
      : camDevices.length + ' kamera bulundu.');
  }
}

/* Kamera akışı iki yerde gösterilir: sol menüdeki küçük önizleme ve büyük
   görünüm penceresi. İkisi de aynı MediaStream'i paylaşır. */
function camVideos() {
  return ['camMiniVideo', 'camBigVideo'].map((id) => $(id)).filter(Boolean);
}

function camActiveVideo() {
  const big = $('camBigVideo');
  if (big && big.srcObject && big.videoWidth) return big;
  const mini = $('camMiniVideo');
  if (mini && mini.videoWidth) return mini;
  return big || mini || null;
}

/* Büyük görünümde kimin görüldüğünü yazar: eşleşen kişi “Yaratıcı” olur. */
function camSetWho(state) {
  const next = state === 'ok' || state === 'bad' ? state : '';
  const prev = camWho;
  camWho = next;
  const who = $('camBigWho');
  const sub = $('camStageSub');
  if (who) {
    who.hidden = !next;
    who.dataset.state = next;
  }
  const text = $('camBigWhoText');
  if (text) text.textContent = next === 'ok' ? t('Yaratıcı') : t('Tanınmayan kişi');
  if (sub) {
    sub.textContent = next === 'ok'
      ? t('Kamerası açık · Yaratıcı')
      : (next === 'bad' ? t('Kamerası açık · tanınmayan kişi') : t('Yapay zekâ kameradaki son kareye bakar.'));
  }
  /* Eşleşme yeni başladıysa sohbette bir kez duyurulur. */
  if (next === 'ok' && prev !== 'ok') camChatAppend('ai', t('Yaratıcı kamerada.'));
}

/* Kamera sohbetine kimin görüldüğünü söyler: eşleşen kişi “Yaratıcı”dır. */
function camWhoExtra() {
  if (camWho === 'ok') {
    return 'Kameradaki kişi, bellekteki yaratıcı fotoğrafıyla eşleşti: bu kişi Yaratıcı. ' +
      'Yanıtında bu kişiden bahsederken ona her zaman “Yaratıcı” de; “kişi”, “biri”, “şahıs” ya da “kullanıcı” deme. ' +
      'Kısa ve saygılı bir dille yanıtla.';
  }
  if (camWho === 'bad') {
    return 'Kameradaki kişi bellekteki yaratıcı fotoğrafıyla eşleşmedi: bu kişi tanınmıyor. ' +
      'Ondan “tanınmayan kişi” diye söz et; kimliği hakkında tahmin yürütme.';
  }
  return 'Kameradaki kişiyi kısaca ve saygılı bir dille anlat.';
}

function camTrackOn(flag) {
  ['camMiniDot', 'camBigLive'].forEach((id) => {
    const node = $(id);
    if (node) node.hidden = !flag;
  });
}

async function startCamPreview(deviceId) {
  if (!camSupported()) {
    toast('Bu ortamda kamera desteği yok.', true);
    return false;
  }
  /* İzin yoksa kamera hiç açılmaz: önce sorulur, 3 saniyede yanıt yoksa iptal. */
  if (!camAllowed()) {
    const ok = await camAskPermission();
    if (!ok) {
      renderCamGuardHint();
      return false;
    }
  }
  releaseCamStream();
  const c = camSettings();
  const id = deviceId != null ? deviceId : (c.deviceId || '');
  const constraints = {
    video: id ? { deviceId: { exact: id }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  };
  try {
    camStream = await navigator.mediaDevices.getUserMedia(constraints);
    camVideos().forEach((v) => {
      v.srcObject = camStream;
      v.hidden = false;
      v.play().catch(() => {});
    });
    const miniEmpty = $('camMiniEmpty');
    if (miniEmpty) miniEmpty.hidden = true;
    const bigEmpty = $('camBigEmpty');
    if (bigEmpty) bigEmpty.hidden = true;
    camTrackOn(true);
    c.enabled = true;
    persist();
    logInfo('Kamera açıldı' + (id ? ' · ' + id.slice(0, 10) : ''));
    return true;
  } catch (err) {
    toast('Kamera açılamadı: ' + ((err && err.message) || err), true);
    logWarn('Kamera açılamadı: ' + ((err && err.message) || err));
    return false;
  }
}

/* Akışı bırakır ama “kamera açık kalsın” tercihini değiştirmez. */
function releaseCamStream() {
  if (camStream) {
    camStream.getTracks().forEach((tr) => tr.stop());
    camStream = null;
  }
  camVideos().forEach((v) => { v.srcObject = null; v.hidden = true; });
  const miniEmpty = $('camMiniEmpty');
  if (miniEmpty) miniEmpty.hidden = false;
  const bigEmpty = $('camBigEmpty');
  if (bigEmpty) bigEmpty.hidden = false;
  camTrackOn(false);
  camSetWho('');
}

/* Kullanıcı kamerayı kapatınca tercih de kapanır. */
function stopCamPreview() {
  releaseCamStream();
  camSettings().enabled = false;
  persist();
}

/* Sol menüdeki Kamera düğmesi: büyük görünümü açar/kapatır. Kamera akışı
   kapatınca da sürer, böylece küçük önizleme görünmeye devam eder. */
async function openCamStage() {
  const modal = $('camStageModal');
  if (!modal) return;
  if (!camAllowed()) {
    const ok = await camAskPermission();
    if (!ok) {
      toast('Kamera izni verilmedi.', true);
      return;
    }
  }
  modal.hidden = false;
  document.body.classList.add('cam-stage-open');
  if (!camStream) await startCamPreview();
  const v = camActiveVideo();
  if (v && v.play) v.play().catch(() => {});
  /* Kamera açıkken yaratıcı kontrolü ve yokluk kaydı sürer. */
  if (camSettings().creatorPhoto) startCamGuard().catch(() => {});
  renderCamGuardHint();
}

function closeCamStage() {
  const modal = $('camStageModal');
  if (modal) modal.hidden = true;
  document.body.classList.remove('cam-stage-open');
}

async function toggleCamStage() {
  const modal = $('camStageModal');
  if (modal && !modal.hidden) closeCamStage();
  else await openCamStage();
}

/* Bir video karesini JPEG data URL'ine çevirir. Küçültme, belleğe ve API'ye
   giden görseli hafif tutar. */
function videoFrame(video, maxW) {
  if (!video || !video.videoWidth) return '';
  const w0 = video.videoWidth, h0 = video.videoHeight;
  const max = Math.max(160, Number(maxW) || 720);
  const scale = Math.min(1, max / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, w, h);
  try { return cv.toDataURL('image/jpeg', 0.82); } catch { return ''; }
}

/* ---------------- yaratıcı belleği ve şifre fotoğrafı ---------------- */
function camPhotoPreview(imgId, emptyId, clearId, dataUrl) {
  const img = $(imgId);
  const empty = $(emptyId);
  const clear = $(clearId);
  if (img) {
    if (dataUrl) { img.src = dataUrl; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; }
  }
  if (empty) empty.hidden = !!dataUrl;
  if (clear) clear.hidden = !dataUrl;
}

function setCamPhoto(dataUrl) {
  const value = String(dataUrl || '');
  camSettings().creatorPhoto = value;
  camPhotoPreview('camCreatorImg', 'camCreatorEmpty', 'camClearCreator', value);
  persist();
  renderCamGuardHint();
  if (!value) stopCamGuard();
  else if (camStream || camSettings().enabled) startCamGuard().catch(() => {});
  logInfo('Kamera: yaratıcı fotoğrafı ' + (value ? 'kaydedildi' : 'kaldırıldı'));
}

/* Kamera sohbetinde tanıma kartı: önce bulanık + yükleniyor, sonuç
   gelince yeşil (eşleşti) ya da kırmızı (tanınmadı) çerçeve. */
function camRecognitionCard(dataUrl, opts) {
  const box = $('camChat');
  const creatorPhoto = String((opts && opts.creatorPhoto) || '');
  const root = document.createElement('div');
  root.className = 'cam-msg cam-recognize';

  const frame = document.createElement('div');
  frame.className = 'cam-shot-frame';
  frame.dataset.state = 'loading';

  const img = document.createElement('img');
  img.className = 'cam-shot';
  img.alt = '';
  if (dataUrl) img.src = dataUrl;

  const spin = document.createElement('div');
  spin.className = 'cam-shot-spin';
  const ring = document.createElement('span');
  ring.className = 'cam-spinner';
  const spinText = document.createElement('b');
  spinText.textContent = t('Tanımlanıyor…');
  spin.appendChild(ring);
  spin.appendChild(spinText);

  const badge = document.createElement('span');
  badge.className = 'cam-shot-badge';

  const cap = document.createElement('p');
  cap.className = 'cam-shot-caption';
  cap.textContent = t('Kameradaki kişi bellekteki yaratıcıyla karşılaştırılıyor…');

  frame.appendChild(img);
  frame.appendChild(spin);
  frame.appendChild(badge);
  root.appendChild(frame);
  root.appendChild(cap);
  if (box) {
    box.appendChild(root);
    /* Uzun izlemede sohbet şişmesin: yalnızca son birkaç tanıma kartı kalır. */
    const cards = box.querySelectorAll('.cam-recognize');
    for (let i = 0; i < cards.length - CAM_CARD_LIMIT; i++) cards[i].remove();
    box.scrollTop = box.scrollHeight;
  }

  function state(next, badgeText, caption) {
    frame.dataset.state = next;
    badge.textContent = badgeText || '';
    cap.textContent = caption || '';
    if (box) box.scrollTop = box.scrollHeight;
  }

  return {
    root,
    setResult(same, reason) {
      if (same) {
        /* Eşleşince sohbette kameradan alınan kare değil, bellekte duran ve
           onaylanmış yaratıcı fotoğrafı yeşil ışıkla gösterilir. */
        if (creatorPhoto) img.src = creatorPhoto;
        state('ok', t('YARATICI'), t('Bellekteki onaylı yaratıcı fotoğrafı · eşleşti.'));
      } else {
        const extra = String(reason || '').trim();
        state('bad', t('TANINMADI'), extra
          ? t('Tanınmayan kişi: ') + extra
          : t('Bellekteki yaratıcıya benzemiyor.'));
      }
    },
    setError(message) {
      state('error', t('TANIMLANAMADI'), t('Tanımlanamadı: ') + String(message || ''));
    },
    remove() { root.remove(); }
  };
}

/* Kamerada kişi görülen kareler ayarlarda saklanır (en fazla 12). */
function camSaveCapture(dataUrl, same, hash) {
  const url = String(dataUrl || '');
  if (!url) return null;
  const c = camSettings();
  const at = Date.now();
  /* Hep aynı görünen kareler tekrar tekrar kaydedilmez. */
  if (camIsLookAlike(c.captures, hash)) return null;
  const item = { id: uid(), at, dataUrl: url, same: !!same, hash: String(hash || '') };
  camLastActivityAt = at;
  c.captures.unshift(item);
  if (c.captures.length > CAM_SHOT_LIMIT) c.captures.length = CAM_SHOT_LIMIT;
  persist();
  renderCamShots();
  /* Kare bilgisayarda bir klasöre de yazılır; kullanıcı oradan kopyalayabilir. */
  const d = desktop();
  if (url.length >= CAM_CAPTURE_MIN_LEN && d && typeof d.saveCameraCapture === 'function') {
    d.saveCameraCapture(url, { at, same: !!same })
      .then((res) => { if (res && res.ok) logInfo('Kamera yakalaması klasöre kaydedildi: ' + res.path); })
      .catch(() => {});
  }
  return item;
}

/* İnsan yokken alınan kareler “Yokluk” bölümünde saklanır. */
function camSaveAbsence(dataUrl, hash) {
  const url = String(dataUrl || '');
  if (!url) return null;
  const c = camSettings();
  const at = Date.now();
  if (at - camLastAbsenceAt < CAM_ABSENCE_MS) return null;
  camLastAbsenceAt = at;
  /* Değişmeyen boş oda her dakika tekrar kaydedilmez. */
  if (camIsLookAlike(c.absences, hash)) return null;
  const item = { id: uid(), at, dataUrl: url, hash: String(hash || '') };
  c.absences.unshift(item);
  if (c.absences.length > CAM_ABSENCE_LIMIT) c.absences.length = CAM_ABSENCE_LIMIT;
  persist();
  renderCamAbsences();
  const d = desktop();
  if (url.length >= CAM_CAPTURE_MIN_LEN && d && typeof d.saveCameraCapture === 'function') {
    d.saveCameraCapture(url, { at, same: false, kind: 'absence' })
      .then((res) => { if (res && res.ok) logInfo('Yokluk kaydı klasöre yazıldı: ' + res.path); })
      .catch(() => {});
  }
  return item;
}

function renderCamAbsences() {
  const box = $('camAbsences');
  if (!box) return;
  const list = camSettings().absences || [];
  box.innerHTML = '';
  list.forEach((item, i) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'cam-shot-item absence';
    node.dataset.index = String(i);
    node.title = new Date(item.at).toLocaleString() + ' · ' + t('insan yok');
    const img = document.createElement('img');
    img.src = item.dataUrl;
    img.alt = '';
    node.appendChild(img);
    const time = document.createElement('span');
    time.className = 'cam-shot-time';
    time.textContent = camStamp(item.at);
    node.appendChild(time);
    box.appendChild(node);
  });
  const empty = $('camAbsencesEmpty');
  if (empty) empty.hidden = list.length > 0;
  const clear = $('camAbsencesClear');
  if (clear) clear.hidden = list.length === 0;
  const all = $('camAbsencesAll');
  if (all) all.hidden = list.length === 0;
  const count = $('camAbsencesCount');
  if (count) count.textContent = String(list.length);
}

function clearCamAbsences() {
  camSettings().absences = [];
  camLastAbsenceAt = 0;
  persist();
  renderCamAbsences();
  logInfo('Kamera: yokluk kayıtları temizlendi');
}

function openCamAbsences(index) {
  const list = camSettings().absences || [];
  if (!list.length) return;
  const i = Math.min(Math.max(0, Number(index) || 0), list.length - 1);
  openLightbox(list.map((x) => ({
    thumb: x.dataUrl, full: x.dataUrl,
    title: new Date(x.at).toLocaleString() + ' · ' + t('insan yok')
  })), i);
}

/* Kareyi 9×8 gri tona indirip 64 bitlik fark özeti (dHash) üretir.
   Aynı sahnenin tekrar eden karelerini ayıklamak için kullanılır. */
function camPerceptualHash(video) {
  if (!video || !video.videoWidth) return '';
  const cv = document.createElement('canvas');
  cv.width = 9;
  cv.height = 8;
  const ctx = cv.getContext('2d');
  if (!ctx) return '';
  try {
    ctx.drawImage(video, 0, 0, 9, 8);
    const data = ctx.getImageData(0, 0, 9, 8).data;
    let bits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const i = (y * 9 + x) * 4;
        const j = (y * 9 + x + 1) * 4;
        const a = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const b = (data[j] + data[j + 1] + data[j + 2]) / 3;
        bits += a > b ? '1' : '0';
      }
    }
    let hex = '';
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch {
    return '';
  }
}

function camHashDiff(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    if (!Number.isFinite(x)) return 64;
    while (x) { diff += x & 1; x >>= 1; }
  }
  return diff;
}

/* Yeni kare son kayıtlardan birine benziyorsa kaydedilmez. */
function camIsLookAlike(list, hash) {
  if (!hash || !Array.isArray(list)) return false;
  const recent = list.slice(0, CAM_DIFF_SCOPE);
  return recent.some((item) => item && item.hash && camHashDiff(item.hash, hash) <= CAM_DIFF_MAX);
}

/* Yakalama zamanı: "19.10 14:32" biçiminde kısa tarih + saat. */
function camStamp(at) {
  const d = new Date(at);
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getDate()) + '.' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* Tüm yakalamaları tek lightbox'ta açar; index verilmezse baştan başlar. */
function openCamShots(index) {
  const list = camSettings().captures || [];
  if (!list.length) return;
  const i = Math.min(Math.max(0, Number(index) || 0), list.length - 1);
  openLightbox(list.map((x) => ({
    thumb: x.dataUrl, full: x.dataUrl,
    title: new Date(x.at).toLocaleString() + (x.same ? ' · ' + t('yaratıcı') : ' · ' + t('tanınmayan'))
  })), i);
}

/* Yakalama klasörünü işletim sisteminde açar. */
function openCamFolder(kind) {
  const absence = kind === 'absence';
  const d = desktop();
  if (!d || typeof d.openCameraCaptures !== 'function') {
    toast('Klasör yalnızca masaüstü uygulamasında açılır.', true);
    return;
  }
  d.openCameraCaptures(absence ? 'absence' : 'capture').then((res) => {
    if (res && res.ok) toast(absence ? 'Yokluk klasörü açıldı.' : 'Kamera yakalama klasörü açıldı.');
    else toast('Klasör açılamadı: ' + ((res && res.error) || ''), true);
  }).catch((err) => {
    toast('Klasör açılamadı: ' + ((err && err.message) || err), true);
  });
}

function renderCamShots() {
  const box = $('camShots');
  if (!box) return;
  const c = camSettings();
  const list = c.captures || [];
  box.innerHTML = '';
  list.forEach((item, i) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'cam-shot-item ' + (item.same ? 'ok' : 'bad');
    node.dataset.index = String(i);
    node.title = new Date(item.at).toLocaleString() + (item.same ? ' · ' + t('yaratıcı') : ' · ' + t('tanınmayan'));
    const img = document.createElement('img');
    img.src = item.dataUrl;
    img.alt = '';
    node.appendChild(img);
    const time = document.createElement('span');
    time.className = 'cam-shot-time';
    time.textContent = camStamp(item.at);
    node.appendChild(time);
    box.appendChild(node);
  });
  const empty = $('camShotsEmpty');
  if (empty) empty.hidden = list.length > 0;
  const clear = $('camShotsClear');
  if (clear) clear.hidden = list.length === 0;
  const all = $('camShotsAll');
  if (all) all.hidden = list.length === 0;
  const count = $('camShotsCount');
  if (count) count.textContent = String(list.length);
}

function clearCamShots() {
  camSettings().captures = [];
  persist();
  renderCamShots();
  logInfo('Kamera: kişi görüntüleri temizlendi');
}

/* Seçilen fotoğrafı en fazla 640 px'e küçültüp data URL döndürür. */
async function camFileToPhoto(file) {
  if (!file) return '';
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type || '')) {
    toast('Yalnızca JPG, PNG veya WebP seçin.', true);
    return '';
  }
  if (file.size > 8 * 1024 * 1024) {
    toast('Görsel en fazla 8 MB olabilir.', true);
    return '';
  }
  const raw = await readFileAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('decode'));
    i.src = raw;
  }).catch(() => null);
  if (!img) return '';
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return '';
  const max = 640;
  const scale = Math.min(1, max / Math.max(w, h));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w * scale));
  cv.height = Math.max(1, Math.round(h * scale));
  const ctx = cv.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.86);
}

function camFrameOrWarn() {
  const v = camActiveVideo();
  const frame = v && v.srcObject ? videoFrame(v, 640) : '';
  if (!frame) toast('Önce kamerayı açın.', true);
  return frame;
}

/* Kamera sekmesindeki ayarları forma yansıtır. */
function renderCameraSettings() {
  if (!$('panelKamera')) return;
  const c = camSettings();
  const sel = $('camSelect');
  if (sel) sel.value = c.deviceId || '';
  if ($('camAlarmOn')) $('camAlarmOn').checked = c.alarm !== false;
  if ($('camAutoClose')) $('camAutoClose').checked = c.autoClose !== false;
  if ($('camCountdown')) $('camCountdown').value = c.countdown || 5;
  if ($('camIdleMin')) $('camIdleMin').value = c.idleMin == null ? 10 : c.idleMin;
  camPhotoPreview('camCreatorImg', 'camCreatorEmpty', 'camClearCreator', c.creatorPhoto);
  /* Kamera açıkken ayarlardan kapatma düğmesi görünür. */
  const off = $('camShutdown');
  if (off) off.hidden = !camStream;
  const offHint = $('camShutdownHint');
  if (offHint) {
    offHint.textContent = camStream
      ? t('Kamera şu anda açık. “Kamerayı kapat” ile izlemeyi durdurabilirsiniz.')
      : t('Kamera kapalı. Yeniden açmak için sol menüdeki Kamera düğmesine basın.');
  }
  if (!camLastAbsenceAt && c.absences && c.absences.length) camLastAbsenceAt = c.absences[0].at || 0;
  renderCamShots();
  renderCamAbsences();
  renderCamGuardHint();
  refreshCamDevices(false);
}

function renderCamGuardHint() {
  const hint = $('camGuardHint');
  if (!hint) return;
  const c = camSettings();
  const parts = [];
  if (!c.creatorPhoto) parts.push(t('Önce yaratıcı fotoğrafını kaydedin.'));
  if (!looksVisionModel(currentModel())) parts.push(t('Görsel karşılaştırma için görsel destekli bir model seçin.'));
  if (!camStream) parts.push(t('İzleme için kamera açık olmalı.'));
  hint.textContent = parts.length
    ? parts.join(' ')
    : t('Hazır: kamera açıkken tanınmayan kişi algılanınca uyarı verilir.');
}

/* ---------------- kamera sohbeti ---------------- */
function camChatAppend(role, text) {
  const box = $('camChat');
  if (!box) return null;
  const node = document.createElement('div');
  node.className = 'cam-msg ' + (role === 'user' ? 'user' : 'ai');
  node.textContent = String(text || '');
  box.appendChild(node);
  box.scrollTop = box.scrollHeight;
  return node;
}

async function askCameraAi(text) {
  const q = String(text || '').trim() || t('Kameradaki kişiyi kısaca anlat.');
  const v = camActiveVideo();
  const frame = v && v.srcObject ? videoFrame(v, 720) : '';
  camChatAppend('user', q);
  const holder = camChatAppend('ai', '…');
  const images = frame ? [{ dataUrl: frame, mime: 'image/jpeg' }] : [];
  let acc = '';
  try {
    await streamReply([{ role: 'user', content: q, images }], (chunk) => {
      acc += chunk;
      if (holder) { holder.textContent = acc; $('camChat').scrollTop = $('camChat').scrollHeight; }
    }, undefined, camWhoExtra());
    if (!acc && holder) holder.textContent = t('Yanıt alınamadı.');
  } catch (err) {
    if (holder) holder.textContent = t('Hata: ') + ((err && err.message) || err);
    logWarn('Kamera sohbeti: ' + ((err && err.message) || err));
  }
}

/* ---------------- görsel karşılaştırma ---------------- */
function parseSamePersonJson(text) {
  const raw = String(text || '');
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const j = JSON.parse(m[0]);
      const same = typeof j.same === 'boolean' ? j.same : (typeof j.ayni === 'boolean' ? j.ayni : null);
      const person = typeof j.person === 'boolean' ? j.person : (typeof j.kisi === 'boolean' ? j.kisi : null);
      if (same !== null) return { same, reason: String(j.reason || j.aciklama || ''), person };
    } catch { /* aşağıdaki yedek */ }
  }
  const low = foldTr(raw);
  if (/ayni kisi|same person|evet ayni|esles|match/.test(low)) return { same: true, reason: '', person: null };
  if (/farkli|degisik|tanimiyorum|not the same|no match|uyusmuyor/.test(low)) return { same: false, reason: '', person: null };
  return null;
}

/* Bellekteki fotoğrafla yeni kareyi görsel modele karşılaştırır. Ağ/anahtar
   hatasında alarm tetiklenmez; yalnızca gerçek “farklı kişi” yanıtı sayılır. */
async function visionSamePerson(refDataUrl, frameDataUrl) {
  if (!refDataUrl || !frameDataUrl) return { ok: false, error: 'missing-image' };
  if (!looksVisionModel(currentModel())) return { ok: false, error: 'no-vision' };
  const prompt = 'İki fotoğraf gönderiliyor: birincisi bellekteki yaratıcı (onaylı referans), ikincisi kameradan gelen kare. ' +
    'Her zaman ikinci kareyi birinci fotoğraftaki yaratıcıyla karşılaştır. ' +
    'Önce ikinci fotoğrafta bir insan olup olmadığına bak; insan yoksa person=false yaz ve same=false yap. ' +
    'İnsan varsa yüz hatlarına ayrıntılı bak: yüz şekli ve oranları, gözler ve kaşlar, burun, ağız ve dudaklar, çene hattı, ' +
    'saç çizgisi ve saç rengi, ten tonu, sakal/bıyık, gözlük gibi ayırt edici özellikler. ' +
    'Poz, ışık, kamera açısı ve ifade farkını kişi farkıyla karıştırma; yalnızca yüz yapısı belirgin biçimde farklıysa same=false yaz. ' +
    'Kararsız kaldığın her durumda same=false kabul et (güvenli taraf). ' +
    'Yalnızca geçerli JSON döndür: {"person":true veya false,"same":true veya false,"reason":"kısa gerekçe"}. ' +
    'person=false ise same=false yaz.';
  let acc = '';
  try {
    await streamReply([{
      role: 'user', content: prompt,
      images: [{ dataUrl: refDataUrl, mime: 'image/jpeg' }, { dataUrl: frameDataUrl, mime: 'image/jpeg' }]
    }], (chunk) => { acc += chunk; }, undefined, 'Görsel kimlik karşılaştırması. Yalnızca JSON döndür.');
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
  const parsed = parseSamePersonJson(acc);
  if (!parsed) return { ok: false, error: 'parse' };
  return { ok: true, same: parsed.same, reason: parsed.reason, person: parsed.person };
}

/* ---------------- güvenlik izleme ---------------- */
async function startCamGuard() {
  const c = camSettings();
  stopCamGuard(false);
  /* Kamera izni yoksa hiçbir izleme, kayıt ya da kare alma yapılmaz. */
  if (!camAllowed()) { renderCamGuardHint(); return; }
  if (!c.creatorPhoto) { renderCamGuardHint(); return; }
  if (!camSupported()) return;
  if (!camStream) {
    const ok = await startCamPreview(c.deviceId || '');
    if (!ok) return;
  }
  camLastActivityAt = Date.now();
  if (!camGuardVideo) {
    camGuardVideo = document.createElement('video');
    camGuardVideo.muted = true;
    camGuardVideo.playsInline = true;
    camGuardVideo.autoplay = true;
    camGuardVideo.className = 'off-screen-cam';
    document.body.appendChild(camGuardVideo);
  }
  try {
    camGuardVideo.srcObject = camStream;
    if (!camGuardStream) camGuardStream = camStream;   // aynı akış paylaşılır
    await camGuardVideo.play().catch(() => {});
  } catch { /* kare alınamazsa tick sessizce geçer */ }
  camMonitorTimer = setInterval(camGuardTick, CAM_CAPTURE_MS);
  renderCamGuardHint();
  logInfo('Kamera: güvenlik izleme başladı');
}

function stopCamGuard(stopPreview) {
  if (camMonitorTimer) { clearInterval(camMonitorTimer); camMonitorTimer = null; }
  if (camGuardVideo) {
    camGuardVideo.srcObject = null;
    camGuardVideo.remove();
    camGuardVideo = null;
  }
  camGuardStream = null;
  if (stopPreview !== false) stopCamPreview();
  renderCamGuardHint();
}

async function camGuardTick() {
  if (camChecking) return;
  if (!camGuardVideo || !camGuardVideo.videoWidth) return;
  if (!document.getElementById('camAlarm').hidden) return;
  const c = camSettings();
  if (!c.creatorPhoto) return;
  const frame = videoFrame(camGuardVideo, 640);
  if (!frame) return;
  const thumb = videoFrame(camGuardVideo, CAM_SHOT_THUMB) || frame;
  const hash = camPerceptualHash(camGuardVideo);
  /* Kare sohbete önce bulanık + yükleniyor olarak düşer; karşılaştırma
     her yakalamada yalnızca bir kez yapılır (tek istek). */
  const card = camRecognitionCard(thumb, { creatorPhoto: c.creatorPhoto });
  camChecking = true;
  try {
    const res = await visionSamePerson(c.creatorPhoto, frame);
    if (!res.ok) {
      card.setError(res.error || 'error');
      camSetWho('');
      if (res.error === 'no-vision') stopCamGuard(false);
      return;
    }
    /* İnsan yoksa kart ve bulanıklık kaldırılır. Kare yalnızca “Yokluk”
       bölümüne, en fazla 1 dakikada bir yazılır; insan varken yokluk
       kaydı alınmaz. */
    if (res.person === false) {
      card.remove();
      camSetWho('');
      camSaveAbsence(frame, hash);
      camIdleCheck();
      return;
    }
    card.setResult(res.same, res.reason);
    camSetWho(res.same ? 'ok' : 'bad');
    camLastActivityAt = Date.now();
    camSaveCapture(thumb, res.same, hash);
    if (!res.same && c.alarm) {
      /* Kırmızı çerçeve önce görünsün, geri sayım bir an sonra başlasın. */
      setTimeout(() => triggerCamAlarm(res.reason), 1100);
    }
  } finally {
    camChecking = false;
  }
}

/* Kimse yoksa ve görüntü değişmiyorsa kamera boşta kapatılır. */
function camIdleCheck() {
  const mins = Math.max(0, Number(camSettings().idleMin) || 0);
  if (!mins || !camStream) return;
  if (Date.now() - camLastActivityAt < mins * 60000) return;
  logInfo('Kamera: ' + mins + ' dakika boşta kaldı, kapatıldı.');
  stopCamGuard(true);
  toast('Kamera boşta kapatıldı.', true);
}

/* Kırmızı uyarı: ekran yanıp söner, geri sayım biter ve uygulama kapanır. */
function triggerCamAlarm(reason) {
  const overlay = $('camAlarm');
  if (!overlay || !overlay.hidden) return;
  const c = camSettings();
  overlay.hidden = false;
  document.body.classList.add('cam-alarm-on');
  $('camAlarmSub').textContent = String(reason || '').trim() || t('Bellekteki yaratıcıya benzemeyen bir kişi algılandı.');
  let left = Math.max(1, Number(c.countdown) || 5);
  $('camAlarmCount').textContent = String(left);
  logInfo('Kamera: tanınmayan kişi algılandı · ' + (reason || 'gerekçe yok'));
  if (camAlarmTimer) clearInterval(camAlarmTimer);
  camAlarmTimer = setInterval(() => {
    left -= 1;
    $('camAlarmCount').textContent = String(Math.max(0, left));
    if (left > 0) return;
    clearInterval(camAlarmTimer);
    camAlarmTimer = null;
    if (c.autoClose !== false) quitAppNow();
    else closeCamAlarm();
  }, 1000);
}

function closeCamAlarm() {
  if (camAlarmTimer) { clearInterval(camAlarmTimer); camAlarmTimer = null; }
  const overlay = $('camAlarm');
  if (overlay) overlay.hidden = true;
  document.body.classList.remove('cam-alarm-on');
}

/* Kullanıcı “Ben yaratıcıyım” derse uyarı kapanır ve izleme 60 saniye
   duraklar; aksi hâlde aynı kişi için sürekli uyarı tekrarlanırdı. */
function camAlarmSnooze() {
  closeCamAlarm();
  if (camMonitorTimer) { clearInterval(camMonitorTimer); camMonitorTimer = null; }
  logInfo('Kamera: uyarı kullanıcı tarafından durduruldu, 60 sn duraklatıldı');
  setTimeout(() => {
    const c = camSettings();
    if (c.alarm && c.creatorPhoto) startCamGuard().catch(() => {});
  }, 60000);
}

function quitAppNow() {
  const d = desktop();
  if (d && typeof d.quitApp === 'function') {
    d.quitApp().catch(() => {});
    return;
  }
  try { window.close(); } catch { /* tarayıcı kapatmaya izin vermeyebilir */ }
}

/* ======================================================================
   MİKROFON — sesle yazma
   Seçilen mikrofon getUserMedia ile kaydedilir ve etkin sağlayıcıya
   yazıya döktürülür (Gemini / OpenAI / Groq). Whisper'a kutu doğrudan webm
   olarak gider (WAV'a çevirmek yalnızca Gemini için gerekir); bu, kayıt
   bittiği anda dönüşümü ortadan kaldırır.
   Mikrofon yalnızca mikrofon düğmesiyle açılır; bas-konuş tuşu kaldırıldı.
   TOP HÂLİ: mikrofon siz kapatana kadar açık kalır. Konuşma parçalara
   bölünür; 3 saniye boyunca ses gelmezse o parça yazıya çevrilip doğrudan
   soru olarak gönderilir, kayıt yeni parçayla sürer.
   ====================================================================== */
/* Mikrofon açık: konuşma Gemini ile yazıya çevrilir, konuşurken canlı
   görünür ve siz sustuğunuzda kendiliğinden gönderilir (onay gerekmez).
   Uygulama ve top aynı akışı kullanır. */

const VOICE_SILENCE_MS = 3000;       // bu kadar sessizlikte kendiliğinden gönder
const VOICE_MAX_SEGMENT_MS = 30000;  // uzun konuşmayı parçala
const VOICE_MIN_VOICED_MS = 320;     // ses sayılması için en az konuşma süresi
const VOICE_RMS = 0.02;              // sessizlik eşiği (0..1 RMS)
const VOICE_PARTIAL_MS = 950;        // canlı yazı: ara çeviri aralığı
const VOICE_PARTIAL_GEMINI_MS = 1500;// Gemini'de WAV dönüşümü yavaş: daha seyrek
const VOICE_PARTIAL_FIRST_MS = 900;  // ilk ara çeviri: kısa/bozuk metin yerine biraz bekle
const VOICE_SEND_RE = /(?:^|[\s,.;:!?…])(bitir|ilet|gönder|yolla|bitsin)\s*[.!?…]*$/;
let voiceState = 'idle';        // idle | listening | busy
let voiceStream = null;
let voiceSeg = null;            // etkin kayıt parçası
let voiceSegments = 0;
let voiceMonitor = 0;
let voiceCtx = null;
let voiceSrc = null;
let voiceAnalyser = null;
let voiceBuf = null;
let voiceQueue = Promise.resolve();
let voicePending = 0;
let voiceTimer = 0;
let voiceTarget = 'app';
let voiceContinuous = false;    // top: sessizlikte gönder, dinlemeyi sürdür
let voiceStopping = false;
let voiceAbort = false;         // iptal edilen parça yazıya çevrilip gönderilmesin
let voiceBaseText = '';         // uygulamada dikte öncesi yazılmış metin
let voiceHold = false;          // asistan sesli okurken mikrofon bekletilir
let voiceBargeTicks = 0;        // kullanıcı asistanın sözünü kesiyor mu
let micDevices = [];

function voiceSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

function sttProviderId() {
  if (sttGeminiInfo()) return 'gemini';
  const s = activeSlot();
  return s ? s.provider : (settings.provider || 'gemini');
}

/* Sesle yazma her zaman Gemini ile: etkin sağlayıcı ne olursa olsun hazır
   bir Gemini anahtarı varsa konuşma Gemini'ye gider — Gemini uygulamasıyla
   aynı dinleme ve yazıya çevirme kalitesi. */
function sttGeminiInfo() {
  const s = activeSlot();
  if (s && s.provider === 'gemini' && String(s.key || '').trim() && s.model) {
    return { key: String(s.key).trim(), model: s.model };
  }
  const key = geminiSpeechKey();
  return key ? { key, model: 'gemini-2.0-flash' } : null;
}

function sttReady() {
  if (sttGeminiInfo()) return true;
  const s = activeSlot();
  if (!s || !s.model) return false;
  const pid = s.provider;
  if (pid !== 'openai' && pid !== 'groq') return false;
  return !requiresKey(getProvider(pid)) || !!s.key;
}

function voiceHintText() {
  if (sttGeminiInfo()) {
    return lang() !== 'tr'
      ? 'Speech is transcribed with Gemini — the same listening and understanding as the Gemini app.'
      : 'Konuşma Gemini ile yazıya çevrilir — Gemini uygulamasıyla aynı dinleme ve anlama.';
  }
  const s = activeSlot();
  const pid = s ? s.provider : (settings.provider || 'gemini');
  if (!s || !s.model || (requiresKey(getProvider(pid)) && !s.key)) {
    return lang() !== 'tr'
      ? 'Voice input needs a Gemini, OpenAI or Groq key and model.'
      : 'Sesle yazma için Gemini, OpenAI ya da Groq anahtarı ve modeli gerekir.';
  }
  if (pid === 'openai' || pid === 'groq') {
    return lang() !== 'tr'
      ? 'Speech is transcribed with your selected provider: ' + providerName(getProvider(pid)) + '.'
      : 'Konuşma, seçili sağlayıcıyla yazıya çevrilir: ' + providerName(getProvider(pid)) + '.';
  }
  return lang() !== 'tr'
    ? 'This provider can’t transcribe speech; choose Gemini, OpenAI or Groq for voice input.'
    : 'Bu sağlayıcı konuşmayı yazıya çeviremiyor; sesle yazma için Gemini, OpenAI ya da Groq seçin.';
}

/* --------------------------- ayar arayüzü --------------------------- */
async function refreshMicDevices(ask) {
  const sel = $('micSelect');
  if (!sel) return;
  const status = $('micStatus');
  if (!voiceSupported()) {
    sel.innerHTML = '<option value="">' + t('Mikrofon bulunamadı') + '</option>';
    sel.disabled = true;
    if (status) status.textContent = t('Bu ortamda mikrofon desteği yok.');
    return;
  }
  sel.disabled = false;
  if (ask) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop());
    } catch (err) {
      logWarn('Mikrofon izni alınamadı: ' + ((err && err.message) || err));
    }
  }
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    micDevices = all.filter((d) => d.kind === 'audioinput');
  } catch (err) {
    micDevices = [];
    logWarn('Mikrofonlar listelenemedi: ' + ((err && err.message) || err));
  }
  sel.innerHTML = '';
  const def = document.createElement('option');
  def.value = '';
  def.textContent = t('Varsayılan mikrofon');
  sel.appendChild(def);
  micDevices.forEach((d, i) => {
    const o = document.createElement('option');
    o.value = d.deviceId;
    o.textContent = d.label || (t('Mikrofon') + ' ' + (i + 1));
    sel.appendChild(o);
  });
  if (settings.micDeviceId && !micDevices.some((d) => d.deviceId === settings.micDeviceId)) {
    settings.micDeviceId = '';
    persist();
  }
  sel.value = settings.micDeviceId || '';
  if (status) {
    if (!micDevices.length) status.textContent = t('Mikrofon bulunamadı. Cihazı bağlayıp yenileyin.');
    else if (!micDevices.some((d) => d.label)) status.textContent = t('Cihaz adları için mikrofona izin verin (Mikrofonları yenile).');
    else status.textContent = (lang() !== 'tr' ? micDevices.length + ' microphone(s) found.' : micDevices.length + ' mikrofon bulundu.');
  }
}

function renderVoiceSettings() {
  const hint = $('voiceSupport');
  if (hint) {
    hint.textContent = voiceSupported()
      ? voiceHintText()
      : t('Bu ortamda mikrofon desteği yok.');
  }
  if (hint) hint.style.color = sttReady() ? '' : 'var(--accent)';
}

/* --------------------------- kayıt --------------------------- */
function stopVoiceTracks() {
  if (voiceStream) {
    voiceStream.getTracks().forEach((tr) => { try { tr.stop(); } catch { /* yok */ } });
    voiceStream = null;
  }
}

function setVoiceUi(state) {
  const btn = $('micBtn');
  if (!btn) return;
  btn.classList.toggle('listening', state === 'listening');
  btn.classList.toggle('busy', state === 'busy');
  if (state === 'listening') {
    btn.title = t('Dinliyorum… konuşurken yazılır; durdurmak için tıkla');
    btn.setAttribute('aria-label', t('Dinliyorum…'));
  } else if (state === 'busy') {
    btn.title = t('Yazıya çevriliyor…');
    btn.setAttribute('aria-label', t('Yazıya çevriliyor…'));
  } else {
    btn.title = t('Sesle konuş (bas, konuş; sustuğunda kendiliğinden gönderilir)');
    btn.setAttribute('aria-label', t('Sesle yaz'));
  }
}

async function getMicStream() {
  const id = settings.micDeviceId;
  /* Konuşma için mono, gürültü bastırmalı ve otomatik kazançlı kayıt: STT
     doğruluğunu artırır. Cihaz bu ipuçlarını desteklemiyorsa tarayıcı yok sayar. */
  const audio = {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  };
  if (id) audio.deviceId = { exact: id };
  const constraints = { audio, video: false };
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (id) {
      logWarn('Seçili mikrofon açılamadı, varsayılana dönülüyor: ' + ((err && err.message) || err));
      return navigator.mediaDevices.getUserMedia({ audio: true });
    }
    throw err;
  }
}

function clearBallListening() {
  if (voiceTarget !== 'ball') return;
  const d = desktop();
  if (d && d.ballListen) d.ballListen(false);
}

function voiceMime() {
  const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  for (const m of mimes) {
    try { if (window.MediaRecorder.isTypeSupported(m)) return m; } catch { /* yok */ }
  }
  return '';
}

/* Ses düzeyi: top modunda 3 saniyelik sessizliği yakalamak için. */
function stopVoiceMeter() {
  clearInterval(voiceMonitor);
  voiceMonitor = 0;
  try { if (voiceSrc) voiceSrc.disconnect(); } catch { /* yok */ }
  try { if (voiceAnalyser) voiceAnalyser.disconnect(); } catch { /* yok */ }
  voiceSrc = null;
  voiceAnalyser = null;
  voiceBuf = null;
  if (voiceCtx) {
    try { voiceCtx.close(); } catch { /* yok */ }
    voiceCtx = null;
  }
}

function startVoiceMeter() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !voiceStream) return false;
  try {
    voiceCtx = new AC();
    voiceAnalyser = voiceCtx.createAnalyser();
    voiceAnalyser.fftSize = 1024;
    voiceAnalyser.smoothingTimeConstant = 0.25;
    voiceSrc = voiceCtx.createMediaStreamSource(voiceStream);
    voiceBuf = new Uint8Array(voiceAnalyser.fftSize);
    /* Grafik bir hedefe bağlanmazsa işlenmez: sıfır kazançla çıkışa bağla. */
    const mute = voiceCtx.createGain();
    mute.gain.value = 0;
    voiceSrc.connect(voiceAnalyser);
    voiceAnalyser.connect(mute);
    mute.connect(voiceCtx.destination);
    if (voiceCtx.state === 'suspended') voiceCtx.resume().catch(() => {});
  } catch (err) {
    logWarn('Ses düzeyi izlenemiyor: ' + ((err && err.message) || err));
    stopVoiceMeter();
    return false;
  }
  voiceMonitor = setInterval(voiceTick, 120);
  return true;
}

/* Türkçe harfleri bozmadan küçültür: "İLET" → "ilet", "GÖNDER" → "gönder". */
function trFold(text) {
  return String(text || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

/* Konuşma sonundaki "bitir / ilet / gönder" komutunu metinden ayırır.
   Komut tek başınaysa metin boş kalır; çağıran taraf boş mesaj göndermez. */
function stripVoiceCommand(input) {
  const original = String(input || '').trim();
  let text = original;
  let command = '';
  for (let i = 0; i < 3; i++) {
    const folded = trFold(text);
    const m = folded.match(VOICE_SEND_RE);
    if (!m) break;
    command = m[1];
    text = text.slice(0, m.index).trim()
      .replace(/[\s,;:.\-–—]+$/g, '')
      .replace(/\s+(ve|de|da)$/i, '')
      .trim();
  }
  return { text, command };
}

function requestBallCommit() {
  if (voiceTarget !== 'ball') return;
  const d = desktop();
  if (d && d.ballCommit) d.ballCommit();
}

function voiceShouldSend(seg, now) {
  if (!seg || !seg.hadSpeech) return false;
  if (seg.voicedMs < VOICE_MIN_VOICED_MS) return false;
  if (now - seg.lastSound >= VOICE_SILENCE_MS) return true;
  return now - seg.started >= VOICE_MAX_SEGMENT_MS;
}

/* Asistan sesli okurken mikrofon bekletilir: kendi sesini yazıya çevirmesin.
   Okuma bitince (ya da kullanıcı sözünü kesince) kayıt yeniden başlar; bu,
   Gemini'nin mikrofon modundaki kesintisiz sohbetin karşılığıdır. */
/* Söz kesme eşiği yüksek tutulur: hoparlörden gelen asistan sesi mikrofonca
   duyulduğunda okuma kendi kendine kesilmesin. 1 saniye boyunca gerçekten
   yüksek ses gerekir; okumanın ilk anı hiç sayılmaz. */
const VOICE_BARGE_RMS = 0.18;
const VOICE_BARGE_TICKS = 8;
let speechStartedAt = 0;

function holdVoiceForSpeech() {
  if (voiceState !== 'listening' || voiceHold) return;
  voiceHold = true;
  voiceBargeTicks = 0;
  speechStartedAt = Date.now();
  const seg = voiceSeg;
  voiceSeg = null;
  if (seg && seg.rec && seg.rec.state !== 'inactive') {
    seg.aborted = true;
    try { seg.rec.stop(); } catch { /* yok */ }
  }
  logInfo('Asistan konuşuyor: mikrofon bekletildi');
}

function releaseVoiceAfterSpeech() {
  if (!voiceHold) return;
  voiceHold = false;
  voiceBargeTicks = 0;
  if (voiceState === 'listening' && !voiceSeg) startSegment();
  logInfo('Asistan sustu: mikrofon yeniden dinliyor');
}

function voiceTick() {
  if (voiceState !== 'listening' || !voiceAnalyser || !voiceBuf) return;
  voiceAnalyser.getByteTimeDomainData(voiceBuf);
  let sum = 0;
  for (let i = 0; i < voiceBuf.length; i++) {
    const v = (voiceBuf[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / voiceBuf.length);
  /* Okuma sırasında mikrofon kaydetmez; yalnızca söz kesme dinlenir. */
  if (voiceHold) {
    if (speechActive) {
      const gecti = Date.now() - speechStartedAt;
      if (rms > VOICE_BARGE_RMS && gecti > 700) voiceBargeTicks += 1;
      else voiceBargeTicks = Math.max(0, voiceBargeTicks - 1);
      if (voiceBargeTicks >= VOICE_BARGE_TICKS) {
        logInfo('Kullanıcı asistanın sözünü kesti: okuma durduruluyor');
        stopSpeaking();
      }
    }
    return;
  }
  const seg = voiceSeg;
  if (!seg) return;
  const now = Date.now();
  if (rms > VOICE_RMS) {
    seg.lastSound = now;
    seg.hadSpeech = true;
    seg.voicedMs += 120;
  }
  if (!voiceContinuous) return;
  /* Konuşma sürerken metni ara ara yaz: mikrofon kapanmadan görünsün. */
  if (!voiceShouldSend(seg, now)) queueLivePartial(seg, now);
  if (voiceShouldSend(seg, now)) {
    logInfo('Sessizlik algılandı · metin gönderiliyor');
    finalizeSegment();
  }
}

/* Canlı yazı: o ana kadarki kaydı çevirip topa yollar (göndermez). */
function queueLivePartial(seg, now) {
  if (!seg || !seg.hadSpeech || seg.voicedMs < 260) return;
  if (seg.partialBusy) return;
  if (now - seg.lastSound > 1800) return;           // konuşma durmuş: final bekleniyor
  const gap = sttProviderId() === 'gemini' ? VOICE_PARTIAL_GEMINI_MS : VOICE_PARTIAL_MS;
  if (now - seg.lastPartialAt < gap) return;
  if (!seg.liveCount && now - seg.started < VOICE_PARTIAL_FIRST_MS) return;
  if (seg.voicedMs < (seg.liveCount ? 520 : 900)) return;
  if (!seg.chunks.length) return;
  const blob = new Blob(seg.chunks.slice(), { type: String(seg.mime || 'audio/webm').split(';')[0] });
  if (blob.size < 1200) return;
  const id = seg.id;
  seg.partialBusy = true;
  seg.lastPartialAt = now;
  transcribeLive(blob).then((text) => {
    const clean = String(text || '').trim();
    /* Parça değiştiyse ya da dinleme bittiyse eski ara sonucu göstermeyelim. */
    if (!clean || voiceState !== 'listening' || !voiceSeg || voiceSeg.id !== id) return;
    seg.liveCount += 1;
    seg.liveText = clean;
    const komut = stripVoiceCommand(clean);
    const d = desktop();
    if (komut.command) {
      /* "... bitir" / "... ilet": 3 saniye bekletmeden hemen gönder. */
      seg.sendText = komut.text;
      if (voiceTarget === 'ball') {
        if (d && d.ballPartial) d.ballPartial(komut.text || '');
        requestBallCommit();
      } else {
        showLiveVoiceText(komut.text);
      }
      logInfo('Sesli gönderme komutu algılandı: ' + komut.command);
      finalizeSegment();
      return;
    }
    if (voiceTarget === 'ball') {
      if (d && d.ballPartial) d.ballPartial(clean);
    } else {
      showLiveVoiceText(clean);
    }
  }).catch((err) => {
    logWarn('Canlı yazı alınamadı: ' + ((err && err.message) || err));
  }).finally(() => { seg.partialBusy = false; });
}

/* Tek bir konuşma parçasını kaydeder; `onDone` parça bitince çağrılır. */
function startSegment() {
  if (!voiceStream) return false;
  const seg = {
    id: ++voiceSegments,
    started: Date.now(),
    lastSound: Date.now(),
    voicedMs: 0,
    hadSpeech: false,
    rec: null,
    chunks: [],
    mime: '',
    lastPartialAt: 0,
    partialBusy: false,
    liveCount: 0,
    liveText: '',
    sendText: ''
  };
  const mime = voiceMime();
  seg.mime = mime || 'audio/webm';
  let rec = null;
  try {
    rec = new MediaRecorder(voiceStream, Object.assign({ audioBitsPerSecond: 128000 }, mime ? { mimeType: mime } : {}));
  } catch (err) {
    logError('Kayıt başlatılamadı', err);
    return false;
  }
  const chunks = [];
  rec.ondataavailable = (e) => {
    if (!e.data || !e.data.size) return;
    chunks.push(e.data);
    seg.chunks.push(e.data);
  };
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: String(rec.mimeType || mime || 'audio/webm').split(';')[0] });
    handleSegment(seg, blob);
  };
  try {
    /* Topta canlı yazı için kayıt sürerken parça parça veri gerekir. */
    if (voiceContinuous) rec.start(500);
    else rec.start();
  } catch (err) {
    logError('Kayıt başlatılamadı', err);
    return false;
  }
  seg.rec = rec;
  voiceSeg = seg;
  return true;
}

/* Sessizlik: parçayı bitir, hemen yeni parçaya başla (mikrofon açık kalır). */
function finalizeSegment() {
  const seg = voiceSeg;
  if (!seg || !seg.rec || seg.rec.state === 'inactive') return;
  voiceSeg = null;
  try { seg.rec.stop(); } catch { /* yok */ }
  if (voiceContinuous && voiceState === 'listening') startSegment();
}

function handleSegment(seg, blob) {
  /* İptal edilen parça (ör. topa geçiş, asistanın konuşması) ne yazılır ne
     gönderilir: kendi sesi ya da yarım kalan söz sohbete düşmez. */
  if (voiceAbort) { voiceAbort = false; return; }
  if (seg && seg.aborted) return;
  /* Her iki pencerede de yalnızca gerçekten konuşulmuş parça gönderilir
     (sessizlikte boş istek gitmez). Konuşma bitince metin kendiliğinden
     gönderilir: uygulamada sohbete, topta topun balonuna. */
  const dolu = !!(blob && blob.size > 800);
  const speech = voiceContinuous
    ? !!(dolu && seg && seg.hadSpeech && seg.voicedMs >= VOICE_MIN_VOICED_MS)
    : dolu;
  if (!speech) {
    maybeFinishStop();
    return;
  }
  /* Hem uygulamada hem topta: konuşma bitince metin kendiliğinden gönderilir. */
  const mode = 'send';
  enqueueVoice(blob, mode, mode === 'send' ? {
    stripCommand: true,
    fallbackText: (seg && (seg.sendText || seg.liveText)) || ''
  } : null);
  maybeFinishStop();
}

function enqueueVoice(blob, mode, opts) {
  voicePending += 1;
  voiceQueue = voiceQueue.then(async () => {
    try {
      const text = await transcribeVoice(blob);
      let clean = String(text || '').trim();
      if (mode === 'send' && opts && opts.stripCommand) {
        const komut = stripVoiceCommand(clean);
        if (komut.command) clean = komut.text;
        if (!clean && opts.fallbackText) {
          /* Final çeviri yalnızca komutu duyduysa canlı metne dön. */
          clean = stripVoiceCommand(opts.fallbackText).text;
        }
      }
      if (!clean) {
        logWarn(mode === 'send'
          ? 'Ses gönderilemedi: yalnızca komut duyuldu.'
          : 'Ses yazıya çevrildi ama boş çıktı.');
        if (mode === 'insert') toast('Ses anlaşılamadı, tekrar deneyin.', true);
        if (mode === 'send' && voiceTarget === 'ball') requestBallCommit();
        if (mode === 'send' && voiceTarget === 'app' && !voiceBaseText && $('input')) {
          $('input').value = ''; autoGrow();
        }
        return;
      }
      const d = desktop();
      if (mode === 'send') {
        if (voiceTarget === 'ball') {
          if (d && d.ballSay) d.ballSay(clean);
          requestBallCommit();
          logInfo('Ses gönderildi · ' + clean.length + ' karakter · top');
        } else {
          voiceSubmit(clean);
        }
      } else if (mode === 'ball') {
        if (d && d.ballDictate) d.ballDictate(clean);
        else insertVoiceText(clean);
        logInfo('Ses yazıya çevrildi · ' + clean.length + ' karakter · top');
      } else {
        insertVoiceText(clean);
        toast('Konuşma yazıya çevrildi.');
        logInfo('Ses yazıya çevrildi · ' + clean.length + ' karakter');
      }
    } catch (err) {
      logError('Ses yazıya çevrilemedi', err);
      if (mode === 'insert' || (mode === 'send' && voiceTarget === 'app')) {
        toast('Ses yazıya çevrilemedi: ' + ((err && err.message) || err), true);
      }
      if (voiceTarget === 'app' && !voiceBaseText && $('input')) {
        $('input').value = ''; autoGrow();
      }
    } finally {
      voicePending = Math.max(0, voicePending - 1);
      maybeFinishStop();
    }
  });
}

function maybeFinishStop() {
  if (!voiceStopping || voiceSeg || voicePending > 0) return;
  voiceStopping = false;
  voiceBaseText = '';
  voiceHold = false;
  voiceBargeTicks = 0;
  stopVoiceTracks();
  stopVoiceMeter();
  clearTimeout(voiceTimer);
  voiceState = 'idle';
  setVoiceUi('idle');
  document.body.classList.remove('listening');
}

async function startVoice(target) {
  if (voiceState !== 'idle') return false;
  voiceTarget = target === 'ball' ? 'ball' : 'app';
  /* İki pencerede de aynı akış: konuşurken canlı yazı, susunca kendiliğinden gönder. */
  voiceContinuous = true;
  voiceBaseText = voiceTarget === 'app' && $('input') ? String($('input').value || '').trim() : '';
  if (!voiceSupported()) { clearBallListening(); toast('Bu ortamda mikrofon desteği yok.', true); return false; }
  if (!sttReady()) { clearBallListening(); toast(voiceHintText(), true); return false; }
  voiceStopping = false;
  voicePending = 0;
  voiceHold = false;
  voiceBargeTicks = 0;
  try {
    voiceStream = await getMicStream();
  } catch (err) {
    clearBallListening();
    logError('Mikrofon açılamadı', err);
    toast('Mikrofon açılamadı: ' + ((err && err.message) || err), true);
    return false;
  }
  if (!startSegment()) {
    stopVoiceTracks();
    clearBallListening();
    toast('Kayıt başlatılamadı.', true);
    return false;
  }
  voiceState = 'listening';
  document.body.classList.add('listening');
  setVoiceUi('listening');
  if (voiceContinuous) startVoiceMeter();
  if (voiceTarget === 'ball') {
    const d = desktop();
    if (d && d.ballListen) d.ballListen(true);
  }
  clearTimeout(voiceTimer);
  logInfo('Mikrofon dinliyor' + (voiceTarget === 'ball' ? ' (top)' : '') +
    ' · konuşurken yazılır, 3 sn sessizlikte veya “bitir/ilet” ile gönderilir');
  return true;
}

/* Pencere değişirken (topa geçiş) mikrofon sessizce bırakılır: o anki parça
   yazıya çevrilmez, gönderilmez. */
function cancelVoice() {
  if (voiceState === 'idle') return;
  voiceStopping = false;
  voiceHold = false;
  voiceBargeTicks = 0;
  clearTimeout(voiceTimer);
  const seg = voiceSeg;
  voiceSeg = null;
  if (seg && seg.rec && seg.rec.state !== 'inactive') {
    voiceAbort = true;
    try { seg.rec.stop(); } catch { /* yok */ }
  }
  stopVoiceTracks();
  stopVoiceMeter();
  voiceState = 'idle';
  setVoiceUi('idle');
  document.body.classList.remove('listening');
  if (voiceTarget === 'ball') {
    const d = desktop();
    if (d && d.ballListen) d.ballListen(false);
  }
  voiceBaseText = '';
}

function stopVoice() {
  if (voiceState !== 'listening') return;
  voiceStopping = true;
  voiceHold = false;
  voiceState = 'busy';
  if (speechActive) stopSpeaking();
  clearTimeout(voiceTimer);
  clearInterval(voiceMonitor);
  voiceMonitor = 0;
  document.body.classList.remove('listening');
  setVoiceUi('busy');
  if (voiceTarget === 'ball') {
    const d = desktop();
    if (d && d.ballListen) d.ballListen(false);
  }
  const seg = voiceSeg;
  voiceSeg = null;
  if (seg && seg.rec && seg.rec.state !== 'inactive') {
    try { seg.rec.stop(); } catch { maybeFinishStop(); }
  } else {
    maybeFinishStop();
  }
}

function insertVoiceText(clean) {
  const el = $('input');
  if (!el) return;
  const cur = String(el.value || '').trim();
  el.value = cur ? cur + ' ' + clean : clean;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  try { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } catch { /* yok */ }
}

/* Uygulamada canlı yazı: konuşurken metin yazma kutusunda görünür.
   Dikte öncesi yazılmış metin korunur; yazılan kısım güncellenir. */
function showLiveVoiceText(text) {
  const el = $('input');
  if (!el) return;
  const clean = String(text || '').trim();
  el.value = voiceBaseText ? voiceBaseText + (clean ? ' ' + clean : '') : clean;
  autoGrow();
  try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* yok */ }
}

/* Yanıt sürerken sesli mesaj kaybolmasın: akış bitince gönderilir. */
function waitForVoiceIdle() {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (!streaming || Date.now() - t0 > 90000) resolve();
      else setTimeout(tick, 200);
    };
    tick();
  });
}

/* Sustuğunuzda konuşma kendiliğinden gönderilir: onay/send gerekmez. */
function voiceSubmit(clean) {
  const text = ((voiceBaseText ? voiceBaseText + ' ' : '') + String(clean || '')).trim();
  voiceBaseText = '';
  const el = $('input');
  if (el && el.value.trim() !== text) { el.value = ''; autoGrow(); }
  if (!text) return;
  logInfo('Sesli mesaj gönderiliyor · ' + text.length + ' karakter');
  waitForVoiceIdle().then(() => {
    const son = $('input');
    if (son && son.value.trim() === text) { son.value = ''; autoGrow(); }
    send(text);
  });
}

/* --------------------- kayıt → WAV → yazıya çevirme --------------------- */
async function wavFromBlob(blob) {
  const raw = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  let audio = null;
  try { audio = await ctx.decodeAudioData(raw.slice(0)); }
  finally { try { ctx.close(); } catch { /* yok */ } }
  if (!audio) throw new Error('Ses çözülemedi');
  const rate = 16000;
  const frames = Math.max(1, Math.ceil(audio.duration * rate));
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const off = new Offline(1, frames, rate);
  const src = off.createBufferSource();
  src.buffer = audio;
  src.connect(off.destination);
  src.start(0);
  const rendered = await off.startRendering();
  const pcm = rendered.getChannelData(0);
  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const write = (at, str) => { for (let i = 0; i < str.length; i++) view.setUint8(at + i, str.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); write(8, 'WAVE');
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  let at = 44;
  for (let i = 0; i < pcm.length; i++, at += 2) {
    const v = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(at, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || '').split(',')[1] || '');
    r.onerror = () => reject(r.error || new Error('Dosya okunamadı'));
    r.readAsDataURL(blob);
  });
}

async function sttHttpProblem(res) {
  let detail = '';
  try {
    const j = await res.json();
    detail = (j && j.error && (j.error.message || j.error)) || (j && j.message) || '';
  } catch {
    try { detail = String(await res.text()).slice(0, 180); } catch { /* yok */ }
  }
  return 'HTTP ' + res.status + (detail ? ' · ' + String(detail).slice(0, 180) : '');
}

/* Yazıya çevirmede dil adı: seçili dilin kendi adı istem içinde geçer. */
const STT_LANG_NAME = { tr: 'Turkish', en: 'English', de: 'German', ru: 'Russian', ja: 'Japanese' };

function sttPrompt() {
  const code = lang();
  if (code === 'tr') {
    return 'Konuşmayı kelimesi kelimesine yazıya çevir. Noktalama işaretlerini ve Türkçe karakterleri ' +
      '(ç, ğ, ı, İ, ö, ş, ü) doğru kullan. İsimleri ve sayıları olduğu gibi koru. Yalnızca metni yaz; ' +
      'açıklama, çeviri veya tahmin ekleme.';
  }
  return 'Transcribe the speech verbatim in ' + (STT_LANG_NAME[code] || 'English') +
    '. Use correct punctuation, spelling and capitalization. Keep names and numbers accurate. ' +
    'Return only the transcript, no comments.';
}

async function transcribeGemini(wav, key, model) {
  const s = activeSlot();
  const secili = model || (s && s.provider === 'gemini' && s.model) || '';
  if (!secili) throw new Error('Model seçili değil');
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: (lang() !== 'tr'
          ? 'Transcribe the speech in this audio exactly as spoken. Use correct punctuation and spelling. ' +
            'Output only the transcript, no comments. Language: ' + (STT_LANG_NAME[lang()] || 'English') + '.'
          : 'Bu ses kaydındaki konuşmayı kelimesi kelimesine, doğru noktalama ve Türkçe karakterlerle yaz. ' +
            'Yalnızca metni yaz; açıklama, çeviri veya tahmin ekleme. Sessizlikte boş yanıt ver. Dil: Türkçe.') },
        { inline_data: { mime_type: 'audio/wav', data: await blobToBase64(wav) } }
      ]
    }],
    generationConfig: { temperature: 0 }
  };
  const url = BASE_URLS.gemini + '/models/' + encodeURIComponent(secili) + ':generateContent?key=' + encodeURIComponent(key);
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await sttHttpProblem(res));
  const j = await res.json();
  const parts = ((((j.candidates || [])[0] || {}).content) || {}).parts || [];
  return parts.map((p) => p.text || '').join(' ').trim();
}

/* Whisper dosya adını kaydın gerçek türüne göre seçer. */
function voiceFileName(blob) {
  const type = String((blob && blob.type) || '').toLowerCase();
  if (type.includes('ogg')) return 'konusma.ogg';
  if (type.includes('mp4') || type.includes('m4a')) return 'konusma.m4a';
  if (type.includes('wav')) return 'konusma.wav';
  return 'konusma.webm';
}

function whisperRequest(blob, pid, key, model) {
  const form = new FormData();
  form.append('file', blob, voiceFileName(blob));
  form.append('model', model);
  form.append('language', lang());
  form.append('response_format', 'json');
  /* İstem, özel adları ve Türkçe karakterleri korur; kısa kayıtlarda
     modelin uydurmasını da azaltır. */
  form.append('prompt', sttPrompt());
  return fetch(BASE_URLS[pid] + '/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key },
    body: form
  });
}

/* Finalde doğruluk, canlı yazıda hız önceliklidir. Model hesapta yoksa
   sıradaki modele düşülür; aynı model her istekte yeniden denenmez. */
const STT_FINAL_MODELS = {
  openai: ['gpt-4o-transcribe', 'gpt-4o-mini-transcribe', 'whisper-1'],
  groq: ['whisper-large-v3', 'whisper-large-v3-turbo']
};
const STT_LIVE_MODELS = {
  openai: ['gpt-4o-mini-transcribe', 'whisper-1'],
  groq: ['whisper-large-v3-turbo', 'whisper-large-v3']
};
const sttBlocked = new Map();

function sttModelBlocked(pid, model) {
  const set = sttBlocked.get(pid);
  return !!(set && set.has(model));
}

function sttBlockModel(pid, model) {
  if (!sttBlocked.has(pid)) sttBlocked.set(pid, new Set());
  sttBlocked.get(pid).add(model);
}

async function transcribeWhisper(blob, pid, key, opts) {
  /* Kayıt doğrudan gönderilir: WAV'a çevirme/örnekleme adımı yok. */
  const live = !!(opts && opts.live);
  const chain = ((live ? STT_LIVE_MODELS : STT_FINAL_MODELS)[pid] || []).slice();
  let last = 'Model bulunamadı';
  let tried = 0;
  for (const model of chain) {
    if (sttModelBlocked(pid, model)) continue;
    tried += 1;
    const res = await whisperRequest(blob, pid, key, model);
    if (res.ok) {
      const j = await res.json();
      return String((j && j.text) || '').trim();
    }
    last = await sttHttpProblem(res);
    const modelProblem = res.status === 404 || res.status === 403 ||
      (res.status === 400 && /model|not found|does not exist|unsupported|desteklen/i.test(last));
    if (!modelProblem) throw new Error(last);
    sttBlockModel(pid, model);
    logWarn(model + ' kullanılamadı, sıradaki ses modeli deneniyor.');
  }
  if (!tried) throw new Error('Kullanılabilir ses modeli yok · ' + last);
  throw new Error(last);
}

/* Canlı yazı için ara çeviri: Gemini varsa her zaman Gemini. */
async function transcribeLive(blob) {
  const gem = sttGeminiInfo();
  if (gem) {
    const wav = await wavFromBlob(blob);
    return transcribeGemini(wav, gem.key, gem.model);
  }
  const s = activeSlot();
  if (!s) throw new Error('Anahtar ve model seçin');
  const pid = s.provider;
  if (!s.key && requiresKey(getProvider(pid))) throw new Error('Anahtar gerekli');
  if (pid === 'openai' || pid === 'groq') return transcribeWhisper(blob, pid, s.key, { live: true });
  throw new Error(lang() !== 'tr'
    ? 'This provider can’t transcribe speech. Choose Gemini, OpenAI or Groq.'
    : 'Bu sağlayıcı sesi yazıya çeviremiyor. Gemini, OpenAI ya da Groq seçin.');
}

async function transcribeVoice(blob) {
  const gem = sttGeminiInfo();
  if (gem) {
    const wav = await wavFromBlob(blob);
    return transcribeGemini(wav, gem.key, gem.model);
  }
  const s = activeSlot();
  if (!s) throw new Error('Anahtar ve model seçin');
  const pid = s.provider;
  if (!s.key && requiresKey(getProvider(pid))) throw new Error('Anahtar gerekli');
  if (pid === 'openai' || pid === 'groq') return transcribeWhisper(blob, pid, s.key, { live: false });
  throw new Error(lang() !== 'tr'
    ? 'This provider can’t transcribe speech. Choose Gemini, OpenAI or Groq.'
    : 'Bu sağlayıcı sesi yazıya çeviremiyor. Gemini, OpenAI ya da Groq seçin.');
}

/* --------------------------- giriş noktaları --------------------------- */
async function voiceToggle(target) {
  if (voiceState === 'listening') { stopVoice(); return; }
  if (voiceState === 'busy') return;
  await startVoice(target || 'app');
}

function bindVoice() {
  const d = desktop();
  if (!d) return;
  if (d.onVoiceToggle) d.onVoiceToggle((data) => {
    voiceToggle((data && data.target) || 'ball');
  });
  /* Topun selamı: sesli asistan açıksa sesli de okunur. */
  if (d.onBallSpeak) d.onBallSpeak((text) => { speakReply(String(text || '')); });
}

/* ======================================================================
   MASAÜSTÜ TOPU
   Yazı kutusunun solundaki gri top uygulamayı küçültür; top ayrı, saydam bir
   pencerede yaşar. Topa yazılanlar buraya gelir; yanıt ana uygulamadaki
   anahtar ve modelle üretilip topa geri akıtılır. Topun sohbeti ana sohbete
   karışmaz; hesabın kendi küçük geçmişinde saklanır.
   ====================================================================== */
const BALL_HISTORY_MAX = 12;
let ballHistory = [];
let ballJob = null;

function ballSystemPrompt() {
  const base = lang() !== 'tr'
    ? 'You are PRIME AI, living in a tiny ball on the desktop. Answer very briefly: at most 3 short sentences. ' +
      'No headings, lists or code blocks. Never end with filler lines like “continue in the app” or “sohbetleşmeye devam” — just answer.'
    : 'Sen masaüstünde küçük bir topta yaşayan PRIME AI\'sın. Çok kısa yanıt ver: en fazla 3 kısa cümle. ' +
      'Başlık, liste ve kod bloğu kullanma. Sözlerinin sonuna “uygulamada sohbete devam edebilirsin”, “devam edelim” '
      + 'ya da “tomum” gibi kapanış/dolgu cümleleri ekleme; doğrudan cevabı ver ve bitir.';
  return base;
}

function ballHistoryLoad() {
  const saved = load(ukey('ball'), []);
  ballHistory = (Array.isArray(saved) ? saved : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-BALL_HISTORY_MAX);
}

function ballHistorySave() {
  save(ukey('ball'), ballHistory.slice(-BALL_HISTORY_MAX));
}

/* ======================================================================
   ASİSTAN AYARLARI — uyku düzeni ve yüz tasarımı
   Masaüstü topu bunları açılışta alır: ne sıklıkla uyuyacağı, uyku süresi
   ve kullanacağı yüz. Yüz değerleri topa CSS değişkeni olarak uygulanır.
   ====================================================================== */
/* Hazır yüzler: “Ekstra yüzler” listesinde kullanıma sunulur. */
const ASSISTANT_FACES = [
  { key: 'varsayilan', tr: 'Varsayılan', en: 'Default',
    eyeSize: 1, eyeGap: 11, eyeR: 50, eyeColor: '#121418',
    mouthW: 15, mouthCurve: 8, mouthRound: false, mouthColor: '#121418' },
  { key: 'mutlu', tr: 'Mutlu', en: 'Happy',
    eyeSize: 0.9, eyeGap: 12, eyeR: 50, eyeColor: '#121418',
    mouthW: 19, mouthCurve: 11, mouthRound: false, mouthColor: '#121418' },
  { key: 'uykucu', tr: 'Uykucu', en: 'Sleepy',
    eyeSize: 0.55, eyeGap: 12, eyeR: 50, eyeColor: '#121418',
    mouthW: 9, mouthCurve: 5, mouthRound: false, mouthColor: '#121418' },
  { key: 'saskin', tr: 'Şaşkın', en: 'Surprised',
    eyeSize: 1.35, eyeGap: 13, eyeR: 50, eyeColor: '#121418',
    mouthW: 10, mouthCurve: 7, mouthRound: true, mouthColor: '#121418' },
  { key: 'kurnaz', tr: 'Kurnaz', en: 'Sly',
    eyeSize: 0.7, eyeGap: 11, eyeR: 50, eyeColor: '#121418',
    mouthW: 22, mouthCurve: 5, mouthRound: false, mouthColor: '#121418' },
  { key: 'robot', tr: 'Robot', en: 'Robot',
    eyeSize: 1, eyeGap: 13, eyeR: 15, eyeColor: '#2f68d8',
    mouthW: 16, mouthCurve: 2, mouthRound: false, mouthColor: '#2f68d8' }
];

const clampNum = (v, min, max, dflt) =>
  (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : dflt);

function assistantCfg() {
  if (!settings.assistant || typeof settings.assistant !== 'object') settings.assistant = {};
  const a = settings.assistant;
  if (a.sleepOn === undefined) a.sleepOn = true;
  if (a.sleepEvery === undefined) a.sleepEvery = 7;
  if (a.sleepLen === undefined) a.sleepLen = 60;
  if (!a.face) a.face = 'varsayilan';
  if (!Array.isArray(a.faces)) a.faces = [];
  if (!ASSISTANT_ACCS.some((x) => x.key === a.accessory)) a.accessory = 'yok';
  if (!a.voice || typeof a.voice !== 'object') a.voice = Object.assign({}, DEFAULT_SETTINGS.assistant.voice);
  if (a.voice.on === undefined) a.voice.on = false;
  /* Yedek Windows sesi, seçilen AI sesinin cinsiyetini izler: kadın ses
     seçilince kadın, erkek ses seçilince erkek okur. Karışık modlarda
     varsayılan kadındır. */
  const seciliSes = GEMINI_VOICES.find((g) => g.key === a.voice.gvoice);
  a.voice.gender = !seciliSes || seciliSes.gender === 'mix' ? 'kadin' : seciliSes.gender;
  /* Yalnızca yapay zekâ sesleri: sistem sesi motoru kaldırıldı. */
  a.voice.engine = 'gemini';
  if (!GEMINI_VOICES.some((g) => g.key === a.voice.gvoice)) a.voice.gvoice = 'mix';
  if (typeof a.voice.pick !== 'string') a.voice.pick = '';
  if (typeof a.voice.elevenKey !== 'string') a.voice.elevenKey = '';
  if (!ELEVEN_MODELS.some((m) => m.id === a.voice.elevenModel)) a.voice.elevenModel = 'eleven_flash_v2_5';
  if (!Array.isArray(a.voice.elevenVoices)) a.voice.elevenVoices = [];
  if (typeof a.voice.elevenVoice !== 'string') a.voice.elevenVoice = '';
  a.voice.pitch = clampNum(a.voice.pitch, 0.5, 1.8, 1.1);
  a.voice.rate = clampNum(a.voice.rate, 0.6, 1.6, 1);
  a.voice.volume = clampNum(a.voice.volume, 0.2, 1, 1);
  return a;
}

/* Top menüsüyle aynı aksesuar listesi (ayarlar sekmesinde de kullanılır). */
const ASSISTANT_ACCS = [
  { key: 'yok', tr: 'Yok', en: 'None', icon: '✕' },
  { key: 'gozluk', tr: 'Gözlük', en: 'Glasses', icon: '👓' },
  { key: 'kovboy', tr: 'Kovboy şapkası', en: 'Cowboy hat', icon: '🤠' },
  { key: 'sapka', tr: 'Şapka', en: 'Cap', icon: '🧢' },
  { key: 'maske', tr: 'Siyah gözlük', en: 'Black glasses', icon: '🕶️' },
  { key: 'tac', tr: 'Kral tacı', en: 'King crown', icon: '👑' },
  { key: 'agiz', tr: 'Ağız maskesi', en: 'Face mask', icon: '😷' }
];

/* Yüz değerlerini güvenli aralıklara sıkıştırır (ayarlar elle değişebilir). */
function normalizeFace(face) {
  const f = face || {};
  const col = (v, d) => (typeof v === 'string' && v.trim()) ? v.trim() : d;
  return {
    eyeSize: clampNum(f.eyeSize, 0.4, 1.6, 1),
    eyeGap: clampNum(f.eyeGap, 6, 18, 11),
    eyeR: clampNum(f.eyeR, 0, 50, 50),
    eyeColor: col(f.eyeColor, '#121418'),
    mouthW: clampNum(f.mouthW, 6, 24, 15),
    mouthCurve: clampNum(f.mouthCurve, 0, 14, 8),
    mouthRound: f.mouthRound === true,
    mouthColor: col(f.mouthColor, '#121418')
  };
}

/* Seçili yüz: hazır yüz ya da kullanıcının kaydettiği özel yüz. */
function assistantFace() {
  const a = assistantCfg();
  const key = String(a.face || 'varsayilan');
  const preset = ASSISTANT_FACES.find((f) => f.key === key);
  if (preset) return normalizeFace(preset);
  const custom = a.faces.find((c) => c && 'ozel:' + c.id === key);
  return normalizeFace(custom || ASSISTANT_FACES[0]);
}

/* Topa gönderilecek asistan ayarları. */
function assistantPayload() {
  const a = assistantCfg();
  return {
    sleepOn: a.sleepOn !== false,
    sleepEvery: clampNum(a.sleepEvery, 1, 120, 7),
    sleepLen: clampNum(a.sleepLen, 10, 600, 60),
    face: assistantFace(),
    accessory: a.accessory
  };
}

/* CSS rengi renk kutusu için #rrggbb biçimine getirir. */
function colorToHex(c) {
  const m = String(c == null ? '' : c).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    return '#' + [1, 2, 3].map((i) => Math.max(0, Math.min(255, Number(m[i]))).toString(16).padStart(2, '0')).join('');
  }
  return /^#[0-9a-f]{6}$/i.test(String(c || '').trim()) ? String(c).trim() : '#121418';
}

/* Yüz önizlemesi: topun çizimiyle aynı geometri, miniBoyutta. */
function paintFacePreview(elNode, face) {
  if (!elNode) return;
  const f = normalizeFace(face);
  const eyes = elNode.querySelectorAll('i');
  const mouth = elNode.querySelector('b');
  if (eyes.length < 2 || !mouth) return;
  const size = elNode.classList.contains('big') ? 76 : 44;
  const s = size / 64;
  const ew = 7 * s * f.eyeSize;
  const eh = 9 * s * f.eyeSize;
  const gap = f.eyeGap * s;
  for (let idx = 0; idx < 2; idx++) {
    const e = eyes[idx];
    e.style.width = ew.toFixed(2) + 'px';
    e.style.height = eh.toFixed(2) + 'px';
    e.style.borderRadius = f.eyeR + '%';
    e.style.background = f.eyeColor;
    e.style.top = (size / 2 - eh / 2 + s).toFixed(2) + 'px';
    e.style.left = (size / 2 + (idx === 0 ? -gap / 2 - ew / 2 : gap / 2 - ew / 2)).toFixed(2) + 'px';
  }
  const mw = f.mouthW * s;
  mouth.style.width = mw.toFixed(2) + 'px';
  mouth.style.left = (size / 2 - mw / 2).toFixed(2) + 'px';
  mouth.style.top = (42 * s).toFixed(2) + 'px';
  if (f.mouthRound) {
    mouth.style.height = (Math.max(4, f.mouthCurve) * s).toFixed(2) + 'px';
    mouth.style.background = f.mouthColor;
    mouth.style.border = '0';
    mouth.style.borderRadius = '50%';
  } else {
    mouth.style.height = '0px';
    mouth.style.background = 'transparent';
    mouth.style.border = '0';
    mouth.style.borderBottom = (f.mouthCurve * s).toFixed(2) + 'px solid ' + f.mouthColor;
    mouth.style.borderRadius = '0 0 12px 12px';
  }
}

let asstDraft = null;    // tasarımcıdaki yüz: kaydedilene kadar yalnızca bellekte

function assistantDraft() {
  if (!asstDraft) asstDraft = assistantFace();
  return asstDraft;
}

/* Tasarımcı okumaları tek bir yüz nesnesine dönüşür. */
function assistantReadDesigner() {
  return normalizeFace({
    eyeSize: Number(($('asstEyeSize') || {}).value),
    eyeGap: Number(($('asstEyeGap') || {}).value),
    eyeColor: ($('asstEyeColor') || {}).value,
    mouthW: Number(($('asstMouthW') || {}).value),
    mouthCurve: Number(($('asstMouthCurve') || {}).value),
    mouthColor: ($('asstMouthColor') || {}).value,
    mouthRound: !!($('asstMouthRound') || {}).checked
  });
}

function renderAssistantDesigner() {
  const f = assistantDraft();
  const put = (id, v) => { const e = $(id); if (e) e.value = String(v); };
  put('asstEyeSize', f.eyeSize);
  put('asstEyeGap', f.eyeGap);
  put('asstEyeColor', colorToHex(f.eyeColor));
  put('asstMouthW', f.mouthW);
  put('asstMouthCurve', f.mouthCurve);
  put('asstMouthColor', colorToHex(f.mouthColor));
  const round = $('asstMouthRound');
  if (round) round.checked = !!f.mouthRound;
  const val = (id, v) => { const e = $(id); if (e) e.textContent = String(v); };
  val('asstEyeSizeVal', f.eyeSize);
  val('asstEyeGapVal', f.eyeGap);
  val('asstMouthWVal', f.mouthW);
  val('asstMouthCurveVal', f.mouthCurve);
  paintFacePreview($('asstPreview'), f);
}

function renderAssistantFaces() {
  const box = $('asstFaces');
  if (!box) return;
  const a = assistantCfg();
  box.innerHTML = '';
  const add = (rec, key, custom) => {
    const activeNow = a.face === key;
    const card = el('div', 'asst-face-card' + (activeNow ? ' active' : ''));
    card.dataset.faceKey = key;
    card.setAttribute('aria-current', activeNow ? 'true' : 'false');
    const mini = el('span', 'asst-face-mini');
    mini.setAttribute('aria-hidden', 'true');
    mini.innerHTML = '<i></i><i></i><b></b>';
    const name = lang() !== 'tr' && rec.en ? rec.en : (rec.tr || rec.name || '');
    const info = el('span', 'asst-face-info');
    info.appendChild(el('strong', null, name));
    info.appendChild(el('small', 'asst-face-use', activeNow ? t('Kullanılıyor') : t('Kullan')));
    card.appendChild(mini);
    card.appendChild(info);
    if (custom) {
      const del = el('button', 'asst-face-del', '×');
      del.type = 'button';
      del.dataset.faceDel = rec.id;
      del.title = t('Sil');
      del.setAttribute('aria-label', t('Sil') + ': ' + name);
      card.appendChild(del);
    }
    box.appendChild(card);
    paintFacePreview(mini, rec);
  };
  ASSISTANT_FACES.forEach((f) => add(f, f.key, false));
  a.faces.forEach((c) => { if (c && c.id) add(c, 'ozel:' + c.id, true); });
}

function renderAssistantSettings() {
  const a = assistantCfg();
  if ($('asstSleepOn')) $('asstSleepOn').checked = a.sleepOn !== false;
  if ($('asstSleepEvery')) $('asstSleepEvery').value = clampNum(a.sleepEvery, 1, 120, 7);
  if ($('asstSleepLen')) $('asstSleepLen').value = clampNum(a.sleepLen, 10, 600, 60);
  asstDraft = null;               // taslak, aktif yüzden taze kurulur
  renderAssistantDesigner();
  renderAssistantFaces();
  renderAssistantAccs();
  renderAssistantVoice();
}

/* --------------------------- aksesuar seçimi --------------------------- */
function renderAssistantAccs() {
  const box = $('asstAccs');
  if (!box) return;
  const a = assistantCfg();
  box.innerHTML = '';
  for (const acc of ASSISTANT_ACCS) {
    const b = el('button', 'asst-acc-btn' + (a.accessory === acc.key ? ' active' : ''));
    b.type = 'button';
    b.dataset.accKey = acc.key;
    b.setAttribute('aria-pressed', a.accessory === acc.key ? 'true' : 'false');
    const em = el('span', 'asst-acc-emoji', acc.icon);
    em.setAttribute('aria-hidden', 'true');
    b.appendChild(em);
    b.appendChild(el('span', null, lang() !== 'tr' ? acc.en : acc.tr));
    box.appendChild(b);
  }
}

function assistantUseAcc(key) {
  const a = assistantCfg();
  a.accessory = ASSISTANT_ACCS.some((x) => x.key === key) ? key : 'yok';
  persist();
  renderAssistantAccs();
  logInfo('Asistan aksesuarı: ' + a.accessory);
}

/* ----------------------- sesli asistan (TTS) ----------------------- */
/* Yalnızca yapay zekâ sesleri (Gemini TTS) kullanılır: sistem sesi
   (SpeechSynthesis) ve onun ton/hız ayarları kaldırıldı. */

/* Gemini TTS sesleri: yalnızca **yeni** tınılar — kadın ve erkek birlikte.
   Eski sekiz ses (Puck/Charon/Fenrir/Orus/Kore/Leda/Aoede/Zephyr) kaldırıldı.
   “Karışık” her yanıtta başka bir ses seçer; kadın/erkek ayrı karışık modları da
   vardır. Böylece tek bir sese mahkûm kalmayız. */
const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_VOICES = [
  { key: 'mix', tr: 'Karışık · her yanıtta farklı ses', gender: 'mix' },
  { key: 'mix-kadin', tr: 'Karışık kadın sesleri · her yanıtta farklı kadın', gender: 'mix' },
  { key: 'mix-erkek', tr: 'Karışık erkek sesleri · her yanıtta farklı erkek', gender: 'mix' },
  { key: 'Callirrhoe', tr: 'Callirrhoe · kadın, rahat ve akıcı', gender: 'kadin' },
  { key: 'Autonoe', tr: 'Autonoe · kadın, parlak ve canlı', gender: 'kadin' },
  { key: 'Despina', tr: 'Despina · kadın, yumuşak ve akıcı', gender: 'kadin' },
  { key: 'Erinome', tr: 'Erinome · kadın, net ve berrak', gender: 'kadin' },
  { key: 'Laomedeia', tr: 'Laomedeia · kadın, neşeli', gender: 'kadin' },
  { key: 'Achernar', tr: 'Achernar · kadın, yumuşak ve sakin', gender: 'kadin' },
  { key: 'Gacrux', tr: 'Gacrux · kadın, olgun ve tok', gender: 'kadin' },
  { key: 'Pulcherrima', tr: 'Pulcherrima · kadın, girişken ve enerjik', gender: 'kadin' },
  { key: 'Vindemiatrix', tr: 'Vindemiatrix · kadın, nazik ve sıcak', gender: 'kadin' },
  { key: 'Sulafat', tr: 'Sulafat · kadın, sıcak ve samimi', gender: 'kadin' },
  { key: 'Enceladus', tr: 'Enceladus · erkek, nefesli ve yumuşak', gender: 'erkek' },
  { key: 'Iapetus', tr: 'Iapetus · erkek, net ve berrak', gender: 'erkek' },
  { key: 'Umbriel', tr: 'Umbriel · erkek, rahat ve akıcı', gender: 'erkek' },
  { key: 'Algieba', tr: 'Algieba · erkek, pürüzsüz', gender: 'erkek' },
  { key: 'Algenib', tr: 'Algenib · erkek, tok ve çakıllı', gender: 'erkek' },
  { key: 'Rasalgethi', tr: 'Rasalgethi · erkek, bilgilendirici', gender: 'erkek' },
  { key: 'Alnilam', tr: 'Alnilam · erkek, kararlı', gender: 'erkek' },
  { key: 'Schedar', tr: 'Schedar · erkek, dengeli', gender: 'erkek' },
  { key: 'Achird', tr: 'Achird · erkek, arkadaş canlısı', gender: 'erkek' },
  { key: 'Zubenelgenubi', tr: 'Zubenelgenubi · erkek, günlük ve rahat', gender: 'erkek' },
  { key: 'Sadachbia', tr: 'Sadachbia · erkek, canlı', gender: 'erkek' },
  { key: 'Sadaltager', tr: 'Sadaltager · erkek, bilgili', gender: 'erkek' }
];
const FEMALE_VOICES = GEMINI_VOICES.filter((v) => v.gender === 'kadin');
const MALE_VOICES = GEMINI_VOICES.filter((v) => v.gender === 'erkek');
const ALL_VOICES = FEMALE_VOICES.concat(MALE_VOICES);
let lastGeminiVoice = '';

function voiceLabel(key) {
  const v = GEMINI_VOICES.find((x) => x.key === key);
  if (!v) return 'Karışık';
  if (v.key === 'mix-kadin') return 'Karışık kadın';
  if (v.key === 'mix-erkek') return 'Karışık erkek';
  return v.key.startsWith('mix') ? 'Karışık' : v.key;
}

/* Seçilen tını; karışık modlarda her yanıtta başka bir ses (art arda aynı ses
   gelmez). Geçersiz/eski bir kayıt varsa karışığa düşülür. */
function geminiVoiceName(pref) {
  if (pref && !String(pref).startsWith('mix') && ALL_VOICES.some((v) => v.key === pref)) return pref;
  const taban = pref === 'mix-kadin' ? FEMALE_VOICES : pref === 'mix-erkek' ? MALE_VOICES : ALL_VOICES;
  let havuz = taban.filter((v) => v.key !== lastGeminiVoice);
  if (!havuz.length) havuz = taban.slice();
  const sec = havuz[Math.floor(Math.random() * havuz.length)] || taban[0];
  lastGeminiVoice = sec.key;
  return sec.key;
}

let ttsCtx = null;          // Gemini sesleri için Web Audio bağlamı
let ttsNode = null;         // çalan ses düğümü (durdurmak için)
let geminiTtsWarned = false;
let fallbackTtsWarned = false;
let speechActive = false;   // asistan şu anda sesli okuyor mu

/* Sesli okuma sürerken topun ağzı hareket etsin diye köprüye haber verilir.
   Top açık değilse sessizce geçilir. */
function notifyBallSpeaking(on) {
  const d = desktop();
  if (!d || !d.ballSpeaking) return;
  try { d.ballSpeaking(!!on); } catch { /* top yok */ }
}
let speakToken = 0;

/* Okunacak metni sadeleştir: emoji, biçim ve bağlantılar sesli okunmaz. */
function ttsCleanText(text) {
  return stripEmoji(String(text || ''))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>~\[\]()]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Ses kısa olsun: sohbet metni uzun olsa da seslendirme en fazla birkaç
   cümle okur; kesme noktası her zaman cümle sınırıdır. */
const TTS_SPEAK_MAX = 260;
/* Açıkça “sesli oku” denince yanıtın tamamına yakını okunur (en fazla 1200
   karakter); otomatik seslendirme kısa kalır. */
const TTS_READ_MAX = 1200;
function ttsShorten(text, max) {
  const sinir = Math.max(80, Number(max) || TTS_SPEAK_MAX);
  const s = String(text || '').trim();
  if (s.length <= sinir) return s;
  const cut = s.slice(0, sinir);
  /* Cümle sınırı: noktalamadan sonra büyük harf gelmeli — “5. cümle”deki
     numara noktaları cümle sanılmasın. */
  const sinirlar = [...cut.matchAll(/[.!?…]+ +/g)]
    .filter((m) => m.index > 60 && /^[A-ZÇĞİÖŞÜ]/.test(cut.slice(m.index + m[0].length)));
  const son = sinirlar[sinirlar.length - 1];
  return (son ? cut.slice(0, son.index + son[0].length) : cut.replace(/\s+\S*$/, '') + '…').trim();
}

/* ----------------------- ElevenLabs (öncelikli ses motoru) ----------------------- */
/* Ayarlar → Sesli asistan sesi bölümünden API anahtarı girilir. Anahtar varsa
   ses önce ElevenLabs’ten alınır; olmazsa Gemini, o da olmazsa Windows sesi. */
const ELEVEN_BASE = 'https://api.elevenlabs.io';
const ELEVEN_MODELS = [
  { id: 'eleven_flash_v2_5', tr: 'Flash v2.5 · en hızlı, Türkçe destekli' },
  { id: 'eleven_multilingual_v2', tr: 'Multilingual v2 · en tutarlı, uzun metin' }
];
let ttsAudio = null;        // ElevenLabs MP3 oynatıcısı (durdurmak için)
let elevenTtsWarned = false;

/* Anahtar girilmeden de görülebilsin diye hazır ses listesi: “Sesleri getir”
   ile hesabın kendi sesleri çekilir ve bu liste yerini alır. */
const ELEVEN_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', tr: 'Rachel · kadın, sakin ve doğal' },
  { id: 'EXAVITQu4vr4xnSDxMaL', tr: 'Bella · kadın, yumuşak' },
  { id: 'XB0fDUnXU5powFXNXPu6', tr: 'Charlotte · kadın, parlak' },
  { id: 'pNInz6obpgDQGcFmaJgB', tr: 'Adam · erkek, derin ve sakin' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', tr: 'Josh · erkek, net' },
  { id: 'pqHfZKP75CvOlQylNhV4', tr: 'Bill · erkek, olgun' }
];

function elevenKey() {
  const a = assistantCfg();
  return String(a.voice.elevenKey || '').trim();
}

/* Seçilen ElevenLabs sesi; kayıtta böyle bir id yoksa ilk hazır ses. */
function elevenVoiceId() {
  const a = assistantCfg().voice;
  const list = Array.isArray(a.elevenVoices) && a.elevenVoices.length ? a.elevenVoices : ELEVEN_VOICES;
  const sec = list.find((v) => v && v.id === a.elevenVoice) || list[0];
  return sec ? sec.id : ELEVEN_VOICES[0].id;
}

/* Seslendirme için Gemini anahtarı: etkin kayıt Gemini değilse ilk hazır
   Gemini kaydı kullanılır; anahtar yoksa null. */
function geminiSpeechKey() {
  const a = activeSlot();
  if (a && a.provider === 'gemini' && String(a.key || '').trim()) return String(a.key).trim();
  const s = slots().find((x) => x.provider === 'gemini' && slotReady(x)) ||
    slots().find((x) => x.provider === 'gemini' && String(x.key || '').trim());
  return s ? String(s.key).trim() : '';
}

function ttsContext() {
  if (!ttsCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ttsCtx = new AC(); } catch { return null; }
  }
  if (ttsCtx.state === 'suspended') { try { ttsCtx.resume().catch(() => {}); } catch { /* yok */ } }
  return ttsCtx;
}

function stopTtsAudio() {
  if (ttsAudio) {
    const a = ttsAudio;
    ttsAudio = null;
    try { a.pause(); } catch { /* yok */ }
    try { a.removeAttribute('src'); } catch { /* yok */ }
  }
  if (!ttsNode) return;
  const node = ttsNode;
  ttsNode = null;
  try { node.stop(); } catch { /* zaten bitmiş */ }
  try { node.disconnect(); } catch { /* yok */ }
}

/* Gemini'nin döndürdüğü 16-bit PCM'i (24 kHz mono) çalınabilir hale getirir. */
function pcm16ToFloat(b64) {
  const bin = atob(String(b64 || ''));
  const n = bin.length >> 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    if (v & 0x8000) v -= 0x10000;
    out[i] = v / 32768;
  }
  return out;
}

/* Gemini TTS ile oku: seçilen tınıda ses üretir, Web Audio ile çalar. */
async function geminiSpeak(text, token, opts) {
  const key = geminiSpeechKey();
  const clean = ttsCleanText(text);
  if (!key || !clean) return false;
  const v = assistantCfg().voice;
  const voice = geminiVoiceName(v.gvoice);
  const body = {
    contents: [{ parts: [{ text: ttsShorten(clean, opts && opts.full ? TTS_READ_MAX : TTS_SPEAK_MAX) }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
    }
  };
  const res = await fetch(BASE_URLS.gemini + '/models/' + GEMINI_TTS_MODEL +
    ':generateContent?key=' + encodeURIComponent(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await httpError(res));
  const data = await res.json();
  const parts = ((((data.candidates || [])[0] || {}).content || {}).parts) || [];
  const withAudio = parts.find((p) => p && (p.inlineData || p.inline_data));
  const inline = withAudio && (withAudio.inlineData || withAudio.inline_data);
  const b64 = inline && (inline.data || inline.bytes);
  if (!b64) throw new Error('Ses verisi gelmedi.');
  const mime = String(inline.mimeType || inline.mime_type || 'audio/L16;codec=pcm;rate=24000');
  const rate = Number((mime.match(/rate=(\d+)/) || [])[1]) || 24000;
  const pcm = pcm16ToFloat(b64);
  if (!pcm.length) throw new Error('Ses boş geldi.');
  const ctx = ttsContext();
  if (!ctx) throw new Error('Ses aygıtı açılamadı.');
  stopTtsAudio();
  const buffer = ctx.createBuffer(1, pcm.length, rate);
  buffer.copyToChannel(pcm, 0);
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = clampNum(v.volume, 0.2, 1, 1);
  node.connect(gain);
  gain.connect(ctx.destination);
  ttsNode = node;
  node.onended = () => {
    if (ttsNode === node) ttsNode = null;
    speechDone(token);
  };
  node.start();
  return true;
}

/* ElevenLabs ile oku: anahtar girilmişse seçilen sesle MP3 alınıp <audio>
   ile çalan ses — Gemini ses motorundan bağımsızdır. */
async function elevenSpeak(text, token, opts) {
  const key = elevenKey();
  const clean = ttsCleanText(text);
  if (!key || !clean) return false;
  const v = assistantCfg().voice;
  const res = await fetch(ELEVEN_BASE + '/v1/text-to-speech/' + encodeURIComponent(elevenVoiceId()) +
    '?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: ttsShorten(clean, opts && opts.full ? TTS_READ_MAX : TTS_SPEAK_MAX),
      model_id: v.elevenModel || 'eleven_flash_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    })
  });
  if (!res.ok) throw new Error(await httpError(res));
  const blob = await res.blob();
  if (!blob || !blob.size) throw new Error('Ses verisi gelmedi.');
  stopTtsAudio();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  ttsAudio = audio;
  const temizle = () => {
    if (ttsAudio === audio) ttsAudio = null;
    try { URL.revokeObjectURL(url); } catch { /* yok */ }
  };
  return new Promise((resolve, reject) => {
    let bitti = false;
    const hata = (e) => { if (bitti) return; bitti = true; temizle(); reject(e); };
    audio.onended = () => { if (bitti) return; bitti = true; temizle(); speechDone(token); resolve(true); };
    audio.onerror = () => hata(new Error('Ses çalınamadı.'));
    audio.play().catch((err) => hata(new Error('Ses çalınamadı: ' + ((err && err.message) || err))));
  });
}

/* Okuma bitti (ya da kesildi): ağız durur, mikrofon yeniden dinlemeye döner. */
function speechDone(token) {
  if (token !== speakToken) return;      // eski bir okumanın olayı
  speechActive = false;
  speechStartedAt = 0;
  speakingMsgId = '';
  notifyBallSpeaking(false);
  releaseVoiceAfterSpeech();
  updateMessageActions();
}

/* Windows'un kendi konuşma sesiyle oku: Gemini kotası dolduğunda yedek. */
function systemSpeak(text, token, opts) {
  const d = desktop();
  const a = assistantCfg();
  const metin = ttsShorten(ttsCleanText(text), opts && opts.full ? TTS_READ_MAX : TTS_SPEAK_MAX);
  if (!d || !d.systemSpeak || !metin) { speechDone(token); return; }
  d.systemSpeak({
    text: metin,
    volume: a.voice.volume,
    rate: a.voice.rate,
    gender: a.voice.gender
  }).then((res) => {
    if (!res || !res.ok) {
      logWarn('Yedek seslendirme başarısız: ' + ((res && res.error) || 'bilinmeyen hata'));
      if (!fallbackTtsWarned) {
        fallbackTtsWarned = true;
        toast(t('Seslendirme şu an çalışmıyor. Ayarlar → Sesli asistan sesi bölümünden sesi deneyin.'), true);
      }
      return;
    }
    logInfo('Yanıt Windows sesiyle okundu · ' + (res.voice || 'varsayılan ses'));
  }).catch((err) => {
    logWarn('Yedek seslendirme hatası: ' + ((err && err.message) || err));
  }).finally(() => speechDone(token));
}

/* Metin seslendirilir: önce Gemini (yapay zekâ sesleri), olmazsa Windows sesi.
   Böylece kota/İnternet sorunu yüzünden asistan sessiz kalmaz. */
/* force: “sesli oku” düğmesi kendi başına çalışır; otomatik seslendirme
   kapalı olsa bile okur. full: uzun sohbet yanıtını kısaltmadan okur. */
function speakReply(text, opts) {
  const a = assistantCfg();
  if (!(opts && opts.force)) {      // otomatik okuma: mesaja bağlı düğme durumu sıfırlanır
    speakingMsgId = '';
    updateMessageActions();
  }
  if (!a.voice.on && !(opts && opts.force)) return false;
  const clean = ttsCleanText(text);
  if (!clean) return false;
  stopTtsAudio();
  const token = speakToken = speakToken + 1;
  speechActive = true;
  speechStartedAt = Date.now();
  notifyBallSpeaking(true);
  holdVoiceForSpeech();
  const yedek = () => {
    if (token !== speakToken) return;
    systemSpeak(text, token, opts);
  };
  /* Gemini ses motoru: anahtar yoksa doğrudan Windows sesine düşülür. */
  const geminiIle = () => {
    if (token !== speakToken) return;
    if (!geminiSpeechKey()) {
      if (!geminiTtsWarned) {
        geminiTtsWarned = true;
        logInfo('Gemini anahtarı yok: seslendirme Windows sesiyle yapılıyor.');
      }
      yedek();
      return;
    }
    geminiSpeak(text, token, opts).catch((err) => {
      logWarn('AI seslendirme başarısız: ' + ((err && err.message) || err));
      if (!geminiTtsWarned) {
        geminiTtsWarned = true;
        toast(t('AI ses kotası doldu; yanıtlar şimdilik Windows sesiyle okunuyor.'), true);
      }
      yedek();
    });
  };
  /* Öncelik: ElevenLabs anahtarı girilmişse ses oradan alınır; olmazsa
     Gemini, o da olmazsa Windows sesi — asistan sessiz kalmaz. */
  if (elevenKey()) {
    elevenSpeak(text, token, opts).catch((err) => {
      logWarn('ElevenLabs seslendirme başarısız: ' + ((err && err.message) || err));
      if (!elevenTtsWarned) {
        elevenTtsWarned = true;
        toast(t('ElevenLabs sesi üretilemedi; ses Gemini ile denenecek.'), true);
      }
      geminiIle();
    });
    return true;
  }
  geminiIle();
  return true;
}

function stopSpeaking() {
  speakToken += 1;                 // eski okumanın olayları artık geçersiz
  speechActive = false;
  speechStartedAt = 0;
  speakingMsgId = '';
  stopTtsAudio();
  const d = desktop();
  if (d && d.systemSpeakStop) { try { d.systemSpeakStop(); } catch { /* yok */ } }
  notifyBallSpeaking(false);
  releaseVoiceAfterSpeech();
  updateMessageActions();
}

function renderAssistantVoice() {
  const a = assistantCfg();
  if ($('asstVoiceOn')) $('asstVoiceOn').checked = a.voice.on === true;
  if ($('asstElevenKey')) $('asstElevenKey').value = a.voice.elevenKey || '';
  if ($('asstElevenModel')) $('asstElevenModel').value = a.voice.elevenModel;
  if ($('asstElevenVoice')) {
    const sel = $('asstElevenVoice');
    const list = Array.isArray(a.voice.elevenVoices) && a.voice.elevenVoices.length ? a.voice.elevenVoices : ELEVEN_VOICES;
    sel.innerHTML = '';
    for (const v of list) {
      const o = el('option', null, v.tr || v.name || v.id);
      o.value = v.id;
      sel.appendChild(o);
    }
    if (!list.some((v) => v.id === a.voice.elevenVoice)) a.voice.elevenVoice = list[0] ? list[0].id : '';
    sel.value = a.voice.elevenVoice;
    sel.onchange = () => {
      assistantCfg().voice.elevenVoice = sel.value;
      persist();
      stopSpeaking();
      renderAssistantVoice();
    };
  }
  if ($('asstElevenStatus')) {
    const s = $('asstElevenStatus');
    const sesAdi = () => {
      const list = Array.isArray(a.voice.elevenVoices) && a.voice.elevenVoices.length ? a.voice.elevenVoices : ELEVEN_VOICES;
      const sec = list.find((v) => v && v.id === a.voice.elevenVoice);
      return sec ? (sec.tr || sec.name || '') : '';
    };
    s.textContent = a.voice.elevenKey
      ? (sesAdi() ? '· ' + sesAdi() : '· hazır')
      : '· anahtar yok; ses Gemini sesleriyle okunur';
  }
  const gSel = $('asstVoiceGemini');
  if (gSel) {
    if (!gSel.options.length) {
      const gruplar = [
        { ad: t('Karışık sesler'), list: GEMINI_VOICES.filter((v) => v.gender === 'mix') },
        { ad: t('Kadın sesler'), list: FEMALE_VOICES },
        { ad: t('Erkek sesler'), list: MALE_VOICES }
      ];
      for (const g of gruplar) {
        const og = document.createElement('optgroup');
        og.label = g.ad;
        for (const gv of g.list) {
          const o = el('option', null, gv.tr);
          o.value = gv.key;
          og.appendChild(o);
        }
        gSel.appendChild(og);
      }
    }
    gSel.value = a.voice.gvoice;
  }
  const gStatus = $('asstGeminiStatus');
  if (gStatus) {
    const gv = GEMINI_VOICES.find((x) => x.key === a.voice.gvoice) || GEMINI_VOICES[0];
    gStatus.textContent = gv.tr + (geminiSpeechKey()
      ? ' · Gemini anahtarı hazır'
      : ' · Gemini anahtarı yok; yanıtlar Windows’un kadın sesiyle okunur.');
  }
}

function assistantUseFace(key) {
  const a = assistantCfg();
  a.face = String(key || 'varsayilan');
  asstDraft = null;
  persist();
  renderAssistantSettings();
}

/* ElevenLabs ses listesini hesaptan çeker ve seçiciye koyar.
   Anahtar yoksa ses listesi hazır seslerle kalır. */
async function fetchElevenVoices() {
  const key = elevenKey();
  const st = $('asstElevenStatus');
  if (!key) { toast(t('Önce ElevenLabs API anahtarını girin.'), true); return; }
  if (st) st.textContent = '· sesler getiriliyor…';
  try {
    const res = await fetch(ELEVEN_BASE + '/v2/voices', { headers: { 'xi-api-key': key } });
    if (!res.ok) throw new Error(await httpError(res));
    const data = await res.json();
    const list = (Array.isArray(data.voices) ? data.voices : [])
      .map((v) => ({ id: String(v.voice_id || v.voiceId || ''), name: String(v.name || '').trim() }))
      .filter((v) => v.id && v.name)
      .slice(0, 80);
    if (!list.length) throw new Error('Hesapta ses bulunamadı.');
    const a = assistantCfg();
    a.voice.elevenVoices = list;
    if (!list.some((v) => v.id === a.voice.elevenVoice)) a.voice.elevenVoice = list[0].id;
    persist();
    renderAssistantVoice();
    logInfo('ElevenLabs sesleri yüklendi: ' + list.length);
    toast(list.length + ' ElevenLabs sesi yüklendi.');
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (st) st.textContent = '· sesler getirilemedi: ' + msg.slice(0, 120);
    logWarn('ElevenLabs ses listesi alınamadı: ' + msg);
    toast(t('Sesler getirilemedi: ') + msg.slice(0, 90), true);
  }
}

function assistantSaveFace() {
  const nameEl = $('asstFaceName');
  const name = String((nameEl && nameEl.value) || '').trim().slice(0, 24);
  if (!name) { toast('Bu yüzü kaydetmek için bir isim verin.', true); return; }
  const a = assistantCfg();
  const rec = Object.assign({ id: uid(), name }, assistantReadDesigner());
  a.faces.push(rec);
  while (a.faces.length > 24) a.faces.shift();     // yüz sayısı sınırı
  a.face = 'ozel:' + rec.id;                       // kaydedilen yüz hemen kullanılır
  asstDraft = null;
  persist();
  if (nameEl) nameEl.value = '';
  renderAssistantSettings();
  toast('Yüz kaydedildi.');
  logInfo('Asistan yüzü kaydedildi: ' + name);
}

function assistantDeleteFace(id) {
  const a = assistantCfg();
  const rec = a.faces.find((f) => f && f.id === id);
  a.faces = a.faces.filter((f) => f && f.id !== id);
  if (rec && a.face === 'ozel:' + id) a.face = 'varsayilan';
  asstDraft = null;
  persist();
  renderAssistantSettings();
  toast('Yüz silindi.');
}

/* Yazı kutusunun solundaki top: uygulama animasyonla küçülür, top belirir. */
function sendToBall(opts) {
  const summon = !!(opts && opts.summon);
  const d = desktop();
  if (!d || !d.openBall) {
    toast('Masaüstü topu yalnızca uygulamada çalışır.', true);
    return;
  }
  if (document.body.classList.contains('orbing')) return;
  cancelVoice();                 // gizlenen pencerede mikrofon açık kalmasın
  closeSettings();
  closeEmoji();
  closeLightbox();
  document.body.classList.add('orbing');
  logInfo(summon ? 'Asistan çağrıldı.' : 'Uygulama topa küçültüldü.');
  const azalt = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  setTimeout(() => {
    d.openBall({
      color: settings.ballColor || 'gri',
      pos: settings.ballPos || null,
      lang: lang(),
      assistant: assistantPayload(),
      summon
    }).then((res) => {
      if (!res || !res.ok) throw new Error((res && res.error) || 'Top açılamadı');
    }).catch((err) => {
      document.body.classList.remove('orbing');
      $('app').classList.remove('entering');
      logError('Top açılamadı', err);
      toast(t('Top açılamadı') + ': ' + ((err && err.message) || err), true);
    });
  }, azalt ? 0 : 430);
}

/* "Asistanı çağır" / "topu aç" gibi çağrılar: model ya da anahtar gerekmez. */
function summonIntent(text) {
  const low = foldTr(text);
  return /(asistani|asistan)\s*(cagir|cagirir|cagirirmisin|cagirir misin|ac|goster)/.test(low) ||
    /(topu)\s*(cagir|cagirir|ac|goster)/.test(low);
}

/* Topun sorusunu yanıtlar; yanıt parça parça topa akar. */
async function answerBall(payload) {
  const d = desktop();
  const id = String((payload && payload.id) || '');
  const text = String((payload && payload.text) || '').trim();
  if (!d || !d.ballFinish || !id || !text) return;

  /* 1) "kendini kapat" → asistan kendini kapatır, uygulama açık kalır. */
  if (selfCloseIntent(text)) {
    ballSay(id, tx('Kendimi kapatıyorum. Görüşürüz!', 'Closing myself. Bye!'));
    setTimeout(() => { try { d.ballReturn(); } catch {} }, 650);
    logInfo('Top: kendini kapatıyor');
    return;
  }

  /* 2) Onay bekleyen bir eylem varsa önce onu değerlendir (evet / hayır). */
  if (pendingAction && await resolvePendingAction(id, text)) return;

  /* 3) "aç / kapat <isim>" yerel komutları anahtar ve model istemez. */
  if (await runAccessCommand(id, text)) return;

  const cfg = providerCfg();
  const aiReady = !!currentModel() && (!requiresKey(cfg) || !!currentKey());

  /* 4) Kayıtlı olmayan emir gibi komut → yapay zekâ güvenli eylem üretsin. */
  if (aiReady && looksLikeCommand(text) && await runAssistantAction(id, text)) return;

  if (!currentModel() || (requiresKey(cfg) && !currentKey())) {
    logWarn('Top: anahtar ya da model seçili değil, yanıt verilemedi.');
    d.ballFinish(id, t('Önce Ayarlar → Yapay Zekâ Anahtarı bölümünden bir anahtar ve model seçin.'));
    return;
  }

  if (ballJob) { try { ballJob.abort(); } catch { /* yok */ } }
  const ctl = new AbortController();
  ballJob = ctl;

  ballHistory.push({ role: 'user', content: text });
  ballHistory = ballHistory.slice(-BALL_HISTORY_MAX);
  logInfo('Top: istek gönderildi · ' + providerCfg().label + ' · ' + text.length + ' karakter');

  let acc = '';
  try {
    await streamReply(ballHistory.map((m) => ({ role: m.role, content: m.content })), (delta) => {
      acc += delta;
      if (d.ballStream) d.ballStream(id, delta);
    }, ctl.signal, ballSystemPrompt());
    if (acc.trim()) {
      ballHistory.push({ role: 'assistant', content: acc.trim() });
      ballHistorySave();
      logInfo('Top: yanıt tamamlandı · ' + acc.length + ' karakter');
      speakReply(acc.trim());
    }
    d.ballFinish(id, '');
  } catch (err) {
    if (ctl.signal.aborted) {
      logWarn('Top: istek durduruldu.');
      d.ballFinish(id, acc.trim() ? '' : t('Yanıt durduruldu.'));
    } else {
      const msg = (err && err.message) || String(err);
      logError('Top: istek başarısız', err);
      d.ballFinish(id, msg);
    }
  } finally {
    if (ballJob === ctl) ballJob = null;
  }
}

/* Köprü dinleyicileri bir kez bağlanır. */
function bindBall() {
  const d = desktop();
  if (!d) return;
  if (d.onBallAsk) d.onBallAsk((payload) => { answerBall(payload); });
  /* Tepsi menüsü "Asistanı çağır": ayarlardaki renk/konumla top gelir. */
  if (d.onSummonBall) d.onSummonBall(() => { sendToBall({ summon: true }); });
  if (d.onBallReturned) d.onBallReturned(() => {
    /* Top kapanırken mikrofon açık kalmasın: son parça gönderilir, kayıt durur. */
    if (voiceState === 'listening' && voiceTarget === 'ball') stopVoice();
    document.body.classList.remove('orbing');
    const app = $('app');
    app.classList.remove('entering');
    void app.offsetWidth;
    app.classList.add('entering');
    $('input').focus();
    logInfo('Top büyütüldü: uygulamaya dönüldü.');
  });
  /* Top kapatıldı (× ya da Ctrl+Shift+A): pencere gizli kalır ama uygulama
     “orbing” durumundan çıkar, böylece asistan aynı tuşla yeniden çağrılır. */
  if (d.onBallClosed) d.onBallClosed(() => {
    if (voiceState === 'listening' && voiceTarget === 'ball') stopVoice();
    document.body.classList.remove('orbing');
    $('app').classList.remove('entering');
    logInfo('Asistan kapatıldı; uygulama arka planda bekliyor.');
  });
  if (d.onBallColor) d.onBallColor((color) => {
    const ok = ['gri', 'kirmizi', 'sari', 'mavi', 'siyah', 'mor', 'pembe', 'yesil', 'turuncu'];
    if (!ok.includes(color)) return;
    settings.ballColor = color;
    persist();
    logInfo('Top rengi değişti: ' + color);
  });
  /* Top menüsünden seçilen aksesuar ayarlara yazılır. */
  if (d.onBallAccessory) d.onBallAccessory((acc) => {
    if (!ASSISTANT_ACCS.some((x) => x.key === acc)) return;
    assistantCfg().accessory = acc;
    persist();
    if ($('settingsModal').classList.contains('open')) renderAssistantAccs();
    logInfo('Asistan aksesuarı top menüsünden değişti: ' + acc);
  });
  if (d.onBallPos) d.onBallPos((pos) => {
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    settings.ballPos = { x: Math.round(pos.x), y: Math.round(pos.y) };
    persist();
  });
}

/* ======================================================================
   FOTOĞRAF GÖRÜNTÜLEYİCİ — bulanık arka plan, zoom, sürükleyerek gezinme
   ====================================================================== */
const LB = { list: [], index: 0, scale: 1, x: 0, y: 0, dragging: false, px: 0, py: 0, moved: false };
const LB_MIN = 0.25;
const LB_MAX = 8;

function lbApply() {
  const img = $('lbImg');
  img.style.transform = 'translate(' + LB.x.toFixed(1) + 'px,' + LB.y.toFixed(1) + 'px) scale(' + LB.scale.toFixed(3) + ')';
  img.classList.toggle('zoomed', LB.scale > 1.0001);
  $('lbZoom').textContent = Math.round(LB.scale * 100) + '%';
}

function lbClamp() {
  const img = $('lbImg');
  const stage = $('lbStage');
  const w = img.offsetWidth * LB.scale;
  const h = img.offsetHeight * LB.scale;
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  // Görüntü ekrana sığıyorsa da fareyle her yöne (çaprazlar dahil) kaydırılabilsin;
  // büyütülmüşse kenarlara kadar gidilebilsin.
  const maxX = w > sw ? (w - sw) / 2 + 24 : sw * 0.32;
  const maxY = h > sh ? (h - sh) / 2 + 24 : sh * 0.32;
  LB.x = Math.min(maxX, Math.max(-maxX, LB.x));
  LB.y = Math.min(maxY, Math.max(-maxY, LB.y));
}

function lbReset() { LB.scale = 1; LB.x = 0; LB.y = 0; lbApply(); }

/* İmlecin altındaki nokta sabit kalacak şekilde yakınlaştırır. */
function lbZoomAt(clientX, clientY, factor) {
  const next = Math.min(LB_MAX, Math.max(LB_MIN, LB.scale * factor));
  const f = next / LB.scale;
  if (f === 1) return;
  const r = $('lbImg').getBoundingClientRect();
  const dx = clientX - (r.left + r.width / 2);
  const dy = clientY - (r.top + r.height / 2);
  LB.x += dx * (1 - f);
  LB.y += dy * (1 - f);
  LB.scale = next;
  lbClamp();
  lbApply();
}

function lbSet(item) {
  const img = $('lbImg');
  img.onerror = () => { if (item.thumb && img.getAttribute('src') !== item.thumb) img.src = item.thumb; };
  img.src = item.full || item.thumb;
  img.alt = item.title || '';
  $('lbCaption').textContent = item.title || '';
  const src = $('lbSource');
  /* Sohbete eklenen görsellerin dış adresi yok: "kaynağı aç" bağlantısı gizlenir. */
  const yerel = /^data:/i.test(String(item.full || item.thumb || ''));
  src.href = item.page || item.full || '#';
  src.hidden = yerel || !(item.page || item.full);
  lbReset();
}

function lbGo(delta) {
  if (LB.list.length < 2) return;
  LB.index = (LB.index + delta + LB.list.length) % LB.list.length;
  lbSet(LB.list[LB.index]);
}

function openLightbox(list, index) {
  LB.list = Array.isArray(list) ? list : [];
  LB.index = Number(index) || 0;
  const item = LB.list[LB.index];
  if (!item) return;
  $('lightbox').hidden = false;
  lbSet(item);
  if (LB.list.length > 1) {
    $('lbCaption').textContent = (item.title || '') + '   ·   ' + (LB.index + 1) + '/' + LB.list.length;
  }
}

function closeLightbox() {
  const box = $('lightbox');
  if (!box || box.hidden) return;
  box.hidden = true;
  $('lbImg').removeAttribute('src');
  LB.dragging = false;
  $('lbStage').classList.remove('dragging');
}

/* ----------------------------- Mesaj çizimi ----------------------------- */
/* Her mesajın kalıcı bir kimliği olur: eylem düğmeleri hangi mesaja ait
   olduğunu bu kimlikle bilir. */
function messageKey(msg) {
  if (!msg.id) msg.id = uid();
  return msg.id;
}

function msgById(id) {
  const chat = activeChat();
  if (!chat || !Array.isArray(chat.messages)) return null;
  return chat.messages.find((m) => m && m.id === id) || null;
}

function lastAssistantOfChat() {
  const chat = activeChat();
  if (!chat || !Array.isArray(chat.messages)) return null;
  const list = chat.messages.filter((m) => m && m.role === 'assistant');
  return list.length ? list[list.length - 1] : null;
}

function messageNode(msg) {
  const wrap = el('div', 'msg ' + (msg.role === 'user' ? 'user' : 'assistant') + (msg.error ? ' error' : ''));

  if (msg.role === 'assistant') {
    const av = el('div', 'msg-avatar');
    av.innerHTML = LOGO_SVG;
    wrap.appendChild(av);
  }

  const body = el('div', 'msg-body');

  if (msg.role === 'user') {
    const imgs = messageImages(msg);
    if (imgs.length) {
      const box = el('div', 'bubble-imgs' + (imgs.length === 1 ? ' one' : ''));
      imgs.forEach((im, i) => {
        const b = el('button', 'bubble-img');
        b.type = 'button';
        b.title = im.name || 'Görseli büyüt';
        b.setAttribute('aria-label', 'Görseli büyüt: ' + (im.name || 'görsel'));
        const pic = document.createElement('img');
        pic.src = im.dataUrl;
        pic.alt = im.name || 'görsel';
        pic.loading = 'lazy';
        b.appendChild(pic);
        b.onclick = () => openLightbox(
          imgs.map((x) => ({ thumb: x.dataUrl, full: x.dataUrl, title: x.name || 'Görsel' })), i);
        box.appendChild(b);
      });
      body.appendChild(box);
    }
    if (msg.content) {
      const b = el('div', 'bubble');
      b.textContent = msg.content;
      body.appendChild(b);
    }
  } else {
    if (msg.images && msg.images.length) body.appendChild(galleryNode(msg.images, msg.imageSource, msg.imageQuery));
    const prose = el('div', 'prose');
    prose.innerHTML = renderMarkdown(msg.content);
    prose.dataset.raw = msg.content;
    body.appendChild(prose);
    /* Metin önce yazılır; video kartı metnin altında durur. */
    if (msg.video) body.appendChild(videoNode(msg.video));

    /* Eylemler metnin ALTINDA: kopyala, yeniden yaz, sesli oku. Yazma
       kutusunun üstünde ayrı bir eylem çubuğu ya da ses seçici yoktur. */
    const key = messageKey(msg);
    const tools = el('div', 'msg-tools');
    const copy = el('button');
    copy.type = 'button';
    copy.dataset.copyMsg = key;
    copy.title = t('Yanıtı kopyala');
    copy.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>' + escapeHtml(t('Kopyala'));
    tools.appendChild(copy);
    /* Yalnızca son asistan yanıtı yeniden yazılabilir; eski yanıtlar sohbeti
       bozmamak için bu düğmeyi taşımaz. */
    const son = lastAssistantOfChat();
    if (son === msg) {
      const retry = el('button');
      retry.type = 'button';
      retry.dataset.retry = key;
      retry.title = t('Son yanıtı yeniden yaz');
      retry.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>' + escapeHtml(t('Yeniden yaz'));
      tools.appendChild(retry);
    }
    const speak = el('button');
    speak.type = 'button';
    speak.dataset.speak = key;
    speak.title = t('Bu yanıtı sesli oku');
    speak.setAttribute('aria-pressed', 'false');
    speak.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 10v4h3l4 3V7L7 10H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>' +
      '<span class="msg-btn-text">' + escapeHtml(t('Sesli oku')) + '</span>';
    tools.appendChild(speak);
    body.appendChild(tools);
  }

  wrap.appendChild(body);
  return wrap;
}

function renderChat() {
  const chat = activeChat();
  const welcome = $('welcome');
  const messages = $('messages');
  messages.innerHTML = '';

  if (!chat || !chat.messages.length) {
    welcome.hidden = false;
    messages.classList.remove('active');
    updateBanner();
    updateMessageActions();
    return;
  }
  welcome.hidden = true;
  messages.classList.add('active');
  for (const m of chat.messages) messages.appendChild(messageNode(m));
  scrollToEnd(true);
  updateMessageActions();
}

function scrollToEnd(force) {
  const box = $('chat');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 220;
  if (force || near) box.scrollTop = box.scrollHeight;
}

/* ----------------------------- Geçmiş ----------------------------- */
function renderHistory() {
  const hist = $('history');
  hist.innerHTML = '';
  if (!chats.length) { hist.appendChild(el('div', 'history-empty', t('Henüz sohbet yok.'))); return; }
  for (const c of chats) {
    const item = el('button', 'history-item' + (c.id === activeId ? ' active' : ''));
    item.type = 'button';
    item.dataset.id = c.id;
    item.appendChild(el('span', null, c.title || t('Yeni sohbet')));
    const del = el('button', 'history-del');
    del.type = 'button';
    del.dataset.del = c.id;
    del.title = 'Sil';
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    item.appendChild(del);
    hist.appendChild(item);
  }
}

function newChat() {
  const c = { id: uid(), title: '', messages: [], createdAt: Date.now() };
  chats.unshift(c);
  activeId = c.id;
  save(ukey('chats'), chats); save(ukey('active'), activeId);
  renderHistory(); renderChat();
  $('input').focus();
}

function setActive(id) {
  if (streaming) { toast('Yanıt sürerken sohbet değiştirilemez.', true); return; }
  activeId = id;
  save(ukey('active'), activeId);
  renderHistory(); renderChat();
}

function deleteChat(id) {
  chats = chats.filter((c) => c.id !== id);
  if (activeId === id) activeId = chats[0] ? chats[0].id : null;
  save(ukey('chats'), chats); save(ukey('active'), activeId);
  renderHistory(); renderChat();
}

/* ----------------------------- Gönderme ----------------------------- */
function setBusy(busy) {
  $('sendBtn').disabled = busy;
  $('stopBtn').hidden = !busy;
}

function updateBanner() {
  const cfg = providerCfg();
  const configured = isConfigured();
  $('keyBanner').hidden = configured;
  if (configured) return;

  if (requiresKey(cfg) && !currentKey()) {
    $('bannerTitle').textContent = t('Henüz yapay zekâ bağlanmadı');
    $('bannerText').textContent = lang() !== 'tr'
      ? 'Add your ' + cfg.label + ' key — it is stored only on this computer.'
      : cfg.label + ' anahtarınızı ekleyin — anahtar yalnızca bu bilgisayarda saklanır.';
  } else if (!currentModel()) {
    $('bannerTitle').textContent = t('Beyin (model) seçilmedi');
    $('bannerText').textContent = t('Ayarlar → Yapay Zekâ Anahtarı → "modelleri getir" ile seçebilirsiniz.');
  }
}

async function send(text, imageList) {
  const fromComposer = text == null;
  const content = (fromComposer ? $('input').value : String(text || '')).trim();
  const imgs = (Array.isArray(imageList) ? imageList : (fromComposer ? pendingImages : [])).slice();
  if ((!content && !imgs.length) || streaming) return;

  /* "Asistanı çağır" yazılınca top animasyonla gelir; API anahtarı gerekmez. */
  if (!imgs.length && summonIntent(content)) {
    if (fromComposer) { $('input').value = ''; autoGrow(); }
    logInfo('Asistan çağrısı: ' + content);
    sendToBall({ summon: true });
    return;
  }

  const cfg = providerCfg();
  if (!currentModel() || (requiresKey(cfg) && !currentKey())) {
    openSettings('api');
    toast('Önce Ayarlar → Yapay Zekâ Anahtarı bölümünden bir anahtar ve model seçin.', true);
    return;
  }

  /* --- niyet çözümü: görsel isteği · "video ile anlat"/"sen anlat" seçimi · çalışmayan bir şey · yardım isteği ---
     Kullanıcı kendi görselini eklediyse bu kısayollar atlanır: asıl iş görsele bakmaktır. */
  const withImage = imgs.length > 0;
  const intent = !withImage && settings.imageSearch ? detectImageIntent(content) : null;
  const choice = withImage ? null : resolveVideoChoice(content);
  const videoOn = settings.videoHelp !== false && !withImage;
  const problem = videoOn && !choice && !intent ? detectProblemIntent(content) : null;
  const help = videoOn && !choice && !problem && !intent ? detectHelpIntent(content) : null;

  let chat = activeChat();
  if (!chat) { newChat(); chat = activeChat(); }
  /* "video ile anlat" dendiğinde konu önceki mesajdan alınır: kullanıcı konuyu yeniden yazmaz. */
  const oncekiKonu = lastTopicFromChat(chat);
  const konu = help ? help.query
    : choice === 'video' ? (oncekiKonu || extractTopicQuery(content))
      : problem ? problem.query
        : choice === 'explain' ? (oncekiKonu || extractTopicQuery(content)) : null;
  logInfo('İstek gönderildi: ' + providerCfg().label + ' · ' + currentModel() + ' · ' + content.length + ' karakter' +
    (imgs.length ? ' · ' + imgs.length + ' görsel' : '') +
    (konu ? ' · konu: "' + konu + '"' + (choice ? ' · seçim: ' + choice : '') : ''));

  if (fromComposer && imgs.length) { pendingImages = []; renderAttachStrip(); }
  $('input').value = '';
  autoGrow();
  closeEmoji();
  $('welcome').hidden = true;
  $('messages').classList.add('active');

  const userMsg = { role: 'user', content, ts: Date.now() };
  if (konu && (problem || help || choice)) userMsg.topic = konu;
  if (imgs.length) {
    userMsg.images = imgs.map((i) => ({ dataUrl: i.dataUrl, mime: i.mime, name: i.name, w: i.w, h: i.h }));
  }
  chat.messages.push(userMsg);
  if (!chat.title) chat.title = (content || 'Görsel hakkında').slice(0, 42).replace(/\s+/g, ' ');
  $('messages').appendChild(messageNode(userMsg));

  const aiMsg = { role: 'assistant', content: '', ts: Date.now() };
  /* Çalışmayan bir şey yazıldıysa yapay zekâ "video mu, anlatayım mı?" diye YAZARAK sorar (düğme yok). */
  /* Video istenen durumlarda kart hemen konur; sayfa akışla paralel dolar (bekleme yok). */
  if (konu && (help || choice === 'video')) aiMsg.video = { query: konu, state: 'loading', video: null };
  chat.messages.push(aiMsg);
  const node = messageNode(aiMsg);
  const prose = node.querySelector('.prose');
  $('messages').appendChild(node);

  const videoJob = aiMsg.video ? lookUpVideos(aiMsg, node) : null;
  /* Animasyon metnin ÜSTÜNDE durur (prose'un dışında): yanıt yazılırken de görünür kalır. */
  const gen = genNode();
  node.querySelector('.msg-body').insertBefore(gen, prose);
  node.classList.add('streaming');          // yazarken mesajın çevresinde hafif ışık
  scrollToEnd(true);

  setBusy(true);
  stopSpeaking();                 // yeni yanıt okunurken eski ses kesilir
  streaming = new AbortController();
  let acc = '';
  let first = true;
  let raf = 0;
  let imageNote = '';
  let imageJob = null;

  /* --- görsel arama: metin akışını bekletmez, bulunca yanıtın üstüne eklenir --- */
  if (intent) {
    if (intent.self) {
      const logo = [{ thumb: 'assets/logo.png', full: 'assets/logo.png', title: 'PRIME AI logosu', page: 'assets/logo.png' }];
      aiMsg.images = logo;
      aiMsg.imageSource = 'PRIME AI';
      const g = galleryNode(logo, 'PRIME AI', null);
      prose.parentNode.insertBefore(g, prose);
      prose.innerHTML = renderMarkdown('Benim fotoğrafım yok — ama işte benim işaretim. 🤖✨');
      imageNote = '\n\n[Uygulama kullanıcıya PRIME AI logosunu gösterdi.]';
      scrollToEnd(true);
    } else {
      imageJob = searchImages(intent.query).then((found) => {
        if (found.images.length) {
          aiMsg.images = found.images;
          aiMsg.imageSource = found.source;
          aiMsg.imageQuery = found.query;
          const g = galleryNode(found.images, found.source, found.query);
          prose.parentNode.insertBefore(g, prose);
          scrollToEnd(false);
          save(ukey('chats'), chats);
          return '\n\n[Uygulama "' + found.query + '" için ' + found.images.length +
            ' görsel buldu ve yanıtın üstüne ekledi. Görsel başlıkları: ' +
            found.images.map((i) => i.title).join('; ') + '. Bu görselleri kullanıcıya kısaca tanıt.]';
        }
        return '\n\n[Uygulama "' + intent.query + '" için görsel bulamadı. Bunu kullanıcıya kısaca söyle.]';
      }).catch(() => '\n\n[Görsel arama başarısız oldu.]');
    }
  }

  /* Hız: akış hiçbir aramayı beklemez. Görsel/video sonuçları geldikçe kart
     kendiliğinden dolar; ilk kelime hemen ekrana gelir. */
  if (imageJob) imageJob.then((n) => { if (n) logInfo('Görsel notu yanıt başladıktan sonra geldi.'); });

  /* --- metin akışı --- */
  const history = chat.messages
    .filter((m) => m !== aiMsg && (m.content || messageImages(m).length))
    .map((m) => Object.assign({}, m));
  if (imageNote && history.length) history[history.length - 1].content += imageNote;
  /* Video ancak gerçekten hazırsa modele bildirilir: bekleme yok, yanlış söz yok. */
  if (konu && history.length && (help || choice === 'video') && aiMsg.video && aiMsg.video.state === 'ready' && aiMsg.video.video) {
    const hazir = aiMsg.video.video;
    history[history.length - 1].content += '\n\n[' + (lang() !== 'tr'
      ? 'The app added the video "' + hazir.title + '" (' + (hazir.channel || 'YouTube') + ') below. Mention it by name at the end with a short friendly line; do not write the link.'
      : 'Uygulama konunun altına "' + hazir.title + '" (' + (hazir.channel || 'YouTube') + ') videosunu ekledi. Yanıtının sonunda bu videoyu adıyla anıp "bu videoya da bakabilirsin" gibi kısaca söyle.') + ']';
  }

  const paint = () => {
    raf = 0;
    prose.innerHTML = renderMarkdown(balanceFences(stripEmoji(acc))) + '<span class="cursor"></span>';
    if (!first) scrollToEnd(false);
  };

  extraSystem = withImage ? imageSystemPrompt(imgs.length)
    : choice === 'explain' ? explainSystemPrompt(konu || extractTopicQuery(content))
      : problem ? problemSystemPrompt(problem.query)
        : (help || choice === 'video')
          ? helpSystemPrompt(konu, aiMsg.video && aiMsg.video.state === 'ready' ? aiMsg.video.video : null)
          : '';
  try {
    await streamReply(history, (t) => {
      if (first) { first = false; prose.innerHTML = ''; }
      acc += t;
      aiMsg.content = stripEmoji(acc);
      if (!raf) raf = requestAnimationFrame(paint);
    }, streaming.signal);

    if (raf) cancelAnimationFrame(raf);
    acc = stripEmoji(acc);
    if (!acc.trim()) acc = '(boş yanıt)';
    aiMsg.content = acc;
    prose.dataset.raw = acc;
    prose.innerHTML = renderMarkdown(acc);
    scrollToEnd(false);
    logInfo('Yanıt tamamlandı: ' + acc.length + ' karakter' + (help ? ' · video bağlantısı eklendi' : ''));
    if (speakReply(acc)) {
      speakingMsgId = messageKey(aiMsg);
      updateMessageActions();
    }
  } catch (err) {
    if (raf) cancelAnimationFrame(raf);
    if (err && err.name === 'AbortError') {
      logWarn('İstek durduruldu.');
      aiMsg.content = stripEmoji(acc) || '(durduruldu)';
      prose.dataset.raw = aiMsg.content;
      prose.innerHTML = renderMarkdown(aiMsg.content);
    } else {
      const msg = (err && err.message) || String(err);
      /* Görsel gönderildiyse ve sağlayıcı görseli reddettiyse anlaşılır bir yol göster. */
      const visionHint = withImage && /image|vision|multimodal|media|unsupported|support|desteklem/i.test(msg)
        ? '\n\nBu model görsel okumuyor olabilir. Ayarlar → Yapay Zekâ Anahtarı bölümünden görsel destekleyen bir model seçin (ör. Gemini flash, GPT-4o mini, Llama 4).'
        : '';
      aiMsg.error = true;
      aiMsg.content = (acc ? acc + '\n\n' : '') + '⚠️ ' + msg + visionHint;
      prose.innerHTML = renderMarkdown(balanceFences(aiMsg.content));
      node.classList.add('error');
      logError('İstek başarısız: ' + msg, err);
      toast('İstek başarısız: ' + msg.slice(0, 140), true);
    }
  } finally {
    streaming = null;
    extraSystem = '';
    node.classList.remove('streaming');
    gen.classList.add('bye');                 // yumuşakça kaybolur
    setTimeout(() => gen.remove(), 340);
    setBusy(false);
    updateMessageActions();
    node.querySelectorAll('.cursor').forEach((c) => c.remove());
    const kaydedildi = save(ukey('chats'), chats);
    if (!kaydedildi) {
      logWarn('Sohbet kaydedilemedi: yerel depolama doldu.');
      if (imgs.length) toast('Sohbet kaydedilemedi: depolama doldu. Eski sohbetleri silip yeniden deneyin.', true);
    }
    renderHistory();
    $('input').focus();
  }
}

function retryLast() {
  const chat = activeChat();
  if (!chat || streaming) return;
  const lastUser = [...chat.messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return;
  while (chat.messages.length && chat.messages[chat.messages.length - 1].role === 'assistant') chat.messages.pop();
  if (chat.messages[chat.messages.length - 1] === lastUser) chat.messages.pop();
  renderChat();
  send(lastUser.content, lastUser.images || []);
}

/* ----------------------------- Composer ----------------------------- */
function autoGrow() {
  const ta = $('input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
}

function buildEmojiPopup() {
  const pop = $('emojiPop');
  pop.innerHTML = '';
  for (const e of EMOJIS) {
    const b = el('button', null, e);
    b.type = 'button';
    b.addEventListener('click', () => {
      const ta = $('input');
      const start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
      const end = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
      ta.value = ta.value.slice(0, start) + e + ta.value.slice(end);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + e.length;
      autoGrow();
    });
    pop.appendChild(b);
  }
}

function openEmoji() {
  const pop = $('emojiPop');
  const btn = $('emojiBtn');
  const r = btn.getBoundingClientRect();
  pop.hidden = false;
  const w = pop.offsetWidth;
  let left = r.right - w;
  if (left < 12) left = 12;
  pop.style.left = left + 'px';
  pop.style.top = Math.max(12, r.top - pop.offsetHeight - 10) + 'px';
}
function closeEmoji() { $('emojiPop').hidden = true; }

/* ==================== MESAJ EYLEMLERİ ====================
   Kopyala, yeniden yaz ve sesli oku, her asistan yanıtının ALTINDA durur.
   Yazma kutusunun üstünde ayrı bir eylem çubuğu ya da ses seçici yoktur;
   ses Ayarlar → Sesli asistan sesi bölümünden seçilir. */
let speakingMsgId = '';         // şu anda hangi mesaj sesli okunuyor

function updateMessageActions() {
  const aktif = speechActive ? speakingMsgId : '';
  document.querySelectorAll('#messages [data-speak]').forEach((b) => {
    const on = !!aktif && b.dataset.speak === aktif;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.title = on ? t('Sesli okumayı durdur') : t('Bu yanıtı sesli oku');
    const lbl = b.querySelector('.msg-btn-text');
    if (lbl) lbl.textContent = on ? t('Durdur') : t('Sesli oku');
  });
}

function speakMessage(id) {
  const m = msgById(id);
  if (!m || !String(m.content || '').trim()) {
    toast(t('Sesli okunacak bir yanıt yok.'), true);
    return;
  }
  if (speakingMsgId === id && speechActive) {
    stopSpeaking();
    return;
  }
  stopSpeaking();
  speakingMsgId = id;
  const ok = speakReply(m.content, { force: true, full: true }) !== false;
  if (!ok) {
    speakingMsgId = '';
    toast(t('Bu yanıt sesli okunamadı.'), true);
  } else {
    logInfo('Sohbet yanıtı sesli okunuyor · ' + voiceLabel(assistantCfg().voice.gvoice));
  }
  updateMessageActions();
}

/* ----------------------------- Görsel ekleme -----------------------------
   Fotoğraf, ekran görüntüsü, ürün etiketi… Sohbete eklenen görsel modelin
   gözüne gider; model ona bakıp ne olduğunu söyler. Görseller cihazdan
   çıkmadan önce küçültülür (uzun kenar 1024 px). */
const IMG_LIMIT = 3;                    // bir mesajda en çok kaç görsel
const IMG_MAX_SIDE = 1024;             // uzun kenar sınırı
const IMG_SOURCE_MAX = 15 * 1024 * 1024;

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel açılamadı.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(new Error('Dosya okunamadı.'));
    fr.readAsDataURL(file);
  });
}

/* Dosyayı API'ye gönderilecek hâle getirir: küçük, hızlı, yeterince net. */
async function prepareImage(file) {
  if (!file || !/^image\//i.test(file.type || '')) throw new Error('Bu dosya bir görsel değil.');
  if (file.size > IMG_SOURCE_MAX) throw new Error('Görsel çok büyük (en çok 15 MB).');
  const src = await readFileAsDataUrl(file);
  const img = await loadImageEl(src);
  const nw = img.naturalWidth || img.width || 1;
  const nh = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, IMG_MAX_SIDE / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));
  const name = String(file.name || 'görsel').slice(0, 80);

  /* Küçük ve zaten sıkıştırılmış görsel yeniden kodlanmaz: kalite korunur. */
  if (scale === 1 && file.size <= 600 * 1024 && /^image\/(jpeg|png|webp)$/i.test(file.type)) {
    return { id: uid(), name, mime: file.type.toLowerCase(), dataUrl: src, w, h };
  }

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const keepAlpha = /png|webp/i.test(file.type || '');
  let mime = keepAlpha ? 'image/png' : 'image/jpeg';
  let dataUrl = canvas.toDataURL(mime, 0.86);
  /* PNG bazen büyük çıkar: sınırı aşarsa saydamlıktan vazgeçilip JPEG'e geçilir. */
  if (dataUrl.length > 900000) {
    mime = 'image/jpeg';
    dataUrl = canvas.toDataURL(mime, 0.8);
  }
  return { id: uid(), name, mime, dataUrl, w, h };
}

/* Seçili model görsel okuyabiliyor mu? Tahmin: ada bakılır, kesin bilgi değil. */
function looksVisionModel(model) {
  const m = String(model || '');
  if (!m) return false;
  return /(gpt-4o|gpt-4\.1|gpt-4-turbo|gpt-5|\bo3\b|\bo4\b|gemini|claude-(3|4)|llama-4|llama-3\.2|pixtral|qwen[^\s]*vl|vision|grok|gemma-?3|mistral-(small|medium)|internvl|llava)/i.test(m);
}

function renderAttachStrip() {
  const strip = $('attachStrip');
  const list = $('attachList');
  const hint = $('attachHint');
  if (!strip || !list) return;
  strip.hidden = pendingImages.length === 0;
  list.innerHTML = '';
  pendingImages.forEach((im) => {
    const item = el('div', 'attach-item');
    const open = el('button', 'attach-thumb');
    open.type = 'button';
    open.title = im.name || 'Görseli büyüt';
    open.setAttribute('aria-label', 'Görseli büyüt: ' + (im.name || 'görsel'));
    const img = document.createElement('img');
    img.src = im.dataUrl;
    img.alt = im.name || 'görsel';
    open.appendChild(img);
    open.onclick = () => openLightbox(
      pendingImages.map((p) => ({ thumb: p.dataUrl, full: p.dataUrl, title: p.name || 'Görsel' })),
      pendingImages.indexOf(im));
    const x = el('button', 'attach-x');
    x.type = 'button';
    x.title = 'Görseli kaldır';
    x.setAttribute('aria-label', 'Görseli kaldır: ' + (im.name || 'görsel'));
    x.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    x.onclick = (e) => {
      e.stopPropagation();
      pendingImages = pendingImages.filter((p) => p.id !== im.id);
      renderAttachStrip();
      $('input').focus();
    };
    item.append(open, x);
    list.appendChild(item);
  });
  const model = currentModel();
  const ok = looksVisionModel(model);
  hint.textContent = ok
    ? pendingImages.length + (lang() !== 'tr' ? ' image' + (pendingImages.length === 1 ? '' : 's') : ' görsel') + ' · ' + model
    : lang() !== 'tr'
      ? '⚠ ' + (model || 'No model selected') + ' may not read images — pick a vision model.'
      : '⚠ ' + (model || 'Model seçilmedi') + ' görsel okumayabilir — görsel destekleyen bir model seçin.';
  hint.classList.toggle('warn', !ok);
}

async function addImageFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f && /^image\//i.test(f.type || ''));
  if (!files.length) {
    if ((fileList || []).length) toast('Yalnızca görsel dosyaları eklenebilir.', true);
    return;
  }
  const room = IMG_LIMIT - pendingImages.length;
  if (room <= 0) { toast('Bir mesajda en çok ' + IMG_LIMIT + ' görsel gönderebilirsiniz.', true); return; }
  for (const f of files.slice(0, room)) {
    try { pendingImages.push(await prepareImage(f)); }
    catch (err) { toast((err && err.message) || 'Görsel eklenemedi.', true); }
  }
  if (files.length > room) toast('En çok ' + IMG_LIMIT + ' görsel eklenebilir; fazlası alınmadı.', true);
  renderAttachStrip();
  $('input').focus();
  logInfo('Görsel eklendi: ' + pendingImages.length + ' bekleyen görsel');
}

function imageSystemPrompt(count) {
  if (lang() !== 'tr') {
    return 'The user sent ' + count + ' image(s) with this message. Really look at the image and answer accordingly:\n' +
      '- First say concretely what is in the image: object, product, plant, animal, device, screenshot, food, place or text.\n' +
      '- If you recognise it, give its name, what it is used for and its distinguishing features; if unsure, say clearly that it is a guess.\n' +
      '- Do not invent brand/model details you cannot read; transcribe visible text exactly.\n' +
      '- If the user asked a question, answer it directly; otherwise describe the image briefly and say how you can help.\n' +
      '- If the image is blurry, dark or incomplete, say what angle would make a better photo.\n' +
      '- Do not pretend to research the object online; rely only on what you see and know.';
  }
  return 'Kullanıcı bu mesajla ' + count + ' görsel gönderdi. Görseli gerçekten incele ve ona göre cevap ver:\n' +
    '· Önce görselde ne olduğunu somut söyle: nesne, ürün, bitki, hayvan, cihaz, ekran görüntüsü, yemek, yer veya metin.\n' +
    '· Tanıdığın bir şeyse adını, ne işe yaradığını ve ayırt edici özelliklerini söyle; emin değilsen bunun bir tahmin olduğunu açıkça belirt.\n' +
    '· Marka/model numarası gibi görselde okunamayan ayrıntıları uydurma; yazı görünüyorsa aynen aktar.\n' +
    '· Kullanıcı bir soru sorduysa doğrudan o soruya cevap ver; soru yoksa görseli kısaca anlat ve nasıl yardımcı olabileceğini söyle.\n' +
    '· Görsel bulanık, karanlık veya eksikse hangi açıdan yeni bir fotoğraf gerektiğini söyle.\n' +
    '· Görseldeki şeyi tanımak için internetten araştırma yapıyormuş gibi davranma; yalnızca gördüklerine ve bildiklerine dayan.';
}

/* ----------------------------- API Yeri ----------------------------- */
function fillProviderSelect(keep) {
  const sel = $('providerSelect');
  const cur = keep || sel.value || (draft && draft.provider) || (activeSlot() && activeSlot().provider) || 'gemini';
  sel.innerHTML = '';
  for (const id of Object.keys(PROVIDERS)) {
    const n = slots().filter((s) => s.provider === id).length;
    const o = document.createElement('option');
    o.value = id;
    o.textContent = providerName(PROVIDERS[id]) +
      (n ? (lang() !== 'tr' ? ' — ' + n + (n === 1 ? ' key' : ' keys') : ' — ' + n + ' kayıt') : '') +
      (PROVIDERS[id].needsKey === false ? (tx(' (anahtarsız)', ' (no key)')) : '');
    sel.appendChild(o);
  }
  sel.value = PROVIDERS[cur] ? cur : 'gemini';
}

function renderApiGrid() {
  const grid = $('apiGrid');
  grid.innerHTML = '';
  const list = slots();
  for (const s of list) {
    const cfg = getProvider(s.provider);
    const ready = slotReady(s);
    /* Kart ve kaldırma tuşu kardeş durur: tuş kartın köşesinde, tek dokunuşla siler. */
    const box = el('div', 'api-slot');
    const tile = el('button', 'api-tile' + (s.sid === settings.activeApiId ? ' active' : ''));
    tile.type = 'button';
    tile.dataset.sid = s.sid;
    tile.title = providerName(cfg) + ' · ' + (s.model || t('model seçilmedi')) +
      (ready ? '' : ' · ' + t('eksik')) +
      (tx(' — düzenlemek için dokunun', ' — tap to edit'));
    if (s.sid === settings.activeApiId) tile.appendChild(el('span', 'use-flag', t('AKTİF')));
    tile.appendChild(el('span', 'badge', cfg.badge));
    tile.appendChild(el('span', 'name', providerName(cfg)));
    const usedUp = slotUsedUp(s);
    tile.appendChild(el('span', 'state' + (ready && !usedUp ? ' on' : ''), usedUp ? t('kota bitti') : (ready ? t('hazır') : t('eksik'))));
    tile.appendChild(el('span', 'model-line', s.model || t('model yok')));
    const del = el('button', 'api-del');
    del.type = 'button';
    del.dataset.del = s.sid;
    del.title = lang() !== 'tr' ? 'Remove ' + providerName(cfg) + ' record' : cfg.label + ' kaydını kaldır';
    del.setAttribute('aria-label', del.title);
    del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.6h16"/>' +
      '<path d="M9.6 6.6V4.4h4.8v2.2"/><path d="M6.6 6.6l1 12.6h8.8l1-12.6"/>' +
      '<path d="M10.4 10.2v5.6M13.6 10.2v5.6"/></svg>';
    box.appendChild(tile);
    box.appendChild(del);
    grid.appendChild(box);
  }
  /* Listenin sonunda her zaman "+ Yeni API": API ekledikten sonra yeniden görünür. */
  const add = el('button', 'api-tile add');
  add.type = 'button';
  add.title = lang() !== 'tr'
    ? 'Add a new API — add as many as you want from the same AI'
    : 'Yeni API ekle — aynı yapay zekadan istediğiniz kadar ekleyebilirsiniz';
  add.innerHTML = '<span class="plus">＋</span><span class="name">' + t('Yeni API') + '</span>' +
    '<span class="model-line">' + t('anahtar yapıştır') + '</span>';
  add.onclick = () => openApiForm(null, true);
  grid.appendChild(add);
  renderGlobalModelSelect();
}

/* Ortak model: bir sağlayıcının bütün kayıtlarında tek model. */
function modelListFor(pid) {
  const out = [];
  const add = (m) => {
    const v = String(m || '').trim();
    if (v && !out.includes(v)) out.push(v);
  };
  for (const m of (settings.models && settings.models[pid]) || []) add(m);
  for (const s of slots()) if (s.provider === pid) add(s.model);
  return out;
}

function renderGlobalModelSelect() {
  const sel = $('globalModelSelect');
  if (!sel) return;
  const status = $('globalModelStatus');
  const groups = [];
  const seen = new Set();
  for (const s of slots()) {
    if (seen.has(s.provider)) continue;
    seen.add(s.provider);
    groups.push({ pid: s.provider, models: modelListFor(s.provider) });
  }
  const active = activeSlot();
  let total = 0;
  sel.innerHTML = '';
  if (!groups.length) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = t('Önce bir API anahtarı ekleyin.');
    sel.appendChild(o);
    sel.disabled = true;
    if (status) status.textContent = '';
    return;
  }
  for (const g of groups) {
    if (!g.models.length) continue;
    const og = document.createElement('optgroup');
    og.label = providerName(getProvider(g.pid));
    for (const m of g.models) {
      const o = document.createElement('option');
      o.value = JSON.stringify([g.pid, m]);
      o.textContent = m;
      og.appendChild(o);
      total += 1;
    }
    sel.appendChild(og);
  }
  if (!total) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = t('— önce "modelleri getir" —');
    sel.appendChild(o);
    sel.disabled = true;
    if (status) status.textContent = t('Bütün modelleri yüklemek için "Tüm modelleri getir" düğmesine basın.');
    return;
  }
  sel.disabled = false;
  const wanted = active ? JSON.stringify([active.provider, active.model || '']) : '';
  const has = [...sel.options].some((o) => o.value === wanted);
  if (has) sel.value = wanted;
  else if (sel.options.length) sel.value = sel.options[0].value;
  if (status) {
    const son = lang() !== 'tr'
      ? total + ' models · ' + groups.length + ' provider' + (groups.length === 1 ? '' : 's')
      : total + ' model · ' + groups.length + ' sağlayıcı';
    status.textContent = son + (lang() !== 'tr'
      ? '. A selection applies to every API record of that provider.'
      : '. Seçim, o sağlayıcıdaki bütün API kayıtlarına uygulanır.');
  }
}

function applyGlobalModel(pid, model) {
  if (!PROVIDERS[pid] || !model) return;
  const targets = slots().filter((s) => s.provider === pid);
  if (!targets.length) return;
  targets.forEach((s) => { s.model = model; });
  const list = settings.models[pid] || (settings.models[pid] = []);
  if (!list.includes(model)) list.unshift(model);
  settings.provider = pid;
  if (!targets.some((s) => s.sid === settings.activeApiId)) settings.activeApiId = targets[0].sid;
  if (draft && targets.some((s) => s.sid === draft.sid)) {
    draft.provider = pid;
    draft.model = model;
    if ($('modelManual')) $('modelManual').value = model;
  }
  persist();
  renderApiGrid();
  fillModelOptions();
  updateChip();
  renderAccountTiles();
  const msg = lang() !== 'tr'
    ? 'Same model applied to ' + targets.length + ' API record' + (targets.length === 1 ? '' : 's') + ': ' + model
    : 'Aynı model ' + targets.length + ' API kaydına uygulandı: ' + model;
  toast(msg);
  logInfo(msg);
}

/* Bütün kayıtlı anahtarların model listelerini getirir; hiçbir modeli silmez. */
async function fetchAllModels() {
  const btn = $('fetchAllModelsBtn');
  const status = $('globalModelStatus');
  const jobs = new Map();
  for (const s of slots()) {
    const cfg = getProvider(s.provider);
    if (requiresKey(cfg) && !s.key) continue;
    const key = s.provider + '\u0000' + (s.key || '');
    if (!jobs.has(key)) jobs.set(key, { pid: s.provider, key: s.key || '' });
  }
  if (!jobs.size) {
    toast(tx('Önce bir API anahtarı ekleyin.', 'Add an API key first.'), true);
    return;
  }
  const oldLabel = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = t('getiriliyor…'); }
  if (status) status.textContent = t('Bütün modeller getiriliyor…');
  const results = await Promise.allSettled([...jobs.values()].map(async (job) => {
    const list = await fetchModels(job.pid, job.key);
    const eski = settings.models[job.pid] || [];
    settings.models[job.pid] = [...new Set([...eski, ...list])];
    return { pid: job.pid, count: list.length };
  }));
  persist();
  renderGlobalModelSelect();
  fillModelOptions();
  const ok = results.filter((r) => r.status === 'fulfilled');
  const bad = results.filter((r) => r.status === 'rejected');
  const perProvider = new Map();
  for (const r of ok) perProvider.set(r.value.pid, settings.models[r.value.pid] || []);
  const modelCount = [...perProvider.values()].reduce((n, list) => n + list.length, 0);
  const providerCount = perProvider.size;
  if (status) {
    status.textContent = bad.length
      ? (lang() !== 'tr'
        ? modelCount + ' models loaded; ' + bad.length + ' key(s) failed.'
        : modelCount + ' model yüklendi; ' + bad.length + ' anahtar başarısız.')
      : (lang() !== 'tr'
        ? modelCount + ' models added from ' + providerCount + ' provider(s).'
        : providerCount + ' sağlayıcıdan ' + modelCount + ' model eklendi.');
  }
  if (btn) { btn.disabled = false; btn.textContent = oldLabel || t('Tüm modelleri getir'); }
  if (bad.length) {
    const first = bad[0].reason;
    toast((tx('Bazı modeller alınamadı: ', 'Some models could not be loaded: ')) +
      ((first && first.message) || first), true);
    logWarn('Tüm modeller alınamadı: ' + bad.length + ' istek');
  } else {
    toast(tx('Bütün modeller eklendi.', 'All models added.'));
    logInfo('Tüm modeller getirildi · ' + modelCount + ' model');
  }
}

function renderProviderHelp() {
  const cfg = getProvider((draft && draft.provider) || $('providerSelect').value || 'gemini');
  $('providerHelp').innerHTML = cfg.keyUrl
    ? t('Anahtarı alın:') + ' <a href="' + cfg.keyUrl + '" target="_blank" rel="noopener noreferrer">' + cfg.keyUrlLabel + '</a>'
    : '';
  $('keyHelp').textContent = t(cfg.keyHint || '');
  $('apiKeyInput').placeholder = requiresKey(cfg) ? t('Anahtarınızı buraya yapıştırın') : t('Bu sağlayıcı için anahtar gerekmez');
}

function fillModelOptions() {
  const sel = $('modelSelect');
  const pid = (draft && draft.provider) || (activeSlot() && activeSlot().provider) || 'gemini';
  const list = settings.models[pid] || [];
  const chosen = (draft && draft.model) || '';
  sel.innerHTML = '';
  if (!list.length) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = t('— önce "modelleri getir" —');
    sel.appendChild(o);
  } else {
    for (const id of list) {
      const o = document.createElement('option');
      o.value = id; o.textContent = id;
      sel.appendChild(o);
    }
    sel.value = (chosen && list.includes(chosen)) ? chosen : list[0];
  }
  $('modelStatus').textContent = list.length
    ? list.length + (tx(' model bulundu.', ' models found.'))
    : '';
}

function openApiForm(sid, isNew) {
  const list = slots();
  const existing = sid ? slotById(sid) : null;
  if (!isNew && !existing) return;
  if (isNew) {
    // Varsayılan: şu an kullanılan sağlayıcı (çoğunlukla aynısından bir tane daha eklenir).
    // Anahtar biçimi farklı bir sağlayıcıya aitse yazarken otomatik değişir.
    const active = activeSlot();
    const unused = Object.keys(PROVIDERS).find((id) => !list.some((s) => s.provider === id));
    draft = { sid: null, provider: active ? active.provider : (unused || 'gemini'), key: '', model: '' };
  } else {
    draft = { sid: existing.sid, provider: existing.provider, key: existing.key || '', model: existing.model || '' };
  }
  const cfg = getProvider(draft.provider);
  $('apiForm').hidden = false;
  fillProviderSelect(draft.provider);
  $('apiFormTitle').textContent = isNew ? t('Yeni API') : cfg.label;
  $('apiKeyInput').value = draft.key;
  $('modelManual').value = draft.model;
  $('clearKeyBtn').hidden = !!isNew;
  $('apiUseBtn').hidden = !!isNew || draft.sid === settings.activeApiId;
  renderProviderHelp();
  fillModelOptions();
  renderApiGrid();
  deferFocus($('apiKeyInput'));
  $('apiForm').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function saveApi() {
  if (!draft) return;
  const id = $('providerSelect').value;
  const cfg = getProvider(id);
  const key = $('apiKeyInput').value.trim();
  if (requiresKey(cfg) && !key) { toast('Bir API anahtarı girin.', true); deferFocus($('apiKeyInput')); return; }
  const model = $('modelManual').value.trim() || $('modelSelect').value || draft.model || '';
  let slot;
  if (draft.sid) {
    slot = slotById(draft.sid);
    if (!slot) return;
    slot.provider = id;
    slot.key = key;
    slot.model = model;
    delete slot.usedUpAt;      // anahtar yeniden girildi: kota işareti kalksın
  } else {
    slot = { sid: uid(), provider: id, key, model };
    slots().push(slot);
    settings.activeApiId = slot.sid;
  }
  draft = { sid: slot.sid, provider: id, key, model };
  settings.provider = id;
  persist();
  $('clearKeyBtn').hidden = false;
  $('apiUseBtn').hidden = slot.sid === settings.activeApiId;
  renderApiGrid();
  updateChip();
  renderAccountTiles();
  logInfo('API kaydedildi: ' + cfg.label + ' · ' + (model || 'model seçilmedi') + (slot.key ? '' : ' (anahtarsız)'));
  toast(cfg.label + ' kaydedildi' + (model ? ': ' + model : ' · model seçmeyi unutmayın'));
}

/* Kaydedilmiş bir API'yi etkin yapar (aynı sağlayıcıdan birden çok kayıt olabilir). */
function useApi() {
  if (!draft || !draft.sid) { saveApi(); return; }
  const chosen = slotById(draft.sid);
  if (chosen) delete chosen.usedUpAt;   // elle seçilen kayıt yeniden denenir
  settings.activeApiId = draft.sid;
  settings.provider = draft.provider;
  persist();
  renderApiGrid();
  updateChip();
  renderAccountTiles();
  $('apiUseBtn').hidden = true;
  logInfo('Etkin API değişti: ' + getProvider(draft.provider).label + ' · ' + (draft.model || 'model seçilmedi'));
  toast(getProvider(draft.provider).label + ' artık kullanılıyor.');
}

function deleteApiSlot(sid) {
  const slot = slotById(sid);
  if (!slot) return;
  const cfg = getProvider(slot.provider);
  if (!confirm(cfg.label + (slot.model ? ' (' + slot.model + ')' : '') + ' kaydı silinsin mi?')) return;
  settings.apis = slots().filter((s) => s.sid !== sid);
  if (!settings.apis.some((s) => s.provider === slot.provider)) settings.models[slot.provider] = [];
  if (settings.activeApiId === sid) { settings.activeApiId = null; pickActiveSlot(); }
  if (draft && draft.sid === sid) { draft = null; $('apiForm').hidden = true; }
  persist();
  fillProviderSelect(activeSlot() ? activeSlot().provider : 'gemini');
  renderApiGrid();
  fillModelOptions();
  updateChip();
  renderAccountTiles();
  logWarn('API silindi: ' + cfg.label + (slot.model ? ' · ' + slot.model : ''));
  toast(cfg.label + ' silindi.');
}

function clearApi() {
  if (!draft || !draft.sid) { $('apiForm').hidden = true; return; }
  deleteApiSlot(draft.sid);
}

/* ----------------------------- Ayarlar ----------------------------- */
function renderAccentGrid() {
  const grid = $('accentGrid');
  grid.innerHTML = '';
  for (const a of ACCENTS) {
    const b = el('button', 'accent-swatch' + ((settings.accent || 'alev') === a.id ? ' active' : ''));
    b.type = 'button';
    b.dataset.accentVal = a.id;
    const i = document.createElement('i');
    i.style.background = 'linear-gradient(120deg,' + a.a + ',' + a.b + ')';
    b.appendChild(i);
    b.appendChild(el('span', null, t(a.name)));
    grid.appendChild(b);
  }
}

/* ------------------------- Profil fotoğrafı ------------------------- */
/* Seçilen görsel tarayıcıda ortadan kırpılıp 256×256 JPEG'e küçültülür;
   böylece localStorage'da küçük kalır ve ağa hiçbir şey çıkmaz. */
const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
const AVATAR_SIZE = 256;

function avatarInitial() {
  return (currentUser && currentUser.name ? currentUser.name[0] : '?').toUpperCase();
}

function paintAvatar(node) {
  if (!node) return;
  const src = settings && settings.avatar ? String(settings.avatar) : '';
  node.classList.toggle('photo', !!src);
  node.textContent = '';
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.draggable = false;
    node.appendChild(img);
  } else {
    node.textContent = avatarInitial();
  }
}

function renderAvatars() {
  paintAvatar($('userAvatar'));
  paintAvatar($('accountAvatar'));
  const clear = $('avatarClearBtn');
  if (clear) clear.hidden = !(settings && settings.avatar);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(new Error('read'));
    fr.readAsDataURL(file);
  });
}

/* Dosyayı kareye kırpıp JPEG veri adresine çevirir. */
async function shrinkAvatar(file) {
  const raw = await readFileAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('decode'));
    i.src = raw;
  });
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const side = Math.min(w, h);
  if (!side) throw new Error('decode');
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  return canvas.toDataURL('image/jpeg', 0.88);
}

async function setAvatarFromFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type || '')) {
    toast(t('Yalnızca JPG, PNG veya WebP seçin.'));
    return;
  }
  if (file.size > AVATAR_MAX_BYTES) {
    toast(t('Görsel en fazla 3 MB olabilir.'));
    return;
  }
  try {
    const dataUrl = await shrinkAvatar(file);
    const before = settings.avatar;
    settings.avatar = dataUrl;
    if (!save(ukey('settings'), settings)) {
      settings.avatar = before;
      toast(t('Depolama dolu: fotoğraf kaydedilemedi.'));
      logWarn('Profil fotoğrafı kaydedilemedi (depolama dolu)');
      return;
    }
    renderAvatars();
    logInfo('Profil fotoğrafı güncellendi · ' + Math.round(dataUrl.length / 1024) + ' KB');
    toast(t('Profil fotoğrafı güncellendi.'));
  } catch {
    logWarn('Profil fotoğrafı okunamadı: ' + (file.name || 'görsel'));
    toast(t('Görsel açılamadı. Başka bir dosya deneyin.'));
  }
}

function clearAvatar() {
  if (!settings || !settings.avatar) return;
  settings.avatar = '';
  persist();
  renderAvatars();
  logInfo('Profil fotoğrafı kaldırıldı');
  toast(t('Profil fotoğrafı kaldırıldı.'));
}

/* Tepsideki (sağ tık) menüde “Uygulamayı aç / Asistanı çağır”ın üstünde
   hangi hesabın açık olduğu yazar; pencere gizliyken de görülür. */
function syncTrayAccount() {
  try {
    if (window.PRIME_DESKTOP && window.PRIME_DESKTOP.setAccountName) {
      window.PRIME_DESKTOP.setAccountName(currentUser ? currentUser.name : '');
    }
  } catch { /* masaüstü köprüsü yoksa yok say */ }
}

function renderAccountTiles() {
  renderAvatars();
  $('userName').textContent = currentUser ? currentUser.name : '';
  syncTrayAccount();
  $('userMeta').textContent = currentUser ? configuredProviders().length + ' API · yerel hesap' : '';
  $('accountName').textContent = currentUser ? currentUser.name : '';
  if (currentUser && currentUser.createdAt) {
    const d = new Date(currentUser.createdAt);
    $('accountSince').textContent = 'Oluşturuldu: ' + d.toLocaleDateString('tr-TR') + ' · ' +
      configuredProviders().length + ' API';
  }
  const cfg = providerCfg();
  $('footStatus').textContent = isConfigured()
    ? cfg.label + ' · ' + currentModel()
    : t('Anahtar eklemelisiniz');
}

/* Alanlara yazarken de doğru durumu gösterebilmek için DOM değerlerini okur. */
function renderGoogleStatus() {
  const key = String(($('googleKey') && $('googleKey').value) || '').trim();
  const cx = String(($('googleCx') && $('googleCx').value) || '').trim();
  const on = !!(key && cx);
  const tag = $('googleTag');
  const st = $('googleStatus');
  if (tag) tag.textContent = t(on ? 'bağlı' : (key || cx ? 'eksik' : 'kapalı'));
  if (st) {
    st.textContent = t(on
      ? 'Google Görseller etkin: fotoğraf aramaları önce Google üzerinden yapılır.'
      : (key || cx)
        ? 'Google için hem API anahtarı hem de arama motoru kimliği (cx) gerekir. Şimdilik anahtarsız kaynaklar kullanılır.'
        : 'Google bağlı değil. Aramalar anahtarsız kaynaklarla yapılır (Wikimedia Commons → Openverse).');
  }
}

/* Klavye sesi kutusu: anahtar, düzey ve düğme ayarlardaki değerle eşitlenir. */
function syncKeySoundUI() {
  const on = keySoundOn();
  const yuzde = Math.round(keySoundLevel() * 100);
  if ($('optKeySound')) $('optKeySound').checked = on;
  if ($('keySoundRange')) { $('keySoundRange').value = yuzde; $('keySoundRange').disabled = !on; }
  if ($('keySoundVal')) $('keySoundVal').textContent = yuzde + '%';
  if ($('keySoundTile')) $('keySoundTile').classList.toggle('is-off', !on);
}

function fillSettingsForm() {
  if (!draft) {
    const s = activeSlot();
    draft = s ? { sid: s.sid, provider: s.provider, key: s.key || '', model: s.model || '' }
              : { sid: null, provider: 'gemini', key: '', model: '' };
  }
  fillProviderSelect(draft.provider);
  $('apiKeyInput').value = draft.key || '';
  $('modelManual').value = draft.model || '';
  $('systemPrompt').value = settings.systemPrompt || '';
  $('tempRange').value = settings.temperature;
  $('tempVal').textContent = Number(settings.temperature).toFixed(1);
  $('maxTokens').value = settings.maxTokens;
  if ($('optBrief')) $('optBrief').checked = briefOn();
  settings.useEmoji = false;   // asistan metninde emoji kullanılmıyor
  $('optImages').checked = settings.imageSearch !== false;
  $('optVideo').checked = settings.videoHelp !== false;
  syncKeySoundUI();
  const g = settings.google || {};
  $('googleKey').value = g.key || '';
  $('googleCx').value = g.cx || '';
  renderGoogleStatus();
  renderApiGrid();
  renderProviderHelp();
  fillModelOptions();
  renderAccentGrid();
  renderAccountTiles();
  renderAccessList();
  renderVoiceSettings();
  refreshMicDevices(false);
  renderCameraSettings();
  renderAssistantSettings();
  applyTheme();
  applyLang();
}

function switchPanel(name) {
  const panel = ['api', 'app', 'kamera', 'asistan'].includes(name) ? name : 'api';
  /* Kamera sekmesi yalnızca izin verildikten sonra açılır. */
  if (panel === 'kamera' && !camAllowed()) {
    camAskPermission().then((ok) => { if (ok) switchPanel('kamera'); });
    return;
  }
  document.querySelectorAll('.settings-tab').forEach((t) => t.classList.toggle('active', t.dataset.panel === panel));
  $('panelApi').hidden = panel !== 'api';
  $('panelApp').hidden = panel !== 'app';
  if ($('panelKamera')) $('panelKamera').hidden = panel !== 'kamera';
  if ($('panelAsistan')) $('panelAsistan').hidden = panel !== 'asistan';
  $('settingsSub').textContent = panel === 'api'
    ? t('API anahtarlarınız ve modeller')
    : panel === 'kamera'
      ? t('Kamera, yaratıcı belleği ve giriş')
      : panel === 'asistan'
        ? t('Uyku düzeni ve yüz')
        : t('Tema, davranış ve hesap');
  if (panel === 'kamera') { renderCameraSettings(); refreshCamDevices(false); }
  if (panel === 'asistan') renderAssistantSettings();
}

function openSettings(panel) {
  fillSettingsForm();
  switchPanel(panel || 'api');
  applyLang();
  $('settingsModal').classList.add('open');
  $('settingsModal').setAttribute('aria-hidden', 'false');
}
function closeSettings() {
  $('settingsModal').classList.remove('open');
  $('settingsModal').setAttribute('aria-hidden', 'true');
}

function updateChip() {
  const cfg = providerCfg();
  const chip = $('chipText'), dot = $('chipDot');
  if (isConfigured()) {
    chip.textContent = currentModel();
    chip.title = cfg.label + ' · ' + currentModel();
    dot.className = 'dot on';
  } else {
    const ready = configuredProviders();
    chip.textContent = t(ready.length ? 'Beyin seçilmeli' : 'Anahtar eklenmedi');
    chip.title = t('Ayarları açın');
    dot.className = 'dot warn';
  }
  updateBanner();
}

/* ----------------------------- Olaylar ----------------------------- */
let appBound = false;   // bindApp iki kez çalışırsa adsız dinleyiciler tekrarlanmasın

function bindApp() {
  $('brandLogoSlot').innerHTML = LOGO_SVG;
  $('welcomeLogoSlot').innerHTML = LOGO_SVG;
  $('aboutLogoSlot').innerHTML = LOGO_SVG;
  $('greetName').textContent = currentUser ? currentUser.name : '';
  loadTypingSamples();          // ilk tuşa basmadan hazır olsun
  if (appBound) return;
  appBound = true;

  $('collapseBtn').onclick = () => $('app').classList.add('collapsed');
  $('menuBtn').onclick = () => $('app').classList.remove('collapsed');
  $('scrim').onclick = () => $('app').classList.add('collapsed');
  $('newChatBtn').onclick = () => { newChat(); if (innerWidth <= 860) $('app').classList.add('collapsed'); };
  $('brandHome').onclick = (e) => { e.preventDefault(); newChat(); };
  $('logoutBtn').onclick = logout;
  if ($('accountsBtn')) $('accountsBtn').onclick = openAccounts;
  if ($('closeAccounts')) $('closeAccounts').onclick = closeAccounts;
  if ($('accountsSignInBtn')) $('accountsSignInBtn').onclick = () => beginAccountSwitch('', 'login');
  if ($('accountsNewBtn')) $('accountsNewBtn').onclick = () => beginAccountSwitch('', 'register');

  /* Yeni sohbet ekranındaki logo: tıklayınca titreyip duman çıkarır. */
  const welcomeLogo = $('welcomeLogoSlot');
  welcomeLogo.onclick = () => puffLogo(welcomeLogo);
  welcomeLogo.onkeydown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    puffLogo(welcomeLogo);
  };

  /* Yazı kutusunun solundaki gri top: uygulamayı masaüstü topuna küçültür. */
  $('orbBtn').onclick = sendToBall;

  /* Profil fotoğrafı: dosya seç → küçült → hesabın ayarlarına yaz */
  $('avatarPickBtn').onclick = () => $('avatarPicker').click();
  $('avatarPicker').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';                 // aynı dosya yeniden seçilebilsin
    setAvatarFromFile(file);
  });
  $('avatarClearBtn').onclick = clearAvatar;

  $('history').onclick = (e) => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); deleteChat(del.dataset.del); return; }
    const item = e.target.closest('.history-item');
    if (item) { setActive(item.dataset.id); if (innerWidth <= 860) $('app').classList.add('collapsed'); }
  };

  /* Video kartı her zaman uygulamanın içinde oynar; tarayıcı isteyen videoyu
     oynatıcı çubuğundaki “Tarayıcıda aç ↗” bağlantısından açar. */
  $('messages').addEventListener('click', (e) => {
    const card = e.target.closest('.video-card[data-video-id]');
    if (!card) return;
    e.preventDefault();
    openVideoPlayer(card, card.dataset.videoId).catch((err) => logWarn('Video açılamadı: ' + ((err && err.message) || err)));
  });

  const ta = $('input');
  ta.addEventListener('input', autoGrow);
  ta.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey &&
        (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete')) typingClick();
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  $('composer').addEventListener('submit', (e) => { e.preventDefault(); send(); });
  $('stopBtn').onclick = () => { if (streaming) streaming.abort(); };

  /* --- görsel ekleme: düğme · panodan yapıştırma · sürükle-bırak --- */
  $('attachBtn').onclick = () => $('imagePicker').click();
  $('imagePicker').addEventListener('change', (e) => {
    addImageFiles(e.target.files);
    e.target.value = '';               // aynı dosya yeniden seçilebilsin
  });
  ta.addEventListener('paste', (e) => {
    const data = e.clipboardData;
    if (!data) return;
    const imgs = Array.from(data.items || [])
      .filter((it) => it.kind === 'file' && /^image\//i.test(it.type || ''))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (imgs.length) { e.preventDefault(); addImageFiles(imgs); }
  });

  /* Yazı kutusu odakta değilken de yapıştırma çalışsın (metin kutusu kendi işini yapar). */
  document.addEventListener('paste', (e) => {
    if (e.defaultPrevented) return;
    const data = e.clipboardData;
    if (!data) return;
    const imgs = Array.from(data.items || [])
      .filter((it) => it.kind === 'file' && /^image\//i.test(it.type || ''))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (imgs.length) { e.preventDefault(); addImageFiles(imgs); }
  });

  const imgDrag = (e) => Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes('Files');
  const dropTargets = [$('composer'), $('messages')];
  for (const zone of dropTargets) {
    if (!zone) continue;
    zone.addEventListener('dragover', (e) => {
      if (!imgDrag(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      $('composer').classList.add('drop');
    });
    zone.addEventListener('dragleave', (e) => {
      if (e.relatedTarget && zone.contains(e.relatedTarget)) return;
      $('composer').classList.remove('drop');
    });
    zone.addEventListener('drop', (e) => {
      if (!imgDrag(e)) return;
      e.preventDefault();
      $('composer').classList.remove('drop');
      addImageFiles(e.dataTransfer && e.dataTransfer.files);
    });
  }

  /* emoji */
  buildEmojiPopup();
  $('emojiBtn').onclick = (e) => { e.stopPropagation(); if ($('emojiPop').hidden) openEmoji(); else closeEmoji(); };
  document.addEventListener('click', (e) => {
    if (!$('emojiPop').hidden && !e.target.closest('#emojiPop') && !e.target.closest('#emojiBtn')) closeEmoji();
  });

  $('messages').addEventListener('click', (e) => {
    const copyCode = e.target.closest('[data-copy]');
    if (copyCode) {
      const code = copyCode.closest('.code-block').querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyCode.textContent = 'Kopyalandı';
        setTimeout(() => {
          copyCode.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>Kopyala';
        }, 1400);
      }).catch(() => toast('Kopyalanamadı.', true));
      return;
    }
    const speakBtn = e.target.closest('[data-speak]');
    if (speakBtn) { speakMessage(speakBtn.dataset.speak); return; }
    const copyMsg = e.target.closest('[data-copy-msg]');
    if (copyMsg) {
      const prose = copyMsg.closest('.msg-body').querySelector('.prose');
      navigator.clipboard.writeText(prose.dataset.raw || prose.textContent)
        .then(() => toast('Mesaj kopyalandı.'))
        .catch(() => toast('Kopyalanamadı.', true));
      return;
    }
    if (e.target.closest('[data-retry]')) retryLast();
  });

  /* fotoğraf görüntüleyici */
  $('lbClose').onclick = closeLightbox;
  $('lbBackdrop').onclick = closeLightbox;
  $('lbIn').onclick = () => { const s = $('lbStage'); lbZoomAt(s.clientWidth / 2, s.clientHeight / 2, 1.35); };
  $('lbOut').onclick = () => { const s = $('lbStage'); lbZoomAt(s.clientWidth / 2, s.clientHeight / 2, 1 / 1.35); };
  $('lbReset').onclick = lbReset;
  $('lbPrev').onclick = () => lbGo(-1);
  $('lbNext').onclick = () => lbGo(1);
  const lbStage = $('lbStage');
  lbStage.addEventListener('wheel', (e) => {
    if ($('lightbox').hidden) return;
    e.preventDefault();
    lbZoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18);
  }, { passive: false });
  lbStage.addEventListener('dblclick', (e) => lbZoomAt(e.clientX, e.clientY, LB.scale > 1.2 ? 1 / LB.scale : 2.5));
  lbStage.addEventListener('pointerdown', (e) => {
    if ($('lightbox').hidden) return;
    LB.dragging = true;
    LB.moved = false;
    LB.px = e.clientX;
    LB.py = e.clientY;
    lbStage.classList.add('dragging');
    try { lbStage.setPointerCapture(e.pointerId); } catch { /* yok */ }
  });
  lbStage.addEventListener('pointermove', (e) => {
    if (!LB.dragging) return;
    const dx = e.clientX - LB.px;
    const dy = e.clientY - LB.py;
    LB.px = e.clientX;
    LB.py = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 1) LB.moved = true;
    LB.x += dx;
    LB.y += dy;
    lbClamp();
    lbApply();
  });
  const lbEnd = (e) => {
    if (!LB.dragging) return;
    LB.dragging = false;
    lbStage.classList.remove('dragging');
    try { lbStage.releasePointerCapture(e.pointerId); } catch { /* yok */ }
  };
  lbStage.addEventListener('pointerup', lbEnd);
  lbStage.addEventListener('pointercancel', lbEnd);
  lbStage.addEventListener('click', (e) => { if ((e.target === lbStage || e.target === $('lbBackdrop')) && !LB.moved) closeLightbox(); });

  /* tema seçimi Ayarlar → Görünüm bölümünden yapılır. */

  /* konsol çekmecesi düğmeleri bindConsole() içinde bağlanır */
  $('themeSeg').onclick = (e) => {
    const b = e.target.closest('[data-theme-val]');
    if (b) { settings.theme = b.dataset.themeVal; persist(); applyTheme(); }
  };
  $('accentGrid').onclick = (e) => {
    const b = e.target.closest('[data-accent-val]');
    if (b) { settings.accent = b.dataset.accentVal; persist(); applyTheme(); }
  };
  $('langSeg').onclick = (e) => {
    const b = e.target.closest('[data-lang-val]');
    if (!b) return;
    const next = b.dataset.langVal;
    if (!langValid(next) || next === lang()) return;
    if (!setLanguage(next)) return;
    updateChip();
    renderHistory();
    renderApiGrid();
    renderAttachStrip();
    fillModelOptions();
    renderGoogleStatus();
    renderAccessList();
    renderChat();
    toast(t('Dil değiştirildi.'));
  };
  const mq = matchMedia('(prefers-color-scheme: light)');
  const onSystemTheme = () => { if ((settings.theme || 'dark') === 'system') applyTheme(); };
  if (mq.addEventListener) mq.addEventListener('change', onSystemTheme);
  else if (mq.addListener) mq.addListener(onSystemTheme);

  /* ayarlar */
  [$('settingsBtn'), $('keyBannerBtn'), $('modelChip')].filter(Boolean).forEach((b) => {
    b.onclick = () => openSettings();
  });
  document.querySelectorAll('.settings-tab').forEach((t) => {
    t.onclick = () => switchPanel(t.dataset.panel);
  });
  $('closeSettings').onclick = closeSettings;
  $('cancelSettings').onclick = closeSettings;
  $('settingsModal').onclick = (e) => { if (e.target === $('settingsModal')) closeSettings(); };
  $('aboutBtn') && ($('aboutBtn').onclick = () => {
    $('aboutModal').classList.add('open'); $('aboutModal').setAttribute('aria-hidden', 'false');
  });
  $('closeAbout').onclick = $('closeAboutBtn').onclick = () => {
    $('aboutModal').classList.remove('open'); $('aboutModal').setAttribute('aria-hidden', 'true');
  };
  $('aboutModal').onclick = (e) => { if (e.target === $('aboutModal')) $('aboutModal').classList.remove('open'); };

  /* API Yeri — "Anahtar ekle" düğmesi kaldırıldı; ekleme, ızgaradaki boş "Yeni API" kartından yapılır.
     Kartın köşesindeki çöp kutusu ise kaydı kaldırır. */
  $('apiGrid').onclick = (e) => {
    const del = e.target.closest('[data-del]');
    if (del) { deleteApiSlot(del.dataset.del); return; }
    const tile = e.target.closest('[data-sid]');
    if (tile) openApiForm(tile.dataset.sid, false);
  };
  $('apiFormClose').onclick = () => { $('apiForm').hidden = true; };
  $('providerSelect').onchange = () => {
    const id = $('providerSelect').value;
    if (!draft) draft = { sid: null, provider: id, key: '', model: '' };
    draft.provider = id;
    draft.key = '';
    draft.model = '';
    $('apiKeyInput').value = '';
    $('modelManual').value = '';
    const hint = $('keyDetect');
    if (hint) { hint.textContent = ''; hint.style.color = ''; }
    renderProviderHelp();
    fillModelOptions();
    renderApiGrid();
  };
  $('toggleKey').onclick = () => {
    const i = $('apiKeyInput');
    i.type = i.type === 'password' ? 'text' : 'password';
  };

  /* Anahtar yapıştırılınca sağlayıcı ve model kendiliğinden seçilir. */
  const keyInput = $('apiKeyInput');
  const keyHint = $('keyDetect');
  let autoTimer = 0;
  let autoFetchedFor = '';
  const setKeyHint = (text, ok) => {
    if (!keyHint) return;
    keyHint.textContent = text;
    keyHint.style.color = ok ? 'var(--good)' : '';
  };
  keyInput.addEventListener('input', () => {
    const key = keyInput.value.trim();
    const detected = detectProviderFromKey(key);
    setKeyHint(detected ? '✓ ' + getProvider(detected).label + ' anahtarı olarak algılandı.' : '', !!detected);
    if (detected && $('apiForm').hidden === false && $('providerSelect').value !== detected) {
      $('providerSelect').value = detected;          // change olayı tetiklenmez: yapıştırılan anahtar korunur
      if (!draft) draft = { sid: null, provider: detected, key: '', model: '' };
      draft.provider = detected;
      draft.model = '';
      $('modelManual').value = '';
      renderProviderHelp();
      fillModelOptions();
      renderApiGrid();
      setKeyHint('✓ ' + getProvider(detected).label + ' seçildi.', true);
      toast(getProvider(detected).label + ' anahtarı algılandı.');
    }
    /* Anahtar tamam görünüyorsa model listesini kendiliğinden getir */
    const pid = $('providerSelect').value;
    if (detected && pid === detected && key.length >= 20 && key !== autoFetchedFor) {
      autoFetchedFor = key;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => { $('fetchModelsBtn').click(); }, 650);
    }
  });

  ['googleKey', 'googleCx'].forEach((id) => {
    const inp = $(id);
    if (inp) inp.addEventListener('input', renderGoogleStatus);
  });
  $('modelSelect').onchange = () => { $('modelManual').value = $('modelSelect').value; };
  $('globalModelSelect').onchange = () => {
    const raw = $('globalModelSelect').value;
    if (!raw) return;
    try {
      const pair = JSON.parse(raw);
      if (Array.isArray(pair) && pair.length === 2) applyGlobalModel(pair[0], pair[1]);
    } catch { /* bozuk seçenek yok sayılır */ }
  };
  $('fetchAllModelsBtn').onclick = fetchAllModels;
  $('saveApiBtn').onclick = saveApi;
  $('clearKeyBtn').onclick = clearApi;
  $('apiUseBtn').onclick = useApi;

  $('fetchModelsBtn').onclick = async (e) => {
    e.preventDefault();
    const btn = $('fetchModelsBtn');
    const id = $('providerSelect').value;
    const key = $('apiKeyInput').value.trim();
    btn.textContent = 'getiriliyor…';
    $('modelStatus').textContent = '';
    try {
      const list = await fetchModels(id, key);
      settings.models[id] = list;
      if (!draft) draft = { sid: null, provider: id, key: '', model: '' };
      draft.provider = id;
      if (!list.includes(draft.model || '')) draft.model = list[0];
      fillModelOptions();
      $('modelManual').value = draft.model || '';
      $('modelStatus').textContent = '✓ ' + list.length + ' model bulundu.';
      logInfo('Model listesi getirildi: ' + getProvider(id).label + ' · ' + list.length + ' model · seçili: ' + (draft.model || '—'));
      toast(list.length + ' model bulundu.');
    } catch (err) {
      $('modelStatus').textContent = '✕ ' + ((err && err.message) || err);
      logError('Model listesi alınamadı: ' + getProvider(id).label, err);
      toast('Modeller alınamadı. Anahtarı kontrol edin.', true);
    } finally {
      btn.textContent = 'modelleri getir';
    }
  };

  $('tempRange').oninput = () => { $('tempVal').textContent = Number($('tempRange').value).toFixed(1); };
  /* Klavye sesi anında uygulanır: düzey kaydırıcısı bırakılınca bir örnek çalar. */
  if ($('optBrief')) $('optBrief').onchange = () => {
    settings.brief = $('optBrief').checked;
    persist();
  };
  if ($('optKeySound')) $('optKeySound').onchange = () => {
    settings.keySoundOn = $('optKeySound').checked;
    persist();
    syncKeySoundUI();
    if (settings.keySoundOn) previewKeySound();
  };
  if ($('keySoundRange')) {
    $('keySoundRange').oninput = () => {
      settings.keySoundLevel = Math.min(100, Math.max(0, Number($('keySoundRange').value) || 0));
      if ($('keySoundVal')) $('keySoundVal').textContent = Math.round(keySoundLevel() * 100) + '%';
    };
    $('keySoundRange').onchange = () => { persist(); previewKeySound(); };
  }
  if ($('keySoundTest')) $('keySoundTest').onclick = previewKeySound;
  $('deleteAccountBtn').onclick = deleteAccount;
  $('accessAddApp').onclick = () => pickAccess('app');
  $('accessAddFolder').onclick = () => pickAccess('folder');

  /* ----------------------------- mikrofon ----------------------------- */
  $('micBtn').onclick = () => voiceToggle('app');
  $('micRefresh').onclick = () => refreshMicDevices(true);
  $('micSelect').onchange = () => {
    settings.micDeviceId = $('micSelect').value;
    persist();
    const chosen = micDevices.find((d) => d.deviceId === settings.micDeviceId);
    logInfo('Mikrofon seçildi: ' + (chosen && chosen.label ? chosen.label : 'varsayılan'));
  };
  /* ------------------------------- kamera ------------------------------- */
  /* Sol menüdeki düğme büyük görünümü açar; küçük önizleme orada kalır. */
  if ($('cameraNavBtn')) $('cameraNavBtn').onclick = () => { toggleCamStage(); };
  if ($('camStageClose')) $('camStageClose').onclick = () => closeCamStage();
  if ($('camStageStop')) $('camStageStop').onclick = () => { stopCamGuard(true); closeCamStage(); };
  if ($('camStageModal')) $('camStageModal').addEventListener('click', (e) => {
    if (e.target === $('camStageModal')) closeCamStage();
  });
  if ($('camPermitYes')) $('camPermitYes').onclick = () => camClosePermit(true);
  if ($('camPermitNo')) $('camPermitNo').onclick = () => camClosePermit(false);
  if ($('camPermit')) $('camPermit').addEventListener('click', (e) => {
    if (e.target === $('camPermit')) camClosePermit(false);
  });
  if ($('camRevokePermit')) $('camRevokePermit').onclick = () => camRevokePermission();
  if ($('camRefresh')) $('camRefresh').onclick = () => refreshCamDevices(true);
  /* Ayarlardan kamerayı kapat: akış ve izleme durur, izin yerinde kalır.
     Yeniden açmak sol menüdeki Kamera düğmesinden yapılır. */
  if ($('camShutdown')) $('camShutdown').onclick = () => {
    camStopAll();
    stopCamPreview();
    toast(t('Kamera kapatıldı.'));
    logInfo('Kamera ayarlardan kapatıldı');
    renderCameraSettings();
  };
  if ($('camSelect')) $('camSelect').onchange = async () => {
    camSettings().deviceId = $('camSelect').value;
    persist();
    if (camStream) await startCamPreview($('camSelect').value);
    startCamGuard().catch(() => {});
  };
  if ($('camSaveCreator')) $('camSaveCreator').onclick = () => {
    const f = camFrameOrWarn();
    if (!f) return;
    setCamPhoto(f);
    toast('Yaratıcı fotoğrafı kaydedildi.');
  };
  if ($('camPickCreator')) $('camPickCreator').onclick = () => $('camCreatorPicker').click();
  if ($('camCreatorPicker')) $('camCreatorPicker').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    const data = await camFileToPhoto(file);
    if (!data) return;
    setCamPhoto(data);
    toast('Yaratıcı fotoğrafı yüklendi.');
  });
  if ($('camClearCreator')) $('camClearCreator').onclick = () => setCamPhoto('');

  /* --------------------- asistan: uyku ve yüz ayarları --------------------- */
  /* Uyku alanları değişince hemen kaydedilir; top bir sonraki açılışta alır. */
  if ($('asstSleepOn')) $('asstSleepOn').onchange = () => {
    assistantCfg().sleepOn = $('asstSleepOn').checked;
    persist();
  };
  if ($('asstSleepEvery')) $('asstSleepEvery').onchange = () => {
    const a = assistantCfg();
    a.sleepEvery = clampNum($('asstSleepEvery').value, 1, 120, 7);
    $('asstSleepEvery').value = a.sleepEvery;
    persist();
  };
  if ($('asstSleepLen')) $('asstSleepLen').onchange = () => {
    const a = assistantCfg();
    a.sleepLen = clampNum($('asstSleepLen').value, 10, 600, 60);
    $('asstSleepLen').value = a.sleepLen;
    persist();
  };
  /* Yüz tasarım değişiklikleri canlı önizlemeye yansır; kaydetmeye kadar saklanmaz. */
  ['asstEyeSize', 'asstEyeGap', 'asstEyeColor', 'asstMouthW', 'asstMouthCurve', 'asstMouthColor']
    .filter((id) => $(id))
    .forEach((id) => {
      $(id).oninput = () => { asstDraft = assistantReadDesigner(); renderAssistantDesigner(); };
    });
  if ($('asstMouthRound')) $('asstMouthRound').onchange = () => {
    asstDraft = assistantReadDesigner();
    renderAssistantDesigner();
  };
  if ($('asstSaveFace')) $('asstSaveFace').onclick = assistantSaveFace;
  /* Kart: seç → kullan. çöp kutusu: özel yüzü sil. */
  if ($('asstFaces')) $('asstFaces').onclick = (e) => {
    const del = e.target.closest('[data-face-del]');
    if (del) { assistantDeleteFace(del.dataset.faceDel); return; }
    const card = e.target.closest('.asst-face-card');
    if (card && card.dataset.faceKey) assistantUseFace(card.dataset.faceKey);
  };
  /* Aksesuar: tıkla → asistan o aksesuarı takar (top bir sonraki açılışta alır). */
  if ($('asstAccs')) $('asstAccs').onclick = (e) => {
    const b = e.target.closest('[data-acc-key]');
    if (b) assistantUseAcc(b.dataset.accKey);
  };
  /* Sesli asistan: aç/kapa, kadın-erkek, tonlama ve hız anında kaydedilir. */
  if ($('asstVoiceOn')) $('asstVoiceOn').onchange = () => {
    assistantCfg().voice.on = $('asstVoiceOn').checked;
    persist();
    if (!$('asstVoiceOn').checked) stopSpeaking();
    renderAssistantVoice();
  };
  /* AI sesler: seçilen tını anında kaydedilir. */
  if ($('asstVoiceGemini')) $('asstVoiceGemini').onchange = () => {
    assistantCfg().voice.gvoice = $('asstVoiceGemini').value;
    persist();
    stopSpeaking();
    renderAssistantVoice();
    logInfo('AI sesi: ' + $('asstVoiceGemini').value);
  };
  /* ElevenLabs: anahtar, model ve ses anında kaydedilir; ses listesi
     “Sesleri getir” ile hesaptan çekilir. */
  if ($('asstElevenKey')) $('asstElevenKey').onchange = () => {
    assistantCfg().voice.elevenKey = String($('asstElevenKey').value || '').trim();
    persist();
    stopSpeaking();
    renderAssistantVoice();
    logInfo('ElevenLabs anahtarı güncellendi · ' + (elevenKey() ? 'girildi' : 'silindi'));
  };
  if ($('asstElevenModel')) $('asstElevenModel').onchange = () => {
    assistantCfg().voice.elevenModel = $('asstElevenModel').value;
    persist();
    renderAssistantVoice();
    logInfo('ElevenLabs modeli: ' + $('asstElevenModel').value);
  };
  if ($('asstElevenFetch')) $('asstElevenFetch').onclick = () => fetchElevenVoices();
  if ($('asstVoiceTest')) $('asstVoiceTest').onclick = () => {
    const a = assistantCfg();
    /* “Sesi dene” her koşulda okur: otomatik seslendirme kapalı olsa bile. */
    speakReply(lang() !== 'tr'
      ? 'Hello! This is how PRIME AI sounds.'
      : 'Merhaba! PRIME AI böyle sesleniyor.', { force: true });
    logInfo('Sesli asistan denendi · ' + (elevenKey()
      ? 'ElevenLabs · ' + (a.voice.elevenModel || 'eleven_flash_v2_5')
      : (a.voice.gvoice === 'mix' ? 'Karışık (kadın sesler)' : (a.voice.gvoice || 'Karışık'))));
  };
  if ($('camShotsClear')) $('camShotsClear').onclick = () => clearCamShots();
  if ($('camShotsAll')) $('camShotsAll').onclick = () => openCamShots(0);
  if ($('camShotsFolder')) $('camShotsFolder').onclick = () => openCamFolder('capture');
  if ($('camShotsTitle')) $('camShotsTitle').onclick = () => openCamShots(0);
  if ($('camShots')) $('camShots').onclick = (e) => {
    const item = e.target.closest('.cam-shot-item');
    if (!item) return;
    openCamShots(Number(item.dataset.index) || 0);
  };
  if ($('camAbsencesClear')) $('camAbsencesClear').onclick = () => clearCamAbsences();
  if ($('camAbsencesAll')) $('camAbsencesAll').onclick = () => openCamAbsences(0);
  if ($('camAbsencesFolder')) $('camAbsencesFolder').onclick = () => openCamFolder('absence');
  if ($('camAbsencesTitle')) $('camAbsencesTitle').onclick = () => openCamAbsences(0);
  if ($('camAbsences')) $('camAbsences').onclick = (e) => {
    const item = e.target.closest('.cam-shot-item');
    if (!item) return;
    openCamAbsences(Number(item.dataset.index) || 0);
  };
  if ($('camChatForm')) $('camChatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('camChatInput').value;
    $('camChatInput').value = '';
    askCameraAi(q);
  });
  if ($('camAlarmOn')) $('camAlarmOn').onchange = () => {
    camSettings().alarm = $('camAlarmOn').checked;
    persist();
    /* Alarm kapalıyken de yaratıcı kontrolü ve yokluk kaydı sürer. */
    if (camSettings().creatorPhoto) startCamGuard().catch(() => {});
    renderCamGuardHint();
  };
  if ($('camAutoClose')) $('camAutoClose').onchange = () => {
    camSettings().autoClose = $('camAutoClose').checked;
    persist();
  };
  if ($('camIdleMin')) $('camIdleMin').onchange = () => {
    camSettings().idleMin = Math.min(120, Math.max(0, Number($('camIdleMin').value) || 0));
    $('camIdleMin').value = camSettings().idleMin;
    camLastActivityAt = Date.now();
    persist();
  };
  if ($('camCountdown')) $('camCountdown').onchange = () => {
    camSettings().countdown = Math.min(30, Math.max(1, Number($('camCountdown').value) || 5));
    $('camCountdown').value = camSettings().countdown;
    persist();
  };
  if ($('camAlarmStop')) $('camAlarmStop').onclick = () => camAlarmSnooze();
  $('saveSettings').onclick = () => {
    settings.systemPrompt = $('systemPrompt').value;
    settings.temperature = Number($('tempRange').value);
    settings.maxTokens = Math.max(256, Number($('maxTokens').value) || 4096);
    if ($('optBrief')) settings.brief = $('optBrief').checked;
    settings.useEmoji = false;   // asistan metni emoji kullanmaz
    settings.imageSearch = $('optImages').checked;
    settings.videoHelp = $('optVideo').checked;
    if ($('optKeySound')) settings.keySoundOn = $('optKeySound').checked;
    if ($('keySoundRange')) settings.keySoundLevel = Math.min(100, Math.max(0, Number($('keySoundRange').value) || 0));
    settings.google = { key: $('googleKey').value.trim(), cx: $('googleCx').value.trim() };
    /* Kamera sekmesi alanları da kaydedilir. */
    if ($('camSelect')) {
      const c = camSettings();
      c.deviceId = $('camSelect').value;
      if ($('camAlarmOn')) c.alarm = $('camAlarmOn').checked;
      if ($('camAutoClose')) c.autoClose = $('camAutoClose').checked;
      if ($('camCountdown')) c.countdown = Math.min(30, Math.max(1, Number($('camCountdown').value) || 5));
    }
    /* Asistan sekmesi: uyku alanları da kaydedilir (yüzler anında kaydedilir). */
    if ($('asstSleepEvery')) {
      const a = assistantCfg();
      if ($('asstSleepOn')) a.sleepOn = $('asstSleepOn').checked;
      a.sleepEvery = clampNum($('asstSleepEvery').value, 1, 120, 7);
      a.sleepLen = clampNum($('asstSleepLen') && $('asstSleepLen').value, 10, 600, 60);
      $('asstSleepEvery').value = a.sleepEvery;
      if ($('asstSleepLen')) $('asstSleepLen').value = a.sleepLen;
    }
    if ($('apiForm').hidden === false && draft && $('providerSelect').value) {
      const id = $('providerSelect').value;
      const key = $('apiKeyInput').value.trim();
      const cfg = getProvider(id);
      if (key || !requiresKey(cfg) || draft.sid) {
        const model = $('modelManual').value.trim() || $('modelSelect').value || draft.model || '';
        let slot = draft.sid ? slotById(draft.sid) : null;
        if (!slot) {
          slot = { sid: uid(), provider: id, key, model };
          slots().push(slot);
          settings.activeApiId = slot.sid;
        } else {
          slot.provider = id; slot.key = key; slot.model = model;
        }
        draft = { sid: slot.sid, provider: id, key, model };
        settings.provider = id;
      }
    }
    persist();
    pickActiveSlot();
    updateChip();
    renderAccountTiles();
    closeSettings();
    toast('Ayarlar kaydedildi.');
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('accountsModal') && $('accountsModal').classList.contains('open')) {
      e.preventDefault(); closeAccounts(); return;
    }
    if (e.key === 'Escape' && authSwitch && !$('authScreen').hidden) {
      e.preventDefault(); cancelAccountSwitch(); return;
    }
    if (!$('lightbox').hidden) {
      const s = $('lbStage');
      const cx = s.clientWidth / 2;
      const cy = s.clientHeight / 2;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lbGo(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbGo(1); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); lbZoomAt(cx, cy, 1.3); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); lbZoomAt(cx, cy, 1 / 1.3); }
      else if (e.key === '0') { e.preventDefault(); lbReset(); }
      return;
    }
    if (e.key === 'Escape' && camPermitAsk) { e.preventDefault(); camClosePermit(false); return; }
    if (e.key === 'Escape') { closeSettings(); closeCamStage(); closeEmoji(); $('aboutModal').classList.remove('open'); closeFilesModal(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); newChat(); }
    if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); openSettings(); }
  });
}

/* ----------------------------- Dil seçimi ----------------------------- */
/* İlk açılışta, giriş ekranından önce açılan dil seçimi. Her dil kendi
   adıyla listelenir; seçim anında uygulanır ve cihazda saklanır. */
function showLangScreen() {
  const s = $('langScreen');
  if (!s) return false;
  if ($('authScreen')) $('authScreen').hidden = true;
  const slot = $('langLogoSlot');
  if (slot && !slot.firstChild) slot.innerHTML = LOGO_SVG;
  const grid = $('langPickGrid');
  if (grid) grid.querySelectorAll('[data-lang-pick]').forEach((b) => b.classList.toggle('picked', b.dataset.langPick === lang()));
  s.hidden = false;
  applyLang();
  return true;
}

function chooseLanguage(code) {
  if (!setLanguage(code)) return;
  logInfo('Dil seçildi: ' + code);
  const grid = $('langPickGrid');
  if (grid) grid.querySelectorAll('[data-lang-pick]').forEach((b) => b.classList.toggle('picked', b.dataset.langPick === code));
  const s = $('langScreen');
  if (s) s.hidden = true;
  showAuth();
}

function bindLangScreen() {
  const grid = $('langPickGrid');
  if (!grid) return;
  grid.onclick = (e) => {
    const b = e.target.closest('[data-lang-pick]');
    if (b) chooseLanguage(b.dataset.langPick);
  };
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const items = Array.from(grid.querySelectorAll('[data-lang-pick]'));
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
    next.focus();
  });
}

function bindAuth() {
  $('authLogoSlot').innerHTML = LOGO_SVG;
  document.querySelectorAll('.auth-tab').forEach((t) => {
    t.onclick = () => setAuthMode(t.dataset.authTab);
  });
  $('authForm').addEventListener('submit', (e) => { e.preventDefault(); submitAuth(); });
  if ($('authSwitchCancel')) $('authSwitchCancel').onclick = cancelAccountSwitch;
  $('authEye').onclick = () => {
    const i = $('authPass');
    i.type = i.type === 'password' ? 'text' : 'password';
  };
}

/* ----------------------------- Başlat ----------------------------- */
function startApp() {
  $('authScreen').hidden = true;
  $('app').hidden = false;
  $('app').classList.remove('entering');
  void $('app').offsetWidth;
  $('app').classList.add('entering');   // yumuşak giriş (Freebuff tarzı açılış)

  settings = Object.assign(freshDefaults(), load(ukey('settings'), {}));
  /* Dil tercihi cihazda tutulur. Cihazda seçim yoksa hesabın dili benimsenir
     (eski sürümden gelen tercih kaybolmasın); cihaz seçimi her zaman kazanır. */
  const deviceLang = langStored();
  if (langValid(deviceLang)) {
    langNow = deviceLang;
  } else if (langValid(settings.lang)) {
    langNow = settings.lang;
    try { localStorage.setItem(LANG_KEY, langNow); } catch { /* yok */ }
  } else {
    langNow = 'tr';
  }
  settings.lang = langNow;
  /* Kaldırılan "Video nerede açılsın?" ayarı eski kayıtlardan temizlenir:
     video her zaman uygulamanın içinde oynar. */
  if ('videoOpen' in settings) { delete settings.videoOpen; persist(); }
  settings.keys = settings.keys || {};
  settings.models = settings.models || {};
  settings.model = settings.model || {};
  migrateApis();
  draft = null;
  chats = load(ukey('chats'), []);
  activeId = load(ukey('active'), null);
  ballHistoryLoad();

  bindApp();
  pendingImages = [];
  renderAttachStrip();
  applyTheme();
  applyLang();

  if (!chats.length) activeId = null;
  else if (!chats.some((c) => c.id === activeId)) activeId = chats[0].id;

  updateChip();
  renderHistory();
  renderChat();
  fillSettingsForm();
  renderVoiceSettings();
  updateMessageActions();

  /* Kamera: izleme yaratıcı fotoğrafı + uyarı ile başlar; yalnızca önizleme
     istenmişse (daha önce kamera açılmışsa) kamera yine açılır.
     İzin verilmemişse hiçbir kamera işi başlamaz ve sekme gizli kalır. */
  const camCfg = camSettings();
  camSetTabVisible(camAllowed());
  if (!camAllowed()) {
    renderCamGuardHint();
  } else if (camCfg.alarm && camCfg.creatorPhoto) {
    startCamGuard().catch(() => {});
  } else if (camCfg.enabled) {
    /* Açılışta aygıt henüz meşgul olabilir: bir kez gecikmeli tekrar denenir. */
    startCamPreview().then((ok) => {
      if (!ok) setTimeout(() => startCamPreview().catch(() => {}), 1500);
    }).catch(() => {});
  } else {
    renderCamGuardHint();
  }

  let autoCollapsed = innerWidth <= 860;
  if (autoCollapsed) $('app').classList.add('collapsed');
  addEventListener('resize', () => {
    const narrow = innerWidth <= 860;
    if (narrow === autoCollapsed) return;
    if (narrow) $('app').classList.add('collapsed');
    else $('app').classList.remove('collapsed');
    autoCollapsed = narrow;
  });

  $('input').focus();
}

(function boot() {
  installLogging();
  bindConsole();
  bindBall();
  bindVoice();
  initIntro();
  logInfo('PRIME AI başladı · ' + (desktop() ? 'masaüstü ' + desktop().version : 'tarayıcı') + ' · ' + location.origin);
  bindAuth();
  bindLangScreen();
  applyLang();                        // açılış, giriş ve dil ekranları seçili dilde
  const users = load(USERS_KEY, []);
  const session = loadSession();
  const user = session ? users.find((u) => u.id === session.userId) : null;
  if (user) {
    currentUser = user;
    startApp();
  } else {
    clearSession();
    /* İlk açılış: önce dil seçilir, sonra hesap ekranı gelir. Dil daha önce
       seçildiyse doğrudan giriş ekranı açılır. */
    if (!langChosen() && showLangScreen()) logInfo('İlk açılış: dil seçimi gösterildi.');
    else showAuth();
  }
})();
