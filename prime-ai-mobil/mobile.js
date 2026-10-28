/* ============================================================
   PRIME AI Mobil — uygulama mantığı
   Sohbet, çoklu sağlayıcı API, asistan topu, ayarlar ve
   ilk açılış API rehberi. Sunucu yok: her şey bu cihazda.
   ============================================================ */
'use strict';

const VERSION = '1.5.1';
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

/* ----------------------------- Diller -----------------------------
   İlk kurulumda rehberden önce dil ekranı açılır. Seçilen dil rehberin
   metinlerini ve yanıt dilini belirler; Ayarlar → Dil’den değiştirilebilir.
   Desteklenen diller masaüstü sürümüyle aynıdır. */
const MOB_LANG_LIST = ['tr', 'en', 'de', 'ru', 'ja'];
const LANG_CODE_LABEL = { tr: 'TR', en: 'EN', de: 'DE', ru: 'RU', ja: 'JA' };

const MOB_I18N = {
  tr: {
    langTitle: 'Dil seç',
    langLead: 'Rehber ve yanıtlar bu dilde olacak. Sonra Ayarlar’dan değiştirebilirsin.',
    langCancel: 'Vazgeç',
    tut1Title: 'PRIME AI’ya hoş geldin',
    tut1Lead: 'Telefonunda çalışan yapay zekâ asistanı. Üç adımda hazır:',
    tut1List: '<li><b>Kendi anahtarın</b> — ücretsiz Gemini anahtarı yeter.</li>' +
      '<li><b>Asistan hep yanında</b> — ekrandaki topla konuş.</li>' +
      '<li><b>Gizli</b> — sohbetler cihazından çıkmaz.</li>',
    tut2Title: 'API anahtarını ekle',
    tut2Lead: 'Anahtar, yapay zekânın senin adına çalışmasını sağlar. Google AI Studio’da ücretsiz:',
    tut2Steps: '<li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> adresini aç.</li>' +
      '<li>“Create API key” düğmesine dokun, Google hesabınla giriş yap.</li>' +
      '<li>Oluşan <b>AIza…</b> ile başlayan anahtarı kopyala.</li>',
    tut2Btn: 'Anahtar sayfasını aç',
    tut2Field: 'Anahtarı buraya yapıştır',
    tut2Hint: 'Anahtar yalnızca bu telefonda saklanır.',
    tut2Alt: 'Başka bir sağlayıcı mı kullanıyorsun?',
    tut2AltBtn: 'Listeden seç',
    tut3Title: 'Modeli seç',
    tut3Lead: 'Anahtarınla kullanabileceğin modeller listelenir. Hızlı ve ücretsiz olan iyi bir başlangıç.',
    tut3Fetch: 'Modelleri getir',
    tut3Hint: 'İnternet yoksa varsayılan modelle devam edebilirsin.',
    tut3Field: 'Model',
    tut4Title: 'Hazırsın',
    tut4Lead: 'Asistan topu ekranda dursun mu? Dilediğin zaman Ayarlar → Asistan’dan değiştirebilirsin.',
    tut4Switch: 'Asistan tuşu ana ekranda olsun',
    tut4SwitchSub: 'Uygulama kapanır, top ana ekranda durur',
    tut4Tip: 'İpucu: Tarayıcı menüsünden “Ana ekrana ekle” dersen uygulama gibi açılır.',
    next: 'Devam',
    start: 'Başla',
    skip: 'Şimdilik atla',
    keyOnlyDevice: 'Anahtar yalnızca bu telefonda saklanır.',
    keyAdded: '{p} anahtarı eklendi.',
    needKey: 'Önce 2. adımda anahtar yapıştır.',
    modelsLoading: 'Modeller getiriliyor…',
    modelsFound: '{n} model bulundu.',
    modelsFallback: 'Liste alınamadı; varsayılan model seçildi.',
    ready: 'Hazır. Bir şey sorabilirsin.',
    noKeyToast: 'Başlamak için Ayarlar → API bölümünden anahtar ekle.'
  },
  en: {
    langTitle: 'Choose your language',
    langLead: 'The guide and replies will use this language. You can change it later in Settings.',
    langCancel: 'Cancel',
    tut1Title: 'Welcome to PRIME AI',
    tut1Lead: 'An AI assistant that runs on your phone. Ready in three steps:',
    tut1List: '<li><b>Your own key</b> — a free Gemini key is enough.</li>' +
      '<li><b>Always with you</b> — talk to the orb on your screen.</li>' +
      '<li><b>Private</b> — chats never leave your device.</li>',
    tut2Title: 'Add your API key',
    tut2Lead: 'The key lets the AI work for you. It is free on Google AI Studio:',
    tut2Steps: '<li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>.</li>' +
      '<li>Tap “Create API key” and sign in with your Google account.</li>' +
      '<li>Copy the key that starts with <b>AIza…</b>.</li>',
    tut2Btn: 'Open the key page',
    tut2Field: 'Paste your key here',
    tut2Hint: 'The key is stored only on this phone.',
    tut2Alt: 'Using another provider?',
    tut2AltBtn: 'Pick from the list',
    tut3Title: 'Choose a model',
    tut3Lead: 'These are the models your key can use. A fast free one is a good start.',
    tut3Fetch: 'Fetch models',
    tut3Hint: 'No internet? You can continue with the default model.',
    tut3Field: 'Model',
    tut4Title: 'You are ready',
    tut4Lead: 'Keep the assistant orb on your screen? You can change this anytime in Settings → Assistant.',
    tut4Switch: 'Show the assistant key on the home screen',
    tut4SwitchSub: 'The app closes and the orb stays on your home screen',
    tut4Tip: 'Tip: “Add to Home screen” in your browser menu opens it like an app.',
    next: 'Continue',
    start: 'Start',
    skip: 'Skip for now',
    keyOnlyDevice: 'The key is stored only on this phone.',
    keyAdded: '{p} key added.',
    needKey: 'Paste your key in step 2 first.',
    modelsLoading: 'Fetching models…',
    modelsFound: '{n} models found.',
    modelsFallback: 'Could not load the list; the default model is selected.',
    ready: 'Ready. Ask me anything.',
    noKeyToast: 'Add a key in Settings → API to get started.'
  },
  de: {
    langTitle: 'Sprache wählen',
    langLead: 'Anleitung und Antworten nutzen diese Sprache. Du kannst sie später in den Einstellungen ändern.',
    langCancel: 'Abbrechen',
    tut1Title: 'Willkommen bei PRIME AI',
    tut1Lead: 'Ein KI-Assistent, der auf deinem Handy läuft. In drei Schritten bereit:',
    tut1List: '<li><b>Eigener Schlüssel</b> — ein kostenloser Gemini-Schlüssel genügt.</li>' +
      '<li><b>Immer dabei</b> — sprich mit der Kugel auf dem Bildschirm.</li>' +
      '<li><b>Privat</b> — Chats verlassen dein Gerät nicht.</li>',
    tut2Title: 'API-Schlüssel hinzufügen',
    tut2Lead: 'Der Schlüssel lässt die KI für dich arbeiten. Bei Google AI Studio kostenlos:',
    tut2Steps: '<li>Öffne <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>.</li>' +
      '<li>Tippe auf „Create API key“ und melde dich mit deinem Google-Konto an.</li>' +
      '<li>Kopiere den Schlüssel, der mit <b>AIza…</b> beginnt.</li>',
    tut2Btn: 'Schlüsselseite öffnen',
    tut2Field: 'Schlüssel hier einfügen',
    tut2Hint: 'Der Schlüssel wird nur auf diesem Handy gespeichert.',
    tut2Alt: 'Anderer Anbieter?',
    tut2AltBtn: 'Aus der Liste wählen',
    tut3Title: 'Modell wählen',
    tut3Lead: 'Diese Modelle kannst du mit deinem Schlüssel nutzen. Ein schnelles kostenloses ist ein guter Start.',
    tut3Fetch: 'Modelle laden',
    tut3Hint: 'Kein Internet? Du kannst mit dem Standardmodell fortfahren.',
    tut3Field: 'Modell',
    tut4Title: 'Alles bereit',
    tut4Lead: 'Soll die Assistenten-Kugel auf dem Bildschirm bleiben? Jederzeit unter Einstellungen → Assistent änderbar.',
    tut4Switch: 'Assistenten-Taste auf dem Home-Bildschirm',
    tut4SwitchSub: 'Die App schließt, die Kugel bleibt auf dem Home-Bildschirm',
    tut4Tip: 'Tipp: „Zum Startbildschirm hinzufügen“ im Browsermenü öffnet sie wie eine App.',
    next: 'Weiter',
    start: 'Start',
    skip: 'Erstmal überspringen',
    keyOnlyDevice: 'Der Schlüssel wird nur auf diesem Handy gespeichert.',
    keyAdded: '{p}-Schlüssel hinzugefügt.',
    needKey: 'Füge zuerst in Schritt 2 einen Schlüssel ein.',
    modelsLoading: 'Modelle werden geladen…',
    modelsFound: '{n} Modelle gefunden.',
    modelsFallback: 'Liste nicht abrufbar; das Standardmodell ist gewählt.',
    ready: 'Fertig. Frag mich etwas.',
    noKeyToast: 'Füge unter Einstellungen → API einen Schlüssel hinzu.'
  },
  ru: {
    langTitle: 'Выберите язык',
    langLead: 'Инструкция и ответы будут на этом языке. Позже его можно сменить в настройках.',
    langCancel: 'Отмена',
    tut1Title: 'Добро пожаловать в PRIME AI',
    tut1Lead: 'ИИ-ассистент, работающий на вашем телефоне. Готов за три шага:',
    tut1List: '<li><b>Свой ключ</b> — достаточно бесплатного ключа Gemini.</li>' +
      '<li><b>Всегда рядом</b> — говорите с шаром на экране.</li>' +
      '<li><b>Приватно</b> — чаты не покидают устройство.</li>',
    tut2Title: 'Добавьте API-ключ',
    tut2Lead: 'Ключ позволяет ИИ работать за вас. В Google AI Studio он бесплатный:',
    tut2Steps: '<li>Откройте <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>.</li>' +
      '<li>Нажмите «Create API key» и войдите в аккаунт Google.</li>' +
      '<li>Скопируйте ключ, начинающийся с <b>AIza…</b>.</li>',
    tut2Btn: 'Открыть страницу ключа',
    tut2Field: 'Вставьте ключ сюда',
    tut2Hint: 'Ключ хранится только на этом телефоне.',
    tut2Alt: 'Другой провайдер?',
    tut2AltBtn: 'Выбрать из списка',
    tut3Title: 'Выберите модель',
    tut3Lead: 'Здесь модели, доступные с вашим ключом. Быстрая бесплатная — хороший старт.',
    tut3Fetch: 'Загрузить модели',
    tut3Hint: 'Нет интернета? Можно продолжить с моделью по умолчанию.',
    tut3Field: 'Модель',
    tut4Title: 'Всё готово',
    tut4Lead: 'Оставить шар ассистента на экране? Это можно изменить в Настройки → Ассистент.',
    tut4Switch: 'Клавиша ассистента на главном экране',
    tut4SwitchSub: 'Приложение закроется, шар останется на главном экране',
    tut4Tip: 'Совет: «Добавить на главный экран» в меню браузера открывает её как приложение.',
    next: 'Далее',
    start: 'Начать',
    skip: 'Пропустить',
    keyOnlyDevice: 'Ключ хранится только на этом телефоне.',
    keyAdded: 'Ключ {p} добавлен.',
    needKey: 'Сначала вставьте ключ на шаге 2.',
    modelsLoading: 'Загружаем модели…',
    modelsFound: 'Найдено моделей: {n}.',
    modelsFallback: 'Список не загрузился; выбрана модель по умолчанию.',
    ready: 'Готово. Спросите что угодно.',
    noKeyToast: 'Добавьте ключ в Настройки → API, чтобы начать.'
  },
  ja: {
    langTitle: '言語を選択',
    langLead: 'ガイドと返答はこの言語になります。あとで設定から変更できます。',
    langCancel: 'キャンセル',
    tut1Title: 'PRIME AI へようこそ',
    tut1Lead: 'スマホで動くAIアシスタント。3ステップで準備完了：',
    tut1List: '<li><b>自分のキー</b> — 無料のGeminiキーで十分です。</li>' +
      '<li><b>いつも手元に</b> — 画面のオーブに話しかけてください。</li>' +
      '<li><b>プライベート</b> — チャットは端末から出ません。</li>',
    tut2Title: 'APIキーを追加',
    tut2Lead: 'キーがあるとAIがあなたの代わりに動きます。Google AI Studioなら無料：',
    tut2Steps: '<li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> を開きます。</li>' +
      '<li>「Create API key」をタップし、Googleアカウントでログインします。</li>' +
      '<li><b>AIza…</b> で始まるキーをコピーします。</li>',
    tut2Btn: 'キーのページを開く',
    tut2Field: 'ここにキーを貼り付け',
    tut2Hint: 'キーはこのスマホにだけ保存されます。',
    tut2Alt: '別のプロバイダーを使いますか？',
    tut2AltBtn: '一覧から選ぶ',
    tut3Title: 'モデルを選択',
    tut3Lead: 'キーで使えるモデルが表示されます。速くて無料のものが始めやすいです。',
    tut3Fetch: 'モデルを取得',
    tut3Hint: 'ネットがない場合は既定のモデルで続けられます。',
    tut3Field: 'モデル',
    tut4Title: '準備完了',
    tut4Lead: 'アシスタントのオーブを画面に残しますか？ 設定 → アシスタント でいつでも変更できます。',
    tut4Switch: 'ホーム画面にアシスタントキーを置く',
    tut4SwitchSub: 'アプリは閉じ、オーブはホーム画面に残ります',
    tut4Tip: 'ヒント：ブラウザメニューの「ホーム画面に追加」でアプリのように開けます。',
    next: '次へ',
    start: '開始',
    skip: '今はスキップ',
    keyOnlyDevice: 'キーはこのスマホにだけ保存されます。',
    keyAdded: '{p} のキーを追加しました。',
    needKey: '先にステップ2でキーを貼り付けてください。',
    modelsLoading: 'モデルを取得中…',
    modelsFound: '{n} 件のモデルが見つかりました。',
    modelsFallback: '一覧を取得できませんでした。既定のモデルを選びました。',
    ready: '準備できました。何でも聞いてください。',
    noKeyToast: '始めるには 設定 → API でキーを追加してください。'
  }
};

/* Ekranda seçili dil; henüz seçilmediyse telefonun dili. */
function detectLang() {
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || ''];
  for (const tag of list) {
    const code = String(tag || '').toLowerCase().slice(0, 2);
    if (MOB_I18N[code]) return code;
  }
  return 'en';
}

function mobLang() {
  return MOB_I18N[state.lang] ? state.lang : detectLang();
}

function T(key, vars) {
  const pack = MOB_I18N[mobLang()] || MOB_I18N.tr;
  const out = pack[key] != null ? pack[key] : (MOB_I18N.tr[key] || '');
  if (!vars) return out;
  return String(out).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

const DEF = {
  v: 6,
  name: '',
  theme: 'dark',
  accent: 'kirmizi',
  replyLang: 'tr',
  brief: true,
  temperature: 0.7,
  systemPrompt: '',
  assistantKey: false,
  orbSize: 56,
  orbLife: true,
  soundOn: true,
  soundLevel: 55,
  apis: [],
  activeSid: null,
  chats: [],
  activeChatId: null,
  lang: '',
  langDone: false,
  tutorialDone: false,
  avatar: '',
  memories: [],
  voiceOn: true,
  voiceId: 'k1',
  voiceRate: 1,
  micAutoSend: true,
  micLang: '',
  bargeIn: true,
  camFacing: 'environment',
  camMic: true
};

/* ----------------------------- Durum ----------------------------- */
let state = loadState();
let streaming = null;        // { ctrl, chatId, msg }
let pendingImages = [];
let tutStep = 1;
let tutSlot = null;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!raw || typeof raw !== 'object') return { ...DEF };
    const oldVersion = Number(raw.v || 1);
    const s = { ...DEF, ...raw };
    s.apis = Array.isArray(s.apis) ? s.apis.filter((a) => a && PROVIDERS[a.provider]) : [];
    s.chats = Array.isArray(s.chats) ? s.chats.filter((c) => c && Array.isArray(c.msgs)) : [];
    s.memories = Array.isArray(s.memories)
      ? s.memories.filter((m) => m && m.name && m.thumb).slice(0, 24)
      : [];
    s.avatar = typeof s.avatar === 'string' ? s.avatar : '';
    for (const a of s.apis) {
      if (!a.sid) a.sid = uid();
      a.key = String(a.key || '');
      a.model = String(a.model || '');
    }
    /* 1 → 2: eski varsayılan (sistem teması + mor) siyah-kırmızıya geçer;
       beyazı ya da başka rengi seçenlerin ayarına dokunulmaz. */
    if (oldVersion < 2 && s.theme === 'system' && s.accent === 'mor') {
      s.theme = 'dark';
      s.accent = 'kirmizi';
    }
    /* 2 → 3: sohbet içindeki yüzen top kaldırıldı, yerine ana ekran tuşu geldi. */
    if (oldVersion < 3) {
      s.assistantKey = s.assistantKey === true;
      delete s.assistantOn;
    }
    /* 3 → 4: dil ekranı. Rehberi bitirmiş olanlar bir daha görmez; henüz
       seçim yapmamış olanların dili yanıt dilinden alınır. */
    if (oldVersion < 4) {
      if (s.tutorialDone) s.langDone = true;
      if (!MOB_I18N[s.lang]) s.lang = MOB_I18N[s.replyLang] ? s.replyLang : 'tr';
    }
    if (oldVersion < DEF.v) {
      s.v = DEF.v;
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
  if (window.PrimeAndroid && window.PrimeAndroid.setDark) {
    try { window.PrimeAndroid.setDark(t !== 'light'); } catch { /* tarayıcı */ }
  }
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

function geminiBody(model, history, extra) {
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
  const gc = { temperature: Number(state.temperature), maxOutputTokens: 8192 };
  /* 2.5 serisi varsayılan olarak düşünmeye token ayırıyor; bütçe sınırsız kalınca
     yanıt bazen tamamen düşünmeye gidip ekrana hiçbir cümle gelmiyor. Flash'ta
     düşünmeyi kapatıyoruz, Pro'da en küçük bütçeye indiriyoruz. */
  if (/^gemini-2[.]5-flash/i.test(model)) gc.thinkingConfig = { thinkingBudget: 0 };
  else if (/^gemini-2[.]5-pro/i.test(model)) gc.thinkingConfig = { thinkingBudget: 128 };
  body.generationConfig = gc;
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

/* Hata mesajına HTTP kodunu da ekler: 4xx'te tekrar denemek anlamsız. */
async function httpFailure(res) {
  const err = new Error(await httpError(res));
  err.status = res.status;
  return err;
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

/* Akış 30 saniye boyunca hiç veri göndermezse bağlantı kesilir: yoksa
   noktalar sonsuza kadar döner ve kullanıcı "API çalışmıyor" görür. */
const STREAM_IDLE_MS = 30000;

async function sseFetch(url, headers, payload, onData, signal) {
  const idleMs = Number(window.__primeStreamIdle) > 0 ? Number(window.__primeStreamIdle) : STREAM_IDLE_MS;
  const ctrl = new AbortController();
  let idle = false;
  const relay = () => { try { ctrl.abort(); } catch { /* yok */ } };
  if (signal) {
    if (signal.aborted) relay();
    else signal.addEventListener('abort', relay, { once: true });
  }
  let timer = 0;
  const bump = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { idle = true; relay(); }, idleMs);
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    if (!res.ok) throw await httpFailure(res);
    if (!res.body) throw new Error('Sunucu akış gövdesi döndürmedi.');
    bump();

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
      bump();
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';
      for (const p of parts) consume(p);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
  } catch (err) {
    if (idle) {
      const stopped = new Error('Yanıt 30 saniye içinde gelmedi.');
      stopped.status = 0;
      throw stopped;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', relay);
  }
}

/* Akış desteklenmezse ya da yanıt hiç gelmezse aynı istek tek seferde
   (stream olmadan) denenir; kullanıcı boş ekran yerine yanıtı görür. */
async function streamOnce(slot, history, onText, signal, extra) {
  const cfg = PROVIDERS[slot.provider];
  const base = cfg.base;
  const key = String(slot.key || '').trim();
  const model = modelOf(slot);
  if (!model) throw new Error('Model seçilmedi. Ayarlar → API bölümünden model seç.');

  let got = 0;
  const feed = (t) => { if (t) { got += t.length; onText(t); } };
  try {
    await streamRaw(slot, history, feed, signal, extra);
    return;
  } catch (err) {
    if (signal && signal.aborted) throw err;
    if (got) throw err;                              // yarıda kalan yanıtı tekrarlamayız
    if (err && err.status && err.status < 500) throw err;  // anahtar/istek hatası
    const text = await plainReply(cfg, base, key, model, history, extra, signal);
    if (!String(text || '').trim()) throw err;
    onText(text);
  }
}

/* Akışsız istek: aynı gövde, tek yanıt. */
async function plainReply(cfg, base, key, model, history, extra, signal) {
  if (cfg.kind === 'gemini') {
    const res = await fetch(base + '/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(geminiBody(model, history, extra)),
      signal
    });
    if (!res.ok) throw await httpFailure(res);
    const data = await res.json();
    const cand = (data.candidates || [])[0] || {};
    const text = ((cand.content || {}).parts || []).map((p) => p.text || '').join('');
    const blocked = String((data.promptFeedback || {}).blockReason || '');
    if (!text.trim()) throw new Error(geminiEmptyWhy(model, blocked || cand.finishReason));
    return text;
  }

  if (cfg.kind === 'anthropic') {
    const body = anthropicBody(model, history, extra);
    body.stream = false;
    const res = await fetch(base + '/messages', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders(cfg, key)),
      body: JSON.stringify(body),
      signal
    });
    if (!res.ok) throw await httpFailure(res);
    const data = await res.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    if (!text.trim()) throw new Error('Model boş yanıt döndürdü.');
    return text;
  }

  const body = openAIBody(model, history, extra);
  body.stream = false;
  const res = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders(cfg, key), extraHeaders(base)),
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) throw await httpFailure(res);
  const data = await res.json();
  const msg = ((data.choices || [])[0] || {}).message || {};
  const text = typeof msg.content === 'string' ? msg.content : '';
  if (!text.trim()) throw new Error('Model boş yanıt döndürdü.');
  return text;
}

async function streamRaw(slot, history, onText, signal, extra) {
  const cfg = PROVIDERS[slot.provider];
  const base = cfg.base;
  const key = String(slot.key || '').trim();
  const model = modelOf(slot);
  if (!model) throw new Error('Model seçilmedi. Ayarlar → API bölümünden model seç.');

  /* Gelen her parça sayılır: hiç metin gelmezse bu bir hata olarak bildirilir,
     böylece “API yanıt vermiyor” sessizce boş bir balona dönüşmez. */
  let chars = 0;
  let why = '';
  const fed = (text) => { if (text) { chars += text.length; onText(text); } };

  if (cfg.kind === 'gemini') {
    await sseFetch(base + '/models/' + encodeURIComponent(model) + ':streamGenerateContent?alt=sse',
      { 'x-goog-api-key': key }, geminiBody(model, history, extra), (raw) => {
        let chunk; try { chunk = JSON.parse(raw); } catch { return; }
        const cand = (chunk.candidates || [])[0] || {};
        if (cand.finishReason) why = String(cand.finishReason);
        const blocked = String((chunk.promptFeedback || {}).blockReason || '');
        if (blocked) why = blocked;
        const parts = (cand.content || {}).parts || [];
        for (const p of parts) if (p.text) fed(p.text);
      }, signal);
    if (!chars) throw new Error(geminiEmptyWhy(model, why));
    return;
  }

  if (cfg.kind === 'anthropic') {
    await sseFetch(base + '/messages', authHeaders(cfg, key), anthropicBody(model, history, extra), (raw) => {
      let j; try { j = JSON.parse(raw); } catch { return; }
      if (j.type === 'error' && j.error) why = String(j.error.message || '');
      if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta' && j.delta.text) fed(j.delta.text);
    }, signal);
    if (!chars) throw new Error('Model boş yanıt döndürdü' + (why ? ': ' + why : '') + '. Ayarlar → API bölümünden başka bir model dene.');
    return;
  }

  await sseFetch(base + '/chat/completions', Object.assign(authHeaders(cfg, key), extraHeaders(base)),
    openAIBody(model, history, extra), (raw) => {
      let chunk; try { chunk = JSON.parse(raw); } catch { return; }
      const choice = (chunk.choices || [])[0] || {};
      if (choice.finish_reason) why = String(choice.finish_reason);
      if (chunk.error) why = String((chunk.error && chunk.error.message) || why);
      const d = choice.delta || {};
      if (typeof d.content === 'string') fed(d.content);
    }, signal);
  if (!chars) throw new Error('Model boş yanıt döndürdü' + (why ? ': ' + why : '') + '. Ayarlar → API bölümünden başka bir model dene.');
}

/* Boş yanıtın nedenini anlaşılır tek cümleye çevirir. */
function geminiEmptyWhy(model, why) {
  const w = String(why || '');
  if (w === 'MAX_TOKENS') return 'Yanıt token sınırına takıldı ve boş döndü (' + model + '). Daha kısa bir soruyla tekrar dene; sürerse Ayarlar → API bölümünden başka bir model seç.';
  if (w === 'SAFETY' || w === 'PROHIBITED_CONTENT' || w === 'BLOCKLIST' || w === 'RECITATION') return 'İçerik filtresi yanıtı engelledi: ' + w + '. Soruyu farklı yazmayı dene.';
  if (w === 'MALFORMED_FUNCTION_CALL') return 'Model yanıtı bozdu (' + w + '). Tekrar dene.';
  if (w) return 'Yanıt gelmedi: ' + w + '. Başka bir model dene.';
  return 'Model boş yanıt döndürdü. Ayarlar → API bölümünden başka bir model dene.';
}

function isQuotaError(err) {
  const s = String((err && err.message) || err || '').toLowerCase();
  return /(\b429\b|quota|kota|resource_exhausted|rate[ _-]?limit|too many requests|insufficient_quota|billing|credit balance)/.test(s);
}

/* Model adı geçersizse (silinmiş/yeniden adlandırılmış model) bunu ayırt eder. */
function isModelError(err) {
  const msg = String((err && err.message) || err);
  if (err && err.status === 404) return true;
  return /model[^.]{0,48}(not found|does not exist|not supported|decommissioned|invalid|unknown|bulunamadı|geçersiz|desteklenmiyor)/i.test(msg);
}

async function streamReply(history, onText, signal, extra) {
  const tried = [];
  let emitted = false;
  const emit = (t) => { if (t) emitted = true; onText(t); };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slot = activeSlot();
    if (!slotReady(slot)) {
      throw new Error('API anahtarı yok. Ayarlar → API bölümünden anahtar ekle.');
    }
    try {
      return await streamOnce(slot, history, emit, signal, extra);
    } catch (err) {
      if (signal && signal.aborted) throw err;
      if (emitted) throw err;

      /* Seçili model o anahtarda yoksa sağlayıcının varsayılanıyla bir kez denenir. */
      if (isModelError(err)) {
        const cfg = PROVIDERS[slot.provider];
        const fallback = cfg.defaultModel;
        const tag = 'model:' + slot.sid;
        if (fallback && slot.model !== fallback && !tried.includes(tag)) {
          tried.push(tag);
          slot.model = fallback;
          saveState();
          renderModelChip();
          toast('Model bulunamadı, ' + fallback + ' ile denendi.', true);
          continue;
        }
        throw err;
      }

      if (!isQuotaError(err)) throw err;
      tried.push(slot.sid);
      const next = state.apis.find((a) => !tried.includes(a.sid) && slotReady(a) && a.sid !== slot.sid);
      if (!next) throw err;
      state.activeSid = next.sid;
      saveState();
      renderModelChip();
      toast('Kota doldu, ' + PROVIDERS[next.provider].label + ' anahtarına geçildi.');
    }
  }
  throw new Error('Yanıt alınamadı. Ayarlar → API bölümünde anahtarı ve modeli kontrol et.');
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

function ensureChat(kind) {
  let chat = activeChat();
  /* "Kameralı sohbet" istendiyse boş bir normal sohbet ona dönüştürülür;
     dolu bir sohbet varsa kameralı olarak yenisi açılır. */
  if (chat && kind === 'cam' && chatKind(chat) !== 'cam') {
    if (chat.msgs.length) chat = null;
    else {
      chat.kind = 'cam';
      saveState();
      renderChatList();
      return chat;
    }
  }
  if (chat) return chat;
  chat = { id: uid(), title: 'Yeni sohbet', ts: Date.now(), msgs: [], kind: kind === 'cam' ? 'cam' : 'chat' };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  saveState();
  renderChatList();
  return chat;
}

function chatKind(chat) {
  return chat && chat.kind === 'cam' ? 'cam' : 'chat';
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
  const value = String(text || '');
  try {
    await navigator.clipboard.writeText(value);
    toast('Kopyalandı.');
    return;
  } catch { /* izin yok: aşağıdaki yöntem denenir */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı.', !ok);
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

  const chat = ensureChat(opts && opts.cam ? 'cam' : undefined);
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

  stopSpeaking();   // yeni soru: okunan yanıt kesilir
  let failure = '';
  let reply = '';
  try {
    await streamReply(historyForApi(chat, chat.msgs.length - 1), (delta) => {
      aiMsg.content += delta;
      paint(false);
    }, ctrl.signal, opts && opts.extra);
    aiMsg.content = aiMsg.content.trim();
    if (!aiMsg.content) aiMsg.content = 'Yanıt gelmedi. Anahtarını ve modelini kontrol edip yeniden dene.';
    reply = aiMsg.content;
    saveState();
  } catch (err) {
    const aborted = ctrl.signal.aborted;
    const msg = String((err && err.message) || err);
    if (!aborted) failure = msg;
    aiMsg.content = aiMsg.content.trim();
    reply = aiMsg.content;
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
    /* Yanıtları sesli okuma açıksa yanıt burada seslendirilir. */
    if (reply && state.voiceOn && !(opts && opts.silent)) speakText(reply);
  }
  return reply;
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

/* ----------------------------- Ses (mikrofon + okuma) -----------------------------
   Mikrofon: Android'de PrimeVoice köprüsü (SpeechRecognizer), tarayıcıda Web
   Speech. Okuma: PrimeVoice TTS; tarayıcıda speechSynthesis. */
const VOICE_FALLBACK = [
  { id: 'k1', label: 'Kadın 1 · sıcak' },
  { id: 'k2', label: 'Kadın 2 · canlı' },
  { id: 'k3', label: 'Kadın 3 · sakin' },
  { id: 'e1', label: 'Erkek 1 · derin' },
  { id: 'e2', label: 'Erkek 2 · doğal' },
  { id: 'e3', label: 'Erkek 3 · ağır' }
];
const VOICE_PITCH = { k1: 1.16, k2: 1.3, k3: 1.08, e1: 0.8, e2: 0.92, e3: 0.66 };

let micTarget = 'chat';       // 'chat' | 'cam'
let micActive = false;
let recognizer = null;
let speakStartedAt = 0;
let spokenText = '';

function nativeVoice() {
  return (window.PrimeVoice && typeof window.PrimeVoice.speak === 'function') ? window.PrimeVoice : null;
}

function voiceProfiles() {
  const nv = nativeVoice();
  if (nv && nv.profiles) {
    try {
      const list = JSON.parse(nv.profiles() || '[]');
      if (Array.isArray(list) && list.length) return list;
    } catch { /* köprü yok */ }
  }
  return VOICE_FALLBACK;
}

function fillVoiceSelect() {
  const sel = $('voicePick');
  if (!sel) return;
  sel.innerHTML = '';
  for (const v of voiceProfiles()) {
    const o = document.createElement('option');
    o.value = v.id;
    o.textContent = v.label || v.id;
    sel.appendChild(o);
  }
  sel.value = VOICE_PITCH[state.voiceId] ? state.voiceId : 'k1';
}

/* Konuşma için metni sadeleştirir: kod ve işaretler okunmaz. */
function speakable(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' (kod bloğu) ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
    .slice(0, 1200);
}

function isSpeaking() {
  const nv = nativeVoice();
  if (nv && nv.speaking) {
    try { if (nv.speaking()) return true; } catch { /* yok */ }
  }
  try { return !!(window.speechSynthesis && window.speechSynthesis.speaking); } catch { return false; }
}

function normSpeech(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}0-9 ]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

/* AI konuşurken kullanıcı araya girerse sesi keser; kendi sesini duyup
   kendini kesmemesi için ilk 0,9 saniye ve kendi metniyle eşleşen parçalar yok sayılır. */
function maybeBargeIn(text) {
  if (!state.bargeIn || !isSpeaking()) return false;
  const said = normSpeech(text);
  if (said.length < 3) return false;
  if (Date.now() - speakStartedAt < 900) return false;
  if (spokenText && (spokenText.startsWith(said) || spokenText.includes(said))) return false;
  stopSpeaking();
  return true;
}

function speakText(text) {
  const clean = speakable(text);
  if (!clean) return;
  speakStartedAt = Date.now();
  spokenText = normSpeech(clean);
  const rate = Number(state.voiceRate) || 1;
  const nv = nativeVoice();
  if (nv) {
    try { nv.speak(clean, state.voiceId || 'k1', rate); return; } catch { /* yedeğe düş */ }
  }
  if (!window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.pitch = VOICE_PITCH[state.voiceId] || 1;
    u.rate = rate;
    u.lang = ({ tr: 'tr-TR', en: 'en-US', de: 'de-DE', ru: 'ru-RU', ja: 'ja-JP' })[state.replyLang] || 'tr-TR';
    u.onstart = () => camSpeechStart();
    u.onend = () => camSpeechEnd();
    u.onerror = () => camSpeechEnd();
    speechSynthesis.speak(u);
  } catch { /* yok */ }
}

function stopSpeaking() {
  const nv = nativeVoice();
  if (nv && nv.stop) { try { nv.stop(); } catch { /* yok */ } }
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch { /* yok */ }
}

function micLangCode() {
  if (state.micLang) return state.micLang;
  return ({ tr: 'tr-TR', en: 'en-US', de: 'de-DE', ru: 'ru-RU', ja: 'ja-JP' })[state.replyLang] || 'tr-TR';
}

function setMicUI(on) {
  micActive = !!on;
  const chatBtn = $('micBtn');
  if (chatBtn) chatBtn.classList.toggle('listening', micActive && micTarget === 'chat');
  const stateLabel = $('micState');
  if (stateLabel) stateLabel.textContent = micActive ? 'Dinliyorum… konuş' : 'Hazır — komut bekliyor';
  renderCamMic();
}

function showTranscript(text) {
  const value = String(text || '');
  if (micTarget === 'cam' || camOpen()) {
    const said = $('camSaid');
    if (said) {
      said.textContent = 'Sen: ' + value;
      said.hidden = !value;
    }
    return;
  }
  const input = $('input');
  input.value = value;
  autoGrow();
  updateSendState();
}

function handleUtterance(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  if (micTarget === 'cam' || camOpen()) {
    /* Kamera modunda yazma alanı yok: cümle biter bitmez gönderilir. */
    if (micTarget !== 'cam') micTarget = 'cam';
    cameraTurn(clean);
    return;
  }
  if (state.micAutoSend) {
    stopMic();
    $('input').value = '';
    sendMessage(clean, pendingImages.slice());
    return;
  }
  $('input').value = clean;
  autoGrow();
  updateSendState();
}

function startMic(target) {
  micTarget = target === 'cam' ? 'cam' : 'chat';
  if (state.bargeIn) stopSpeaking();
  const nv = nativeVoice();
  if (nv && nv.micAvailable && nv.micAvailable()) {
    try { nv.listen(micLangCode()); } catch { /* yok */ }
    setMicUI(true);
    return;
  }
  startWebMic();
}

function stopMic() {
  const nv = nativeVoice();
  if (nv && nv.listenStop) { try { nv.listenStop(); } catch { /* yok */ } }
  if (recognizer) {
    try { recognizer.stop(); } catch { /* yok */ }
    recognizer = null;
  }
  setMicUI(false);
}

function startWebMic() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    toast('Bu cihazda mikrofon desteği yok. Android uygulamasında çalışır.', true);
    return;
  }
  try {
    const rec = new Rec();
    rec.lang = micLangCode();
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) {
        maybeBargeIn(interim);
        showTranscript(interim);
      }
      if (final.trim()) handleUtterance(final);
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') toast('Mikrofon: ' + e.error, true);
      setMicUI(false);
    };
    rec.onend = () => {
      recognizer = null;
      setMicUI(false);
    };
    rec.start();
    recognizer = rec;
    setMicUI(true);
  } catch (err) {
    toast('Mikrofon açılamadı.', true);
    setMicUI(false);
  }
}

function toggleMic() {
  if (micActive) { stopMic(); return; }
  startMic('chat');
}

/* Kamera modundaki mikrofon açma/kapama. Kapalıyken uygulama seni duymaz;
   açınca dinleme kendiliğinden başlar ve her turdan sonra sürer. */
function camOpen() {
  const el = $('camSheet');
  return !!(el && !el.hidden);
}

function renderCamMic() {
  const on = !!state.camMic;
  const btn = $('camMicToggle');
  const status = $('camStatus');
  const text = $('camStatusText');
  if (btn) {
    btn.classList.toggle('mic-off', !on);
    btn.classList.toggle('listening', on && micActive && camOpen());
    btn.setAttribute('aria-pressed', String(on));
  }
  if (status) status.classList.toggle('off', !on);
  if (text) {
    text.textContent = !on
      ? 'Mikrofon kapalı — dokunup aç'
      : (micActive ? 'Dinliyorum… konuş, biter bitmez gönderirim' : 'Hazır — mikrofon hazırda bekliyor');
  }
}

function toggleCamMic() {
  state.camMic = !state.camMic;
  saveState();
  if (state.camMic) resumeCamMic(60);
  else { stopMic(); toast('Mikrofon kapatıldı — seni duymuyorum.'); }
  renderCamMic();
}

/* Kamera açık ve mikrofon açıksa dinleme sürer; durmuşsa yeniden başlar. */
function resumeCamMic(delay) {
  const go = () => {
    if (!camOpen() || !state.camMic || micActive || camBusy || isSpeaking()) return;
    startMic('cam');
    renderCamMic();
  };
  if (delay) setTimeout(go, delay); else go();
}

/* Android köprüsünden gelen konuşma olayları. */
window.__primeVoice = function (raw) {
  let d = raw;
  if (typeof raw === 'string') {
    try { d = JSON.parse(raw); } catch { return; }
  }
  if (!d || !d.type) return;
  if (d.type === 'speech') {
    /* Android TTS: konuşma başladı/bitti. Kamera modunda mikrofona yön verir. */
    if (d.text === 'start') camSpeechStart(); else camSpeechEnd();
    return;
  }
  if (d.type === 'start') { setMicUI(true); return; }
  if (d.type === 'partial') {
    maybeBargeIn(d.text || '');
    showTranscript(d.text || '');
    return;
  }
  if (d.type === 'final') { handleUtterance(d.text); return; }
  if (d.type === 'error') { setMicUI(false); if (d.text) toast(d.text, true); return; }
  if (d.type === 'end') setMicUI(false);
};

/* ----------------------------- Kamera ile konuş ----------------------------- */
let camStream = null;
let camReady = false;
let camBusy = false;
let lastCameraFrame = null;

function openCamera() {
  stopMic();
  closeDrawer();
  $('settings').hidden = true;
  $('modelSheet').hidden = true;
  $('apiEdit').hidden = true;
  $('camSheet').hidden = false;
  $('camAnswer').hidden = true;
  $('camSaid').hidden = true;
  $('camHint').hidden = false;
  $('camHint').textContent = 'Kamerayı açıyorum…';
  fillVoiceSelect();
  buildCamDots();
  syncCamStage();
  renderCamMic();
  const bridge = window.PrimeAndroid;
  if (bridge && bridge.ensureCamera) {
    let st = 'granted';
    try { st = bridge.ensureCamera(); } catch { /* yok */ }
    if (st !== 'granted') {
      $('camHint').textContent = 'Kamera izni isteniyor… İzin verince kamera açılır.';
      return;
    }
  }
  startCameraStream();
}

/* İzin sonucu Android'den gelir. */
window.__primeMediaGranted = function (ok) {
  if ($('camSheet').hidden) return;
  if (ok) startCameraStream();
  else $('camHint').textContent = 'Kamera izni verilmedi. Telefon ayarlarından izin verebilirsin.';
};

async function startCameraStream() {
  stopCameraStream();
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.camFacing || 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false
    });
    const video = $('camVideo');
    video.srcObject = camStream;
    await video.play().catch(() => {});
    camReady = true;
    $('camHint').hidden = true;
    /* Kamera hazırsa ve mikrofon açıksa dinlemeye kendiliğinden başlanır. */
    resumeCamMic(700);
  } catch (err) {
    camReady = false;
    $('camHint').hidden = false;
    $('camHint').textContent = 'Kamera açılamadı: ' + String((err && err.message) || err);
  }
}

function stopCameraStream() {
  camReady = false;
  if (camStream) {
    for (const track of camStream.getTracks()) { try { track.stop(); } catch { /* yok */ } }
    camStream = null;
  }
  const video = $('camVideo');
  if (video) video.srcObject = null;
}

function closeCamera() {
  stopMic();
  stopCameraStream();
  stopSpeaking();
  $('camSheet').hidden = true;
  $('camMicToggle').classList.remove('listening');
}

/* Kamera sahnesinin durumu: idle (boşta), thinking (model düşünüyor),
   speaking (AI sesli yanıt veriyor). Noktalar bu sınıfa göre hareket eder. */
function setCamStage(mode) {
  const stage = $('camStage');
  if (!stage) return;
  stage.classList.remove('is-idle', 'is-thinking', 'is-speaking');
  stage.classList.add(mode === 'thinking' ? 'is-thinking' : mode === 'speaking' ? 'is-speaking' : 'is-idle');
}

function syncCamStage() {
  if (!camOpen()) return;
  if (camBusy) setCamStage('thinking');
  else if (isSpeaking()) setCamStage('speaking');
  else setCamStage('idle');
}

/* AI sesli konuşmaya başlayınca mikrofon kapatılır (kendi sesini duymasın),
   konuşması bitince dinleme kendiliğinden yeniden açılır. */
function camSpeechStart() {
  if (!camOpen()) return;
  if (micActive) stopMic();
  setCamStage('speaking');
  renderCamMic();
}

function camSpeechEnd() {
  if (!camOpen()) return;
  if (camBusy) { setCamStage('thinking'); return; }
  setCamStage('idle');
  if (state.camMic) resumeCamMic(350);
  renderCamMic();
}

/* Kamera çerçevesinin etrafına temaya uygun noktalar dizilir.
   Kamera açıkken bu halka görünür; noktalar animasyonla yaşar. */
function buildCamDots() {
  const wrap = $('camDots');
  if (!wrap || wrap.childElementCount) return;
  const total = 28;
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement('i');
    dot.className = 'cam-dot';
    const edge = i % 4;
    const along = (2 + Math.random() * 96).toFixed(1) + '%';
    const near = (1 + Math.random() * 6).toFixed(1) + '%';
    if (edge === 0) { dot.style.top = near; dot.style.left = along; }
    else if (edge === 1) { dot.style.bottom = near; dot.style.left = along; }
    else if (edge === 2) { dot.style.left = near; dot.style.top = along; }
    else { dot.style.right = near; dot.style.top = along; }
    dot.style.animationDelay = (-Math.random() * 9).toFixed(2) + 's';
    wrap.appendChild(dot);
  }
}

async function flipCamera() {
  state.camFacing = (state.camFacing === 'environment') ? 'user' : 'environment';
  saveState();
  await startCameraStream();
}

function captureFrame(max) {
  const video = $('camVideo');
  if (!camReady || !video || !video.videoWidth) return null;
  const limit = max || 896;
  const scale = Math.min(1, limit / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), mime: 'image/jpeg' };
}

async function cameraTurn(text) {
  const clean = String(text || '').trim();
  if (!clean || camBusy) return;
  const frame = captureFrame();
  if (!frame) { toast('Kamera hazır değil.', true); return; }
  lastCameraFrame = frame;
  camBusy = true;
  $('camSaid').textContent = 'Sen: ' + clean;
  $('camSaid').hidden = false;
  $('camAnswer').hidden = true;

  const memories = state.memories.slice(0, 4);
  const images = [frame];
  for (const m of memories) images.push({ dataUrl: m.thumb, mime: 'image/jpeg' });
  const names = state.memories.slice(0, 12).map((m) => m.name);
  const hint =
    'Kullanıcı kameradan bir görüntü gönderdi' +
    (images.length > 1 ? '; ilk görsel kameradan, sonrakiler daha önce adlandırdığı nesneler' : '') + '. ' +
    'Soru görüntüyle ilgiliyse gördüğünü kısa, doğal cümlelerle anlat: nesnenin ne olduğunu, rengini ve belirgin özelliğini söyle. ' +
    (names.length ? 'Kullanıcının adlandırdığı nesneler: ' + names.join(', ') + '. Görüntüdeki bunlardan biriyse adını kullan. ' : '') +
    'Soru görüntüyle ilgisizse (selam, farklı bir konu, genel bir soru, kod isteği) görüntüyü hiç anmadan soruya normalce cevap ver; '
    + 'ilgisiz sorularda kareyi açıklama. Kod yazma.';

  setCamStage('thinking');
  let reply = '';
  try {
    reply = await sendMessage(clean, images, { cam: true, extra: hint, silent: !state.voiceOn });
  } finally {
    camBusy = false;
    syncCamStage();
    if (!isSpeaking() && state.camMic && camOpen()) resumeCamMic(400);
  }
  if (reply) {
    $('camAnswer').innerHTML = md(reply);
    $('camAnswer').hidden = false;
    learnMemory(clean, frame);
  }
}

/* ----------------------------- Nesne belleği -----------------------------
   “bunun adı Pamuk” gibi bir cümle duyulunca o kare adıyla saklanır. Sonraki
   kamera sorularında hem ad listesi hem küçük görseller modele gönderilir. */
function learnMemory(text, frame) {
  if (!frame) return;
  const said = String(text || '');
  const m = said.match(/(?:ad[ıi]|ismi|ismini)\s+([^.,!?;:\n]{2,24})/iu);
  let name = '';
  if (m) {
    name = m[1].replace(/^["'“”‘’]|["'“”‘’]$/g, '').replace(/\s+/g, ' ').trim();
    if (/^(ne|ney|kim|bu|şu)$/i.test(name)) name = '';
  }
  /* “belleğe geçir / kaydet / hatırla” denildiyse adsız da olsa kare saklanır. */
  const wantsKeep = /belle|hatırla|hatirla|kaydet/i.test(said);
  if (!name && !wantsKeep) return;
  if (!name) {
    let n = state.memories.length + 1;
    name = 'Nesne ' + n;
    while (state.memories.some((x) => x.name === name)) { n += 1; name = 'Nesne ' + n; }
  }
  saveMemory(name, frame, said);
}

/* Görseli yükler. decode() arka plandaki sekmede askıda kalabildiği için
   onload kullanılır; 2,5 saniyede gelmezse küçültme atlanır. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('görsel okunamadı'));
    img.src = src;
  });
}

async function shrinkImage(dataUrl, max) {
  const side = max || 192;
  const img = await Promise.race([
    loadImage(dataUrl).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), 2500))
  ]);
  if (!img || !img.width) return dataUrl;
  const scale = Math.min(1, side / Math.max(img.width || side, img.height || side));
  if (scale >= 1 && String(dataUrl).length < 40000) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img.width || side) * scale));
  canvas.height = Math.max(1, Math.round((img.height || side) * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

async function saveMemory(name, frame, said) {
  const clean = String(name || '').trim().slice(0, 32);
  if (!clean || !frame || !frame.dataUrl) return null;
  const thumb = await shrinkImage(frame.dataUrl, 192);
  const item = { id: uid(), name: clean, thumb, said: String(said || '').slice(0, 120), ts: Date.now() };
  state.memories.unshift(item);
  state.memories = state.memories.slice(0, 24);
  if (!saveState()) {
    state.memories = state.memories.filter((x) => x.id !== item.id);
    toast('Bellek dolu: yer açıp tekrar dene.', true);
    return null;
  }
  renderMemories();
  toast('Belleğe eklendi: ' + clean);
  return item;
}

function renderMemories() {
  const wrap = $('memList');
  const empty = $('memEmpty');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (empty) empty.hidden = state.memories.length > 0;
  for (const m of state.memories) {
    const row = document.createElement('div');
    row.className = 'mem-item';
    const img = document.createElement('img');
    img.className = 'mem-thumb';
    img.src = m.thumb;
    img.alt = m.name;
    const meta = document.createElement('div');
    meta.className = 'mem-meta';
    const strong = document.createElement('strong');
    strong.textContent = m.name;
    const sub = document.createElement('span');
    sub.textContent = m.said || 'kameradan kaydedildi';
    meta.append(strong, sub);
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'mem-del';
    del.setAttribute('aria-label', m.name + ' kaydını sil');
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12"/></svg>';
    del.addEventListener('click', () => {
      state.memories = state.memories.filter((x) => x.id !== m.id);
      saveState();
      renderMemories();
      toast('Kayıt silindi.');
    });
    row.append(img, meta, del);
    wrap.appendChild(row);
  }
}

/* ------------------- Kayıtlı varlıklar: galeri + görüntüleyici ------------------- */
let assetIndex = 0;

function renderAssets() {
  const grid = $('assetsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const items = state.memories;
  const count = $('assetsCount');
  if (count) count.textContent = items.length + ' kayıt';
  const empty = $('assetsEmpty');
  if (empty) empty.hidden = items.length > 0;
  items.forEach((m, i) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'assets-cell';
    const img = document.createElement('img');
    img.src = m.thumb;
    img.alt = m.name;
    img.loading = 'lazy';
    const cap = document.createElement('span');
    cap.textContent = m.name;
    cell.append(img, cap);
    cell.addEventListener('click', () => openAsset(i));
    grid.appendChild(cell);
  });
}

function openAssets() {
  renderAssets();
  $('settings').hidden = true;
  $('assets').hidden = false;
}

function closeAssets() {
  $('assets').hidden = true;
  openSettings();
}

function openAsset(i) {
  if (!state.memories.length) return;
  assetIndex = Math.max(0, Math.min(i | 0, state.memories.length - 1));
  $('assetViewer').hidden = false;
  paintAsset();
}

function paintAsset() {
  const m = state.memories[assetIndex];
  if (!m) { $('assetViewer').hidden = true; return; }
  $('viewerImg').src = m.thumb;
  $('viewerName').textContent = m.name + (m.said ? ' — ' + m.said : '');
  $('viewerCount').textContent = (assetIndex + 1) + ' / ' + state.memories.length;
}

function stepAsset(d) {
  const n = state.memories.length;
  if (!n) { closeAsset(); return; }
  assetIndex = (assetIndex + (d | 0) + n) % n;
  paintAsset();
}

function closeAsset() {
  $('assetViewer').hidden = true;
}

/* Görüntüleyicide sola/sağa kaydırarak gezinme. */
function wireAssetSwipe() {
  const el = document.querySelector('#assetViewer .viewer-card');
  if (!el || el.dataset.wired) return;
  el.dataset.wired = '1';
  let x0 = null;
  el.addEventListener('touchstart', (e) => {
    x0 = e.touches && e.touches.length ? e.touches[0].clientX : null;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const t = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : null;
    const dx = t ? t.clientX - x0 : 0;
    x0 = null;
    if (Math.abs(dx) > 44) stepAsset(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    if ($('assetViewer').hidden) return;
    if (e.key === 'ArrowLeft') stepAsset(-1);
    else if (e.key === 'ArrowRight') stepAsset(1);
    else if (e.key === 'Escape') closeAsset();
  });
}

/* ----------------------------- Profil fotoğrafı ----------------------------- */
function renderAvatar() {
  const initial = initialOf(state.name);
  const photo = state.avatar || '';
  for (const id of ['avatarBtn', 'drawerAvatar', 'profileAvatar']) {
    const el = $(id);
    if (!el) continue;
    if (photo) {
      el.style.backgroundImage = 'url("' + photo + '")';
      el.textContent = '';
      el.classList.add('has-photo');
    } else {
      el.style.backgroundImage = '';
      el.textContent = initial;
      el.classList.remove('has-photo');
    }
  }
  const clear = $('avatarClear');
  if (clear) clear.hidden = !photo;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function pickAvatar(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Yalnızca görsel seçilebilir.', true); return; }
  const raw = await fileToDataUrl(file);
  state.avatar = await shrinkImage(raw, 192);
  saveState();
  renderAvatar();
  toast('Profil fotoğrafı güncellendi.');
}

/* ----------------------------- Asistan topu ----------------------------- */
/* ----------------------------- Çekmece ----------------------------- */
function openDrawer() {
  drawerTab = chatKind(activeChat()) === 'cam' ? 'cam' : 'chat';
  $('drawer').hidden = false;
  $('scrim').hidden = false;
  renderChatList();
}

function closeDrawer() {
  $('drawer').hidden = true;
  $('scrim').hidden = true;
}

let drawerTab = 'chat';   // çekmecedeki sekme: 'chat' | 'cam'

function renderDrawerTabs() {
  document.querySelectorAll('#drawerTabs .drawer-tab').forEach((b) => {
    const on = (b.dataset.kind === drawerTab);
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  });
}

function renderChatList() {
  const list = $('chatList');
  list.innerHTML = '';
  renderDrawerTabs();
  const chats = [...state.chats]
    .filter((c) => chatKind(c) === drawerTab)
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (!chats.length) {
    const empty = document.createElement('p');
    empty.className = 'chat-empty';
    empty.textContent = drawerTab === 'cam'
      ? 'Henüz kameralı sohbet yok. Kamerayı açıp konuşmaya başladığında buraya düşer.'
      : 'Henüz sohbet yok.';
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
  drawerTab = 'chat';
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

/* ----------------------------- Model seçimi -----------------------------
   Sohbetteki model rozeti ve API listesindeki model satırı bu sayfayı açar.
   Liste, etkin anahtarın sağlayıcısından gelir; seçim anında uygulanır ve
   API ayarlarına gitmek gerekmez. */
const MODEL_CACHE = new Map();

function openModelSheet(sid) {
  closeDrawer();
  $('settings').hidden = true;
  $('apiEdit').hidden = true;
  if (sid && state.apis.some((a) => a.sid === sid)) state.activeSid = sid;
  $('modelSheet').hidden = false;
  renderModelSheet();
  loadModelSheetModels(false);
}

function closeModelSheet() {
  $('modelSheet').hidden = true;
  /* Model, API düzenleme sayfasından seçildiyse oraya dönülür. */
  if (backToEdit && editSid) {
    backToEdit = false;
    openApiEdit(editSid);
  }
}

function renderModelSheet() {
  const slot = activeSlot();
  const slots = $('modelSlots');
  slots.innerHTML = '';
  slots.hidden = state.apis.length < 2;
  for (const s of state.apis) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'model-slot' + (slot && s.sid === slot.sid ? ' active' : '');
    b.textContent = PROVIDERS[s.provider].label;
    b.addEventListener('click', () => {
      state.activeSid = s.sid;
      saveState();
      renderModelChip();
      renderApiList();
      renderModelSheet();
      loadModelSheetModels(false);
    });
    slots.appendChild(b);
  }

  if (!slot) {
    $('modelBadge').textContent = 'API';
    $('modelProvider').textContent = 'Henüz anahtar yok';
    $('modelKeyMask').textContent = 'Model seçmek için önce API anahtarı ekle';
    $('modelRefresh').disabled = true;
    $('modelList').innerHTML = '';
    $('modelMsg').textContent = '';
    $('modelMsg').className = 'hint';
    return;
  }

  const cfg = PROVIDERS[slot.provider];
  $('modelBadge').textContent = cfg.badge;
  $('modelProvider').textContent = cfg.label;
  $('modelKeyMask').textContent = maskKey(slot.key) + ' · ' + (modelOf(slot) || 'model seçilmedi');
  $('modelRefresh').disabled = false;
  renderModelOptions();
}

function renderModelOptions() {
  const slot = activeSlot();
  const wrap = $('modelList');
  wrap.innerHTML = '';
  if (!slot) return;
  const current = modelOf(slot);
  const cached = MODEL_CACHE.get(slot.sid);
  const models = cached && cached.length ? cached : (current ? [current] : []);
  if (!models.length) {
    wrap.innerHTML = '<p class="hint bad">Bu anahtar için model listesi alınamadı; “Yenile” ile tekrar dene.</p>';
    return;
  }
  for (const id of models) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'model-item' + (id === current ? ' active' : '');
    b.dataset.model = id;
    b.innerHTML = '<span class="model-name">' + esc(id) + '</span>' +
      '<svg class="model-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>';
    b.addEventListener('click', () => selectModel(id));
    wrap.appendChild(b);
  }
}

async function loadModelSheetModels(force) {
  const slot = activeSlot();
  if (!slot) return;
  if (MODEL_CACHE.get(slot.sid) && !force) { renderModelOptions(); return; }
  $('modelMsg').textContent = 'Modeller getiriliyor…';
  $('modelMsg').className = 'hint';
  $('modelRefresh').disabled = true;
  try {
    const models = await fetchModels(slot.provider, slot.key);
    MODEL_CACHE.set(slot.sid, models);
    $('modelMsg').textContent = models.length + ' model bulundu.';
    $('modelMsg').className = 'hint good';
  } catch (err) {
    $('modelMsg').textContent = 'Liste alınamadı: ' +
      String((err && err.message) || err).slice(0, 90) + ' Mevcut model seçili kalır.';
    $('modelMsg').className = 'hint bad';
  } finally {
    $('modelRefresh').disabled = false;
  }
  renderModelOptions();
}

function selectModel(id) {
  const slot = activeSlot();
  if (!slot || !id) return;
  slot.model = id;
  state.activeSid = slot.sid;
  saveState();
  renderModelChip();
  renderApiList();
  closeModelSheet();
  toast(PROVIDERS[slot.provider].label + ' · ' + id);
}

/* ----------------------------- API düzenleme -----------------------------
   Ayarlar → API listesinde bir anahtara iki kez dokununca açılır; sağlayıcı,
   anahtar ve model oradan değiştirilir. */
let editSid = null;
let backToEdit = false;
let apiTapTimer = 0;
let apiTapSid = '';

/* Tek dokunma model listesini, iki dokunma düzenlemeyi açar. */
function tapApiRow(sid) {
  if (apiTapTimer && apiTapSid === sid) {
    clearTimeout(apiTapTimer);
    apiTapTimer = 0;
    apiTapSid = '';
    openApiEdit(sid);
    return;
  }
  apiTapSid = sid;
  apiTapTimer = setTimeout(() => {
    apiTapTimer = 0;
    apiTapSid = '';
    openModelSheet(sid);
  }, 300);
}

function fillProviderOptions(sel) {
  sel.innerHTML = '';
  for (const id of Object.keys(PROVIDERS)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = PROVIDERS[id].label;
    sel.appendChild(opt);
  }
}

function editProviderHint(id) {
  const cfg = PROVIDERS[id];
  $('editKey').placeholder = cfg.needsKey === false ? 'Gerekmez' : 'Anahtarı yapıştır';
  $('editHint').innerHTML = cfg.keyUrl
    ? esc(cfg.keyHint) + ' <a href="' + cfg.keyUrl + '" target="_blank" rel="noopener">' + esc(cfg.keyUrlLabel) + '</a>'
    : esc(cfg.keyHint);
}

function openApiEdit(sid) {
  const slot = state.apis.find((a) => a.sid === sid);
  if (!slot) return;
  if (apiTapTimer) { clearTimeout(apiTapTimer); apiTapTimer = 0; apiTapSid = ''; }
  editSid = sid;
  backToEdit = false;
  closeDrawer();
  $('settings').hidden = true;
  $('modelSheet').hidden = true;
  $('apiEdit').hidden = false;
  fillProviderOptions($('editProvider'));
  $('editProvider').value = slot.provider;
  editProviderHint(slot.provider);
  $('editKey').value = slot.key || '';
  $('editModel').textContent = modelOf(slot) || 'model seçilmedi';
  $('editMsg').textContent = '';
  $('editMsg').className = 'hint';
}

function closeApiEdit() {
  $('apiEdit').hidden = true;
}

function backToSettings() {
  editSid = null;
  backToEdit = false;
  closeApiEdit();
  openSettings();
  $('apiCard').scrollIntoView({ block: 'center' });
}

function saveApiEdit() {
  const slot = state.apis.find((a) => a.sid === editSid);
  if (!slot) { backToSettings(); return; }
  const provider = $('editProvider').value;
  const cfg = PROVIDERS[provider];
  const key = $('editKey').value.trim();
  if (cfg.needsKey !== false && !key) {
    $('editMsg').textContent = 'API anahtarı gerekli.';
    $('editMsg').className = 'hint bad';
    return;
  }

  const providerChanged = provider !== slot.provider;
  const keyChanged = key !== String(slot.key || '');
  slot.provider = provider;
  slot.key = key;
  if (providerChanged) slot.model = cfg.defaultModel || '';
  if (providerChanged || keyChanged) MODEL_CACHE.delete(slot.sid);
  state.activeSid = slot.sid;
  saveState();
  renderApiList();
  renderModelChip();
  $('apiEdit').hidden = true;
  toast('API güncellendi.');
  /* Yeni anahtarın modelleri hemen görünsün. */
  openModelSheet(slot.sid);
}

function deleteApiEdit() {
  const slot = state.apis.find((a) => a.sid === editSid);
  if (!slot) { backToSettings(); return; }
  if (!confirm(PROVIDERS[slot.provider].label + ' anahtarı silinsin mi?')) return;
  state.apis = state.apis.filter((a) => a.sid !== slot.sid);
  if (state.activeSid === slot.sid) state.activeSid = state.apis[0] ? state.apis[0].sid : null;
  MODEL_CACHE.delete(slot.sid);
  saveState();
  renderApiList();
  renderModelChip();
  backToSettings();
  toast('Anahtar silindi.');
}

function wireApiEdit() {
  $('editBack').addEventListener('click', backToSettings);
  $('editProvider').addEventListener('change', (e) => editProviderHint(e.target.value));
  $('editSave').addEventListener('click', saveApiEdit);
  $('editDelete').addEventListener('click', deleteApiEdit);
  $('editModelRow').addEventListener('click', () => {
    if (!editSid) return;
    backToEdit = true;
    $('apiEdit').hidden = true;
    openModelSheet(editSid);
  });
}

function wireModelSheet() {
  $('modelClose').addEventListener('click', closeModelSheet);
  $('modelRefresh').addEventListener('click', () => loadModelSheetModels(true));
  $('modelApiBtn').addEventListener('click', () => {
    closeModelSheet();
    openSettings();
    $('apiCard').scrollIntoView({ block: 'center' });
    if (!state.apis.length) $('apiAdd').open = true;
  });
}

/* ----------------------------- Ayarlar ----------------------------- */
function openSettings() {
  closeDrawer();
  $('settings').hidden = false;
  syncSettingsUI();
}

function closeSettings() {
  $('settings').hidden = true;
}

function syncSettingsUI() {
  applyMobLang();
  $('nameInput').value = state.name || '';
  renderAvatar();
  fillVoiceSelect();
  $('voiceOn').checked = !!state.voiceOn;
  $('voiceRate').value = String(state.voiceRate);
  $('voiceRateValue').textContent = Number(state.voiceRate).toFixed(1).replace('.', ',') + '×';
  $('micAutoSend').checked = !!state.micAutoSend;
  $('micLang').value = state.micLang || '';
  $('bargeIn').checked = !!state.bargeIn;
  renderMemories();
  $('drawerName').textContent = state.name ? state.name : 'PRIME AI';
  applyTheme();
  syncAssistantKey();
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

    /* Satıra dokunmak model listesini açar; API ekleme formuna götürmez. */
    const meta = document.createElement('button');
    meta.type = 'button';
    meta.className = 'api-meta api-meta-btn';
    meta.setAttribute('aria-label', cfg.label + ' için model seç; iki kez dokun: düzenle');
    const strong = document.createElement('strong');
    strong.textContent = cfg.label;
    const sub = document.createElement('span');
    sub.textContent = (modelOf(slot) || 'model seçilmedi') + ' · ' + maskKey(slot.key);
    meta.append(strong, sub);
    meta.addEventListener('click', () => tapApiRow(slot.sid));

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
    renderAvatar();
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

  $('assistantKey').addEventListener('change', (e) => {
    setAssistantKey(e.target.checked);
  });

  $('orbSize').addEventListener('input', (e) => {
    state.orbSize = Number(e.target.value);
    saveState();
    applyAssistantKey();
  });

  $('orbLife').addEventListener('change', (e) => {
    state.orbLife = e.target.checked;
    saveState();
    applyAssistantKey();
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
    out.textContent = 'Deneniyor… (bağlantı + yazılı yanıt)';
    try {
      const models = await fetchModels(slot.provider, slot.key);
      let text = '';
      await streamOnce(slot, [{ role: 'user', content: 'Tek kelimeyle yanıtla: hazır' }],
        (chunk) => { text += chunk; }, null, 'Yanıtı en fazla bir cümleyle ver.');
      const reply = text.trim();
      if (!reply) throw new Error('Model boş yanıt döndürdü.');
      out.textContent = 'Çalışıyor · ' + models.length + ' model · yanıt: “' + reply.slice(0, 40) + '”';
      toast('Bağlantı ve yanıt çalışıyor.');
    } catch (err) {
      out.textContent = 'Başarısız: ' + String((err && err.message) || err).slice(0, 120);
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

/* ----------------------------- Dil seçimi -----------------------------
   İlk kurulumda rehberden önce açılır; Ayarlar → Dil ile yeniden açılabilir. */
let langFirstRun = false;

function renderLangList() {
  const wrap = $('langList');
  wrap.innerHTML = '';
  for (const code of MOB_LANG_LIST) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lang-item';
    b.dataset.lang = code;
    b.lang = code;
    b.innerHTML = '<span class="lang-name">' + esc(LANG_NAMES[code]) + '</span>' +
      '<span class="lang-code">' + LANG_CODE_LABEL[code] + '</span>' +
      '<svg class="lang-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>';
    b.addEventListener('click', () => chooseLang(code));
    wrap.appendChild(b);
  }
}

function openLangScreen(firstRun) {
  langFirstRun = !!firstRun;
  closeDrawer();
  $('settings').hidden = true;
  $('tutorial').hidden = true;
  $('langCancel').hidden = langFirstRun;
  renderLangList();
  applyMobLang();
  $('langScreen').hidden = false;
}

function closeLangScreen() { $('langScreen').hidden = true; }

function chooseLang(code) {
  if (MOB_LANG_LIST.indexOf(code) < 0) return;
  const firstRun = langFirstRun;
  langFirstRun = false;
  state.lang = code;
  state.replyLang = code;
  state.langDone = true;
  saveState();
  $('replyLang').value = code;
  applyMobLang();
  closeLangScreen();
  if (firstRun) { openTutorial(true, 2); return; }
  openSettings();
}

/* Rehber ve etiketler seçilen dile çevrilir. */
function applyMobLang() {
  const code = mobLang();
  document.documentElement.lang = code;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = T(el.dataset.t); });
  document.querySelectorAll('[data-th]').forEach((el) => { el.innerHTML = T(el.dataset.th); });
  $('langTitle').textContent = T('langTitle');
  $('langLead').textContent = T('langLead');
  $('langCancel').textContent = T('langCancel');
  $('langValue').textContent = LANG_NAMES[state.lang] || LANG_NAMES[code];
  document.querySelectorAll('#langList [data-lang]').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === (state.lang || code));
  });
  setTutStep(tutStep);
}

/* ----------------------------- İlk açılış rehberi ----------------------------- */
function setTutStep(n) {
  tutStep = Math.max(1, Math.min(4, n));
  document.querySelectorAll('.tut-step').forEach((s) => { s.hidden = Number(s.dataset.step) !== tutStep; });
  document.querySelectorAll('#tutDots i').forEach((d, i) => d.classList.toggle('on', i === tutStep - 1));
  $('tutNext').textContent = tutStep === 4 ? T('start') : T('next');
  $('tutSkip').hidden = tutStep === 4;
  document.querySelector('.tut-body').scrollTop = 0;
}

function openTutorial(force, start) {
  closeDrawer();
  $('settings').hidden = true;
  $('langScreen').hidden = true;
  $('tutorial').hidden = false;
  applyMobLang();
  tutSlot = state.apis[0] || null;
  $('tutKey').value = '';
  $('tutKeyMsg').textContent = T('keyOnlyDevice');
  $('tutKeyMsg').className = 'hint';
  $('tutModelField').hidden = true;
  $('tutFetchMsg').textContent = T('tut3Hint');
  $('tutFetchMsg').className = 'hint';
  $('tutAssistant').checked = !!state.assistantKey;
  setTutStep(start || 1);
  if (!force && state.tutorialDone) closeTutorial();
}

function closeTutorial() {
  $('tutorial').hidden = true;
  syncAssistantKey();
  setTimeout(() => $('input').focus(), 100);
}

function finishTutorial() {
  state.tutorialDone = true;
  saveState();
  closeTutorial();
  renderModelChip();
  renderApiList();
  const on = $('tutAssistant').checked;
  if (on !== state.assistantKey) setAssistantKey(on);
  else if (on) applyAssistantKey();
  toast(T('ready'));
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
      $('tutKeyMsg').textContent = T('keyAdded', { p: PROVIDERS[provider].label });
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
      $('tutFetchMsg').textContent = T('needKey');
      $('tutFetchMsg').className = 'hint bad';
      return;
    }
    $('tutFetch').disabled = true;
    $('tutFetchMsg').textContent = T('modelsLoading');
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
      $('tutFetchMsg').textContent = T('modelsFound', { n: models.length });
      $('tutFetchMsg').className = 'hint good';
    } catch (err) {
      const cfg = PROVIDERS[tutSlot.provider];
      if (cfg.defaultModel) {
        const sel = $('tutModel');
        sel.innerHTML = '<option value="' + esc(cfg.defaultModel) + '">' + esc(cfg.defaultModel) + '</option>';
        $('tutModelField').hidden = false;
        $('tutFetchMsg').textContent = T('modelsFallback');
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
  $('langRow').addEventListener('click', () => openLangScreen(false));
  $('langCancel').addEventListener('click', () => { closeLangScreen(); openSettings(); });

  /* Mikrofon, ses, kamera ve profil fotoğrafı */
  $('voiceOn').addEventListener('change', (e) => {
    state.voiceOn = e.target.checked;
    saveState();
    if (!state.voiceOn) stopSpeaking();
  });
  $('voicePick').addEventListener('change', (e) => {
    state.voiceId = e.target.value;
    saveState();
    speakText('Merhaba, ben PRIME AI. Bu ses nasıl?');
  });
  $('voiceRate').addEventListener('input', (e) => {
    state.voiceRate = Number(e.target.value);
    $('voiceRateValue').textContent = Number(state.voiceRate).toFixed(1).replace('.', ',') + '×';
    saveState();
  });
  $('voiceTry').addEventListener('click', () => {
    speakText('Merhaba, ben PRIME AI. Kameradaki nesneleri anlatabilir, adlarını hatırlayabilirim.');
  });
  $('micAutoSend').addEventListener('change', (e) => { state.micAutoSend = e.target.checked; saveState(); });
  $('micLang').addEventListener('change', (e) => { state.micLang = e.target.value; saveState(); });
  $('bargeIn').addEventListener('change', (e) => { state.bargeIn = e.target.checked; saveState(); });
  $('micTest').addEventListener('click', () => { if (micActive) stopMic(); else startMic('chat'); });

  $('avatarPick').addEventListener('click', () => $('avatarInput').click());
  $('profileAvatar').addEventListener('click', () => $('avatarInput').click());
  $('avatarClear').addEventListener('click', () => {
    state.avatar = '';
    saveState();
    renderAvatar();
    toast('Profil fotoğrafı kaldırıldı.');
  });
  $('avatarInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) await pickAvatar(file);
  });

  $('cameraBtn').addEventListener('click', openCamera);
  $('camClose').addEventListener('click', closeCamera);
  $('camStop').addEventListener('click', closeCamera);
  $('camFlip').addEventListener('click', flipCamera);
  $('camMicToggle').addEventListener('click', toggleCamMic);
  $('camMemory').addEventListener('click', async () => {
    const frame = lastCameraFrame || captureFrame();
    if (!frame) { toast('Önce kameraya bir şey göster.', true); return; }
    const name = prompt('Nesnenin adı ne?');
    if (name) await saveMemory(name, frame, 'elle eklendi');
  });

  /* Çekmece sekmeleri: Sohbetler / Kameralı Sohbetler */
  document.querySelectorAll('#drawerTabs .drawer-tab').forEach((b) => {
    b.addEventListener('click', () => {
      drawerTab = b.dataset.kind === 'cam' ? 'cam' : 'chat';
      renderChatList();
    });
  });

  /* Kayıtlı varlıklar: ayarlar → galeri → tam ekran gezinme */
  $('assetsOpen').addEventListener('click', openAssets);
  $('assetsBack').addEventListener('click', closeAssets);
  $('viewerClose').addEventListener('click', closeAsset);
  $('viewerVeil').addEventListener('click', closeAsset);
  $('viewerPrev').addEventListener('click', () => stepAsset(-1));
  $('viewerNext').addEventListener('click', () => stepAsset(1));
  wireAssetSwipe();
  renderCamMic();

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

  $('modelChip').addEventListener('click', () => openModelSheet());

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

  $('thread').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const pre = btn.closest('pre');
    const code = pre ? pre.querySelector('code') : null;
    if (code) copyText(code.textContent);
  });

  $('chatArea').addEventListener('scroll', () => { /* kaydırma konumu korunur */ });

}

/* ----------------------------- PWA ----------------------------- */
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ----------------------------- Başlangıç ----------------------------- */
/* Android kabuğunda tarayıcı ipucu gösterilmez. */
function inApp() {
  try { return !!(window.PrimeAndroid && window.PrimeAndroid.isApp && window.PrimeAndroid.isApp()); }
  catch { return false; }
}

/* ------------------------------ Güncelleme ------------------------------ */
/* Yeni sürüm bilgisi GitHub'daki update.json dosyasından okunur. Uygulama
   kabuğunda APK, Android tarafında indirilir ve kurulum ekranı açılır;
   kurulum bitince yeni sürüm açılır. Tarayıcıda/PWA'da güncelleme düğmesi
   APK bağlantısını açar. */

const UPDATE_FEED = 'https://raw.githubusercontent.com/dgkn23trzn-star/Prime-AI/main/update.json';

let updInfo = null;
let updBusy = false;
let updPhase = 'idle';
let updCheckedAt = 0;
let updTimer = null;

function cmpVersion(a, b) {
  const parts = (value) => String(value == null ? '' : value)
    .trim().replace(/^v/i, '').split('-')[0].split('.')
    .map((part) => { const n = parseInt(part, 10); return Number.isFinite(n) && n > 0 ? n : 0; });
  const left = parts(a);
  const right = parts(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const x = left[i] || 0;
    const y = right[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/* Yalnızca bu deponun https adresleri kabul edilir. */
function safeUpdateUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:') return '';
    if (!/(^|\.)github\.com$/i.test(url.hostname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function updStatusText(text, isError) {
  const node = $('updStatus');
  if (!node) return;
  if (!text) {
    node.hidden = true;
    node.textContent = '';
    node.classList.remove('err');
    return;
  }
  node.hidden = false;
  node.textContent = text;
  node.classList.toggle('err', !!isError);
}

function updSetProgress(pct) {
  const value = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const bar = $('updBar');
  if (bar) bar.style.width = value + '%';
  const label = $('updPct');
  if (label) label.textContent = '%' + value;
}

function updMegabytes(bytes) {
  return (Math.max(0, Number(bytes) || 0) / 1048576).toFixed(1) + ' MB';
}

function updResetCard() {
  updBusy = false;
  updPhase = 'idle';
  if ($('updProgress')) $('updProgress').hidden = true;
  updSetProgress(0);
  updStatusText('');
  const now = $('updNow');
  if (now) { now.disabled = false; now.textContent = 'Güncelle'; }
  const later = $('updLater');
  if (later) { later.disabled = false; later.hidden = false; }
}

function updPollStop() {
  if (updTimer) { clearInterval(updTimer); updTimer = null; }
}

function closeUpdateCard() {
  const modal = $('updModal');
  if (!modal) return;
  modal.hidden = true;
}

function showUpdateCard(info) {
  if (!info || !info.hasUpdate) return;
  updInfo = info;
  updResetCard();
  const version = $('updVer');
  if (version) version.textContent = info.latest || '';
  const notes = Array.isArray(info.notes) ? info.notes.slice(0, 4) : [];
  const list = $('updNotes');
  if (list) {
    list.innerHTML = '';
    notes.forEach((note) => {
      const li = document.createElement('li');
      li.textContent = note;
      list.appendChild(li);
    });
    list.hidden = notes.length === 0;
  }
  const modal = $('updModal');
  if (modal) modal.hidden = false;
}

function updateBridge() {
  return inApp() ? window.PrimeAndroid : null;
}

function updateStateOf() {
  const bridge = updateBridge();
  if (!bridge || typeof bridge.updateState !== 'function') return null;
  try { return JSON.parse(String(bridge.updateState() || '')); } catch { return null; }
}

/* Android tarafındaki durumu arayüze yansıtır. Kurulum izni yoksa ayarlar
   açılır; izin verilince bir sonraki yoklamada kurulum kendiliğinden başlar. */
function updHandleState(state) {
  if (!state) return;
  const now = $('updNow');
  const later = $('updLater');
  const progress = $('updProgress');
  const phase = String(state.state || '');

  if (phase === 'downloading') {
    updBusy = true;
    updPhase = 'downloading';
    if (progress) progress.hidden = false;
    if (now) { now.disabled = true; now.textContent = 'İndiriliyor…'; }
    if (later) later.disabled = false;
    updSetProgress(state.pct);
    updStatusText(state.total
      ? 'İndiriliyor: ' + updMegabytes(state.received) + ' / ' + updMegabytes(state.total)
      : 'APK indiriliyor…');
    return;
  }

  if (phase === 'ready') {
    updBusy = true;
    updSetProgress(100);
    if (now) { now.disabled = true; now.textContent = 'Kurulum açılıyor…'; }
    if (later) later.disabled = false;
    updStatusText('İndirme tamamlandı, kurulum ekranı açılıyor…');
    if (updPhase !== 'installing') {
      updPhase = 'installing';
      const bridge = updateBridge();
      let next = null;
      try { next = JSON.parse(String(bridge.installUpdate() || '')); } catch { next = null; }
      if (next) updHandleState(next);
    }
    return;
  }

  if (phase === 'needs_permission') {
    updBusy = true;
    updPhase = 'permission';
    if (now) { now.disabled = false; now.textContent = 'İzin ver'; }
    if (later) later.disabled = false;
    updStatusText('Kurulum için izin gerekiyor: açılan ayarda PRIME AI\'ya izin ver, sonra bu ekrana dön.');
    return;
  }

  if (phase === 'installing') {
    updBusy = true;
    updPhase = 'installing';
    if (now) { now.disabled = true; now.textContent = 'Kurulum ekranı açık…'; }
    if (later) later.disabled = false;
    updStatusText('Kurulum ekranında “Kur”a dokun. Bitince “Aç” yeni sürümü başlatır.');
    return;
  }

  if (phase === 'error') {
    updBusy = false;
    updPhase = 'error';
    updPollStop();
    if (now) { now.disabled = false; now.textContent = 'Tekrar dene'; }
    if (later) later.disabled = false;
    updStatusText('Güncelleme indirilemedi: ' + (state.error || 'bilinmeyen hata') + '.', true);
  }
}

function updPollStart() {
  updPollStop();
  const tick = () => {
    const state = updateStateOf();
    if (!state) { updPollStop(); return; }

    /* İzin verildi: kurulum kendiliğinden açılır. */
    if (state.state === 'needs_permission' && state.canInstall) {
      const bridge = updateBridge();
      let next = null;
      try { next = JSON.parse(String(bridge.installUpdate() || '')); } catch { next = null; }
      updPollStop();
      if (next) updHandleState(next);
      return;
    }

    updHandleState(state);
    if (state.state === 'error' || state.state === 'installing') updPollStop();
  };
  tick();
  updTimer = setInterval(tick, 800);
}

function startAppUpdate() {
  if (!updInfo) return;
  const bridge = updateBridge();
  const url = safeUpdateUrl(updInfo.url);

  /* Android yoksa (PWA/tarayıcı): APK bağlantısı açılır. */
  if (!bridge || typeof bridge.downloadUpdate !== 'function') {
    if (!url) { updStatusText('İndirme adresi bulunamadı.', true); return; }
    closeUpdateCard();
    toast('APK indiriliyor. Kurulum bitince yeni sürümü aç.');
    try { window.open(url, '_blank', 'noopener'); } catch { location.href = url; }
    return;
  }

  if (updBusy) {
    /* "İzin ver" durumunda düğme ayarları açar. */
    if (updPhase === 'permission' && typeof bridge.openUpdateSettings === 'function') {
      try { bridge.openUpdateSettings(); } catch { /* yok */ }
    }
    return;
  }

  if (!url) { updStatusText('İndirme adresi bulunamadı.', true); return; }

  const now = $('updNow');
  const later = $('updLater');
  updBusy = true;
  updPhase = 'downloading';
  if (now) { now.disabled = true; now.textContent = 'İndiriliyor…'; }
  if (later) later.disabled = true;
  if ($('updProgress')) $('updProgress').hidden = false;
  updSetProgress(0);
  updStatusText('APK indiriliyor…');

  const fileName = url.split('/').pop() || 'PRIME-AI-Mobil.apk';
  let state = null;
  try { state = JSON.parse(String(bridge.downloadUpdate(url, fileName) || '')); } catch { state = null; }
  if (state && state.state === 'error') {
    updHandleState(state);
    return;
  }
  updPollStart();
}

async function checkAppUpdate(manual) {
  if (updBusy) {
    if (manual) toast('Güncelleme zaten sürüyor.');
    return null;
  }
  if (!manual && Date.now() - updCheckedAt < 20000) return null;
  updCheckedAt = Date.now();
  const sub = $('updCheckSub');
  if (manual && sub) sub.textContent = 'Denetleniyor…';

  let info = null;
  try {
    const res = await fetch(UPDATE_FEED + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const feed = await res.json();
    const entry = feed && feed.mobile;
    if (!entry || !entry.version) throw new Error('sürüm bilgisi yok');
    const latest = String(entry.version);
    info = {
      ok: true,
      current: VERSION,
      latest,
      hasUpdate: cmpVersion(latest, VERSION) > 0,
      notes: Array.isArray(entry.notes) ? entry.notes.map(String).slice(0, 4) : [],
      url: safeUpdateUrl(entry.url),
      page: safeUpdateUrl(entry.page)
    };
  } catch (err) {
    info = { ok: false, error: String((err && err.message) || err) };
  }

  if (sub) {
    sub.textContent = info.ok
      ? (info.hasUpdate ? 'Yeni sürüm var: ' + info.latest : 'En güncel sürümdesin · ' + VERSION)
      : 'Denetlenemedi · bağlantını kontrol et';
  }
  if (info.ok && info.hasUpdate) {
    showUpdateCard(info);
    if (manual) toast('Yeni sürüm var: ' + info.latest);
  } else if (manual) {
    toast(info.ok ? 'En güncel sürümü kullanıyorsun (' + VERSION + ').' : 'Güncelleme denetlenemedi.');
  }
  return info;
}

function initUpdater() {
  const now = $('updNow');
  if (now) now.addEventListener('click', startAppUpdate);
  const later = $('updLater');
  if (later) later.addEventListener('click', closeUpdateCard);
  const checkRow = $('updCheckRow');
  if (checkRow) checkRow.addEventListener('click', () => { checkAppUpdate(true); });

  /* İzin ekranından ya da kurulum ekranından dönünce durum tazelenir. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (updPhase === 'permission') {
      const state = updateStateOf();
      if (state) {
        if (state.canInstall && state.state === 'needs_permission') updPollStart();
        else updHandleState(state);
      }
      return;
    }
    if (updPhase === 'installing') {
      setTimeout(() => {
        if (updPhase !== 'installing') return;
        const now = $('updNow');
        updBusy = false;
        updPhase = 'idle';
        if (now) { now.disabled = false; now.textContent = 'Tekrar dene'; }
        if ($('updLater')) $('updLater').disabled = false;
        updStatusText('Kurulum tamamlanmadıysa “Tekrar dene”ye dokunabilirsin.');
      }, 2500);
    }
  });

  setTimeout(() => { checkAppUpdate(false); }, 4200);
  setInterval(() => { checkAppUpdate(false); }, 6 * 60 * 60 * 1000);
}

/* ------------------------- Asistan tuşu (Android) ------------------------- */
/* Ayarlardaki anahtar Android kabuğuna haber verir: uygulama kapanır, top ana
   ekranda kalır ve oradan soru sorulur. Tarayıcıda yalnızca ayar saklanır. */
function assistantBridge() {
  return inApp() ? window.PrimeAndroid : null;
}
function assistantStateOf() {
  const na = assistantBridge();
  if (!na || typeof na.assistantState !== 'function') return null;
  try { return JSON.parse(String(na.assistantState() || '')); } catch { return null; }
}
function assistantKeySub(info) {
  const el = $('assistantKeySub');
  if (!el) return;
  if (!inApp()) {
    el.textContent = 'Ana ekrandaki top PRIME AI uygulamasında görünür';
    return;
  }
  if (!state.assistantKey) {
    el.textContent = 'Kapalı · açınca top ana ekranda durur, uygulama kapanır';
    return;
  }
  const i = info || assistantStateOf() || {};
  if (i.overlay === false) { el.textContent = 'Ekranda gösterme izni bekleniyor · ayarı kapatıp aç'; return; }
  if (i.mic === false) { el.textContent = 'Mikrofon izni yok · top dinleyemez, yazamaz'; return; }
  el.textContent = 'Açık · top ana ekranda; uygulama kapalıyken de sorabilirsin';
}
function applyAssistantKey() { assistantKeySub(null); }

function setAssistantKey(on) {
  state.assistantKey = !!on;
  saveState();
  renderAssistantKey();
  const na = assistantBridge();
  if (na && typeof na.setAssistant === 'function') {
    let info = null;
    try { info = JSON.parse(String(na.setAssistant(!!on) || '')); } catch { info = null; }
    assistantKeySub(info);
    if (!on) { toast('Asistan tuşu kapatıldı.'); return; }
    if (info && info.overlay === false) toast('İzin ekranında “bu uygulamaya izin ver”e bas.');
    else if (info && info.mic === false) toast('Mikrofon izni vermezsen sesle soramazsın.');
    else toast('Asistan topu ana ekranda.');
    return;
  }
  toast(on ? 'Asistan tuşu açıldı · top uygulamada ana ekranda görünür.' : 'Asistan tuşu kapatıldı.');
}

function renderAssistantKey() {
  const box = $('assistantKey');
  if (box) box.checked = !!state.assistantKey;
  assistantKeySub(null);
}

/* Uygulama her açıldığında: ayar açıksa top Android tarafında yeniden kurulur. */
function syncAssistantKey() {
  renderAssistantKey();
  const na = assistantBridge();
  if (!na || typeof na.ensureAssistant !== 'function') return;
  try { assistantKeySub(JSON.parse(String(na.ensureAssistant() || ''))); } catch { /* yok */ }
}

/* Android geri tuşu: açık sayfa/panel varsa onu kapatır. */
window.__primeBack = function () {
  if (!$('updModal').hidden) { closeUpdateCard(); return true; }
  if (!$('camSheet').hidden) { closeCamera(); return true; }
  if (!$('modelSheet').hidden) { closeModelSheet(); return true; }
  if (!$('apiEdit').hidden) { backToSettings(); return true; }
  if (!$('langScreen').hidden) {
    /* İlk kurulumda dil seçilmeden geçilmez. */
    if (!langFirstRun) { closeLangScreen(); openSettings(); }
    return true;
  }
  if (!$('drawer').hidden) { closeDrawer(); return true; }
  if (!$('settings').hidden) { closeSettings(); return true; }
  if (!$('tutorial').hidden) { closeTutorial(); return true; }
  return false;
};

function boot() {
  ensureActive();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderAssistantKey();
  });
  if (inApp()) document.documentElement.classList.add('in-app');
  updateBrand();
  updateGreeting();
  applyTheme();
  fillProviderSelect();
  providerHint('gemini');
  wireChrome();
  wireSettings();
  wireTutorial();
  wireModelSheet();
  wireApiEdit();
  syncAssistantKey();
  fillVoiceSelect();
  renderAvatar();
  renderMemories();
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
    };
    window.visualViewport.addEventListener('resize', fit);
    fit();
  }

  registerSW();
  initUpdater();

  setTimeout(() => {
    if (!state.langDone || !state.lang) { openLangScreen(true); return; }
    if (!state.tutorialDone) openTutorial(true);
    else if (!slotReady(activeSlot())) toast(T('noKeyToast'));
  }, 350);
}

document.addEventListener('DOMContentLoaded', boot);
