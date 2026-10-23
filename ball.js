/* PRIME AI — masaüstü topu
   Küçük saydam pencerede yaşar: sol tık yalnızca yazma kutusunu açar; yazıp
   gönderince kutu kapanır, yanıt ayrı bir konuşma balonunda akar. Sağ tık
   menüsünde renkler ve (iki basışla) uygulamaya dönüş vardır.
   6–8 dakikada bir yorulur: huysuzca veda eder, esner, yatağına yatıp 1 dakika uyur
   ve gerinerek uyanır. Boşta sık sık yüzünü döndürüp etrafa bakar, arada yavaşça dolanır.
   Yanıtı uygulamanın kendisi üretir; bu sayfa onu gösterir. */
'use strict';

const bridge = window.PRIME_DESKTOP || null;

const COLORS = [
  { key: 'gri', tr: 'Gri', en: 'Grey', a: '#cfd5dd', b: '#6d747e' },
  { key: 'kirmizi', tr: 'Kırmızı', en: 'Red', a: '#ff8d80', b: '#d13b34' },
  { key: 'sari', tr: 'Sarı', en: 'Yellow', a: '#ffe58c', b: '#e0b020' },
  { key: 'mavi', tr: 'Mavi', en: 'Blue', a: '#8fbcff', b: '#2f68d8' },
  { key: 'siyah', tr: 'Siyah', en: 'Black', a: '#565c66', b: '#22262d' },
  { key: 'mor', tr: 'Mor', en: 'Purple', a: '#c4a6ff', b: '#7a44e0' },
  { key: 'pembe', tr: 'Pembe', en: 'Pink', a: '#ffb0d4', b: '#db3f8c' },
  { key: 'yesil', tr: 'Yeşil', en: 'Green', a: '#96ecb4', b: '#2ba361' },
  { key: 'turuncu', tr: 'Turuncu', en: 'Orange', a: '#ffc48f', b: '#e8761f' }
];

/* Aksesuarlar: sağ tık menüsünden seçilir, topa uygulanır ve ayarlara yazılır. */
const ACCS = [
  { key: 'yok', tr: 'Yok', en: 'None', icon: '✕' },
  { key: 'gozluk', tr: 'Gözlük', en: 'Glasses', icon: '👓' },
  { key: 'kovboy', tr: 'Kovboy şapkası', en: 'Cowboy hat', icon: '🤠' },
  { key: 'sapka', tr: 'Şapka', en: 'Cap', icon: '🧢' },
  { key: 'maske', tr: 'Siyah gözlük', en: 'Black glasses', icon: '🕶️' },
  { key: 'tac', tr: 'Kral tacı', en: 'King crown', icon: '👑' },
  { key: 'agiz', tr: 'Ağız maskesi', en: 'Face mask', icon: '😷' }
];

const STR = {
  tr: {
    placeholder: 'Bir şey yaz…', send: 'Gönder', back: 'Uygulamaya dön',
    again: 'Emin misin? Bir daha tıkla',
    titles: 'Sol tık: yaz · Sağ tık: renk, aksesuar ve menü · Sürükle: taşı',
    fail: 'Yanıt alınamadı.', empty: 'Yanıt gelmedi.', colorLabel: 'Top rengi',
    accLabel: 'Aksesuarlar',
    mic: 'Sesle konuş', listening: 'Dinliyorum…',
    summonHello: 'Kanka neler soracan gene?', close: 'Kapat',
    byeTired: 'Ben uyuyacağım… bay bay…', yawnBye: 'Hııııaaah… bay bay…',
    goodMorning: 'Günaydın! Enerji dolu döndüm!'
  },
  en: {
    placeholder: 'Type something…', send: 'Send', back: 'Back to app',
    again: 'Sure? Click again',
    titles: 'Left click: type · Right click: colours, accessories and menu · Drag: move',
    fail: 'No answer received.', empty: 'No reply yet.', colorLabel: 'Ball colour',
    accLabel: 'Accessories',
    mic: 'Talk by voice', listening: 'Listening…',
    summonHello: 'Hey buddy, what are you gonna ask this time?', close: 'Close',
    byeTired: "I'm gonna sleep… bye bye…", yawnBye: 'Yaaawn… bye bye…',
    goodMorning: "Morning! I'm full of energy again!"
  }
};

/* Uyku düzeni ayarlardan gelir (Asistan Ayarları); buradakiler varsayılanlardır.
   Varsayılan davranış: 6–8 dakikada bir yorulur, 1 dakika uyur. */
const SLEEP_DEFAULT = { every: 7, len: 60 };
const SLEEPY_LEAD_MS = 45 * 1000;    // uyumaya 45 sn kala yorulmaya başlar
const DROWSY_LEAD_MS = 12 * 1000;    // son 12 sn: iyice ağırlaşır
const BEDTIME_MS = 2600;             // yorgun veda cümlesinin ekranda kalma süresi
const YAWN_MS = 1600;                // esneme
const LIE_MS = 900;                  // yatağa yatma
const WAKE_ANIM_MS = 1600;           // uyanma animasyonu
const RETURN_MS = 2600;              // "uygulamaya dön" ikinci basışa kadar bekleme
const SPEECH_HOLD_MS = 4200;         // sesli sorudan sonra cevabı okuyup dinlemeye dönme süresi
const MOOD_STEP_MS = 2100;           // aynı yanıttaki ikinci duyguya geçiş aralığı
const LOOK_MS = [2400, 6400];        // boşta bakma aralığı (sık sık etrafa bakar)
const WANDER_MS = [16000, 38000];    // yavaş ama sık dolanma aralığı
const GAZE_MS = [10000, 23000];      // ara sıra fareye bakma aralığı (hep değil)
const GAZE_HOLD_MS = [2400, 4400];   // her bakışın süresi
const CHATTER_MS = [170000, 330000]; // kendiliğinden sohbet aralığı
const CHATTER_HOLD_MS = 6200;        // kendiliğinden söylediği cümlenin ekranda kalması

/* Kendiliğinden söylediği kısa cümleler. Artık hangi uygulamada ne yapıldığı
   sorulmaz; yalnızca yardım teklifi ve kısa hatırlatmalar. Top boştayken,
   arada bir gösterilir. */
const CHATTER = {
  tr: [
    'Bir şeye ihtiyacın olursa buradayım.',
    'Bir el atacağım bir şey var mı?',
    'Takıldığın bir yer olursa yaz.',
    'Bir şey sormak istersen buradayım.',
    'Buradayım; ne zaman istersen.'
  ],
  en: [
    'I am here if you need anything.',
    'Need a hand with something?',
    'Ping me if you get stuck.',
    'Ask me anything whenever you like.',
    'I am right here whenever you need me.'
  ]
};

/* Duygu sözlüğü: asistanın KENDİ yanıtındaki kelimelere göre yüz değişir.
   Her duygunun eşleşmeleri sırayla taranır; metinde EN SON geçen duygu
   kazanır, böylece “maalesef… ama harika haber” gibi cümlelerde top önce
   üzülüp sonra sevinir (geçiş CSS ile yumuşak). */
const MOOD_KEYS = ['neseli', 'uzgun', 'kizgin', 'saskin'];
const MOOD_WORDS = [
  { key: 'uzgun', re: /(üzgünüm|uzgunum|üzülüyorum|uzuluyorum|üzüldüm|uzuldum|üzücü|uzucu|maalesef|ne yazık|ne yazik|ne yazık ki|kötü haber|kotu haber|geçmiş olsun|gecmis olsun|başın sağ olsun|basin sag olsun|olmuyor işte|ne acı|ne aci|😔|😞|😢|😭|💔)/gi },
  { key: 'kizgin', re: /(sinirlendim|sinirliyim|sinirim bozuldu|kızgınım|kizginim|öfkeliyim|ofkeliyim|kabul edilemez|saçmalık|sacmalik|rezalet|saygısızlık|saygisizlik|yeter artık|yeter artik|aptalca|utanç verici|utanc verici|😠|😡|🤬)/gi },
  { key: 'saskin', re: /(vay canına|vay canina|vay be|şaşırdım|sasirdim|şaşırtıcı|sasirtici|inanılmaz|inanilmaz|gerçekten mi|gercekten mi|hayret|şaşkın|saskin|hiç beklemiyordum|hic beklemiyordum|😮|😲|🤯)/gi },
  { key: 'neseli', re: /(harika|mükemmel|mukemmel|süper|super|muhteşem|muhtesem|sevindim|çok mutlu|cok mutlu|mutluyum|sevgiler|teşekkür|tesekkur|teşekkürler|tesekkurler|sağ ol|sag ol|bravo|harikulade|bayıldım|bayildim|ne güzel|ne guzel|memnuniyetle|😊|😄|😁|😍|🥳|🎉|❤️)/gi }
];

let lang = 'tr';
let color = 'gri';
let acc = 'yok';
let sleepCfg = { on: true, every: SLEEP_DEFAULT.every, len: SLEEP_DEFAULT.len };
let state = 'ball';                  // ball | ask | speech | menu
let thinking = false;
let active = true;                   // top penceresi görünür mü (uygulamaya dönünce durur)
let pending = null;                  // { id, got, el }
let sleeping = false;                // yatakta uyuyor
let lying = false;                   // yatağa yatıyor (uyku düzeni açık)
let sleepTimer = 0;                  // sıradaki uyku
let sleepyTimer = 0;                 // yorulma başlangıcı
let drowsyTimer = 0;                 // iyice ağırlaşma
let bedtimeTimer = 0;
let yawnTimer = 0;
let lieTimer = 0;
let sleepWakeTimer = 0;              // 1 dakikalık uykunun sonu
let greetTimer = 0;
let wakeAnimTimer = 0;
let exciteTimer = 0;
let bedToken = 0;                    // yatma/uyuma sırası iptal edilsin diye
let watchdog = 0;
let talkTimer = 0;
let moodTimer = 0;
let moodStepTimer = 0;
let moodSeen = [];             // yanıt sırasında gösterilen duygular (sırayla, tekil)
let pendingRaw = '';           // yanıtın ham metni: emoji duygu için okunur ama yazılmaz
let gazing = false;            // fareyi takip ediyor mu
let gazeTimer = 0;
let gazeEndTimer = 0;
let chatterTimer = 0;
let chatterHideTimer = 0;
let chatterText = '';
let shakeTimer = 0;
let lookTimer = 0;
let lookClassTimer = 0;
let lookAgainTimer = 0;
let wanderTimer = 0;
let wanderClassTimer = 0;
let returnArmedAt = 0;
let returnTimer = 0;
let drag = null;
let liveText = '';              // konuşurken yazıya çevrilen ara metin
let resumeTimer = 0;            // sesli yanıttan sonra dinleme alanına dönüş
let smileTimer = 0;             // çağrı gülümsemesi
let blinkTimer = 0;             // ara sıra çift kırpma / göz kırpma

const $ = (id) => document.getElementById(id);
const orb = $('orb');
const askEl = $('ask');
const speechEl = $('speech');
const menuEl = $('menu');
const replyEl = $('reply');
const input = $('askInput');
const menuReturn = $('menuReturn');
const menuReturnText = $('menuReturnText');
const wrapEl = document.querySelector('.orb-wrap');
const orbMic = $('orbMic');
const askMic = $('askMic');
const orbListen = $('orbListen');
const liveEl = $('live');

const str = (key) => (STR[lang] || STR.en || STR.tr)[key] || key;
const rand = (min, max) => min + Math.random() * (max - min);

/* Asistanın kendi yazdığı metinde emoji YOK. Emoji yalnızca duygu sinyali
   olarak okunur (kaşlar/ağız), ekrana yazılmaz. */
function stripEmoji(text) {
  const s = String(text == null ? '' : text);
  if (!s) return '';
  return s
    .replace(/[0-9#*]\uFE0F?\u20E3/g, '')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0F\u200D\u20E3]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/[ \t]+$/gm, '');
}
const clampNum = (v, min, max, dflt) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : dflt);

/* --------------------------- pencere düzeni --------------------------- */
function layout() {
  /* Top yatağa yatarken ya da uyurken pencere, yatak ve z harfleri
     görünsün diye büyür. */
  const name = (sleeping || lying) && state === 'ball' ? 'sleep' : state;
  document.body.dataset.state = name;
  askEl.hidden = state !== 'ask';
  speechEl.hidden = state !== 'speech';
  menuEl.hidden = state !== 'menu';
  if (bridge && bridge.ballLayout) bridge.ballLayout(name);
  if (state !== 'menu') resetReturnButton();
  if (state === 'ask') setTimeout(() => { try { input.focus(); } catch { /* yok */ } }, 30);
}

function setState(next) {
  clearTimeout(resumeTimer);
  state = next === 'ask' || next === 'speech' || next === 'menu' ? next : 'ball';
  layout();
  if (state !== 'ball') { stopGaze(); resetSleep(); }
}

/* Sol tık: yalnızca yazma kutusu. Renkler burada YOK. */
function openAsk() {
  wake();
  if (sleeping) wake();
  cancelChatter();
  setState('ask');
  /* Canlı metin varsa yazma kutusuna taşı. */
  if (liveText && input) {
    input.value = liveText;
    try { input.setSelectionRange(liveText.length, liveText.length); } catch { /* yok */ }
  }
}
function closePanels() { setState('ball'); setMood(''); }

function toggleBallPanels() {
  if (state === 'ask') closePanels();
  else if (state === 'speech') openAsk();     // balon kapanır, yazma yeri açılır
  else if (state === 'menu') closePanels();
  else openAsk();
}

function openMenu() {
  wake();
  cancelChatter();
  setState(state === 'menu' ? 'ball' : 'menu');
  if (state === 'menu') { markColor(); markAcc(); }
}

/* ------------------------------- renk ------------------------------- */
function applyColor(key, tellApp) {
  const next = COLORS.some((c) => c.key === key) ? key : 'gri';
  color = next;
  document.body.dataset.color = next;
  markColor();
  if (tellApp && bridge && bridge.ballColor) bridge.ballColor(next);
}

function markColor() {
  document.querySelectorAll('.orb-swatch').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.color === color ? 'true' : 'false');
  });
}

/* ------------------------------ aksesuar ------------------------------ */
function applyAcc(key, tellApp) {
  const next = ACCS.some((a) => a.key === key) ? key : 'yok';
  acc = next;
  document.body.dataset.acc = next;
  markAcc();
  if (tellApp && bridge && bridge.ballAccessory) bridge.ballAccessory(next);
}

function markAcc() {
  document.querySelectorAll('.orb-acc-btn').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.acc === acc ? 'true' : 'false');
  });
}

function buildAccs() {
  const box = $('orbAccs');
  if (!box) return;
  box.innerHTML = '';
  box.setAttribute('aria-label', str('accLabel'));
  for (const a of ACCS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'orb-acc-btn';
    b.dataset.acc = a.key;
    b.textContent = a.icon;
    b.title = lang !== 'tr' ? a.en : a.tr;
    b.setAttribute('aria-label', b.title);
    b.onclick = () => { wake(); applyAcc(a.key, true); };
    box.appendChild(b);
  }
  markAcc();
}

function buildColors() {
  const box = $('orbColors');
  box.innerHTML = '';
  box.setAttribute('aria-label', str('colorLabel'));
  for (const c of COLORS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'orb-swatch';
    b.dataset.color = c.key;
    b.title = lang !== 'tr' ? c.en : c.tr;
    b.setAttribute('aria-label', b.title);
    b.style.background = 'radial-gradient(circle at 34% 28%, ' + c.a + ' 0%, ' + c.b + ' 72%)';
    b.onclick = () => { wake(); applyColor(c.key, true); };
    box.appendChild(b);
  }
  markColor();
}

/* -------------------- uygulamaya dön: iki basışla -------------------- */
function resetReturnButton() {
  clearTimeout(returnTimer);
  returnArmedAt = 0;
  menuReturn.classList.remove('armed');
  menuReturnText.textContent = str('back');
}

function pressReturn() {
  const now = Date.now();
  if (returnArmedAt && now - returnArmedAt < RETURN_MS) {
    returnArmedAt = 0;
    clearTimeout(returnTimer);
    if (bridge && bridge.ballReturn) bridge.ballReturn();
    return;
  }
  returnArmedAt = now;
  menuReturn.classList.add('armed');
  menuReturnText.textContent = str('again');
  clearTimeout(returnTimer);
  returnTimer = setTimeout(resetReturnButton, RETURN_MS);
}

/* -------------------------------- uyku -------------------------------- */
/* Ayarlanan uyku sıklığı: her etkileşimde sayaç sıfırlanır. Uyumaya 45 sn kala
   top yorulmaya, son 12 sn'de iyice ağırlaşmaya başlar. Uyku kapatıldıysa
   hiç planlanmaz. */
function sleepEveryMs() {
  const every = clampNum(sleepCfg.every, 1, 120, SLEEP_DEFAULT.every);
  return rand(Math.max(0.5, every - 1), every + 1) * 60 * 1000;
}

function sleepLenMs() {
  return clampNum(sleepCfg.len, 10, 600, SLEEP_DEFAULT.len) * 1000;
}

function clearSleepiness() {
  clearTimeout(sleepyTimer);
  clearTimeout(drowsyTimer);
  document.body.classList.remove('sleepy', 'very-sleepy');
}

function canSleep() {
  return active && !sleeping && !lying && !thinking && !drag && state === 'ball' &&
    !document.hidden && !document.body.classList.contains('listening') &&
    !document.body.classList.contains('bedtime') &&
    !document.body.classList.contains('yawning');
}

function scheduleSleepCycle(delay) {
  clearTimeout(sleepTimer);
  clearSleepiness();
  if (!active) return;
  if (!sleepCfg.on) return;               // asistanın uykusu kapatıldıysa hiç uyumaz
  const wait = Number.isFinite(delay) ? Math.max(0, Number(delay)) : sleepEveryMs();
  sleepTimer = setTimeout(() => {
    if (canSleep()) beginBedtime();
    else scheduleSleepCycle();
  }, wait);
  sleepyTimer = setTimeout(() => {
    if (sleeping || lying) return;
    document.body.classList.add('sleepy');
  }, Math.max(0, wait - SLEEPY_LEAD_MS));
  drowsyTimer = setTimeout(() => {
    if (sleeping || lying) return;
    document.body.classList.remove('sleepy');
    document.body.classList.add('very-sleepy');
  }, Math.max(0, wait - DROWSY_LEAD_MS));
}

function resetSleep() {
  if (sleeping || lying) return;
  if (document.body.classList.contains('bedtime')) return;
  scheduleSleepCycle();
}

/* Yatma sırası: yorgun veda → esneme → yatağa yatma → uyku. */
function beginBedtime() {
  if (sleeping || lying || !active) return;
  clearTimeout(sleepTimer);
  clearTimeout(bedtimeTimer);
  clearTimeout(yawnTimer);
  clearTimeout(lieTimer);
  clearTimeout(greetTimer);
  const token = ++bedToken;
  /* dolanma animasyonu yorgun duruşu ezmesin */
  clearTimeout(wanderClassTimer);
  document.body.classList.remove('happy', 'excited', 'moving', 'look-left', 'look-right', 'look-up');
  document.body.classList.add('bedtime', 'sleepy');
  state = 'speech';
  showReply(str('byeTired'));
  layout();
  bedtimeTimer = setTimeout(() => {
    if (token !== bedToken) return;
    document.body.classList.add('yawning');
    showReply(str('yawnBye'));
    yawnTimer = setTimeout(() => { if (token === bedToken) lieDown(token); }, YAWN_MS);
  }, BEDTIME_MS);
}

function lieDown(token) {
  document.body.classList.remove('yawning', 'bedtime', 'sleepy', 'very-sleepy');
  document.body.classList.add('lying');
  lying = true;
  state = 'ball';
  replyEl.textContent = '';
  layout();
  lieTimer = setTimeout(() => {
    if (token !== bedToken) return;
    lying = false;
    sleeping = true;
    document.body.classList.remove('lying');
    document.body.classList.add('sleeping');
    renderZzz();
    layout();
    clearTimeout(sleepWakeTimer);
    sleepWakeTimer = setTimeout(() => { if (sleeping) wakeUpFromBed(true); }, sleepLenMs());
  }, LIE_MS);
}

/* Uyanma: gerinme animasyonu, ardından mutlu ve enerjik hâl. */
function wakeUpFromBed(greet) {
  if (!sleeping && !lying) return false;
  ++bedToken;
  clearTimeout(bedtimeTimer);
  clearTimeout(yawnTimer);
  clearTimeout(lieTimer);
  clearTimeout(sleepWakeTimer);
  clearTimeout(greetTimer);
  sleeping = false;
  lying = false;
  document.body.classList.remove('sleeping', 'lying', 'sleepy', 'very-sleepy', 'bedtime', 'yawning');
  $('orbZzz').innerHTML = '';
  document.body.classList.add('waking', 'happy');
  clearTimeout(wakeAnimTimer);
  wakeAnimTimer = setTimeout(() => {
    document.body.classList.remove('waking');
    /* uyandıktan sonra enerji taşar: iki kısa hop */
    if (!sleeping && !lying) {
      document.body.classList.add('excited');
      setTimeout(() => document.body.classList.remove('excited'), 1300);
    }
  }, WAKE_ANIM_MS);
  state = 'ball';
  layout();
  if (greet) {
    showReply(str('goodMorning'));
    state = 'speech';
    layout();
    greetTimer = setTimeout(() => {
      if (sleeping || lying) return;
      if (state === 'speech' && replyEl.textContent === str('goodMorning')) {
        replyEl.textContent = '';
        state = 'ball';
        layout();
      }
    }, 3400);
  }
  scheduleSleepCycle();
  return true;
}

function sleep() {
  if (sleeping || lying) return;
  beginBedtime();
}

function wake() {
  if (sleeping || lying) return wakeUpFromBed(false);
  if (document.body.classList.contains('bedtime') || document.body.classList.contains('yawning')) {
    ++bedToken;
    clearTimeout(bedtimeTimer);
    clearTimeout(yawnTimer);
    document.body.classList.remove('bedtime', 'yawning', 'sleepy', 'very-sleepy');
    document.body.classList.add('happy');
    if (state === 'speech') {
      replyEl.textContent = '';
      state = 'ball';
    }
    layout();
    scheduleSleepCycle();
    return true;
  }
  return false;
}

function renderZzz() {
  const box = $('orbZzz');
  box.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const z = document.createElement('span');
    z.className = 'z';
    z.textContent = 'z';
    z.style.setProperty('--i', String(i));
    box.appendChild(z);
  }
}

/* -------------------------------- yüz -------------------------------- */
/* Yüz tasarımı ayarlardan gelen değerlerle CSS değişkenlerine uygulanır;
   bütün durumlar (mutlu, yorgun, uyku, esneme…) bu değişkenlerden ölçek alır. */
function applyFace(face) {
  const f = face || {};
  const col = (v, d) => (typeof v === 'string' && v.trim()) ? v.trim() : d;
  const st = document.body.style;
  st.setProperty('--eye-size', String(clampNum(f.eyeSize, 0.4, 1.6, 1)));
  st.setProperty('--eye-gap', clampNum(f.eyeGap, 6, 18, 11) + 'px');
  st.setProperty('--eye-r', clampNum(f.eyeR, 0, 50, 50) + '%');
  st.setProperty('--eye-c', col(f.eyeColor, 'rgba(18, 20, 24, .82)'));
  st.setProperty('--mouth-w', clampNum(f.mouthW, 6, 24, 15) + 'px');
  st.setProperty('--mouth-curve', clampNum(f.mouthCurve, 0, 14, 8) + 'px');
  st.setProperty('--mouth-c', col(f.mouthColor, 'rgba(18, 20, 24, .8)'));
  document.body.classList.toggle('round-mouth', f.mouthRound === true);
}

/* ------------------------------ duygu ------------------------------ */
/* Metindeki en son duygu sinyalini döndürür ('' = nötr). */
function moodOf(text) {
  const s = String(text || '');
  if (!s) return '';
  let best = '';
  let bestAt = -1;
  for (const item of MOOD_WORDS) {
    item.re.lastIndex = 0;
    let hit = null;
    let m = item.re.exec(s);
    while (m) {
      hit = m.index + m[0].length;
      m = item.re.exec(s);
    }
    if (hit !== null && hit >= bestAt) {
      best = item.key;
      bestAt = hit;
    }
  }
  return best;
}

/* Metindeki duyguların geçiş sırası (ardışık tekrarlar tekleşir).
   “Maalesef olmadı ama harika haberim var” → ['uzgun', 'neseli'] */
function moodSequence(text) {
  const s = String(text || '');
  if (!s) return [];
  const hits = [];
  for (const item of MOOD_WORDS) {
    item.re.lastIndex = 0;
    let m = item.re.exec(s);
    while (m) {
      hits.push({ key: item.key, at: m.index });
      m = item.re.exec(s);
    }
  }
  hits.sort((a, b) => a.at - b.at);
  const out = [];
  for (const h of hits) if (out[out.length - 1] !== h.key) out.push(h.key);
  return out;
}

/* Duygu değişimi: aynı metinde duygu değişirse kaşlar/ağız yavaşça kayar. */
function applyMood(key) {
  const next = MOOD_KEYS.includes(key) ? key : '';
  if ((document.body.dataset.mood || '') === next) return;
  document.body.dataset.mood = next;
  if (next && !moodSeen.includes(next)) moodSeen.push(next);
  document.body.classList.remove('mood-shift');
  void document.body.offsetWidth;
  document.body.classList.add('mood-shift');
  clearTimeout(moodTimer);
  moodTimer = setTimeout(() => document.body.classList.remove('mood-shift'), 900);
}

/* Elle/tek seferlik duygu: süren zaman çizelgesini iptal eder. */
function setMood(key) {
  clearTimeout(moodStepTimer);
  applyMood(key);
}

/* Yanıt bittiğinde çağrılır: metinde geçen ve henüz gösterilmemiş duygular
   sırayla, MOOD_STEP_MS aralıkla uygulanır; böylece iki duygu varsa yüz
   birinciden ikinciye yavaşça geçer. */
function settleMood(text) {
  clearTimeout(moodStepTimer);
  const seq = moodSequence(text);
  if (!seq.length) { setMood(''); return []; }
  const rest = seq.filter((k) => !moodSeen.includes(k));
  if (!rest.length) return seq;
  applyMood(rest[0]);
  let i = 1;
  const step = () => {
    if (i >= rest.length) return;
    applyMood(rest[i++]);
    moodStepTimer = setTimeout(step, MOOD_STEP_MS);
  };
  if (i < rest.length) moodStepTimer = setTimeout(step, MOOD_STEP_MS);
  return seq;
}

/* ------------------------------ konuşma ------------------------------ */
function scrollReply() { replyEl.scrollTop = replyEl.scrollHeight; }

function showThinking() {
  replyEl.classList.remove('err');
  replyEl.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
}

function showReply(text, isError) {
  replyEl.classList.toggle('err', !!isError);
  replyEl.textContent = stripEmoji(text);
  settleMood(text);
}

function startTalking() {
  document.body.classList.add('talking');
  clearTimeout(talkTimer);
  talkTimer = setTimeout(stopTalking, 900);
}

function stopTalking() {
  document.body.classList.remove('talking');
}

/* Sesli okuma (TTS): metin akmasa bile ağız sesle birlikte oynar.
   Uygulama okumaya başlayınca 'speaking' açılır, bitince kapanır. */
let speakingVoice = false;
function setSpeaking(on) {
  const activeNow = !!on && active;
  speakingVoice = activeNow;
  document.body.classList.toggle('speaking', activeNow);
  if (activeNow) {
    document.body.classList.add('talking');
    clearTimeout(talkTimer);          // okuma boyunca ağız susmasın
  } else if (!pending && !thinking) {
    stopTalking();
  }
}

/* Uygulama/klasör açılırken top kısa süre titrer. */
function shake(ms) {
  if (sleeping) wake();
  document.body.classList.add('launching');
  clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => document.body.classList.remove('launching'), Math.max(400, Number(ms) || 1500));
}

function stopShake() {
  clearTimeout(shakeTimer);
  document.body.classList.remove('launching');
}

/* Ara sıra gözleri iki kez kırpar ya da tek gözünü kırpar: boştaki yüz
   daha canlı görünür. Yalnızca sakin hâllerde çalışır. */
function scheduleBlinks() {
  clearTimeout(blinkTimer);
  blinkTimer = setTimeout(() => {
    if (canIdle() && !document.body.classList.contains('sleepy') &&
        !document.body.classList.contains('very-sleepy')) {
      const r = Math.random();
      if (r < 0.3) {
        document.body.classList.add('blink-twice');
        setTimeout(() => document.body.classList.remove('blink-twice'), 1300);
      } else if (r < 0.45) {
        document.body.classList.add('wink');
        setTimeout(() => document.body.classList.remove('wink'), 800);
      }
    }
    scheduleBlinks();
  }, rand(5200, 11000));
}

/* Topun çevresine saçılan kıvılcımlar; kısa süre sonra silinir. */
function sparkles(count) {
  if (!active || !wrapEl) return;
  const adet = count || 9;
  for (let i = 0; i < adet; i++) {
    const s = document.createElement('span');
    s.className = 'orb-spark';
    const a = Math.random() * Math.PI * 2;
    const d = rand(18, 30);
    s.style.setProperty('--sx', Math.round(Math.cos(a) * d) + 'px');
    s.style.setProperty('--sy', Math.round(Math.sin(a) * d - 8) + 'px');
    s.style.width = s.style.height = Math.round(rand(4, 7)) + 'px';
    s.style.animationDelay = Math.round(rand(0, 140)) + 'ms';
    wrapEl.appendChild(s);
    setTimeout(() => s.remove(), 1250);
  }
}

/* Tıklama halkası: toptan dışa doğru yayılır. */
function ripple() {
  if (!active || !wrapEl) return;
  const r = document.createElement('span');
  r.className = 'orb-ripple';
  wrapEl.appendChild(r);
  setTimeout(() => r.remove(), 720);
}

/* Yanıt gelince kısa sevinç zıplaması + kıvılcım. */
function cheer() {
  if (!active) return;
  document.body.classList.add('cheering');
  clearTimeout(cheerTimer);
  cheerTimer = setTimeout(() => document.body.classList.remove('cheering'), 1000);
  sparkles(10);
}
let cheerTimer = 0;

/* Asistan çağrısı: yandan küçükten büyüyerek gelir, gülümser ve selam verir. */
function summonSequence() {
  if (sleeping) wake();
  clearTimeout(smileTimer);
  document.body.classList.remove('summoning', 'smiling');
  void document.body.offsetWidth;    document.body.classList.add('summoning');
  setTimeout(() => {
    document.body.classList.remove('summoning');
    document.body.classList.add('smiling');
    sparkles(8);
    const selam = greetLine();
    showReply(selam);
    /* Selam da duyulsun: ses, uygulamanın sesli asistan ayarına bağlı. */
    if (bridge && bridge.ballSpeak) bridge.ballSpeak(selam);
    state = 'speech';
    layout();
    clearTimeout(smileTimer);
    smileTimer = setTimeout(() => {
      document.body.classList.remove('smiling');
      /* Selam balonu kendiliğinden kapanır: top yeniden boşta kalır. */
      if (state === 'speech' && replyEl.textContent === selam) {
        replyEl.textContent = '';
        setMood('');
        state = 'ball';
        layout();
        resetSleep();
      }
    }, 5200);
  }, 900);
}

/* Mikrofon dinlerken halka nabız atar; topa yazılan metin uygulamadan gelir. */
function clearLive() {
  liveText = '';
  if (!liveEl) return;
  liveEl.textContent = '';
  liveEl.hidden = true;
  liveEl.classList.remove('on');
}

/* Topta konuşurken gelen ara metni göster (göndermez). */
/* Gönderim tamamlandı: canlı metin ve yazma alanı kapanır, dinleme sürer. */
function commitVoice() {
  if (!active) return;
  clearLive();
  if (input) input.value = '';
  if (state === 'ask') closePanels();
  if (document.body.classList.contains('listening')) setListening(true);
  resetSleep();
}

/* Sesli yanıt kapandıktan sonra boş dinleme alanını geri getir. */
function resumeListening() {
  if (!active || state !== 'speech' || !document.body.classList.contains('listening')) return;
  clearLive();
  setMood('');
  if (input) input.value = '';
  openAsk();
}

function scheduleResume(voice) {
  clearTimeout(resumeTimer);
  if (!document.body.classList.contains('listening')) return;
  /* Sesli sohbette mikrofon beklemez: yanıt biter bitmez yeniden dinlenir
     (Gemini'nin mikrofon modu gibi). Yazılı soruda ise balon biraz kalır. */
  resumeTimer = setTimeout(resumeListening, voice ? 350 : SPEECH_HOLD_MS);
}

function showLive(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  liveText = clean;
  if (sleeping) wake();
  if (state === 'ask' && input) {
    input.value = clean;
    if (document.activeElement === input) {
      try { input.setSelectionRange(clean.length, clean.length); } catch { /* yok */ }
    }
    return;
  }
  if (state === 'ball' || state === 'menu') openAsk();
  if (state !== 'speech' || !liveEl) return;
  liveEl.textContent = clean;
  liveEl.hidden = false;
  liveEl.classList.add('on');
}

function setListening(on) {
  const activeNow = !!on;
  document.body.classList.toggle('listening', activeNow);
  if (orbMic) {
    orbMic.classList.toggle('on', activeNow);
    orbMic.title = activeNow ? str('listening') : str('mic');
    orbMic.setAttribute('aria-label', orbMic.title);
  }
  if (askMic) {
    askMic.classList.toggle('on', activeNow);
    askMic.title = activeNow ? str('listening') : str('mic');
    askMic.setAttribute('aria-label', askMic.title);
  }
  if (!activeNow) clearTimeout(resumeTimer);
  if (!activeNow && liveEl) {
    liveEl.hidden = true;
    liveEl.classList.remove('on');
  }
  if (orbMic) {
    orbMic.classList.toggle('on', activeNow);
    orbMic.title = activeNow ? str('listening') : str('mic');
    orbMic.setAttribute('aria-label', orbMic.title);
  }
  if (orbListen) {
    const label = lang !== 'tr' ? 'Stop listening' : 'Dinlemeyi durdur';
    orbListen.title = label;
    orbListen.setAttribute('aria-label', label);
  }
}

function dictate(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  if (sleeping) wake();
  clearLive();
  openAsk();
  input.value = clean;
  try { input.setSelectionRange(clean.length, clean.length); } catch { /* yok */ }
  input.focus();
  resetSleep();
}

function finishAsk(id, error) {
  if (!pending || pending.id !== id) return;
  const voice = !!pending.voice;
  const raw = pending.raw || '';
  clearTimeout(watchdog);
  thinking = false;
  document.body.classList.remove('thinking');
  if (!pending.got) showReply(error || str('empty'), !!error);
  else if (pending.el) settleMood(raw || pending.el.textContent);
  /* Yanıt geldi: üzücü/sinirli bir yanıt değilse kısa sevinç zıplaması. */
  if (!error && pending.got) {
    const duygu = moodOf(raw || '');
    if (duygu !== 'uzgun' && duygu !== 'kizgin') cheer();
  }
  pending = null;
  clearTimeout(talkTimer);
  talkTimer = setTimeout(stopTalking, 450);
  if (voice) scheduleResume(true);
  resetSleep();
}

function ask(text, opts) {
  const clean = String(text || '').trim();
  if (!clean) return;
  wake();
  cancelChatter();
  stopGaze();
  resetSleep();
  clearTimeout(resumeTimer);
  clearLive();
  input.value = '';
  /* Önceki yazışma görünmez: kutu kapanır, balon temizlenir. */
  replyEl.textContent = '';
  moodSeen = [];
  setMood('');
  state = 'speech';
  thinking = true;
  document.body.classList.add('thinking');
  showThinking();
  layout();
  scrollReply();
  const id = 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  pending = { id, got: false, el: null, raw: '', voice: !!(opts && opts.voice) };
  pendingRaw = '';
  clearTimeout(watchdog);
  watchdog = setTimeout(() => finishAsk(id, str('fail')), 120000);   // uygulama yanıt vermezse takılmasın
  if (!bridge || !bridge.ballAsk) { finishAsk(id, str('fail')); return; }
  bridge.ballAsk(id, clean).then((res) => {
    if (res && res.ok === false) finishAsk(id, res.error || str('fail'));
  }).catch((err) => finishAsk(id, (err && err.message) || str('fail')));
}

function onDelta(data) {
  if (!pending || !data || data.id !== pending.id) return;
  const text = String(data.delta == null ? '' : data.delta);
  if (!text) return;
  if (!pending.got) {
    pending.got = true;
    replyEl.classList.remove('err');
    replyEl.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'orb-text';
    replyEl.appendChild(span);
    pending.el = span;
  }
  pending.raw = (pending.raw || '') + text;
  pendingRaw = pending.raw;
  /* Ham metin duygu için okunur; ekrana emoji olmadan yazılır. */
  pending.el.textContent = stripEmoji(pending.raw);
  setMood(moodOf(pending.raw));
  startTalking();
  scrollReply();
}

/* --------------------- boşta bakma ve dolanma --------------------- */
const LOOKS = ['left', 'right', 'up'];

function look(dir) {
  if (!active) return;
  const side = LOOKS.includes(dir) ? dir : LOOKS[Math.floor(Math.random() * LOOKS.length)];
  document.body.classList.remove('look-left', 'look-right', 'look-up');
  void document.body.offsetWidth;
  document.body.classList.add('look-' + side);
  clearTimeout(lookClassTimer);
  lookClassTimer = setTimeout(() => document.body.classList.remove('look-left', 'look-right', 'look-up'), 1900);
}

function canIdle() {
  return active && !sleeping && !lying && !thinking && !document.hidden && state === 'ball' &&
    !document.body.classList.contains('bedtime') &&
    !document.body.classList.contains('yawning') &&
    !document.body.classList.contains('waking');
}

function scheduleLook() {
  clearTimeout(lookTimer);
  lookTimer = setTimeout(() => {
    if (canIdle()) {
      look();
      /* çoğu zaman bir yöne bakıp kalır; bazen başını çevirip öbür yana da bakar */
      if (Math.random() < 0.4) {
        clearTimeout(lookAgainTimer);
        lookAgainTimer = setTimeout(() => { if (canIdle()) look(); }, 1200);
      }
    }
    scheduleLook();
  }, rand(LOOK_MS[0], LOOK_MS[1]));
}

/* Ara sıra enerji taşar: iki kısa hop. */
function scheduleExcited() {
  clearTimeout(exciteTimer);
  exciteTimer = setTimeout(() => {
    if (canIdle() && !document.body.classList.contains('sleepy') &&
        !document.body.classList.contains('very-sleepy')) {
      document.body.classList.add('excited');
      setTimeout(() => document.body.classList.remove('excited'), 1300);
    }
    scheduleExcited();
  }, rand(14000, 26000));
}

function wander(dx, dy) {
  if (!active || !bridge || !bridge.ballWander) return;
  bridge.ballWander(Math.round(dx), Math.round(dy));
  document.body.classList.add('moving');
  clearTimeout(wanderClassTimer);
  wanderClassTimer = setTimeout(() => document.body.classList.remove('moving'), 2400);
}

/* Yavaş yavaş dolanır ama hep hareket etmez: her turda kısa bir durak da var. */
function maybeWander() {
  if (!canIdle() || drag) return;
  if (document.body.classList.contains('sleepy') || document.body.classList.contains('very-sleepy')) return;
  if (Math.random() > 0.78) return;                // bazen hiç kımıldamaz
  const angle = rand(0, Math.PI * 2);
  const dist = rand(70, 200);
  wander(Math.cos(angle) * dist, Math.sin(angle) * dist);
}

function scheduleWander() {
  clearTimeout(wanderTimer);
  wanderTimer = setTimeout(() => { maybeWander(); scheduleWander(); }, rand(WANDER_MS[0], WANDER_MS[1]));
}

/* ------------------------ fareyi takip (ara sıra) ------------------------ */
/* Ana süreç fare konumunu topun merkezine göre yollar (dx, dy). Yüz yalnızca
   bir “bakış” başladıysa döner; yoksa öne bakar. Böylece hep fareye bakmaz. */
function gazeTo(dx, dy) {
  if (!gazing) return;
  const nx = Math.max(-1, Math.min(1, (Number(dx) || 0) / 180));
  const ny = Math.max(-1, Math.min(1, (Number(dy) || 0) / 140));
  const st = document.body.style;
  st.setProperty('--gaze-x', (nx * 7).toFixed(1) + 'px');
  st.setProperty('--gaze-y', (ny * 4).toFixed(1) + 'px');
  st.setProperty('--gaze-r', (nx * 10).toFixed(1) + 'deg');
}

function startGaze() {
  if (!active) return false;
  gazing = true;
  clearTimeout(lookClassTimer);
  document.body.classList.remove('look-left', 'look-right', 'look-up');
  document.body.classList.add('gazing');
  clearTimeout(gazeEndTimer);
  gazeEndTimer = setTimeout(stopGaze, rand(GAZE_HOLD_MS[0], GAZE_HOLD_MS[1]));
  return true;
}

function stopGaze() {
  gazing = false;
  clearTimeout(gazeEndTimer);
  document.body.classList.remove('gazing');
  const st = document.body.style;
  st.setProperty('--gaze-x', '0px');
  st.setProperty('--gaze-y', '0px');
  st.setProperty('--gaze-r', '0deg');
}

function canGaze() {
  return canIdle() && !gazing && !document.body.classList.contains('listening') &&
    !document.body.classList.contains('very-sleepy');
}

function scheduleGaze() {
  clearTimeout(gazeTimer);
  gazeTimer = setTimeout(() => {
    if (canGaze()) startGaze();
    scheduleGaze();
  }, rand(GAZE_MS[0], GAZE_MS[1]));
}

/* --------------------- kendiliğinden kısa sohbet --------------------- */
function chatterLines() {
  return CHATTER[lang] || CHATTER.en || CHATTER.tr;
}

function greetLine() {
  return str('summonHello');
}

function cancelChatter() {
  clearTimeout(chatterHideTimer);
  chatterText = '';
}

function closeChatter() {
  clearTimeout(chatterHideTimer);
  if (!chatterText) return;
  const mine = chatterText;
  chatterText = '';
  if (state !== 'speech' || pending || replyEl.textContent !== mine) return;
  replyEl.textContent = '';
  setMood('');
  state = 'ball';
  layout();
}

function maybeChatter() {
  if (!canIdle() || state !== 'ball') return;
  if (document.body.classList.contains('listening')) return;
  if (document.body.classList.contains('sleepy') || document.body.classList.contains('very-sleepy')) return;
  const lines = chatterLines();
  if (!lines.length) return;
  chatterText = stripEmoji(lines[Math.floor(Math.random() * lines.length)]);
  showReply(chatterText);
  state = 'speech';
  layout();
  clearTimeout(chatterHideTimer);
  chatterHideTimer = setTimeout(closeChatter, CHATTER_HOLD_MS);
  resetSleep();
}

function scheduleChatter() {
  clearTimeout(chatterTimer);
  chatterTimer = setTimeout(() => { maybeChatter(); scheduleChatter(); }, rand(CHATTER_MS[0], CHATTER_MS[1]));
}

/* ------------------------------ olaylar ------------------------------ */
orb.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  wake();
  resetSleep();
  drag = { sx: e.screenX, sy: e.screenY, moved: false };
  try { orb.setPointerCapture(e.pointerId); } catch { /* yok */ }
  if (bridge && bridge.ballDragStart) bridge.ballDragStart();
});

orb.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = Math.round(e.screenX - drag.sx);
  const dy = Math.round(e.screenY - drag.sy);
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  if (drag.moved && bridge && bridge.ballDrag) bridge.ballDrag(dx, dy);
});

const endDrag = (e) => {
  if (!drag) return;
  const moved = drag.moved;
  drag = null;
  try { orb.releasePointerCapture(e.pointerId); } catch { /* yok */ }
  if (bridge && bridge.ballDragEnd) bridge.ballDragEnd();
  if (!moved && e.type === 'pointerup') {   // sürükleme değilse tıklama
    ripple();
    toggleBallPanels();
  }
};

orb.addEventListener('pointerup', endDrag);
orb.addEventListener('pointercancel', endDrag);

orb.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  wake();
  toggleBallPanels();
});

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  openMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (sleeping) { wake(); return; }
    if (state !== 'ball') { closePanels(); return; }
  }
  resetSleep();
}, true);

menuReturn.onclick = pressReturn;
$('orbClose').onclick = () => {
  clearTimeout(smileTimer);
  document.body.classList.remove('summoning', 'smiling');
  if (bridge && bridge.ballHide) bridge.ballHide();
};
if (orbMic) orbMic.onclick = (e) => {
  e.preventDefault();
  resetSleep();
  if (bridge && bridge.ballVoice) bridge.ballVoice();
};
if (askMic) askMic.onclick = (e) => {
  e.preventDefault();
  resetSleep();
  if (bridge && bridge.ballVoice) bridge.ballVoice();
};
/* Cevap balonu açıkken de mikrofonu kapatma yolu. */
if (orbListen) orbListen.onclick = (e) => {
  e.preventDefault();
  resetSleep();
  if (bridge && bridge.ballVoice) bridge.ballVoice();
};
$('askForm').addEventListener('submit', (e) => {
  e.preventDefault();
  ask(input.value);
});
input.addEventListener('input', resetSleep);
input.addEventListener('focus', resetSleep);

/* ------------------------- uygulamadan gelenler ------------------------- */
function init(payload) {
  const p = payload || {};
  active = true;
  lang = ['tr', 'en', 'de', 'ru', 'ja'].indexOf(p.lang) >= 0 ? p.lang : 'tr';
  applyColor(p.color || color, false);
  /* Asistan ayarları: uyku düzeni ve yüz. Alan yoksa eski davranış korunur. */
  const asst = p.assistant || {};
  sleepCfg = {
    on: asst.sleepOn !== false,
    every: clampNum(asst.sleepEvery, 1, 120, SLEEP_DEFAULT.every),
    len: clampNum(asst.sleepLen, 10, 600, SLEEP_DEFAULT.len)
  };
  applyFace(asst.face);
  applyAcc(asst.accessory || 'yok', false);
  document.body.dataset.lang = lang;
  input.placeholder = str('placeholder');
  $('askSend').setAttribute('aria-label', str('send'));
  menuReturnText.textContent = str('back');
  const accLabel = $('orbAccLabel');
  if (accLabel) accLabel.textContent = str('accLabel');
  if (orbMic) {
    orbMic.title = str('mic');
    orbMic.setAttribute('aria-label', str('mic'));
  }
  orb.title = str('titles');
  orb.setAttribute('aria-label', 'PRIME AI · ' + str('titles'));
  buildColors();
  buildAccs();
  clearLive();
  document.body.classList.add('happy');
  document.body.classList.remove('sleeping', 'lying', 'bedtime', 'yawning', 'waking',
    'sleepy', 'very-sleepy');
  sleeping = false;
  lying = false;
  $('orbZzz').innerHTML = '';
  state = 'ball';
  layout();
  resetSleep();
  scheduleBlinks();
  if (p.summon) summonSequence();
}

/* programatik erişim: testler ve CDP doğrulaması için */
window.PRIME_ORB = {
  state: () => state,
  color: () => color,
  colors: COLORS.map((c) => c.key),
  sleepCfg: () => ({ on: sleepCfg.on, every: sleepCfg.every, len: sleepCfg.len }),
  setSleep: (cfg) => {
    const c = cfg || {};
    sleepCfg = {
      on: c.on !== false,
      every: clampNum(c.every, 1, 120, SLEEP_DEFAULT.every),
      len: clampNum(c.len, 10, 600, SLEEP_DEFAULT.len)
    };
    if (active && !sleeping && !lying) scheduleSleepCycle();
  },
  setFace: applyFace,
  isSleeping: () => sleeping,
  isLying: () => lying,
  isHappy: () => document.body.classList.contains('happy'),
  isTired: () => document.body.classList.contains('sleepy') || document.body.classList.contains('very-sleepy'),
  isYawning: () => document.body.classList.contains('yawning'),
  isBedtime: () => document.body.classList.contains('bedtime'),
  isThinking: () => thinking,
  isTalking: () => document.body.classList.contains('talking'),
  isSpeaking: () => document.body.classList.contains('speaking'),
  setSpeaking,
  isListening: () => document.body.classList.contains('listening'),
  live: () => liveText,
  liveVisible: () => !!(liveEl && !liveEl.hidden),
  reply: () => replyEl.textContent,
  setColor: (key) => applyColor(key, true),
  acc: () => acc,
  accs: ACCS.map((a) => a.key),
  setAcc: (key) => applyAcc(key, true),
  /* Duygu: yanıt metninden çıkarılır; test için de erişilebilir. */
  mood: () => document.body.dataset.mood || '',
  moods: MOOD_KEYS.slice(),
  moodOf,
  moodSequence,
  moodSeen: () => moodSeen.slice(),
  resetMood: () => { clearTimeout(moodStepTimer); moodSeen = []; applyMood(''); },
  setMood,
  playMoodText: settleMood,
  brows: () => [...document.querySelectorAll('#orbBrows i')].length,
  /* Fare takibi ve kendiliğinden sohbet (test ve doğrulama için). */
  gazing: () => gazing,
  startGaze: () => startGaze(),
  stopGaze,
  gazeTo,
  chatterLines: () => chatterLines().slice(),
  greet: () => greetLine(),
  chatterText: () => chatterText,
  sayChatter: () => { maybeChatter(); return chatterText; },
  closeChatter,
  stripEmoji,
  raw: () => pendingRaw,
  open: openAsk,
  close: closePanels,
  openMenu,
  ask,
  look,
  wander,
  listen: setListening,
  dictate,
  commit: commitVoice,
  pressReturn,
  sleep,
  wake,
  shake,
  summon: summonSequence,
  isSummoning: () => document.body.classList.contains('summoning'),
  isSmiling: () => document.body.classList.contains('smiling'),
  hasClose: () => !!$('orbClose'),
  hideBall: () => $('orbClose').click(),
  sleepIn: (ms) => scheduleSleepCycle(Math.max(0, Number(ms) || 0)),
  dragBy: (dx, dy) => {
    if (bridge && bridge.ballDragStart) bridge.ballDragStart();
    if (bridge && bridge.ballDrag) bridge.ballDrag(dx, dy);
    if (bridge && bridge.ballDragEnd) bridge.ballDragEnd();
  }
};

if (bridge && bridge.onBallInit) bridge.onBallInit(init);
if (bridge && bridge.onBallStream) bridge.onBallStream(onDelta);
if (bridge && bridge.onBallFinish) bridge.onBallFinish((data) => {
  if (!data) return;
  finishAsk(data.id, data.error || '');
});
if (bridge && bridge.onBallReset) bridge.onBallReset(() => {
  active = false;
  ++bedToken;
  clearTimeout(sleepTimer);
  clearTimeout(sleepWakeTimer);
  clearTimeout(bedtimeTimer);
  clearTimeout(yawnTimer);
  clearTimeout(lieTimer);
  clearTimeout(greetTimer);
  clearTimeout(wakeAnimTimer);
  clearTimeout(exciteTimer);
  clearTimeout(lookTimer);
  clearTimeout(lookAgainTimer);
  clearTimeout(wanderTimer);
  clearTimeout(watchdog);
  clearTimeout(gazeTimer);
  clearTimeout(chatterTimer);
  stopGaze();
  cancelChatter();
  setSpeaking(false);
  stopTalking();
  stopShake();
  clearTimeout(smileTimer);
  clearTimeout(blinkTimer);
  clearTimeout(cheerTimer);
  document.body.classList.remove('summoning', 'smiling', 'cheering', 'blink-twice', 'wink');
  clearTimeout(resumeTimer);
  setListening(false);
  clearLive();
  setMood('');
  thinking = false;
  sleeping = false;
  lying = false;
  clearSleepiness();
  document.body.classList.remove('thinking', 'sleeping', 'lying', 'bedtime', 'yawning', 'waking',
    'sleepy', 'very-sleepy', 'excited', 'moving');
  $('orbZzz').innerHTML = '';
  state = 'ball';
  replyEl.textContent = '';
  pending = null;
  layout();
});
if (bridge && bridge.onBallShake) bridge.onBallShake((data) => {
  if (!active) return;
  shake(data && data.ms);
});
/* Fare konumu (topun merkezine göre): yüz yalnızca bakış sürerken döner. */
if (bridge && bridge.onBallCursor) bridge.onBallCursor((data) => {
  if (!active) return;
  gazeTo(data && data.dx, data && data.dy);
});
if (bridge && bridge.onBallListen) bridge.onBallListen((on) => {
  if (!active) return;
  /* Sesle yazma başladığında yazı görünsün diye kutu açılır. */
  if (on && (state === 'ball' || state === 'menu')) openAsk();
  setListening(on);
});
if (bridge && bridge.onBallPartial) bridge.onBallPartial((text) => {
  if (!active) return;
  showLive(text);
});
if (bridge && bridge.onBallCommit) bridge.onBallCommit(() => {
  if (!active) return;
  commitVoice();
});
/* Sesli okuma başladı/bitti: ağız hareketi buna bağlı. */
if (bridge && bridge.onBallSpeaking) bridge.onBallSpeaking(setSpeaking);
if (bridge && bridge.onBallDictate) bridge.onBallDictate((text) => {
  if (!active) return;
  dictate(text);
});
/* Topta sessizlik ya da "bitir/ilet" sonrası metin doğrudan soru olur;
   yanıt bittikten sonra dinleme alanı kendiliğinden geri gelir. */
if (bridge && bridge.onBallSay) bridge.onBallSay((text) => {
  if (!active) return;
  const listening = document.body.classList.contains('listening');
  ask(text, { voice: true });
  if (listening) setListening(true);
});

/* ilk durum: sadece top */  buildColors();
  buildAccs();
  document.body.classList.add('happy');
  layout();
  resetSleep();
  scheduleLook();
  scheduleWander();
  scheduleBlinks();
scheduleExcited();
  scheduleGaze();
  scheduleChatter();
