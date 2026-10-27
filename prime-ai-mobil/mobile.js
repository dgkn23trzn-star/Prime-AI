/* ============================================================
   PRIME AI Mobil — uygulama mantığı
   Sohbet, çoklu sağlayıcı API, asistan topu, ayarlar ve
   ilk açılış API rehberi. Sunucu yok: her şey bu cihazda.
   ============================================================ */
'use strict';

const VERSION = '1.0.0';
const STORE_KEY = 'primeai.mobil.v1';

/* ----------------------------- Sağlayıcılar ----------------------------- */
const PROVIDERS = {
  gemini:      { label: 'Google Gemini', badge: 'GE', kind: 'gemini', base: 'https://generativelanguage.googleapis.com/v1beta',
                 keyUrl: 'https://aistudio.google.com/apikey', keyUrlLabel: 'aistudio.google.com/apikey',
                 keyHint: 'Ücretsiz katman var. Anahtar AIza ile başlar.', prefer: ['flash', 'pro'],
                 defaultModel: 'gemini-2.5-flash' },
  openai:      { label: 'OpenAI', badge: 'OP', kind: 'openai', base: 'https://api.openai.com/v1',
                 keyUrl: 'https://platform.openai.com/api-keys', keyUrlLabel: 'platform.openai.com/api-keys',
                 keyHint: 'Anahtar sk- ile başlar.', prefer: ['mini', 'gpt'], defaultModel: 'gpt-4o-mini' },
  anthropic:   { label: 'Anthropic (Claude)', badge: 'AN', kind: 'anthropic', base: 'https://api.anthropic.com/v1',
                 keyUrl: 'https://console.anthropic.com/settings/keys', keyUrlLabel: 'console.anthropic.com/settings/keys',
                 keyHint: 'Anahtar sk-ant- ile başlar.', prefer: ['sonnet', 'haiku', 'opus'],
                 defaultModel: 'claude-3-5-haiku-latest' },
  groq:        { label: 'Groq', badge: 'GR', kind: 'openai', base: 'https://api.groq.com/openai/v1',
                 keyUrl: 'https://console.groq.com/keys', keyUrlLabel: 'console.groq.com/keys',
                 keyHint: 'Ücretsiz katman var. Anahtar gsk_ ile başlar.', prefer: ['versatile', 'instant', 'oss'],
                 defaultModel: 'llama-3.3-70b-versatile' },
  openrouter:  { label: 'OpenRouter', badge: 'OR', kind: 'openai', base: 'https://openrouter.ai/api/v1',
                 keyUrl: 'https://openrouter.ai/keys', keyUrlLabel: 'openrouter.ai/keys',
                 keyHint: 'Tek anahtarla birçok model. Anahtar sk-or- ile başlar.', prefer: ['free', 'flash'],
                 defaultModel: 'openrouter/auto' },
  mistral:     { label: 'Mistral AI', badge: 'MI', kind: 'openai', base: 'https://api.mistral.ai/v1',
                 keyUrl: 'https://console.mistral.ai/api-keys', keyUrlLabel: 'console.mistral.ai/api-keys',
                 keyHint: 'Ücretsiz deneme katmanı var.', prefer: ['mistral', 'large', 'small'],
                 defaultModel: 'mistral-small-latest' },
  deepseek:    { label: 'DeepSeek', badge: 'DS', kind: 'openai', base: 'https://api.deepseek.com/v1',
                 keyUrl: 'https://platform.deepseek.com/api_keys', keyUrlLabel: 'platform.deepseek.com/api_keys',
                 keyHint: 'Uygun fiyatlı. Anahtar sk- ile başlar.', prefer: ['chat', 'reasoner'],
                 defaultModel: 'deepseek-chat' },
  xai:         { label: 'xAI (Grok)', badge: 'XA', kind: 'openai', base: 'https://api.x.ai/v1',
                 keyUrl: 'https://console.x.ai', keyUrlLabel: 'console.x.ai',
                 keyHint: 'Anahtar xai- ile başlar.', prefer: ['grok'], defaultModel: 'grok-3-mini' },
  together:    { label: 'Together AI', badge: 'TG', kind: 'openai', base: 'https://api.together.ai/v1',
                 keyUrl: 'https://api.together.ai/settings/api-keys', keyUrlLabel: 'api.together.ai/settings/api-keys',
                 keyHint: 'Açık kaynak modeller, ücretsiz katman var.', prefer: ['instruct', 'chat'],
                 defaultModel: '' },
  perplexity:  { label: 'Perplexity', badge: 'PX', kind: 'openai', base: 'https://api.perplexity.ai/v1',
                 keyUrl: 'https://www.perplexity.ai/settings/api', keyUrlLabel: 'perplexity.ai/settings/api',
                 keyHint: 'Web araması destekli modeller. Anahtar pplx- ile başlar.', prefer: [],
                 defaultModel: 'sonar' },
  cerebras:    { label: 'Cerebras', badge: 'CB', kind: 'openai', base: 'https://api.cerebras.ai/v1',
                 keyUrl: 'https://cloud.cerebras.ai', keyUrlLabel: 'cloud.cerebras.ai',
                 keyHint: 'Çok hızlı çıkarım, ücretsiz katman var. csk- ile başlar.', prefer: ['llama', 'qwen'],
                 defaultModel: '' },
  fireworks:   { label: 'Fireworks AI', badge: 'FW', kind: 'openai', base: 'https://api.fireworks.ai/inference/v1',
                 keyUrl: 'https://fireworks.ai/account/api-keys', keyUrlLabel: 'fireworks.ai/account/api-keys',
                 keyHint: 'fw_ ile başlar. Model kimlikleri accounts/fireworks/... biçimindedir.',
                 prefer: ['instruct', 'chat'], defaultModel: '' },
  ollama:      { label: 'Ollama (bu bilgisayar)', badge: 'OL', kind: 'openai', base: 'http://localhost:11434/v1',
                 needsKey: false, keyHint: 'Bilgisayarında çalışır, anahtar gerekmez.', prefer: ['llama', 'qwen'],
                 defaultModel: '' }
};

const ACCENTS = [
  { id: 'kirmizi', name: 'Kırmızı' },
  { id: 'alev', name: 'Alev' },
  { id: 'gunbatimi', name: 'Gün batımı' },
  { id: 'okyanus', name: 'Okyanus' },
  { id: 'orman', name: 'Orman' },
  { id: 'mor', name: 'Mor' },
  { id: 'altin', name: 'Altın' },
  { id: 'buz', name: 'Buz' }
];

const KEY_PREFIXES = [
  ['sk-ant-', 'anthropic'], ['sk-or-', 'openrouter'], ['sk-proj-', 'openai'], ['sk-svcacct-', 'openai'],
  ['gsk_', 'groq'], ['csk-', 'cerebras'], ['fw_', 'fireworks'], ['xai-', 'xai'], ['pplx-', 'perplexity'],
  ['tgp_v1_', 'together'], ['AIza', 'gemini']
];

const LANG_NAMES = { tr: 'Türkçe', en: 'English', de: 'Deutsch', ru: 'Русский', ja: '日本語' };

const DEF = {
  v: 2,
  name: '',
  theme: 'dark',
  accent: 'kirmizi',
  replyLang: 'tr',
  brief: true,
  temperature: 0.7,
  systemPrompt: '',
  assistantOn: true,
  orbSize: 56,
  orbLife: true,
  soundOn: true,
  soundLevel: 55,
  apis: [],
  activeSid: null,
  chats: [],
  activeChatId: null,
  tutorialDone: false
};

/* ----------------------------- Durum ----------------------------- */
let state = loadState();
let streaming = null;        // { ctrl, chatId, msg }
let pendingImages = [];
let tutStep = 1;
let tutSlot = null;
let orbMsgs = [];
let orbBusy = false;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!raw || typeof raw !== 'object') return { ...DEF };
    const oldVersion = Number(raw.v || 1);
    const s = { ...DEF, ...raw };
    s.apis = Array.isArray(s.apis) ? s.apis.filter((a) => a && PROVIDERS[a.provider]) : [];
    s.chats = Array.isArray(s.chats) ? s.chats.filter((c) => c && Array.isArray(c.msgs)) : [];
    for (const a of s.apis) {
      if (!a.sid) a.sid = uid();
      a.key = String(a.key || '');
      a.model = String(a.model || '');
    }
    /* 1 → 2: eski varsayılan (sistem teması + mor) siyah-kırmızıya geçer;
       beyazı ya da başka rengi seçenlerin ayarına dokunulmaz. */
    if (oldVersion < 2) {
      if (s.theme === 'system' && s.accent === 'mor') {
        s.theme = 'dark';
        s.accent = 'kirmizi';
      }
      s.v = 2;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* yok */ }
    }
    return s;
  } catch {
    return { ...DEF };
  }
}

function saveState() {
  try {
    state.chats = state.chats.slice(0, 40);
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    /* Depolama doldu: eski sohbetlerin görselleri bırakılıp yeniden denenir. */
    try {
      const keep = new Set(state.chats.slice(0, 3).map((c) => c.id));
      for (const c of state.chats) {
        if (keep.has(c.id)) continue;
        for (const m of c.msgs) if (m.images) m.images = [];
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch {
      toast('Depolama dolu: sohbet kaydedilemedi.', true);
      return false;
    }
  }
}

/* ----------------------------- Yardımcılar ----------------------------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function toast(msg, isError) {
  const node = document.createElement('div');
  node.className = 'toast' + (isError ? ' err' : '');
  node.textContent = msg;
  $('toastWrap').appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s ease, transform .3s ease';
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 320);
  }, isError ? 4800 : 2600);
}

function detectProviderFromKey(key) {
  const k = String(key || '').trim();
  if (k.length < 8) return null;
  for (const [prefix, id] of KEY_PREFIXES) if (k.startsWith(prefix)) return id;
  if (/^sk-[A-Za-z0-9_-]{16,}$/.test(k)) return 'openai';
  return null;
}

function activeSlot() {
  const list = state.apis;
  return list.find((a) => a.sid === state.activeSid) || list[0] || null;
}

function slotReady(slot) {
  if (!slot) return false;
  const cfg = PROVIDERS[slot.provider];
  if (!cfg) return false;
  if (cfg.needsKey !== false && !String(slot.key || '').trim()) return false;
  return true;
}

function modelOf(slot) {
  if (!slot) return '';
  return String(slot.model || '').trim() || PROVIDERS[slot.provider].defaultModel || '';
}

function slotTitle(slot) {
  if (!slot) return 'Model seç';
  const cfg = PROVIDERS[slot.provider];
  return cfg.label + (modelOf(slot) ? ' · ' + modelOf(slot) : '');
}

function ensureActive() {
  if (!state.apis.length) { state.activeSid = null; return; }
  if (!state.apis.some((a) => a.sid === state.activeSid)) {
    state.activeSid = (state.apis.find(slotReady) || state.apis[0]).sid;
    saveState();
  }
}

/* ----------------------------- Tema ----------------------------- */
function resolvedTheme() {
  if (state.theme === 'system') {
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return state.theme === 'light' ? 'light' : 'dark';
}

function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.setAttribute('data-accent', state.accent || 'mor');
  const meta = $('metaTheme');
  if (meta) meta.setAttribute('content', t === 'light' ? '#ffffff' : '#08080c');
  document.querySelectorAll('#themeSeg [data-theme]').forEach((b) => {
    b.classList.toggle('active', b.dataset.theme === state.theme);
  });
  document.querySelectorAll('#accentRow [data-accent]').forEach((b) => {
    b.classList.toggle('active', b.dataset.accent === state.accent);
  });
}

/* ----------------------------- İstek gövdeleri ----------------------------- */
function languagePrompt() {
  const name = LANG_NAMES[state.replyLang] || 'Türkçe';
  return 'Yanıtlarını her zaman ' + name + ' dilinde yaz.';
}

function briefPrompt() {
  return 'Kısa ve öz yaz. Uzun giriş, tekrar ve gereksiz özet yok. Çoğu soruda birkaç cümle ya da en fazla 4-5 kısa madde kullan. ' +
         'Kullanıcı ayrıntı veya adım adım anlatım isterse gerektiği kadar uzun yaz; kod, liste ve adımlar eksik kalmasın.';
}

function systemPrompt(extra) {
  const parts = [];
  if (String(state.systemPrompt || '').trim()) parts.push(String(state.systemPrompt).trim());
  parts.push(languagePrompt());
  if (state.brief) parts.push(briefPrompt());
  if (extra) parts.push(extra);
  return parts.join('\n\n');
}

function imgList(m) {
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

function geminiBody(history, extra) {
  const body = {
    contents: history.map((m) => {
      const parts = [];
      for (const im of imgList(m)) parts.push({ inline_data: { mime_type: mimeOf(im), data: base64Of(im.dataUrl) } });
      if (m.content) parts.push({ text: m.content });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    })
  };
  const sys = systemPrompt(extra);
  if (sys) body.systemInstruction = { parts: [{ text: sys }] };
  body.generationConfig = { temperature: Number(state.temperature), maxOutputTokens: 4096 };
  return body;
}

function openAIBody(model, history, extra) {
  const msgs = history.map((m) => {
    const imgs = imgList(m);
    if (!imgs.length) return { role: m.role, content: m.content };
    const parts = [];
    if (m.content) parts.push({ type: 'text', text: m.content });
    for (const im of imgs) parts.push({ type: 'image_url', image_url: { url: im.dataUrl } });
    return { role: m.role, content: parts };
  });
  const sys = systemPrompt(extra);
  if (sys) msgs.unshift({ role: 'system', content: sys });
  return { model, messages: msgs, stream: true, temperature: Number(state.temperature) };
}

function anthropicBody(model, history, extra) {
  const body = {
    model,
    max_tokens: 4096,
    temperature: Number(state.temperature),
    stream: true,
    messages: history.map((m) => {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      const imgs = imgList(m);
      if (!imgs.length) return { role, content: m.content };
      const content = imgs.map((im) => ({
        type: 'image',
        source: { type: 'base64', media_type: mimeOf(im), data: base64Of(im.dataUrl) }
      }));
      if (m.content) content.push({ type: 'text', text: m.content });
      return { role, content };
    })
  };
  const sys = systemPrompt(extra);
  if (sys) body.system = sys;
  return body;
}

/* ----------------------------- Ağ ----------------------------- */
function authHeaders(cfg, key) {
  const h = {};
  if (cfg.kind === 'anthropic') {
    if (key) h['x-api-key'] = key;
    h['anthropic-version'] = '2023-06-01';
    h['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (key) {
    h.Authorization = 'Bearer ' + key;
  }
  return h;
}

function extraHeaders(base) {
  if (String(base).indexOf('openrouter.ai') !== -1) {
    return { 'HTTP-Referer': location.origin || 'https://localhost', 'X-Title': 'PRIME AI Mobil' };
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
  detail = String(detail || '').slice(0, 220);
  if (res.status === 401 || res.status === 403) return 'Anahtar reddedildi (' + res.status + '). ' + detail;
  if (res.status === 404) return 'Bulunamadı (404). Model adı hatalı olabilir. ' + detail;
  if (res.status === 429) return 'Çok fazla istek (429). Biraz bekleyip yeniden dene. ' + detail;
  return 'HTTP ' + res.status + ' ' + detail;
}

function rankModels(ids, prefer) {
  const score = (m) => {
    const l = m.toLowerCase();
    let s = 0;
    (prefer || []).forEach((p, i) => { if (l.includes(p)) s += (prefer.length - i) * 10; });
    if (/chat|instruct|latest/.test(l)) s += 2;
    if (/embed|whisper|tts|image|vision|audio|rerank|moderation|guard/.test(l)) s -= 60;
    if (/preview|experimental|beta/.test(l)) s -= 3;
    return s;
  };
  return [...new Set(ids)].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
}

async function fetchModels(providerId, key) {
  const cfg = PROVIDERS[providerId];
  const base = cfg.base;
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

async function streamOnce(slot, history, onText, signal, extra) {
  const cfg = PROVIDERS[slot.provider];
  const base = cfg.base;
  const key = String(slot.key || '').trim();
  const model = modelOf(slot);
  if (!model) throw new Error('Model seçilmedi. Ayarlar → API bölümünden model seç.');

  if (cfg.kind === 'gemini') {
    await sseFetch(base + '/models/' + encodeURIComponent(model) + ':streamGenerateContent?alt=sse',
      { 'x-goog-api-key': key }, geminiBody(history, extra), (raw) => {
        let chunk; try { chunk = JSON.parse(raw); } catch { return; }
        const parts = (((chunk.candidates || [])[0] || {}).content || {}).parts || [];
        for (const p of parts) if (p.text) onText(p.text);
      }, signal);
    return;
  }

  if (cfg.kind === 'anthropic') {
    await sseFetch(base + '/messages', authHeaders(cfg, key), anthropicBody(model, history, extra), (raw) => {
      let j; try { j = JSON.parse(raw); } catch { return; }
      if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta' && j.delta.text) onText(j.delta.text);
    }, signal);
    return;
  }

  await sseFetch(base + '/chat/completions', Object.assign(authHeaders(cfg, key), extraHeaders(base)),
    openAIBody(model, history, extra), (raw) => {
      let chunk; try { chunk = JSON.parse(raw); } catch { return; }
      const d = (((chunk.choices || [])[0] || {}).delta) || {};
      if (typeof d.content === 'string') onText(d.content);
    }, signal);
}

function isQuotaError(err) {
  const s = String((err && err.message) || err || '').toLowerCase();
  return /(\b429\b|quota|kota|resource_exhausted|rate[ _-]?limit|too many requests|insufficient_quota|billing|credit balance)/.test(s);
}

async function streamReply(history, onText, signal, extra) {
  const tried = [];
  let emitted = false;
  const emit = (t) => { if (t) emitted = true; onText(t); };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slot = activeSlot();
    if (!slotReady(slot)) {
      throw new Error('API anahtarı yok. Ayarlar → API bölümünden anahtar ekle.');
    }
    try {
      return await streamOnce(slot, history, emit, signal, extra);
    } catch (err) {
      if (signal && signal.aborted) throw err;
      if (!isQuotaError(err) || emitted) throw err;
      tried.push(slot.sid);
      const next = state.apis.find((a) => !tried.includes(a.sid) && slotReady(a) && a.sid !== slot.sid);
      if (!next) throw err;
      state.activeSid = next.sid;
      saveState();
      renderModelChip();
      toast('Kota doldu, ' + PROVIDERS[next.provider].label + ' anahtarına geçildi.');
    }
  }
  throw new Error('Tüm anahtarların kotası doldu. Ayarlar → API bölümünden yeni anahtar ekle.');
}

/* ----------------------------- Markdown ----------------------------- */
function md(src) {
  const blocks = [];
  let text = String(src || '');
  text = text.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push('<pre><button class="copy-code" type="button" data-copy>Kopyala</button><code>' +
      esc(String(code).replace(/\n+$/, '')) + '</code></pre>');
    return '\u0001' + (blocks.length - 1) + '\u0001';
  });

  text = esc(text);
  text = text.replace(/`([^`\n]+)`/g, (_, c) => '<code>' + c + '</code>');
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  text = text.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = text.split('\n');
  const out = [];
  let para = [];
  let list = null;

  const flushPara = () => {
    if (!para.length) return;
    out.push('<p>' + para.join('<br>') + '</p>');
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    out.push('<' + list.tag + '>' + list.items.map((i) => '<li>' + i + '</li>').join('') + '</' + list.tag + '>');
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) { flushPara(); flushList(); continue; }

    const ph = line.trim().match(/^\u0001(\d+)\u0001$/);
    if (ph) { flushPara(); flushList(); out.push(blocks[Number(ph[1])] || ''); continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const level = Math.min(3, h[1].length + 1);
      out.push('<h' + level + '>' + h[2] + '</h' + level + '>');
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara(); flushList();
      out.push('<blockquote>' + line.replace(/^>\s?/, '') + '</blockquote>');
      continue;
    }

    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; }
      list.items.push(ul[1]);
      continue;
    }

    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; }
      list.items.push(ol[1]);
      continue;
    }

    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join('');
}

/* ----------------------------- Sohbet ----------------------------- */
function activeChat() {
  return state.chats.find((c) => c.id === state.activeChatId) || null;
}

function ensureChat() {
  let chat = activeChat();
  if (chat) return chat;
  chat = { id: uid(), title: 'Yeni sohbet', ts: Date.now(), msgs: [] };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  saveState();
  renderChatList();
  return chat;
}

function chatTitleFrom(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? clean.slice(0, 42) + '…' : (clean || 'Yeni sohbet');
}

function renderWelcome() {
  const has = activeChat() && activeChat().msgs.length;
  $('welcome').hidden = !!has;
}

function renderThread() {
  const chat = activeChat();
  const thread = $('thread');
  thread.innerHTML = '';
  renderWelcome();
  if (!chat) return;
  for (const m of chat.msgs) thread.appendChild(messageNode(m));
  scrollToEnd(true);
}

function messageNode(m) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (m.role === 'user' ? 'user' : 'ai');

  if (m.role === 'user') {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const imgs = imgList(m);
    if (imgs.length) {
      const strip = document.createElement('div');
      strip.className = 'img-strip';
      for (const im of imgs) {
        const img = document.createElement('img');
        img.src = im.dataUrl;
        img.alt = 'Eklenen görsel';
        strip.appendChild(img);
      }
      bubble.appendChild(strip);
    }
    if (m.content) {
      const text = document.createElement('div');
      text.textContent = m.content;
      bubble.appendChild(text);
    }
    wrap.appendChild(bubble);
    return wrap;
  }

  const who = document.createElement('div');
  who.className = 'who';
  who.innerHTML = '<i></i>PRIME AI';
  wrap.appendChild(who);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (m.content) bubble.innerHTML = md(m.content);
  else bubble.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
  wrap.appendChild(bubble);

  if (m.content && m.id !== (streaming && streaming.msg && streaming.msg.id)) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 6.5 14"/></svg>Kopyala';
    copy.addEventListener('click', () => copyText(m.content));
    actions.appendChild(copy);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 10a8 8 0 1 1 2.3 6.2"/><path d="M4 4v6h6"/></svg>Yeniden';
    retry.addEventListener('click', () => regenerate(m));
    actions.appendChild(retry);
    wrap.appendChild(actions);
  }
  return wrap;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text || ''));
    toast('Kopyalandı.');
  } catch {
    toast('Kopyalanamadı.', true);
  }
}

function nearBottom() {
  const area = $('chatArea');
  return area.scrollHeight - area.scrollTop - area.clientHeight < 140;
}

function scrollToEnd(force) {
  const area = $('chatArea');
  if (force || nearBottom()) area.scrollTop = area.scrollHeight;
}

function setBusy(on) {
  const send = $('sendBtn');
  send.classList.toggle('stop', on);
  send.innerHTML = on
    ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  send.setAttribute('aria-label', on ? 'Durdur' : 'Gönder');
  $('input').disabled = on;
  $('orb').classList.toggle('busy', on);
  updateSendState();
}

function updateSendState() {
  const send = $('sendBtn');
  if (streaming) { send.disabled = false; return; }
  const text = $('input').value.trim();
  send.disabled = !text && !pendingImages.length;
}

function historyForApi(chat, uptoIndex) {
  const msgs = chat.msgs.slice(0, uptoIndex).slice(-20);
  return msgs.map((m) => ({ role: m.role, content: m.content, images: m.images }))
    .filter((m) => m.content || imgList(m).length);
}

async function sendMessage(text, images, opts) {
  const clean = String(text || '').trim();
  if (!clean && !(images && images.length)) return;
  if (!slotReady(activeSlot())) {
    toast('Önce bir API anahtarı ekle.', true);
    openTutorial(!state.tutorialDone);
    return;
  }

  const chat = ensureChat();
  const userMsg = { role: 'user', content: clean, images: images || [], ts: Date.now() };
  chat.msgs.push(userMsg);
  if (chat.msgs.length === 1) chat.title = chatTitleFrom(clean);
  chat.ts = Date.now();

  const aiMsg = { id: uid(), role: 'assistant', content: '', ts: Date.now() };
  chat.msgs.push(aiMsg);

  $('input').value = '';
  autoGrow();
  pendingImages = [];
  renderAttachments();
  renderThread();
  updateSendState();
  scrollToEnd(true);

  const node = $('thread').lastElementChild;
  const bubble = node ? node.querySelector('.bubble') : null;
  if (bubble) bubble.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';

  saveState();

  const ctrl = new AbortController();
  streaming = { ctrl, chat, msg: aiMsg };
  setBusy(true);

  let raf = 0;
  let lastPaint = 0;
  const paint = (final) => {
    const now = performance.now();
    if (!final && now - lastPaint < 55) {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(false); });
      return;
    }
    lastPaint = now;
    if (bubble) bubble.innerHTML = aiMsg.content ? md(aiMsg.content) : '<span class="dots"><i></i><i></i><i></i></span>';
    scrollToEnd(false);
  };

  let failure = '';
  try {
    await streamReply(historyForApi(chat, chat.msgs.length - 1), (delta) => {
      aiMsg.content += delta;
      paint(false);
    }, ctrl.signal, opts && opts.extra);
    aiMsg.content = aiMsg.content.trim();
    if (!aiMsg.content) aiMsg.content = 'Yanıt gelmedi. Anahtarını ve modelini kontrol edip yeniden dene.';
    saveState();
    cheerOrb();
  } catch (err) {
    const aborted = ctrl.signal.aborted;
    const msg = String((err && err.message) || err);
    if (!aborted) failure = msg;
    aiMsg.content = aiMsg.content.trim();
    if (!aiMsg.content) chat.msgs = chat.msgs.filter((m) => m !== aiMsg);
    saveState();
  } finally {
    streaming = null;
    setBusy(false);
    renderChatList();
    renderModelChip();
    renderThread();
    if (failure) {
      const note = document.createElement('div');
      note.className = 'err-note';
      note.textContent = 'Bağlantı hatası: ' + failure;
      $('thread').appendChild(note);
      const hint = document.createElement('div');
      hint.className = 'err-note';
      hint.style.background = 'none';
      hint.style.border = '0';
      hint.style.padding = '0 2px';
      hint.textContent = 'İpucu: Ayarlar → API bölümünden anahtarı ve modeli kontrol edebilirsin.';
      $('thread').appendChild(hint);
      toast(failure, true);
    }
    scrollToEnd(true);
    updateSendState();
  }
}

function stopStreaming() {
  if (streaming) {
    streaming.ctrl.abort();
    toast('Durduruldu.');
  }
}

function regenerate(msg) {
  const chat = activeChat();
  if (!chat || streaming) return;
  const idx = chat.msgs.indexOf(msg);
  if (idx < 1) return;
  let userIdx = idx - 1;
  while (userIdx >= 0 && chat.msgs[userIdx].role !== 'user') userIdx -= 1;
  if (userIdx < 0) return;
  const userMsg = chat.msgs[userIdx];
  chat.msgs = chat.msgs.slice(0, userIdx);
  saveState();
  renderThread();
  sendMessage(userMsg.content, userMsg.images);
}

/* ----------------------------- Yazma alanı ----------------------------- */
function autoGrow() {
  const ta = $('input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(132, Math.max(44, ta.scrollHeight)) + 'px';
}

/* Tuş sesi — WebAudio, dosya gerekmez. */
let audioCtx = null;
function tick() {
  if (!state.soundOn || Number(state.soundLevel) <= 0) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1250 + Math.random() * 420, t);
    const level = 0.015 + (Number(state.soundLevel) / 100) * 0.075;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch { /* sessizce yok */ }
}

/* ----------------------------- Görsel ekleme ----------------------------- */
function renderAttachments() {
  const row = $('attachRow');
  row.innerHTML = '';
  if (!pendingImages.length) { row.hidden = true; return; }
  row.hidden = false;
  pendingImages.forEach((im, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    const img = document.createElement('img');
    img.src = im.dataUrl;
    img.alt = 'Eklenecek görsel';
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'x';
    x.textContent = '×';
    x.setAttribute('aria-label', 'Görseli kaldır');
    x.addEventListener('click', () => {
      pendingImages.splice(i, 1);
      renderAttachments();
      updateSendState();
    });
    wrap.append(img, x);
    row.appendChild(wrap);
  });
}

async function addImageFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Yalnızca görsel eklenebilir.', true); return; }
  if (pendingImages.length >= 3) { toast('En fazla 3 görsel eklenebilir.'); return; }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = new Image();
  img.src = dataUrl;
  await img.decode().catch(() => {});
  const max = 1280;
  const scale = Math.min(1, max / Math.max(img.width || max, img.height || max));
  let out = dataUrl;
  if (scale < 1 && img.width) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    out = canvas.toDataURL('image/jpeg', 0.86);
  }
  pendingImages.push({ dataUrl: out, mime: out.slice(5, out.indexOf(';')) });
  renderAttachments();
  updateSendState();
}

/* ----------------------------- Sesle yazma ----------------------------- */
let recognizer = null;
function toggleMic() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { toast('Bu tarayıcı sesle yazmayı desteklemiyor.', true); return; }
  const btn = $('micBtn');
  if (recognizer) {
    recognizer.stop();
    recognizer = null;
    btn.classList.remove('listening');
    return;
  }
  try {
    const rec = new Rec();
    rec.lang = ({ tr: 'tr-TR', en: 'en-US', de: 'de-DE', ru: 'ru-RU', ja: 'ja-JP' })[state.replyLang] || 'tr-TR';
    rec.interimResults = true;
    rec.continuous = false;
    const base = $('input').value;
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) text += e.results[i][0].transcript;
      $('input').value = (base ? base + ' ' : '') + text;
      autoGrow();
      updateSendState();
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') toast('Sesle yazma hatası: ' + e.error, true);
    };
    rec.onend = () => {
      recognizer = null;
      btn.classList.remove('listening');
      updateSendState();
    };
    rec.start();
    recognizer = rec;
    btn.classList.add('listening');
  } catch (err) {
    toast('Mikrofon açılamadı.', true);
  }
}

/* ----------------------------- Asistan topu ----------------------------- */
function updateOrb() {
  const orb = $('orb');
  orb.hidden = !state.assistantOn;
  orb.style.setProperty('--orb-size', Number(state.orbSize) + 'px');
  document.documentElement.style.setProperty('--orb-size', Number(state.orbSize) + 'px');
  orb.classList.toggle('no-life', !state.orbLife);
  $('app').classList.toggle('orb-on', !!state.assistantOn);
  if (!state.assistantOn) closeOrbPanel();
}

function measureComposer() {
  const h = $('composerWrap').offsetHeight;
  document.documentElement.style.setProperty('--composer-h', h + 'px');
}

function sparkle() {
  if (!state.orbLife) return;
  const orb = $('orb');
  for (let i = 0; i < 9; i += 1) {
    const s = document.createElement('span');
    s.className = 'spark';
    const angle = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
    const dist = 34 + Math.random() * 26;
    s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    orb.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

function cheerOrb() {
  const orb = $('orb');
  orb.classList.add('cheer');
  sparkle();
  setTimeout(() => orb.classList.remove('cheer'), 950);
}

function ripple() {
  const orb = $('orb');
  const r = document.createElement('span');
  r.className = 'ripple';
  orb.appendChild(r);
  setTimeout(() => r.remove(), 900);
}

function openOrbPanel() {
  if (!state.assistantOn) { toast('Asistan kapalı. Ayarlar → Asistan bölümünden aç.'); return; }
  const panel = $('orbPanel');
  panel.hidden = false;
  measureComposer();
  if (!orbMsgs.length) addOrbMessage('ai', 'Buradayım. Kısa sorularına hemen yanıt veririm.');
  setTimeout(() => $('orbInput').focus(), 120);
}

function closeOrbPanel() {
  $('orbPanel').hidden = true;
}

function addOrbMessage(role, text) {
  orbMsgs.push({ role, content: text });
  const log = $('orbLog');
  const b = document.createElement('div');
  b.className = 'ob ' + (role === 'user' ? 'me' : role === 'sys' ? 'sys' : 'ai');
  if (role === 'ai') b.innerHTML = md(text); else b.textContent = text;
  log.appendChild(b);
  log.scrollTop = log.scrollHeight;
  return b;
}

async function askOrb(text) {
  const clean = String(text || '').trim();
  if (!clean || orbBusy) return;
  if (!slotReady(activeSlot())) { toast('Önce API anahtarı ekle.', true); openTutorial(true); return; }
  const input = $('orbInput');
  input.value = '';
  addOrbMessage('user', clean);
  const ai = addOrbMessage('ai', '');
  ai.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';

  orbBusy = true;
  $('orb').classList.add('thinking');
  const history = orbMsgs.filter((m) => m.role === 'user' || m.role === 'ai')
    .slice(0, -1).slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    let text2 = '';
    await streamReply(history, (d) => {
      text2 += d;
      ai.innerHTML = md(text2) || '<span class="dots"><i></i><i></i><i></i></span>';
      $('orbLog').scrollTop = $('orbLog').scrollHeight;
    }, undefined, 'Asistan olarak çok kısa yanıt ver: en fazla 2-3 cümle. Gereksiz açıklama ekleme.');
    orbMsgs[orbMsgs.length - 1].content = text2.trim() || 'Yanıt gelmedi.';
    ai.innerHTML = md(orbMsgs[orbMsgs.length - 1].content);
    cheerOrb();
  } catch (err) {
    ai.textContent = 'Hata: ' + String((err && err.message) || err);
    orbMsgs.pop();
    $('orb').classList.remove('thinking');
  } finally {
    orbBusy = false;
    $('orb').classList.remove('thinking');
    $('orbLog').scrollTop = $('orbLog').scrollHeight;
  }
}

/* ----------------------------- Çekmece ----------------------------- */
function openDrawer() {
  $('drawer').hidden = false;
  $('scrim').hidden = false;
  renderChatList();
}

function closeDrawer() {
  $('drawer').hidden = true;
  $('scrim').hidden = true;
}

function renderChatList() {
  const list = $('chatList');
  list.innerHTML = '';
  const chats = [...state.chats].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (!chats.length) {
    const empty = document.createElement('p');
    empty.className = 'chat-empty';
    empty.textContent = 'Henüz sohbet yok.';
    list.appendChild(empty);
    return;
  }
  for (const chat of chats) {
    const row = document.createElement('div');
    row.className = 'chat-item' + (chat.id === state.activeChatId ? ' active' : '');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'flex:1;display:flex;gap:8px;align-items:center;min-width:0;text-align:left;';
    const title = document.createElement('span');
    title.textContent = chat.title || 'Sohbet';
    btn.appendChild(title);
    btn.addEventListener('click', () => {
      state.activeChatId = chat.id;
      saveState();
      renderThread();
      renderChatList();
      closeDrawer();
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.setAttribute('aria-label', 'Sohbeti sil');
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12"/></svg>';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      state.chats = state.chats.filter((c) => c.id !== chat.id);
      if (state.activeChatId === chat.id) state.activeChatId = state.chats[0] ? state.chats[0].id : null;
      saveState();
      renderChatList();
      renderThread();
    });
    row.append(btn, del);
    list.appendChild(row);
  }
}

function newChat() {
  state.activeChatId = null;
  saveState();
  $('thread').innerHTML = '';
  $('welcome').hidden = false;
  renderChatList();
  closeDrawer();
  setTimeout(() => $('input').focus(), 120);
}

/* ----------------------------- Model rozeti ----------------------------- */
function renderModelChip() {
  const slot = activeSlot();
  const dot = $('modelDot');
  const text = $('modelChipText');
  if (!slot) {
    text.textContent = 'Model seç';
    dot.className = 'model-dot';
    return;
  }
  text.textContent = slotTitle(slot);
  dot.className = 'model-dot ' + (slotReady(slot) ? 'live' : 'warn');
}

/* ----------------------------- Ayarlar ----------------------------- */
function openSettings() {
  closeDrawer();
  closeOrbPanel();
  $('settings').hidden = false;
  syncSettingsUI();
}

function closeSettings() {
  $('settings').hidden = true;
}

function syncSettingsUI() {
  $('nameInput').value = state.name || '';
  $('profileAvatar').textContent = initialOf(state.name);
  $('drawerAvatar').textContent = initialOf(state.name);
  $('drawerName').textContent = state.name ? state.name : 'PRIME AI';
  applyTheme();
  $('assistantOn').checked = !!state.assistantOn;
  $('orbSize').value = String(state.orbSize);
  $('orbLife').checked = !!state.orbLife;
  $('briefOn').checked = !!state.brief;
  $('replyLang').value = state.replyLang;
  $('temperature').value = String(state.temperature);
  $('tempValue').textContent = Number(state.temperature).toFixed(1).replace('.', ',');
  $('systemPrompt').value = state.systemPrompt || '';
  $('soundOn').checked = !!state.soundOn;
  $('soundLevel').value = String(state.soundLevel);
  $('soundValue').textContent = '%' + state.soundLevel;
  $('versionText').textContent = 'Sürüm ' + VERSION;
  renderApiList();
}

function initialOf(name) {
  const s = String(name || '').trim();
  return s ? s[0].toLocaleUpperCase('tr-TR') : 'P';
}

function renderApiList() {
  const wrap = $('apiList');
  wrap.innerHTML = '';
  $('apiEmpty').hidden = state.apis.length > 0;
  ensureActive();
  for (const slot of state.apis) {
    const cfg = PROVIDERS[slot.provider];
    const item = document.createElement('div');
    item.className = 'api-item' + (slot.sid === state.activeSid ? ' active' : '');

    const badge = document.createElement('span');
    badge.className = 'api-badge';
    badge.textContent = cfg.badge;

    const meta = document.createElement('span');
    meta.className = 'api-meta';
    const strong = document.createElement('strong');
    strong.textContent = cfg.label;
    const sub = document.createElement('span');
    sub.textContent = (modelOf(slot) || 'model seçilmedi') + ' · ' + maskKey(slot.key);
    meta.append(strong, sub);

    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'use';
    use.textContent = slot.sid === state.activeSid ? 'Etkin' : 'Kullan';
    use.addEventListener('click', () => {
      state.activeSid = slot.sid;
      saveState();
      renderApiList();
      renderModelChip();
      toast(cfg.label + ' etkin.');
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.setAttribute('aria-label', cfg.label + ' anahtarını sil');
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12"/></svg>';
    del.addEventListener('click', () => {
      state.apis = state.apis.filter((a) => a.sid !== slot.sid);
      if (state.activeSid === slot.sid) state.activeSid = state.apis[0] ? state.apis[0].sid : null;
      saveState();
      renderApiList();
      renderModelChip();
      toast('Anahtar silindi.');
    });

    item.append(badge, meta, use, del);
    wrap.appendChild(item);
  }
}

function maskKey(key) {
  const k = String(key || '');
  if (!k) return 'anahtarsız';
  if (k.length <= 12) return '••••';
  return k.slice(0, 4) + '••••' + k.slice(-4);
}

/* ----------------------------- API formu ----------------------------- */
function fillProviderSelect() {
  const sel = $('apiProvider');
  sel.innerHTML = '';
  for (const id of Object.keys(PROVIDERS)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = PROVIDERS[id].label;
    sel.appendChild(opt);
  }
  sel.value = 'gemini';
}

function providerHint(id) {
  const cfg = PROVIDERS[id];
  $('apiHint').innerHTML = cfg.keyUrl
    ? esc(cfg.keyHint) + ' <a href="' + cfg.keyUrl + '" target="_blank" rel="noopener">' + esc(cfg.keyUrlLabel) + '</a>'
    : esc(cfg.keyHint);
}

async function saveApiFromForm() {
  const provider = $('apiProvider').value;
  const key = $('apiKey').value.trim();
  const model = $('apiModel').value || '';
  const cfg = PROVIDERS[provider];
  const msg = $('apiFormMsg');

  if (cfg.needsKey !== false && !key) {
    msg.textContent = 'API anahtarı gerekli.';
    msg.className = 'hint bad';
    return;
  }

  let slot = state.apis.find((a) => a.provider === provider && a.key === key);
  if (!slot) {
    slot = { sid: uid(), provider, key, model: model || cfg.defaultModel || '' };
    state.apis.push(slot);
  } else if (model) {
    slot.model = model;
  }
  state.activeSid = slot.sid;
  saveState();
  renderApiList();
  renderModelChip();
  $('apiKey').value = '';
  msg.textContent = 'Kaydedildi: ' + cfg.label + '.';
  msg.className = 'hint good';
  toast('Anahtar kaydedildi.');
}

async function fetchModelsInto(selectEl, provider, key, msgEl) {
  const btn = $('fetchModelsBtn');
  if (btn) btn.disabled = true;
  if (msgEl) { msgEl.textContent = 'Modeller getiriliyor…'; msgEl.className = 'hint'; }
  try {
    const models = await fetchModels(provider, key);
    selectEl.innerHTML = '';
    for (const m of models) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      selectEl.appendChild(opt);
    }
    const cfg = PROVIDERS[provider];
    const prefer = cfg.defaultModel;
    if (prefer && models.includes(prefer)) selectEl.value = prefer;
    selectEl.closest('.model-field')?.removeAttribute('hidden');
    if (msgEl) { msgEl.textContent = models.length + ' model bulundu.'; msgEl.className = 'hint good'; }
    return models;
  } catch (err) {
    if (msgEl) { msgEl.textContent = String((err && err.message) || err); msgEl.className = 'hint bad'; }
    return [];
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ----------------------------- Ayar bağlantıları ----------------------------- */
function wireSettings() {
  $('nameInput').addEventListener('input', (e) => {
    state.name = e.target.value.slice(0, 32);
    saveState();
    const initial = initialOf(state.name);
    $('profileAvatar').textContent = initial;
    $('drawerAvatar').textContent = initial;
    $('avatarBtn').textContent = initial;
    $('drawerName').textContent = state.name || 'PRIME AI';
    updateGreeting();
  });

  document.querySelectorAll('#themeSeg [data-theme]').forEach((b) => {
    b.addEventListener('click', () => {
      state.theme = b.dataset.theme;
      saveState();
      applyTheme();
    });
  });

  const accents = $('accentRow');
  for (const acc of ACCENTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.accent = acc.id;
    b.setAttribute('aria-label', acc.name);
    b.innerHTML = '<span style="background:linear-gradient(140deg,var(--a1),var(--a2))"></span>';
    b.style.setProperty('--a1', accentPair(acc.id)[0]);
    b.style.setProperty('--a2', accentPair(acc.id)[1]);
    b.addEventListener('click', () => {
      state.accent = acc.id;
      saveState();
      applyTheme();
    });
    accents.appendChild(b);
  }

  $('assistantOn').addEventListener('change', (e) => {
    state.assistantOn = e.target.checked;
    saveState();
    updateOrb();
    measureComposer();
    toast(state.assistantOn ? 'Asistan ekranda.' : 'Asistan gizlendi.');
  });

  $('orbSize').addEventListener('input', (e) => {
    state.orbSize = Number(e.target.value);
    saveState();
    updateOrb();
  });

  $('orbLife').addEventListener('change', (e) => {
    state.orbLife = e.target.checked;
    saveState();
    updateOrb();
  });

  $('briefOn').addEventListener('change', (e) => {
    state.brief = e.target.checked;
    saveState();
  });

  $('replyLang').addEventListener('change', (e) => {
    state.replyLang = e.target.value;
    saveState();
  });

  $('temperature').addEventListener('input', (e) => {
    state.temperature = Number(e.target.value);
    $('tempValue').textContent = Number(state.temperature).toFixed(1).replace('.', ',');
    saveState();
  });

  $('systemPrompt').addEventListener('change', (e) => {
    state.systemPrompt = e.target.value.slice(0, 600);
    saveState();
  });

  $('soundOn').addEventListener('change', (e) => {
    state.soundOn = e.target.checked;
    saveState();
    if (state.soundOn) tick();
  });
  $('soundLevel').addEventListener('input', (e) => {
    state.soundLevel = Number(e.target.value);
    $('soundValue').textContent = '%' + state.soundLevel;
    saveState();
  });
  $('soundLevel').addEventListener('change', tick);

  $('apiProvider').addEventListener('change', (e) => {
    providerHint(e.target.value);
    $('modelField').hidden = true;
    $('apiFormMsg').textContent = '';
  });

  $('fetchModelsBtn').addEventListener('click', async () => {
    const provider = $('apiProvider').value;
    const key = $('apiKey').value.trim();
    if (PROVIDERS[provider].needsKey !== false && !key) {
      $('apiFormMsg').textContent = 'Önce anahtarı yapıştır.';
      $('apiFormMsg').className = 'hint bad';
      return;
    }
    await fetchModelsInto($('apiModel'), provider, key, $('apiFormMsg'));
  });

  $('saveApiBtn').addEventListener('click', saveApiFromForm);

  $('retestBtn').addEventListener('click', async () => {
    const slot = activeSlot();
    const out = $('testResult');
    if (!slot) { out.textContent = 'Önce anahtar ekle.'; return; }
    out.textContent = 'Deneniyor…';
    try {
      const models = await fetchModels(slot.provider, slot.key);
      out.textContent = 'Bağlantı çalışıyor · ' + models.length + ' model';
      toast('Bağlantı çalışıyor.');
    } catch (err) {
      out.textContent = 'Başarısız: ' + String((err && err.message) || err).slice(0, 90);
      toast('Bağlantı kurulamadı.', true);
    }
  });

  $('openTutorial').addEventListener('click', () => openTutorial(true));
  $('tutorialAgain').addEventListener('click', () => openTutorial(true));

  $('clearChatsBtn').addEventListener('click', () => {
    if (!confirm('Tüm sohbetler silinsin mi?')) return;
    state.chats = [];
    state.activeChatId = null;
    saveState();
    renderThread();
    renderChatList();
    toast('Sohbetler silindi.');
  });

  $('resetAllBtn').addEventListener('click', () => {
    if (!confirm('Ayarlar, anahtarlar ve sohbetler silinsin mi? Bu işlem geri alınamaz.')) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });
}

function accentPair(id) {
  const map = {
    kirmizi: ['#e11d48', '#ff5f3a'],
    alev: ['#ff3b30', '#ff9500'],
    gunbatimi: ['#f43f5e', '#f59e0b'],
    okyanus: ['#2563eb', '#06b6d4'],
    orman: ['#059669', '#84cc16'],
    mor: ['#7c3aed', '#ec4899'],
    altin: ['#d97706', '#fbbf24'],
    buz: ['#0284c7', '#8b5cf6']
  };
  return map[id] || map.mor;
}

/* ----------------------------- İlk açılış rehberi ----------------------------- */
function setTutStep(n) {
  tutStep = Math.max(1, Math.min(4, n));
  document.querySelectorAll('.tut-step').forEach((s) => { s.hidden = Number(s.dataset.step) !== tutStep; });
  document.querySelectorAll('#tutDots i').forEach((d, i) => d.classList.toggle('on', i === tutStep - 1));
  $('tutNext').textContent = tutStep === 4 ? 'Başla' : 'Devam';
  $('tutSkip').hidden = tutStep === 4;
  document.querySelector('.tut-body').scrollTop = 0;
}

function openTutorial(force) {
  closeDrawer();
  $('settings').hidden = true;
  $('tutorial').hidden = false;
  tutSlot = state.apis[0] || null;
  $('tutKey').value = '';
  $('tutKeyMsg').textContent = 'Anahtar yalnızca bu telefonda saklanır.';
  $('tutKeyMsg').className = 'hint';
  $('tutModelField').hidden = true;
  $('tutFetchMsg').textContent = 'İnternet yoksa varsayılan modelle devam edebilirsin.';
  $('tutFetchMsg').className = 'hint';
  $('tutAssistant').checked = !!state.assistantOn;
  setTutStep(1);
  if (!force && state.tutorialDone) closeTutorial();
}

function closeTutorial() {
  $('tutorial').hidden = true;
  updateOrb();
  measureComposer();
  setTimeout(() => $('input').focus(), 100);
}

function finishTutorial() {
  state.tutorialDone = true;
  const on = $('tutAssistant').checked;
  if (on !== state.assistantOn) {
    state.assistantOn = on;
    saveState();
  }
  saveState();
  closeTutorial();
  renderModelChip();
  renderApiList();
  toast('Hazır. Bir şey sorabilirsin.');
}

async function tutorialNext() {
  if (tutStep === 2) {
    const raw = $('tutKey').value.trim();
    if (raw) {
      const provider = detectProviderFromKey(raw) || $('apiProvider').value || 'gemini';
      const existing = state.apis.find((a) => a.key === raw && a.provider === provider);
      tutSlot = existing || { sid: uid(), provider, key: raw, model: PROVIDERS[provider].defaultModel || '' };
      if (!existing) state.apis.push(tutSlot);
      state.activeSid = tutSlot.sid;
      saveState();
      renderApiList();
      renderModelChip();
      $('tutKeyMsg').textContent = PROVIDERS[provider].label + ' anahtarı eklendi.';
      $('tutKeyMsg').className = 'hint good';
      $('tutFetch').disabled = false;
    }
    setTutStep(3);
    return;
  }

  if (tutStep === 3) {
    if (tutSlot && $('tutModel').value && !$('tutModelField').hidden) {
      tutSlot.model = $('tutModel').value;
      state.activeSid = tutSlot.sid;
      saveState();
    }
    setTutStep(4);
    return;
  }

  if (tutStep === 4) { finishTutorial(); return; }
  setTutStep(tutStep + 1);
}

function wireTutorial() {
  $('tutNext').addEventListener('click', tutorialNext);
  $('tutSkip').addEventListener('click', () => { state.tutorialDone = true; saveState(); closeTutorial(); });
  $('tutorialClose').addEventListener('click', () => { state.tutorialDone = true; saveState(); closeTutorial(); });

  $('tutOther').addEventListener('click', () => {
    $('settings').hidden = false;
    closeTutorial();
    openSettings();
    $('apiAdd').open = true;
    $('apiAdd').scrollIntoView({ behavior: 'smooth' });
  });

  $('tutFetch').addEventListener('click', async () => {
    if (!tutSlot) {
      $('tutFetchMsg').textContent = 'Önce 2. adımda anahtar yapıştır.';
      $('tutFetchMsg').className = 'hint bad';
      return;
    }
    $('tutFetch').disabled = true;
    $('tutFetchMsg').textContent = 'Modeller getiriliyor…';
    try {
      const models = await fetchModels(tutSlot.provider, tutSlot.key);
      const sel = $('tutModel');
      sel.innerHTML = '';
      for (const m of models) {
        const o = document.createElement('option');
        o.value = m;
        o.textContent = m;
        sel.appendChild(o);
      }
      if (tutSlot.model && models.includes(tutSlot.model)) sel.value = tutSlot.model;
      $('tutModelField').hidden = false;
      $('tutFetchMsg').textContent = models.length + ' model bulundu.';
      $('tutFetchMsg').className = 'hint good';
    } catch (err) {
      const cfg = PROVIDERS[tutSlot.provider];
      if (cfg.defaultModel) {
        const sel = $('tutModel');
        sel.innerHTML = '<option value="' + esc(cfg.defaultModel) + '">' + esc(cfg.defaultModel) + '</option>';
        $('tutModelField').hidden = false;
        $('tutFetchMsg').textContent = 'Liste alınamadı; varsayılan model seçildi.';
        $('tutFetchMsg').className = 'hint';
      } else {
        $('tutFetchMsg').textContent = String((err && err.message) || err);
        $('tutFetchMsg').className = 'hint bad';
      }
    } finally {
      $('tutFetch').disabled = false;
    }
  });
}

/* ----------------------------- Arayüz bağlantıları ----------------------------- */
function updateGreeting() {
  const name = String(state.name || '').trim();
  $('greeting').textContent = name ? 'Merhaba, ' + name : 'Merhaba';
}
function updateBrand() {
  $('brandTitle').textContent = 'PRIME AI';
}

function wireChrome() {
  $('menuBtn').addEventListener('click', openDrawer);
  $('scrim').addEventListener('click', closeDrawer);
  $('newChatBtn').addEventListener('click', newChat);
  $('drawerSettings').addEventListener('click', () => { closeDrawer(); openSettings(); });
  $('drawerAbout').addEventListener('click', () => {
    closeDrawer();
    openSettings();
    $('settings').querySelector('.sheet-body').scrollTop = 99999;
  });
  $('avatarBtn').addEventListener('click', openSettings);
  $('settingsBack').addEventListener('click', closeSettings);

  $('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    if (streaming) { stopStreaming(); return; }
    sendMessage($('input').value, pendingImages.slice());
  });

  $('input').addEventListener('input', () => {
    autoGrow();
    updateSendState();
    tick();
  });
  $('input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (streaming) return;
      sendMessage($('input').value, pendingImages.slice());
    }
  });

  $('attachBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) await addImageFile(file);
  });

  $('micBtn').addEventListener('click', toggleMic);

  $('modelChip').addEventListener('click', () => {
    openSettings();
    $('apiCard').scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  document.querySelectorAll('#chipWrap .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt || '';
      const input = $('input');
      input.value = prompt;
      autoGrow();
      updateSendState();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });

  $('orb').addEventListener('click', () => {
    ripple();
    if (!$('orbPanel').hidden) closeOrbPanel(); else openOrbPanel();
  });
  $('orbClose').addEventListener('click', closeOrbPanel);
  $('orbForm').addEventListener('submit', (e) => {
    e.preventDefault();
    askOrb($('orbInput').value);
  });

  $('thread').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const pre = btn.closest('pre');
    const code = pre ? pre.querySelector('code') : null;
    if (code) copyText(code.textContent);
  });

  $('chatArea').addEventListener('scroll', () => { /* kaydırma konumu korunur */ });

  const ro = new ResizeObserver(() => measureComposer());
  ro.observe($('composerWrap'));
}

/* ----------------------------- PWA ----------------------------- */
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ----------------------------- Başlangıç ----------------------------- */
function boot() {
  ensureActive();
  updateBrand();
  updateGreeting();
  applyTheme();
  fillProviderSelect();
  providerHint('gemini');
  wireChrome();
  wireSettings();
  wireTutorial();
  updateOrb();
  measureComposer();
  renderModelChip();
  renderThread();
  renderChatList();
  renderAttachments();
  updateSendState();
  autoGrow();

  if (matchMedia('(prefers-color-scheme: light)').matches) applyTheme();
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (state.theme === 'system') applyTheme();
  });

  if (window.visualViewport) {
    const fit = () => {
      if (window.visualViewport.height) {
        document.documentElement.style.setProperty('--app-h', window.visualViewport.height + 'px');
      }
      measureComposer();
    };
    window.visualViewport.addEventListener('resize', fit);
    fit();
  }

  registerSW();

  setTimeout(() => {
    if (!state.tutorialDone) openTutorial(true);
    else if (!slotReady(activeSlot())) toast('Başlamak için Ayarlar → API bölümünden anahtar ekle.');
  }, 350);
}

document.addEventListener('DOMContentLoaded', boot);
