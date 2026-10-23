/* PRIME AI — Electron duman testi
   Görünmez bir pencerede uygulamayı açar, app:// şemasını ve localStorage'ı doğrular.
   Kullanım:  npx electron scripts/smoke.js                                     */
'use strict';

const { app, BrowserWindow, protocol, net, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const HOST = 'prime';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

function resolveTarget(requestUrl) {
  let rel;
  try { rel = decodeURIComponent(new URL(requestUrl).pathname || '/'); } catch { return null; }
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(ROOT, rel));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

/* Masaüstü topu: ayrı saydam pencereyi açar, gerçek köprü yollarını sınar.
   Yanıt akışı ana süreçten gelir; burada o akış taklit edilir. */
async function runBallTests() {
  const seen = { layout: [], color: [], acc: [], ask: [], wander: 0, dragStart: 0, drag: 0, dragEnd: 0, ret: 0, voice: 0, hide: 0 };
  ipcMain.handle('ball:ask', (_e, data) => {
    seen.ask.push({ id: String((data && data.id) || ''), text: String((data && data.text) || '') });
    return { ok: true };
  });
  ipcMain.on('ball:layout', (_e, state) => seen.layout.push(String(state)));
  ipcMain.on('ball:color', (_e, color) => seen.color.push(String(color)));
  ipcMain.on('ball:accessory', (_e, acc) => seen.acc.push(String(acc)));
  ipcMain.on('ball:wander', () => { seen.wander += 1; });
  ipcMain.on('ball:voice', () => { seen.voice += 1; });
  ipcMain.on('ball:drag-start', () => { seen.dragStart += 1; });
  ipcMain.on('ball:drag', () => { seen.drag += 1; });
  ipcMain.on('ball:drag-end', () => { seen.dragEnd += 1; });
  ipcMain.on('ball:return', () => { seen.ret += 1; });
  ipcMain.on('ball:hide', () => { seen.hide += 1; });
  ipcMain.on('ball:speak', () => { seen.speak = (seen.speak || 0) + 1; });
  /* Bilgisayar etkinliği: topun soruları gerçek uygulamadan söz etsin.
     Ana uygulama testi de bu kanalı kullanır; ikinci kayıt hata vermesin. */
  ipcMain.removeHandler('activity:get');
  ipcMain.handle('activity:get', () => ({
    enabled: true,
    at: Date.now(),
    idleMs: 1200,
    current: { app: 'chrome', label: 'Chrome', title: 'YouTube — Lo-fi study mix' },
    apps: [
      { app: 'chrome', label: 'Chrome', title: 'YouTube — Lo-fi study mix', seconds: 640, clicks: 14, keys: 87, last: Date.now() },
      { app: 'code', label: 'VS Code', title: 'app.js — primeAI', seconds: 320, clicks: 5, keys: 40, last: Date.now() - 60000 }
    ],
    recent: [
      { app: 'code', label: 'VS Code', title: 'app.js — primeAI', at: Date.now() - 60000 },
      { app: 'chrome', label: 'Chrome', title: 'YouTube — Lo-fi study mix', at: Date.now() }
    ],
    totalSeconds: 960
  }));

  const problems = [];
  const win = new BrowserWindow({
    show: false, width: 84, height: 84, frame: false, transparent: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      preload: path.join(ROOT, 'electron', 'preload.js')
    }
  });
  win.webContents.on('console-message', (...args) => {
    const first = args[0];
    if (first && typeof first === 'object' && 'message' in first) {
      if (first.level === 'error' || first.level === 'warning') problems.push('[top ' + first.level + '] ' + first.message);
    }
  });
  win.webContents.on('render-process-gone', (_e, d) => problems.push('top render-process-gone ' + JSON.stringify(d)));
  win.webContents.on('did-fail-load', (_e, code, desc) => problems.push('top did-fail-load ' + code + ' ' + desc));

  await win.loadURL('app://' + HOST + '/ball.html');
  /* Asistan ayarları da gelir: uyku 3 dakikada bir, uyku 30 sn, özel yüz. */
  win.webContents.send('ball:init', { color: 'mavi', lang: 'en',
    assistant: { sleepOn: true, sleepEvery: 3, sleepLen: 30, accessory: 'kovboy',
      face: { eyeSize: 1.3, eyeGap: 14, eyeR: 25, eyeColor: '#123456',
        mouthW: 20, mouthCurve: 11, mouthColor: '#654321', mouthRound: false } } });
  await new Promise((r) => setTimeout(r, 260));

  const first = await win.webContents.executeJavaScript(
    '(async () => {' +
    ' const o = window.PRIME_ORB;' +
    ' const stage = document.getElementById("stage");' +
    ' const out = {' +
    '   kanca: !!o, durum: o ? o.state() : "yok",' +
    '   renkler: document.querySelectorAll(".orb-swatch").length,' +
    '   accDugmeleri: document.querySelectorAll("#menu .orb-acc-btn").length,' +
    '   accAdlari: [...document.querySelectorAll("#menu .orb-acc-btn")].map((b) => b.title).join("|"),' +
    '   accBaslangic: document.body.dataset.acc,' +
    '   accKatmanBaslangic: getComputedStyle(document.querySelector(".orb-acc")).display,' +
    '   renkAdlari: [...document.querySelectorAll(".orb-swatch")].map((b) => b.title),' +
    '   ilkOlcu: [stage.offsetWidth, stage.offsetHeight],' +
    '   yaziGizli: document.getElementById("ask").hidden,' +
    '   balonGizli: document.getElementById("speech").hidden,' +
    '   uykuYok: !document.body.classList.contains("sleeping"),' +
    '   renk: o ? o.color() : "yok",' +
    '   yer: document.getElementById("askInput").placeholder,' +
    '   geri: document.getElementById("menuReturnText").textContent.trim(),' +
    '   micVar: !!document.getElementById("orbMic"),' +
    '   askMicVar: !!document.getElementById("askMic"),' +
    '   okumaDugmesi: !!document.getElementById("readAloudBtn") || !!document.getElementById("chatActions"),' +
    '   uykuCfg: o ? o.sleepCfg() : null,' +
    '   yuz: {' +
    '    gap: getComputedStyle(document.querySelector(".orb-face")).gap,' +
    '    gozGen: getComputedStyle(document.querySelector(".orb-face i")).width,' +
    '    gozC: getComputedStyle(document.querySelector(".orb-face i")).backgroundColor,' +
    '    agizGen: getComputedStyle(document.querySelector(".orb-mouth")).width,' +
    '    agizKav: getComputedStyle(document.querySelector(".orb-mouth")).borderBottomWidth,' +
    '    agizC: getComputedStyle(document.querySelector(".orb-mouth")).borderBottomColor,' +
    '    yuvarlak: document.body.classList.contains("round-mouth")' +
    '   }' +
    ' };' +
    ' if (!o) return out;' +
    ' o.look("left");' +
    ' out.baktiSol = document.body.classList.contains("look-left");' +
    ' o.look("right");' +
    ' out.baktiSag = document.body.classList.contains("look-right");' +
    ' o.look("up");' +
    ' out.baktiYukari = document.body.classList.contains("look-up");' +
    ' out.varsayilanMutlu = document.body.classList.contains("happy");' +
    ' out.agizKavisi = getComputedStyle(document.querySelector(".orb-mouth")).borderBottomWidth;' +
    ' out.govdeAnim = getComputedStyle(document.getElementById("orb")).animationName;' +
    ' o.open();' +
    ' await new Promise((r) => setTimeout(r, 90));' +
    ' out.acik = o.state();' +
    ' out.acikOlcu = [stage.offsetWidth, stage.offsetHeight];' +
    ' out.yaziGorunur = getComputedStyle(document.getElementById("ask")).display;' +
    ' out.menuGizli = getComputedStyle(document.getElementById("menu")).display;' +
    ' out.soruRenk = document.querySelectorAll("#ask .orb-swatch, #ask .orb-colors").length;' +
    ' o.setColor("kirmizi");' +
    ' await new Promise((r) => setTimeout(r, 40));' +
    ' out.renkSonra = o.color();' +
    ' out.renkAttr = document.body.dataset.color;' +
    ' out.renkBasili = (document.querySelector(".orb-swatch[data-color=\\"kirmizi\\"]") || { getAttribute: () => "" }).getAttribute("aria-pressed");' +
    ' out.renkDegrade = getComputedStyle(document.getElementById("orb")).backgroundImage;' +
    ' const input = document.getElementById("askInput");' +
    ' input.value = "Merhaba top";' +
    ' document.getElementById("askForm").requestSubmit();' +
    ' await new Promise((r) => setTimeout(r, 90));' +
    ' out.kutuKapandi = document.getElementById("ask").hidden;' +
    ' out.soruDurum = o.state();' +
    ' out.girisBos = input.value;' +
    ' out.gecmis = document.querySelectorAll("#speech .orb-msg, #speech .user, #speech .orb-log").length;' +
    ' out.dusunuyor = document.body.classList.contains("thinking");' +
    ' out.noktalar = document.querySelectorAll("#reply .dots").length;' +
    ' out.dusunmeHalkasi = getComputedStyle(document.querySelector("#orb .orb-ring")).opacity;' +
    ' return out;' +
    ' })()'
  );

  const ask = seen.ask[0];
  if (ask) {
    win.webContents.send('ball:delta', { id: ask.id, delta: 'Merhaba' });
    win.webContents.send('ball:delta', { id: ask.id, delta: ', dünya' });
    win.webContents.send('ball:delta', { id: ask.id, delta: ' · Harika! 😄' });
    win.webContents.send('ball:done', { id: ask.id, error: '' });
  }
  await new Promise((r) => setTimeout(r, 150));
  /* Erişim komutu geldiğinde ana süreç bu olayı yollar: top titremeli. */
  win.webContents.send('ball:shake', { ms: 900 });
  await new Promise((r) => setTimeout(r, 120));

  const second = await win.webContents.executeJavaScript(
    '(async () => {' +
    ' const o = window.PRIME_ORB;' +
    ' const out = {};' +
    ' const stage = document.getElementById("stage");' +
    ' out.titriyor = document.body.classList.contains("launching");' +
    ' out.titremeAnim = getComputedStyle(document.querySelector("#orb")).animationName;' +
    ' out.yanit = document.getElementById("reply").textContent;' +
    ' out.emojiYok = out.yanit.indexOf("😄") === -1;' +
    ' out.emojiMood = o.moodOf("😢");' +
    ' out.strip = o.stripEmoji("Harika 😄 bir gün 🎉 bugün");' +
    ' out.noktalarSonra = document.querySelectorAll("#reply .dots").length;' +
    ' out.dusunmeBitti = !document.body.classList.contains("thinking");' +
    ' out.akanMood = o.mood();' +
    ' out.kasSayisi = document.querySelectorAll("#orbBrows i").length;' +
    ' out.moodler = {' +
    '   uzgun: o.moodOf("Maalesef olmadı, çok üzüldüm."),' +
    '   neseli: o.moodOf("Harika! Çok sevindim."),' +
    '   kizgin: o.moodOf("Buna gerçekten sinirlendim, kabul edilemez."),' +
    '   saskin: o.moodOf("Vay canına, inanılmaz!"),' +
    '   bos: o.moodOf("Yarın hava güzel olacak."),' +
    '   karisik: o.moodOf("Maalesef olmadı ama harika bir haberim var."),' +
    '   ters: o.moodOf("Harika bir haberim var ama maalesef olmadı.")' +
    ' };' +
    ' out.konusuyor = document.body.classList.contains("talking");' +
    ' out.agizAnim = getComputedStyle(document.querySelector(".orb-mouth")).animationName;' +
    ' out.balonGorunur = getComputedStyle(document.getElementById("speech")).display;' +
    ' out.balonOlcu = [stage.offsetWidth, stage.offsetHeight];' +
    ' await new Promise((r) => setTimeout(r, 520));' +
    ' out.konusmaBitti = !document.body.classList.contains("talking");' +
    ' const browEl = document.querySelector("#orbBrows i");' +
    ' const mouthEl = document.querySelector(".orb-mouth");' +
    ' /* Gizli pencerede CSS geçişleri ilerlemez: ölçüm için geçişi kapat. */' +
    ' const browTr = browEl.style.transition, mouthTr = mouthEl.style.transition;' +
    ' browEl.style.transition = "none"; mouthEl.style.transition = "none";' +
    ' o.setMood("uzgun");' +
    ' out.moodUzgun = { key: o.mood(), bas: getComputedStyle(browEl).transform,' +
    '   agiz: getComputedStyle(mouthEl).borderTopWidth,' +
    '   agizAlt: getComputedStyle(mouthEl).borderBottomWidth,' +
    '   goz: getComputedStyle(document.querySelector(".orb-face i")).height };' +
    ' o.setMood("neseli");' +
    ' out.moodNeseli = { key: o.mood(), bas: getComputedStyle(browEl).transform,' +
    '   agiz: getComputedStyle(mouthEl).borderBottomWidth };' +
    ' browEl.style.transition = browTr; mouthEl.style.transition = mouthTr;' +
    ' out.basGecis = getComputedStyle(browEl).transitionDuration;' +
    ' /* Konuşurken de ağız duyguya uyar: şaşkın “o”, kızgın düz, üzgün aşağı. */' +
    ' browEl.style.transition = "none"; mouthEl.style.transition = "none";' +
    ' document.body.classList.add("talking");' +
    ' out.agizKonus = {}; out.kasKonus = {};' +
    ' for (const k of ["saskin", "kizgin", "uzgun"]) {' +
    '   o.setMood(k);' +
    '   const cs = getComputedStyle(mouthEl);' +
    '   out.agizKonus[k] = { yuk: parseFloat(cs.borderTopWidth) || 0,' +
    '     alt: parseFloat(cs.borderBottomWidth) || 0, yuvarlak: cs.borderTopLeftRadius,' +
    '     h: parseFloat(cs.height) || 0 };' +
    '   out.kasKonus[k] = getComputedStyle(browEl).transform;' +
    ' }' +
    ' document.body.classList.remove("talking");' +
    ' browEl.style.transition = browTr; mouthEl.style.transition = mouthTr;' +
    ' o.setMood("");' +
    ' /* Sesli okuma: metin akmasa da ağız oynar, bitince durur. */' +
    ' o.setSpeaking(true);' +
    ' out.konusuyorSinif = document.body.classList.contains("speaking");' +
    ' out.agizSesAnim = getComputedStyle(mouthEl).animationName;' +
    ' o.setSpeaking(false);' +
    ' out.konusuyorBitti = document.body.classList.contains("speaking");' +
    ' /* Aksesuar yüze takılı: yüz nereye dönerse aksesuar da aynı yöne gider,' +
    '    duruş da o yöne yatar. Geçişler kapatılıp anlık değer okunur. */' +
    ' const accEl = document.querySelector(".orb-acc");' +
    ' const yuzEl = document.querySelector(".orb-features");' +
    ' document.body.classList.remove("look-left", "look-right", "look-up");' +
    ' const topEl = document.getElementById("orb");' +
    ' const eskiAccTr = accEl.style.transition, eskiOrbTr = topEl.style.transition;' +
    ' const eskiYuzTr = yuzEl.style.transition;' +
    ' accEl.style.transition = "none"; topEl.style.transition = "none"; yuzEl.style.transition = "none";' +
    ' document.body.classList.add("look-left");' +
    ' out.accLook = getComputedStyle(accEl).transform;' +
    ' out.yuzLook = getComputedStyle(yuzEl).transform;' +
    ' out.durusRotate = getComputedStyle(topEl).rotate;' +
    ' out.durusTranslate = getComputedStyle(topEl).translate;' +
    ' document.body.classList.remove("look-left");' +
    ' out.accLookSon = getComputedStyle(accEl).transform;' +
    ' out.durusSon = getComputedStyle(topEl).rotate;' +
    ' o.startGaze();' +
    ' o.gazeTo(220, 0);' +
    ' out.accGaze = getComputedStyle(accEl).transform;' +
    ' out.durusGaze = getComputedStyle(topEl).rotate;' +
    ' o.stopGaze();' +
    ' accEl.style.transition = eskiAccTr; topEl.style.transition = eskiOrbTr; yuzEl.style.transition = eskiYuzTr;' +
    ' /* Fare takibi: yüz ara sıra fareye döner, sonra öne bakar. */' +
    ' o.close();' +
    ' out.gazeOnce = o.gazing();' +
    ' out.gazeBasladi = o.startGaze();' +
    ' o.gazeTo(200, 0);' +
    ' out.gazeX = document.body.style.getPropertyValue("--gaze-x");' +
    ' out.gazeR = document.body.style.getPropertyValue("--gaze-r");' +
    ' o.gazeTo(0, -200);' +
    ' out.gazeY = document.body.style.getPropertyValue("--gaze-y");' +
    ' out.gazeSinif = document.body.classList.contains("gazing");' +
    ' o.stopGaze();' +
    ' out.gazeBitti = o.gazing();' +
    ' out.gazeSinifSon = document.body.classList.contains("gazing");' +
    ' /* Kendiliğinden sohbet: uygulamanın adı geçer. Gizli pencere “hidden”' +
    '    olduğu için yalnızca ölçüm sırasında görünür sayılır. */' +
    ' Object.defineProperty(document, "hidden", { configurable: true, get: () => false });' +
    ' const satirlar = o.chatterLines();' +
    ' out.sohbetSatir = satirlar.length;' +
    ' out.sohbetUygulama = satirlar.filter((s) => /Chrome|YouTube/.test(s)).length;' +
    ' out.sohbetPrime = satirlar.filter((s) => /PRIME AI/.test(s)).length;' +
    ' out.sohbetSayac = satirlar.filter((s) => /[0-9]+ (tıklama|tuş)|keystroke|clicks?/i.test(s)).length;' +
    ' out.sohbetTakil = satirlar.some((s) => /ne işler peşindesin|what are you scheming/i.test(s));' +
    ' out.etkinlik = o.activity();' +
    ' const soh = o.sayChatter();' +
    ' out.sohbetMetni = soh;' +
    ' out.sohbetDurum = o.state();' +
    ' out.sohbetGorunur = document.getElementById("reply").textContent === soh;' +
    ' o.closeChatter();' +
    ' out.sohbetKapandi = o.state();' +
    ' delete document.hidden;' +
    ' /* Aynı metinde iki duygu: önce üzülür, sonra yavaşça sevinçe geçer. */' +
    ' o.setMood("");' +
    ' o.resetMood();' +
    ' out.moodSira = o.moodSequence("Maalesef olmadı ama harika bir haberim var.");' +
    ' o.playMoodText("Maalesef olmadı ama harika bir haberim var.");' +
    ' out.moodIlk = o.mood();' +
    ' await new Promise((r) => setTimeout(r, 2600));' +
    ' out.moodSon = o.mood();' +
    ' out.moodGorulen = o.moodSeen();' +
    ' o.resetMood();' +
    ' o.openMenu();' +
    ' await new Promise((r) => setTimeout(r, 90));' +
    ' out.menuDurum = o.state();' +
    ' out.menuGorunur = !document.getElementById("menu").hidden;' +
    ' out.menuDon = document.getElementById("menuReturnText").textContent.trim();' +
    ' out.menuRenkler = document.querySelectorAll("#menu .orb-swatch").length;' +
    ' out.menuOlcu = [stage.offsetWidth, stage.offsetHeight];' +
    ' out.menuAccs = document.querySelectorAll("#menu .orb-acc-btn").length;' +
    ' out.menuIlkAcc = document.body.dataset.acc;' +
    ' const crown = [...document.querySelectorAll("#menu .orb-acc-btn")].find((b) => b.dataset.acc === "tac");' +
    ' crown.click();' +
    ' await new Promise((r) => setTimeout(r, 60));' +
    ' out.accSonra = document.body.dataset.acc;' +
    ' out.accKatman = getComputedStyle(document.querySelector(".orb-acc")).display;' +
    ' out.accBasili = crown.getAttribute("aria-pressed");' +
    ' out.accDigerBasili = [...document.querySelectorAll("#menu .orb-acc-btn")]' +
    '   .filter((b) => b.dataset.acc !== "tac" && b.getAttribute("aria-pressed") === "true").length;' +
    ' out.menuTasma = document.getElementById("menu").scrollHeight > document.getElementById("menu").clientHeight + 1;' +
    ' /* Her aksesuarın çizimi (::before/::after) gerçekten boyanıyor mu? */' +
    ' out.accCizim = {};' +
    ' for (const key of ["gozluk", "kovboy", "sapka", "maske", "tac", "agiz"]) {' +
    '   document.body.dataset.acc = key;' +
    '   const layer = document.querySelector(".orb-acc");' +
    '   const bf = getComputedStyle(layer, "::before");' +
    '   const af = getComputedStyle(layer, "::after");' +
    '   const kat = layer.getBoundingClientRect();' +
    '   out.accCizim[key] = {' +
    '     once: [parseFloat(bf.width) || 0, parseFloat(bf.height) || 0],' +
    '     sonra: [parseFloat(af.width) || 0, parseFloat(af.height) || 0],' +
    '     onceUst: parseFloat(bf.top), sonraUst: parseFloat(af.top),' +
    '     kenar: bf.borderTopColor,' +
    '     katman: [Math.round(kat.width), Math.round(kat.height)],' +
    '     gorunum: bf.display' +
    '   };' +
    ' }' +
    ' /* Aksesuarın ek parçaları (gözlük köprüsü/sapları, şapka bandı…). */' +
    ' out.accParca = {};' +
    ' for (const key of ["gozluk", "kovboy", "sapka", "maske", "tac", "agiz"]) {' +
    '   document.body.dataset.acc = key;' +
    '   const layer = document.querySelector(".orb-acc");' +
    '   out.accParca[key] = [...layer.children]' +
    '     .filter((i) => getComputedStyle(i).display !== "none")' +
    '     .map((i) => [i.className, Math.round(parseFloat(getComputedStyle(i).width) || 0)]);' +
    ' }' +
    ' document.body.dataset.acc = "tac";' +
    ' const ret = document.getElementById("menuReturn");' +
    ' ret.click();' +
    ' await new Promise((r) => setTimeout(r, 60));' +
    ' out.donIlk = document.getElementById("menuReturnText").textContent.trim();' +
    ' out.donArmed = ret.classList.contains("armed");' +
    ' ret.click();' +
    ' await new Promise((r) => setTimeout(r, 80));' +
    ' o.dragBy(40, -24);' +
    ' await new Promise((r) => setTimeout(r, 120));' +
    ' o.close();' +
    ' o.wander(60, -40);' +
    ' await new Promise((r) => setTimeout(r, 90));' +
    ' const orbEl = document.getElementById("orb");' +
    ' const pe = (type) => new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, screenX: 600, screenY: 400 });' +
    ' orbEl.dispatchEvent(pe("pointerdown"));' +
    ' orbEl.dispatchEvent(pe("pointerup"));' +
    ' await new Promise((r) => setTimeout(r, 70));' +
    ' out.tikDurum = o.state();' +
    ' out.tikMenu = getComputedStyle(document.getElementById("menu")).display;' +
    ' out.tikYazi = getComputedStyle(document.getElementById("ask")).display;' +
    ' out.tikRenk = document.querySelectorAll("#ask .orb-swatch").length;' +
    ' o.close();' +
    ' o.close();' +
    ' o.sleepIn(80);' +
    ' await new Promise((r) => setTimeout(r, 180));' +
    ' out.bedtime = document.body.classList.contains("bedtime");' +
    ' out.yorgun = document.body.classList.contains("sleepy") || document.body.classList.contains("very-sleepy");' +
    ' out.veda = window.PRIME_ORB.reply();' +
    ' out.govdeUykuAnim = getComputedStyle(document.getElementById("orb")).animationName;' +
    ' await new Promise((r) => setTimeout(r, 2900));' +
    ' out.esyandi = document.body.classList.contains("yawning");' +
    ' out.esnemeYazi = window.PRIME_ORB.reply();' +
    ' out.esnemeAgiz = getComputedStyle(document.querySelector(".orb-mouth")).animationName;' +
    ' await new Promise((r) => setTimeout(r, 1800));' +
    ' out.yatti = document.body.classList.contains("lying");' +
    ' const bedEl = document.querySelector(".orb-bed");' +
    ' bedEl.style.transition = "none"; void bedEl.offsetWidth;' +
    ' out.yatak = parseFloat(getComputedStyle(bedEl).opacity) || 0;' +
    ' out.yatmaAnim = getComputedStyle(document.getElementById("orb")).animationName;' +
    ' await new Promise((r) => setTimeout(r, 1200));' +
    ' out.uyudu = document.body.classList.contains("sleeping");' +
    ' out.zMetni = [...document.querySelectorAll("#orbZzz .z")].map((z) => z.textContent).join("");' +
    ' const z = document.querySelector("#orbZzz .z");' +
    ' out.zAnim = z ? getComputedStyle(z).animationName : "";' +
    ' out.zBoyut = z ? getComputedStyle(z).fontSize : "";' +
    ' out.uykuOlcu = [stage.offsetWidth, stage.offsetHeight];' +
    ' out.uykuAnim = getComputedStyle(document.getElementById("orb")).animationName;' +
    ' const sheetEl = document.querySelector(".orb-sheet");' +
    ' sheetEl.style.transition = "none"; void sheetEl.offsetWidth;' +
    ' out.yorgan = parseFloat(getComputedStyle(sheetEl).opacity) || 0;' +
    ' o.wake();' +
    ' await new Promise((r) => setTimeout(r, 90));' +
    ' out.uyandi = !document.body.classList.contains("sleeping");' +
    ' out.uyanmaVar = document.body.classList.contains("waking");' +
    ' out.uyanmaAnim = getComputedStyle(document.getElementById("orb")).animationName;' +
    ' out.zTemiz = document.querySelectorAll("#orbZzz .z").length;' +
    ' await new Promise((r) => setTimeout(r, 1600));' +
    ' out.uyanmaBitti = !document.body.classList.contains("waking");' +
    ' out.uyanmaSonra = document.body.classList.contains("happy");' +
    ' out.yatakSon = parseFloat(getComputedStyle(document.querySelector(".orb-bed")).opacity) || 0;' +
    ' out.panellerKapali = [getComputedStyle(document.getElementById("ask")).display,' +
    '   getComputedStyle(document.getElementById("speech")).display,' +
    '   getComputedStyle(document.getElementById("menu")).display];' +
    ' out.micVar = !!document.getElementById("orbMic");' +
    ' o.open();' +
    ' await new Promise((r) => setTimeout(r, 40));' +
    ' out.yeniden = o.state();' +
    ' out.titremeBitti = !document.body.classList.contains("launching");' +
    ' return out;' +
    ' })()'
  );

  /* Dinleme göstergesi ve uygulamadan gelen ses metni */
  /* Topun mikrofon düğmesi gerçekten kayıt açma isteği gönderiyor mu? */
  await win.webContents.executeJavaScript('document.getElementById("orbMic").click()');
  await win.webContents.executeJavaScript('document.getElementById("askMic").click()');
  await new Promise((r) => setTimeout(r, 120));
  if ((seen.voice || 0) < 2) problems.push('topun mikrofon düğmeleri kayıt başlatmıyor: ' + seen.voice);

  win.webContents.send('ball:listen', true);
  await new Promise((r) => setTimeout(r, 140));
  const third = await win.webContents.executeJavaScript(
    '(() => { const out = {}; const ring = document.querySelector(".orb-ring");' +
    ' out.dinliyor = document.body.classList.contains("listening");' +
    ' out.halka = getComputedStyle(ring).opacity;' +
    ' out.micVar = !!document.getElementById("orbMic");' +
    ' out.askMicVar = !!document.getElementById("askMic");' +
    ' out.durdurma = getComputedStyle(document.getElementById("orbListen")).display;' +
    ' return out; })()'
  );
  /* Canlı ara metin: mikrofon kapanmadan kutuya yazılmalı, soru oluşturmamalı. */
  win.webContents.send('ball:partial', 'Canlı yazı');
  await new Promise((r) => setTimeout(r, 140));
  const thirdLive = await win.webContents.executeJavaScript(
    '(() => ({ yazi: document.getElementById("askInput").value, canli: window.PRIME_ORB.live(),' +
    ' durum: window.PRIME_ORB.state(), dinliyor: window.PRIME_ORB.isListening(),' +
    ' sorular: document.querySelectorAll("#speech .user").length }))()'
  );
  /* Gönderim komutu: yazı alanı kapanır, dinleme göstergesi geri gelir. */
  win.webContents.send('ball:commit');
  await new Promise((r) => setTimeout(r, 140));
  const thirdCommit = await win.webContents.executeJavaScript(
    '(() => ({ durum: window.PRIME_ORB.state(), yazi: document.getElementById("askInput").value,' +
    ' canli: window.PRIME_ORB.live(), dinliyor: window.PRIME_ORB.isListening(),' +
    ' yaziGizli: document.getElementById("ask").hidden,' +
    ' durdurma: getComputedStyle(document.getElementById("orbListen")).display }))()'
  );
  win.webContents.send('ball:listen', false);
  win.webContents.send('ball:dictate', 'Sesle gelen metin');
  await new Promise((r) => setTimeout(r, 180));
  const fourth = await win.webContents.executeJavaScript(
    '(() => ({ durum: window.PRIME_ORB.state(), yazi: document.getElementById("askInput").value,' +
    ' odak: document.activeElement === document.getElementById("askInput"),' +
    ' durdurma: getComputedStyle(document.getElementById("orbListen")).display,' +
    ' dinliyor: document.body.classList.contains("listening") }))()'
  );

  /* Sessizlik sonrası gönderilen metin doğrudan soru olmalı (yazma kutusuna değil). */
  win.webContents.send('ball:say', 'Sessizlikten gelen soru');
  await new Promise((r) => setTimeout(r, 180));
  const fifth = await win.webContents.executeJavaScript(
    '(() => ({ durum: window.PRIME_ORB.state(), dusunuyor: document.body.classList.contains("thinking"),' +
    ' noktalar: document.querySelectorAll("#reply .dots").length, yazi: document.getElementById("askInput").value,' +
    ' soruGorunur: !document.getElementById("speech").hidden }))()'
  );
  const autoAsk = seen.ask[seen.ask.length - 1] || {};

  /* Cevap balonu açıkken gelen ara metin balonun üstünde görünmeli. */
  win.webContents.send('ball:listen', true);
  win.webContents.send('ball:partial', 'Devam eden cümle');
  await new Promise((r) => setTimeout(r, 160));
  const sixth = await win.webContents.executeJavaScript(
    '(() => ({ durum: window.PRIME_ORB.state(), canli: window.PRIME_ORB.live(),' +
    ' gorunur: window.PRIME_ORB.liveVisible(), yazi: document.getElementById("live").textContent,' +
    ' yanit: document.getElementById("reply").textContent }))()'
  );
  win.webContents.send('ball:say', 'Canlı metinden sonra');
  await new Promise((r) => setTimeout(r, 160));
  const seventh = await win.webContents.executeJavaScript(
    '(() => ({ durum: window.PRIME_ORB.state(), canli: window.PRIME_ORB.live(),' +
    ' gorunur: window.PRIME_ORB.liveVisible(), yazi: document.getElementById("live").textContent }))()'
  );

  /* Sesli sorunun yanıtı bitince cevap kapanmalı, boş dinleme alanı geri gelmeli. */
  const lastAsk = seen.ask[seen.ask.length - 1] || {};
  win.webContents.send('ball:done', { id: lastAsk.id || '', error: '' });
  await new Promise((r) => setTimeout(r, 4500));
  const resume = await win.webContents.executeJavaScript(
    '(() => ({ durum: window.PRIME_ORB.state(), yazi: document.getElementById("askInput").value,' +
    ' canli: window.PRIME_ORB.live(), dinliyor: window.PRIME_ORB.isListening(),' +
    ' yaziGorunur: !document.getElementById("ask").hidden,' +
    ' yanitGizli: document.getElementById("speech").hidden }))()'
  );

  /* Asistan çağrısı: yandan büyüme animasyonu, gülümseme, karşılama ve kapat. */
  win.webContents.send('ball:init', { color: 'mavi', lang: 'tr', summon: true });
  await new Promise((r) => setTimeout(r, 220));
  const summonStart = await win.webContents.executeJavaScript(
    '(() => ({ anim: window.PRIME_ORB.isSummoning(), close: window.PRIME_ORB.hasClose(),' +
    ' kapatma: (document.getElementById("orbClose") || {}).title || "" }))()'
  );
  await new Promise((r) => setTimeout(r, 1000));
  const summonEnd = await win.webContents.executeJavaScript(
    '(() => ({ guluyor: window.PRIME_ORB.isSmiling(), durum: window.PRIME_ORB.state(),' +
    ' yazi: window.PRIME_ORB.reply(), anim: window.PRIME_ORB.isSummoning() }))()'
  );
  win.webContents.executeJavaScript('window.PRIME_ORB.hideBall()');
  await new Promise((r) => setTimeout(r, 200));
  const closeSent = seen.hide;

  /* Asistan ayarları: uyku kapatılınca top hiç uyumaz, yüz değişince çizim değişir. */
  win.webContents.send('ball:init', { color: 'gri', lang: 'tr',
    assistant: { sleepOn: false, sleepEvery: 9, sleepLen: 45,
      face: { eyeSize: 1, eyeGap: 12, eyeR: 20, eyeColor: 'rgba(18,20,24,0.82)',
        mouthW: 15, mouthCurve: 8, mouthColor: 'rgba(18,20,24,0.8)', mouthRound: true } } });
  await new Promise((r) => setTimeout(r, 240));
  const sleepOff = await win.webContents.executeJavaScript(
    '(async () => {' +
    ' const o = window.PRIME_ORB;' +
    ' const out = { cfg: o.sleepCfg() };' +
    ' o.sleepIn(120);' +
    ' await new Promise((r) => setTimeout(r, 430));' +
    ' out.uyumadi = !document.body.classList.contains("bedtime") && !o.isSleeping() && !o.isLying();' +
    ' out.yuz = {' +
    '  gap: getComputedStyle(document.querySelector(".orb-face")).gap,' +
    '  kavis: getComputedStyle(document.querySelector(".orb-mouth")).borderBottomWidth,' +
    '  yuvarlak: document.body.classList.contains("round-mouth") };' +
    ' /* göz biçimi geçiş (transition) sırasında okunursa ara değer çıkar: önce geçişi durdur */' +
    ' document.querySelector(".orb-face i").style.transition = "none";' +
    ' document.body.classList.remove("happy");' +
    ' void document.querySelector(".orb-face i").offsetWidth;' +
    ' out.yuz.gozR = getComputedStyle(document.querySelector(".orb-face i")).borderRadius;' +
    ' document.body.classList.add("happy");' +
    ' o.setSleep({ on: true, every: 2, len: 15 });' +
    ' out.yenidenCfg = o.sleepCfg();' +
    ' return out;' +
    ' })()'
  );

  win.destroy();
  return { first: first || {}, second: second || {}, third: third || {}, thirdLive: thirdLive || {},
    thirdCommit: thirdCommit || {}, fourth: fourth || {}, fifth: fifth || {}, sixth: sixth || {},
    seventh: seventh || {}, resume: resume || {},
    summonStart: summonStart || {}, summonEnd: summonEnd || {}, closeSent: closeSent,
    sleepOff: sleepOff || {},
    autoAsk: autoAsk, seen: seen, problems: problems };
}

app.whenReady().then(async () => {
  /* Erişim köprüsü: gerçek dosya seçici yerine sahte yanıtlar; top yanıtları da
     burada toplanır. */
  const accessSeen = { pick: [], open: [], close: [], url: [], run: [], ret: 0 };
  const voiceSeen = { voice: 0 };
  const ttsSeen = { texts: [], stopped: 0 };
  let activityOn = true;
  const fakeActivity = () => ({
    enabled: activityOn, at: Date.now(), idleMs: 900,
    current: { app: 'chrome', label: 'Chrome', title: 'YouTube — Lo-fi study mix' },
    apps: [
      { app: 'chrome', label: 'Chrome', title: 'YouTube — Lo-fi study mix', seconds: 900, clicks: 21, keys: 130, last: Date.now() },
      { app: 'code', label: 'VS Code', title: 'app.js — primeAI', seconds: 300, clicks: 4, keys: 55, last: Date.now() - 90000 }
    ],
    recent: [{ app: 'code', label: 'VS Code', title: 'app.js — primeAI', at: Date.now() - 90000 }],
    totalSeconds: 1200
  });
  ipcMain.handle('activity:get', () => fakeActivity());
  ipcMain.on('activity:set', (_e, on) => { activityOn = !!on; });
  ipcMain.handle('tts:say', (_e, data) => {
    ttsSeen.texts.push(String((data && data.text) || ''));
    return { ok: true, voice: 'Microsoft Tolga', ms: 40 };
  });
  ipcMain.handle('tts:stop', () => { ttsSeen.stopped += 1; return { ok: true }; });
  const ballOut = [];
  ipcMain.on('ball:voice', () => { voiceSeen.voice += 1; });
  ipcMain.on('ball:listen', () => {});
  ipcMain.on('ball:dictate', () => {});
  ipcMain.handle('shortcut:pick', (_e, kind) => {
    accessSeen.pick.push(String(kind));
    return { ok: true, path: 'C:/Test/Chrome.exe', kind: kind === 'folder' ? 'folder' : 'app', name: 'Chrome' };
  });
  ipcMain.handle('shortcut:open', (_e, data) => {
    accessSeen.open.push(String((data && data.path) || ''));
    return { ok: true };
  });
  ipcMain.handle('shortcut:close', (_e, data) => {
    accessSeen.close.push(String((data && data.path) || ''));
    return { ok: true, closed: 1 };
  });
  ipcMain.handle('screen:capture', () => ({ ok: true, name: 'Ekran', dataUrl: 'data:image/png;base64,AAAA' }));
  ipcMain.handle('app:quit', () => ({ ok: true }));
  ipcMain.handle('app:open-url', (_e, data) => { accessSeen.url.push(String((data && data.url) || '')); return { ok: true }; });
  ipcMain.handle('app:run-command', (_e, data) => { accessSeen.run.push(String((data && data.command) || '')); return { ok: true, stdout: 'hi' }; });
  ipcMain.on('ball:return', () => { accessSeen.ret += 1; });
  ipcMain.on('ball:chunk', (_e, data) => ballOut.push({ id: String((data && data.id) || ''), delta: String((data && data.delta) || '') }));
  ipcMain.on('ball:finish', (_e, data) => ballOut.push({ id: String((data && data.id) || ''), done: true, error: String((data && data.error) || '') }));

  protocol.handle('app', async (request) => {
    const file = resolveTarget(request.url);
    if (!file) return new Response('Forbidden', { status: 403 });
    try { return await net.fetch(pathToFileURL(file).toString()); }
    catch { return new Response('Not found', { status: 404 }); }
  });

  const win = new BrowserWindow({
    show: false, width: 1280, height: 860,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      preload: path.join(__dirname, '..', 'electron', 'preload.js')
    }
  });

  const problems = [];
  /* API kaldırma tuşu testi silme akışını bilerek çalıştırır; uygulamanın bunu
     uyarı olarak loglaması normaldir. Yalnızca o kayıt hoş görülür. */
  let beklenenSilmeUyarisi = false;
  let beklenenSesYedegi = false;
  win.webContents.on('console-message', (...args) => {
    const first = args[0];
    if (first && typeof first === 'object' && 'message' in first) {
      if (beklenenSilmeUyarisi && /API silindi/.test(String(first.message))) return;
      /* Yedek model testi bilerek 400 yanıtı üretir: bu uyarı beklenir. */
      if (beklenenSesYedegi && /kullanılamadı, sıradaki ses modeli/.test(String(first.message))) return;
      /* ElevenLabs yedek testi bilerek 400 yanıtı üretir: bu uyarı beklenir. */
      if (beklenenSesYedegi && /ElevenLabs seslendirme başarısız/.test(String(first.message))) return;
      if (first.level === 'error' || first.level === 'warning') problems.push('[' + first.level + '] ' + first.message);
    } else if (args[1] >= 2) {
      problems.push('[log] ' + args[2]);
    }
  });
  win.webContents.on('render-process-gone', (_e, d) => problems.push('render-process-gone ' + JSON.stringify(d)));
  win.webContents.on('did-fail-load', (_e, code, desc) => problems.push('did-fail-load ' + code + ' ' + desc));

  try {
    await win.loadURL('app://' + HOST + '/index.html');
    // Denetlenecek kimlikler (kaçış karakteri gerektirmemesi için burada tutulur)
    const UI_IDS = ['lightbox', 'lbStage', 'lbImg', 'lbPrev', 'lbNext', 'lbZoom', 'googleKey', 'googleCx',
      'googleTag', 'apiGrid', 'apiUseBtn', 'optVideo', 'optImages', 'keyDetect',
      'sendBtn', 'input', 'settingsModal', 'consoleBtn', 'consoleBadge', 'consoleCount', 'consoleDrawer',
      'consoleBody', 'consoleHide', 'consoleClear', 'consoleErrOnly', 'introScreen', 'introLogo',
      'attachBtn', 'imagePicker', 'attachStrip', 'attachList', 'attachHint', 'langSeg', 'welcomeLogoSlot',
      'orbBtn', 'accessList', 'accessAddApp', 'accessAddFolder', 'accessHint',
      'micTile', 'micSelect', 'micRefresh', 'micStatus', 'micBtn', 'voiceSupport',
      'camShutdown', 'camShutdownHint',
      'asstAccs', 'asstVoiceOn', 'asstGeminiRow', 'asstVoiceGemini', 'asstGeminiStatus',
      'asstVoiceTest',
      'globalModelSelect', 'fetchAllModelsBtn', 'globalModelStatus'];
    /* Kodlama modu kaldırıldı: bu kimlikler artık bulunmamalı. */
    const GONE_IDS = ['codeBtn', 'projectBar', 'projectModal', 'projectList', 'projectFoot', 'filesModal',
      'fileTree', 'fileViewCode', 'optCoding', 'projectPickNew', 'settingsProjectPick', 'settingsProjectName',
      'suggestions',    // konu kutucukları kaldırıldı: konu yazılan metinden anlaşılır
      'newApiBtn',      // API bölümündeki "Anahtar ekle" düğmesi kaldırıldı: ekleme Yeni API kartından
      'videoOpenSeg',   // "Video nerede açılsın?" ayarı kaldırıldı: video hep uygulamada oynar
      'pttBtn',         // Bas-konuş kaldırıldı: mikrofon yalnızca mikrofon simgesiyle açılır
      'pttClear',
      'optEmoji',     // emoji ayarı kaldırıldı: asistan metni artık emoji kullanmaz
      /* Yazma kutusunun üstündeki eylem çubuğu ve ses seçici kaldırıldı;
         eylemler artık her yanıtın altında. */
      'chatActions', 'voicePop', 'readAloudBtn', 'readAloudLabel', 'voicePickBtn',
      'voicePickLabel', 'copyLastBtn', 'regenBtn', 'likeBtn', 'dislikeBtn'];
    /* Dosya sistemi köprüsü de kaldırıldı: bu işlevler açılmamalı. */
    const GONE_BRIDGE_FNS = ['selectFolder', 'setFolder', 'list', 'read', 'write', 'exists', 'openFolder',
      'openPath', 'makeLauncher'];
    /* Kaldırılan kodlama işlevleri global kapsamda kalmamalı. */
    const GONE_FNS = ['resolveCoding', 'detectCodingIntent', 'extractFileBlocks', 'safeRelPath', 'fmtSize',
      'makeCodeLive', 'finishCoding', 'refreshFiles', 'syncCodingUI', 'openProjectModal', 'setProject',
      'choiceNode'];    // seçim düğmeleri kaldırıldı: yapay zekâ soruyu YAZARAK sorar

    beklenenSilmeUyarisi = true;
    const result = await win.webContents.executeJavaScript(
      '(async () => {' +
      ' const uiIds = ' + JSON.stringify(UI_IDS) + ';' +
      ' const brFns = ' + JSON.stringify(GONE_BRIDGE_FNS) + ';' +
      ' const goneIds = ' + JSON.stringify(GONE_IDS) + ';' +
      ' const goneFns = ' + JSON.stringify(GONE_FNS) + ';' +
      ' let ls = "ok";' +
      ' try { localStorage.setItem("__smoke", "1"); localStorage.removeItem("__smoke"); }' +
      ' catch (e) { ls = "HATA: " + e.message; }' +
      ' const bridge = window.PRIME_DESKTOP || null;' +
      ' const bridgeKeys = bridge ? Object.keys(bridge).sort() : [];' +
      ' const brGone = bridge ? brFns.filter((k) => typeof bridge[k] === "function") : [];' +
      ' const t = document.getElementById("introScreen");' +
      ' const intro = {' +
      '   logoFilled: !!document.querySelector("#introLogo svg"),' +
      '   letters: document.querySelectorAll(".intro-word span").length,' +
      '   logoAnim: getComputedStyle(document.querySelector(".intro-logo")).animationName,' +
      '   wordAnim: getComputedStyle(document.querySelector(".intro-word span")).animationName,' +
      '   barAnim: getComputedStyle(document.querySelector(".intro-bar i")).animationName,' +
      '   haloAnim: getComputedStyle(document.querySelector(".intro-halo")).animationName,' +
      '   beforeDone: t.classList.contains("done")' +
      ' };' +
      ' finishIntro();' +
      ' intro.afterDone = t.classList.contains("done");' +
      ' intro.reenterBlocked = (finishIntro(), t.classList.contains("done"));' +
      ' const drawer0 = document.getElementById("consoleDrawer");' +
      ' const drawerBefore = drawer0.hidden;' +
      ' const ce = console.error; console.error = function () {};' +
      ' logError("duman testi hatası", new Error("sahte"));' +
      ' console.error = ce;' +
      ' const autoOpened = !drawer0.hidden;' +
      ' const rows = document.querySelectorAll("#consoleBody .log-row").length;' +
      ' const errRows = document.querySelectorAll("#consoleBody .log-row.err").length;' +
      ' const errText = (document.querySelector("#consoleBody .log-row.err .log-lvl") || {}).textContent;' +
      ' const badge = document.getElementById("consoleBadge");' +
      ' const badgeText = badge.hidden ? "" : badge.textContent;' +
      ' const countText = document.getElementById("consoleCount").textContent;' +
      ' document.getElementById("consoleErrOnly").click();' +
      ' const filtered = document.querySelectorAll("#consoleBody .log-row").length;' +
      ' const errPressed = document.getElementById("consoleErrOnly").getAttribute("aria-pressed");' +
      ' document.getElementById("consoleErrOnly").click();' +
      ' const allBack = document.querySelectorAll("#consoleBody .log-row").length;' +
      ' document.getElementById("consoleHide").click();' +
      ' const hiddenAfterClose = drawer0.hidden;' +
      ' document.getElementById("consoleBtn").click();' +
      ' const reopened = !drawer0.hidden;' +
      ' document.getElementById("consoleClear").click();' +
      ' const cleared = document.querySelectorAll("#consoleBody .log-row").length;' +
      ' const badgeCleared = badge.hidden;' +
      ' document.getElementById("consoleHide").click();' +
      ' const consoleTest = { drawerBefore, autoOpened, rows, errRows, errText, badgeText, countText,' +
      '   filtered, errPressed, allBack, hiddenAfterClose, reopened, cleared, badgeCleared };' +
      ' const uiGone = goneIds.filter((id) => document.getElementById(id));' +
      ' const fnGone = goneFns.filter((n) => typeof window[n] !== "undefined");' +
      ' const video = await (async () => {' +
      '   const h = detectHelpIntent("Python ile dosya okumayı nasıl yaparım? adım adım anlat");' +
      '   const p = detectProblemIntent("uygulamam açılmıyor, hata veriyor");' +
      '   const ornek = { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Sıfırdan Python - Dosya Okuma",' +
      '     channel: "Rehber Yazılım", thumb: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",' +
      '     duration: "15:51", views: "1.257 görüntüleme" };' +
      '   const card = videoCardHtml({ state: "ready", query: "python", video: ornek });' +
      '   const evil = videoCardHtml({ state: "ready", query: "x", video: {' +
      '     url: "https://x/" + String.fromCharCode(34) + "><img src=x>", title: "<b>kötü</b>",' +
      '     channel: "c", thumb: "https://i.ytimg.com/vi/abc/mqdefault.jpg" } });' +
      '   const yukleniyor = videoCardHtml({ query: "python", state: "loading" });' +
      '   const bos = videoCardHtml({ query: "python", state: "none" });' +
      '   const eskiDesktop = desktop;' +
      '   desktop = () => ({ videoPlayerUrl: async (id) => ({ url: "http://127.0.0.1:5000/player.html?v=" + id }) });' +
      '   const videoTestKutusu = document.createElement("div"); videoTestKutusu.className = "video-wrap";' +
      '   videoTestKutusu.innerHTML = "<div class=\\"video-body\\">" + card + "</div>";' +
      '   document.body.appendChild(videoTestKutusu);' +
      '   await openVideoPlayer(videoTestKutusu.querySelector(".video-card"), "dQw4w9WgXcQ");' +
      '   const oynatici = (videoTestKutusu.querySelector(".video-player iframe") || {}).src || "";' +
      '   videoTestKutusu.remove(); desktop = eskiDesktop;' +
      '   const probe = document.createElement("div"); probe.className = "video-card";' +
      '   document.body.appendChild(probe); const radius = getComputedStyle(probe).borderRadius; probe.remove();' +
      '   const g = genNode(); document.body.appendChild(g);' +
      '   const noktalar = [...g.querySelectorAll(".gen-dots i")];' +
      '   const genDotAdlari = noktalar.map((d) => getComputedStyle(d).animationName);' +
      '   const genDotGecikme = noktalar.map((d) => getComputedStyle(d).animationDelay);' +
      '   const genDotDegrade = noktalar.map((d) => getComputedStyle(d).backgroundImage);' +
      '   const genDotOlcu = noktalar.map((d) => getComputedStyle(d).width);' +
      '   const genPill = getComputedStyle(g).borderRadius;' +
      '   const genText = g.querySelector(".gen-text").textContent.trim();' +
      '   const eskiParcalar = g.querySelectorAll(".gen-core, .gen-orbit, .gen-heart, .gen-bar, .gen-shine").length;' +
      '   g.remove();' +
      '   const secimler = ["video at", "video ile anlat", "video atsana", "bana video at", "anlat", "sen anlat",' +
      '     "yazıyla anlat", "sadece anlat", "merhaba nasılsın", "video nasıl indirilir", "bugün hava nasıl",' +
      '     "bu cümle çok uzun olduğu için seçim sayılmamalı, çünkü seçimler kısa mesajlardır ve uzunları aranmaz"]' +
      '     .map((s) => resolveVideoChoice(s));' +
      '   const kalanDugme = document.querySelectorAll("[data-video-choice], .choice-row, .choice-btn, .choice-ico, .api-new").length;' +
      '   const soruIstemi = problemSystemPrompt("uygulamam açılmıyor hata veriyor");' +
      '   const dugmeKaldi = typeof choiceNode;' +
      '   openSettings();' +
      '   await new Promise((r) => setTimeout(r, 900));   /* açılma animasyonu bitsin (gizli pencerede gecikir) */' +
      '   const modal = document.getElementById("settingsModal");' +
      '   const kart = modal.querySelector(".modal-card").getBoundingClientRect();' +
      '   const just = getComputedStyle(modal).justifyContent;' +
      '   const orta = Math.round((window.innerWidth - kart.width) / 2);' +
      '   const tabLabels = [...document.querySelectorAll(".settings-tab")].map((t) => t.textContent.trim());' +
      '   const solTaraf = Math.round(kart.left);' +
      '   const genislik = Math.round(kart.width);' +
      '   /* API kartındaki kaldırma tuşu: tek dokunuşta kaydı siler, formu açmaz.\n' +
      '      Uygulama açılınca bağlanan (bindApp) gerçek tıklama yolu sınanır. */' +
      '   startApp();' +
      '   /* Yeni sohbet logosu: tıklayınca titrer, kızarır, arkasından duman çıkar.\n' +
      '      bindApp ile bağlanan gerçek tıklama yolu sınanır. */' +
      '   const logoSlot = document.getElementById("welcomeLogoSlot");' +
      '   const logoDurum = { bagli: typeof logoSlot.onclick === "function", logoVar: !!logoSlot.querySelector("svg") };' +
      '   logoSlot.click();' +
      '   await new Promise((r) => setTimeout(r, 420));' +
      '   const dumanTaneleri = logoSlot.querySelectorAll(".puff");' +
      '   const logoCizim = logoSlot.querySelector("svg");' +
      '   logoDurum.duman = dumanTaneleri.length;' +
      '   logoDurum.sinif = logoSlot.className;' +
      '   logoDurum.anim = logoCizim ? getComputedStyle(logoCizim).animationName : "svg yok";' +
      '   logoDurum.renk = logoCizim ? getComputedStyle(logoCizim).color : "svg yok";' +
      '   logoDurum.katman = dumanTaneleri.length ? getComputedStyle(dumanTaneleri[0]).zIndex : "";' +
      '   logoDurum.logoKatman = logoCizim ? getComputedStyle(logoCizim).zIndex : "svg yok";' +
      '   await new Promise((r) => setTimeout(r, 3600));   /* gizli pencerede zamanlayıcılar gecikir */' +
      '   logoDurum.sinifSonra = logoSlot.className;' +
      '   logoDurum.temiz = logoSlot.querySelectorAll(".puff").length;' +
      '   /* Yazı kutusunun solundaki gri top: tıklayınca uygulama küçülür, top penceresi istenir. */' +
      '   const orbBtn = document.getElementById("orbBtn");' +
      '   const orbDot = orbBtn ? orbBtn.querySelector(".orb-dot") : null;' +
      '   const orbTest = {' +
      '     dugme: !!orbBtn, noktaVar: !!orbDot,' +
      '     solda: !!(orbBtn && (orbBtn.compareDocumentPosition(document.getElementById("input")) &' +
      '       Node.DOCUMENT_POSITION_FOLLOWING)),' +
      '     bagli: !!(orbBtn && typeof orbBtn.onclick === "function"),' +
      '     yuvarlak: orbDot ? getComputedStyle(orbDot).borderRadius : "yok",' +
      '     degrade: orbDot ? getComputedStyle(orbDot).backgroundImage : "yok"' +
      '   };' +
      '   const eskiTopDesktop = desktop;' +
      '   let orbIstek = null;' +
      '   desktop = () => ({ openBall: (p) => { orbIstek = p; return Promise.resolve({ ok: true }); } });' +
      '   orbBtn.click();' +
      '   await new Promise((r) => setTimeout(r, 620));' +
      '   orbTest.anim = getComputedStyle(document.getElementById("app")).animationName;' +
      '   orbTest.orbing = document.body.classList.contains("orbing");' +
      '   orbTest.istek = orbIstek;' +
      '   desktop = eskiTopDesktop;' +
      '   document.body.classList.remove("orbing");' +
      '   document.getElementById("app").style.animation = "none";' +
      '   openSettings();' +
      '   const gridBagli = typeof document.getElementById("apiGrid").onclick === "function";' +
      '   switchPanel("api");' +
      '   const yedekApis = JSON.stringify(settings.apis || []);' +
      '   const yedekModels = JSON.stringify(settings.models || {});' +
      '   const yedekAktif = settings.activeApiId;' +
      '   settings.apis = [{ sid: "smoke-sil", provider: "groq", key: "gsk_test", model: "llama-3.3-70b" }];' +
      '   settings.activeApiId = "smoke-sil";' +
      '   renderApiGrid();' +
      '   const kartKutusu = document.querySelector(".api-slot");' +
      '   const silTuple = document.querySelector("[data-del=\\"smoke-sil\\"]");' +
      '   const silOlcu = silTuple ? silTuple.getBoundingClientRect() : { width: 0, height: 0 };' +
      '   const silEtiket = silTuple ? (silTuple.getAttribute("aria-label") || "") : "";' +
      '   const silIkon = silTuple ? silTuple.querySelectorAll("svg").length : 0;' +
      '   const silKardes = silTuple ? silTuple.parentElement === kartKutusu : false;' +
      '   const kartAdetOnce = document.querySelectorAll(".api-tile[data-sid]").length;' +
      '   const eskiOnay = window.confirm; window.confirm = () => true;' +
      '   if (silTuple) silTuple.click();' +
      '   const kartAdetSonra = document.querySelectorAll(".api-tile[data-sid]").length;' +
      '   const silindi = !document.querySelector("[data-sid=\\"smoke-sil\\"]");' +
      '   const formKapali = document.getElementById("apiForm").hidden;' +
      '   const yeniKartiVar = !!document.querySelector(".api-tile.add");' +
      '   window.confirm = eskiOnay;' +
      '   settings.apis = JSON.parse(yedekApis); settings.models = JSON.parse(yedekModels);' +
      '   settings.activeApiId = yedekAktif; persist(); renderApiGrid();' +
      '   closeSettings();' +
      '   /* --- dil değiştirme: varsayılan Türkçe, İngilizceye geçiş ve geri dönüş --- */' +
      '   const dil = { baslangic: settings.lang, videoAc: settings.videoOpen,' +
      '     dugmeVar: !!document.getElementById("langSeg") };' +
      '   settings.lang = "en"; applyLang();' +
      '   dil.en = {' +
      '     yeni: document.querySelector(".new-chat span").textContent.trim(),' +
      '     yer: document.getElementById("input").placeholder,' +
      '     ayar: document.getElementById("settingsBtn").textContent.trim(),' +
      '     sistem: effectiveSystemPrompt(),' +
      '     tAyarlar: window.t("Ayarlar"),' +
      '     dilBasligi: [...document.querySelectorAll("#panelApp .tile-title")].some((x) => x.textContent.trim() === "Language")' +
      '   };' +
      '   settings.lang = "tr"; applyLang();' +
      '   dil.tr = { yeni: document.querySelector(".new-chat span").textContent.trim(),' +
      '     yer: document.getElementById("input").placeholder, sistem: effectiveSystemPrompt() };' +
      '   /* --- görsel ekleme: hazırlık, önizleme, vücutlar, mesaj çizimi --- */' +
      '   const tuval = document.createElement("canvas");' +
      '   tuval.width = 2400; tuval.height = 1600;' +
      '   const c2 = tuval.getContext("2d"); c2.fillStyle = "#2a6df4"; c2.fillRect(0, 0, 2400, 1600);' +
      '   c2.fillStyle = "#ffffff"; c2.fillRect(900, 600, 600, 400);' +
      '   const blob = await new Promise((r) => tuval.toBlob(r, "image/jpeg", 0.9));' +
      '   const dosya = new File([blob], "deneme-fotograf.jpg", { type: "image/jpeg" });' +
      '   const hazir = await prepareImage(dosya);' +
      '   const resim = { dataUrl: hazir.dataUrl, mime: hazir.mime, name: hazir.name, w: hazir.w, h: hazir.h };' +
      '   /* 1) dosya seçici + düğme bağlı mı, önizleme şeridi doluyor mu? */' +
      '   const ekleBagli = typeof document.getElementById("attachBtn").onclick === "function";' +
      '   const seciciKabul = document.getElementById("imagePicker").getAttribute("accept") || "";' +
      '   await addImageFiles([dosya]);' +
      '   const seritGorunur = !document.getElementById("attachStrip").hidden;' +
      '   const kucukResim = document.querySelectorAll("#attachList .attach-thumb img").length;' +
      '   const kucukKaynak = ((document.querySelector("#attachList .attach-thumb img") || {}).src) || "";' +
      '   const kaldirTusu = document.querySelector("#attachList .attach-x");' +
      '   const ipucu = document.getElementById("attachHint").textContent;' +
      '   if (kaldirTusu) kaldirTusu.click();' +
      '   const seritBos = document.getElementById("attachStrip").hidden;' +
      '   const bekleyenBos = pendingImages.length;' +
      '   /* 2) mesaj balonunda küçük görsel + büyütme yolu */' +
      '   const balon = messageNode({ role: "user", content: "bu ne?", images: [resim] });' +
      '   const balonResim = balon.querySelectorAll(".bubble-imgs .bubble-img img").length;' +
      '   const balonKaynak = ((balon.querySelector(".bubble-img img") || {}).src) || "";' +
      '   const buyutme = typeof (balon.querySelector(".bubble-img") || {}).onclick === "function";' +
      '   /* görselsiz kullanıcı mesajı eskisi gibi yalnızca yazı balonu */' +
      '   const duzBalon = messageNode({ role: "user", content: "selam" }).querySelectorAll(".bubble-imgs").length;' +
      '   /* 3) üç sağlayıcının istek gövdesi */' +
      '   const gecmis = [{ role: "user", content: "bu ne?", images: [resim] },' +
      '     { role: "assistant", content: "Bir saat." }];' +
      '   const gGovde = buildGeminiBody(gecmis);' +
      '   const oGovde = buildOpenAIBody("gpt-4o-mini", gecmis);' +
      '   const aGovde = buildAnthropicBody("claude-3-5-sonnet", gecmis);' +
      '   const sadeGovde = buildOpenAIBody("x", [{ role: "user", content: "selam" }]);' +
      '   const yalnizGorsel = buildOpenAIBody("x", [{ role: "user", content: "", images: [resim] }]);' +
      '   const gParcalar = gGovde.contents[0].parts;' +
      '   const oKullanici = oGovde.messages.find((m) => m.role === "user");' +
      '   const oParcalar = oKullanici.content;' +
      '   const sadeKullanici = sadeGovde.messages.find((m) => m.role === "user");' +
      '   const yalnizKullanici = yalnizGorsel.messages.find((m) => m.role === "user");' +
      '   const aParcalar = aGovde.messages[0].content;' +
      '   const gorselTest = {' +
      '     ekleBagli, seciciKabul, seritGorunur, kucukResim, kucukKaynak, ipucu, seritBos, bekleyenBos,' +
      '     olcu: { w: hazir.w, h: hazir.h, uzunluk: hazir.dataUrl.length, tur: hazir.mime },' +
      '     balonResim, balonKaynak, buyutme, duzBalon,' +
      '     gemini: { tur: gParcalar[0].inline_data && gParcalar[0].inline_data.mime_type,' +
      '       veri: gParcalar[0].inline_data && gParcalar[0].inline_data.data,' +
      '       metin: (gParcalar[1] || {}).text },' +
      '     openai: { tur: (oParcalar[1] || {}).type, url: ((oParcalar[1] || {}).image_url || {}).url,' +
      '       metin: (oParcalar[0] || {}).text, sade: sadeKullanici.content,' +
      '       yalnizAdet: Array.isArray(yalnizKullanici.content) ? yalnizKullanici.content.length : -1 },' +
      '     anthropic: { tur: (aParcalar[0] || {}).type, medya: ((aParcalar[0] || {}).source || {}).media_type,' +
      '       veri: ((aParcalar[0] || {}).source || {}).data, metin: (aParcalar[1] || {}).text },' +
      '     istem: imageSystemPrompt(1),' +
      '     vizyon: [looksVisionModel("gemini-2.0-flash"), looksVisionModel("llama-3.3-70b-versatile"),' +
      '       looksVisionModel("gpt-4o-mini")]' +
      '   };' +
      '   return {' +
      '     query: h ? h.query : null,' +
      '     problem: p ? p.query : null,' +
      '     problemYok: detectProblemIntent("bugün hava çok güzel"),' +
      '     secimVideo: resolveVideoChoice("Video ile anlat"),' +
      '     secimAnlat: resolveVideoChoice("sen anlat"),' +
      '     secimYok: resolveVideoChoice("merhaba nasılsın"),' +
      '     short: detectHelpIntent("merhaba"),' +
      '     photoOnly: detectHelpIntent("bana kırmızı pandanın fotoğrafını göster"),' +
      '     card: card, evil: evil, yukleniyor: yukleniyor, bos: bos, radius: radius, oynatici: oynatici,' +
      '     genDotAdlari: genDotAdlari, genDotGecikme: genDotGecikme, genDotDegrade: genDotDegrade,' +
      '     genDotOlcu: genDotOlcu, genPill: genPill, genText: genText, eskiParcalar: eskiParcalar,' +
      '     apiSil: { bagli: gridBagli, varMi: !!silTuple, etiket: silEtiket, ikon: silIkon, kardes: silKardes,' +
      '       genislik: Math.round(silOlcu.width), yukseklik: Math.round(silOlcu.height),' +
      '       once: kartAdetOnce, sonra: kartAdetSonra, silindi: silindi, formKapali: formKapali,' +
      '       yeniKarti: yeniKartiVar },' +
      '     gorselTest: gorselTest, dil: dil,' +
      '     secimler: secimler, kalanDugme: kalanDugme, soruIstemi: soruIstemi, dugmeKaldi: dugmeKaldi,' +
      '     drawer: { just: just, solTaraf: solTaraf, genislik: genislik, orta: orta, tabLabels: tabLabels },' +
      '     logoDuman: logoDurum,' +
      '     top: orbTest,' +
      '     setting: !!(settings && settings.videoHelp)' +
      '   };' +
      ' })();' +
      ' return {' +
      '   origin: location.origin,' +
      '   title: document.title,' +
      '   emoji: stripEmoji("Merhaba 😄🎉 dünya!"),' +
      '   localStorage: ls,' +
      '   desktopFlag: !!(bridge && bridge.isDesktop),' +
      '   bridgeKeys, brGone, uiGone, fnGone, video,' +
      '   version: bridge ? bridge.version : null,' +
      '   intro,' +
      '   consoleTest,' +
      '   authVisible: !document.getElementById("authScreen").hidden,' +
      '   appHidden: document.getElementById("app").hidden,' +
      '   logoRendered: !!document.querySelector("#authLogoSlot svg"),' +
      '   settingsTabs: document.querySelectorAll(".settings-tab").length,' +
      '   authTabs: document.querySelectorAll(".auth-tab").length,' +
      '   missingUi: uiIds.filter((id) => !document.getElementById(id)),' +
      '   util: {' +
      '     keyDetect: [detectProviderFromKey("AIzaSyABCDEF1234567890"), detectProviderFromKey("gsk_abcdef1234567890"),' +
      '       detectProviderFromKey("sk-ant-abcdef1234567890"), detectProviderFromKey("sk-or-v1-abcdef1234567890"),' +
      '       detectProviderFromKey("csk-abcdef1234567890"), detectProviderFromKey("rastgele"), detectProviderFromKey("kisa")],' +
      '     slotReady: [slotReady({ provider: "groq", key: "x", model: "m" }), slotReady({ provider: "groq", key: "", model: "m" }),' +
      '       slotReady({ provider: "ollama", key: "", model: "m" }), slotReady({ provider: "groq", key: "x", model: "" })],' +
      '     google: googleCfg(),' +
      '     /* Kota bitince sıradaki anahtara geçiş: saf seçim + işaretleme. */' +
      '     apiFail: (() => {' +
      '       const eskiApis = slots().slice(), eskiAktif = settings.activeApiId, eskiProvider = settings.provider;' +
      '       const a = { sid: "a", provider: "gemini", key: "k1", model: "m1" };' +
      '       const b = { sid: "b", provider: "groq", key: "k2", model: "m2" };' +
      '       const c = { sid: "c", provider: "openai", key: "", model: "m3" };' +
      '       let out;' +
      '       try {' +
      '         settings.apis = [a, b, c]; settings.activeApiId = "a"; settings.provider = "gemini";' +
      '         const next = nextApiSlot([a]);' +
      '         markSlotUsedUp(a);' +
      '         out = {' +
      '           next: next && next.sid,' +
      '           bosAtlanir: nextApiSlot([a, b]) === null,' +
      '           kullanildi: slotUsedUp(slotById("a")),' +
      '           kota: [isQuotaError(new Error("HTTP 429 Çok fazla istek")),' +
      '             isQuotaError(new Error("insufficient_quota: billing hard limit")),' +
      '             isQuotaError(new Error("RESOURCE_EXHAUSTED")),' +
      '             isQuotaError(new Error("ağ hatası"))],' +
      '           etiket: slotLabel(b)' +
      '         };' +
      '       } finally {' +
      '         settings.apis = eskiApis; settings.activeApiId = eskiAktif; settings.provider = eskiProvider;' +
      '       }' +
      '       return out;' +
      '     })()' +
      '   },' +
      '   cssLoaded: getComputedStyle(document.body).backgroundColor,' +
      '   csp: !!document.querySelector("meta[http-equiv=Content-Security-Policy]"),' +
      '   cspText: (document.querySelector("meta[http-equiv=Content-Security-Policy]") || {}).content || "",' +
      '   svgIconCount: document.querySelectorAll("svg").length' +
      ' };' +
      '})()');

    /* --- erişim: uygulama/klasör ekleme ve top komutları --- */
    const acc = await win.webContents.executeJavaScript(`(async () => {
      try {
      const out = { };
      settings.access = [
        { id: 'a1', name: 'Chrome', path: 'C:/Test/Chrome.exe', kind: 'app' },
        { id: 'a2', name: 'Belgeler', path: 'C:/Test/Belgeler', kind: 'folder' }
      ];
      /* Görsel olmayan model: ekrana bakma (750ms + görüntu) devreye girmesin. */
      settings.apis = [{ sid: 'acc-test', provider: 'groq', key: 'test-key', model: 'llama-3.3-70b-versatile' }];
      settings.activeApiId = 'acc-test';
      settings.provider = 'groq';
      persist();
      openSettings('app');
      renderAccessList();
      await new Promise((r) => setTimeout(r, 60));
      out.panel = !document.getElementById('panelApp').hidden;
      out.satir = document.querySelectorAll('#accessList .access-row').length;
      out.adlar = [...document.querySelectorAll('#accessList .access-name')].map((i) => i.value);
      out.rozet = document.querySelectorAll('#accessList .access-icon').length;
      out.ekleAktif = !document.getElementById('accessAddApp').disabled;
      await answerBall({ id: 'e1', text: 'aç chrome' });
      await answerBall({ id: 'e2', text: "kapat Chrome'u" });
      await answerBall({ id: 'e3', text: 'aç belgeler' });
      await answerBall({ id: 'e4', text: 'kapat belgeler' });
      await answerBall({ id: 'e5', text: 'aç bilinmeyen' });
      out.tekBasina = accessIntent('kapat');
      addAccess('C:/Test/Yeni.exe', 'app');
      out.eklendi = settings.access.map((x) => x.name);
      renameAccess(settings.access[0].id, 'Tarayıcı');
      out.yenidenAd = settings.access[0].name;
      out.yol = settings.access[0].path;
      removeAccess(settings.access[0].id);
      out.silindi = settings.access.map((x) => x.name);
      document.getElementById('accessAddApp').click();
      await new Promise((r) => setTimeout(r, 140));
      out.secimSonrasi = settings.access.map((x) => x.name);
      out.kayit = JSON.parse(localStorage.getItem(ukey('settings'))).access.map((x) => x.name);
      closeSettings();
      return out;
      } catch (e) { return { hata: String((e && e.stack) || e) }; }
    })()`);
    if (!acc.panel) problems.push('erişim bölümü Uygulama Ayarları panelinde değil');
    if (acc.satir !== 2) problems.push('erişim satırları çizilmiyor: ' + acc.satir);
    if ((acc.adlar || []).join(',') !== 'Chrome,Belgeler') problems.push('erişim adları yanlış: ' + (acc.adlar || []).join(','));
    if (acc.rozet !== 2) problems.push('erişim simgeleri yok: ' + acc.rozet);
    if (!acc.ekleAktif) problems.push('erişim ekle düğmesi masaüstünde pasif');
    if (acc.tekBasina !== null) problems.push('tek başına “kapat” komut sayılıyor');
    if ((acc.eklendi || []).join(',') !== 'Chrome,Belgeler,Yeni') problems.push('erişim eklenmiyor: ' + (acc.eklendi || []).join(','));
    if (acc.yenidenAd !== 'Tarayıcı') problems.push('erişim adı değişmiyor: ' + acc.yenidenAd);
    if (acc.yol !== 'C:/Test/Chrome.exe') problems.push('erişim yolu bozuldu: ' + acc.yol);
    if ((acc.silindi || []).join(',') !== 'Belgeler,Yeni') problems.push('erişim silinmiyor: ' + (acc.silindi || []).join(','));
    if ((acc.secimSonrasi || []).join(',') !== 'Belgeler,Yeni,Chrome') problems.push('seçiciyle erişim eklenmiyor: ' + (acc.secimSonrasi || []).join(','));
    if ((acc.kayit || []).join(',') !== (acc.secimSonrasi || []).join(',')) problems.push('erişim ayarlara yazılmıyor: ' + (acc.kayit || []).join(','));
    if ((accessSeen.pick || []).join(',') !== 'app') problems.push('uygulama seçici açılmıyor: ' + (accessSeen.pick || []).join(','));
    if (JSON.stringify(accessSeen.open) !== JSON.stringify(['C:/Test/Chrome.exe', 'C:/Test/Belgeler'])) {
      problems.push('top açma komutu yanlış yolu açıyor: ' + JSON.stringify(accessSeen.open));
    }
    if (JSON.stringify(accessSeen.close) !== JSON.stringify(['C:/Test/Chrome.exe'])) {
      problems.push('top kapatma komutu yanlış: ' + JSON.stringify(accessSeen.close));
    }
    const ballSay = (id) => (ballOut.find((x) => x.id === id && x.delta) || {}).delta || '';
    if (ballSay('e1') !== 'Chrome açıldı.') problems.push('aç yanıtı: ' + ballSay('e1'));
    if (ballSay('e2') !== 'Chrome kapatıldı.') problems.push('kapat yanıtı: ' + ballSay('e2'));
    if (ballSay('e3') !== 'Belgeler açıldı.') problems.push('klasör aç yanıtı: ' + ballSay('e3'));
    if (!/klasör/.test(ballSay('e4'))) problems.push('klasör kapatma uyarısı yok: ' + ballSay('e4'));
    if (!/bilinmeyen/.test(ballSay('e5')) || !/Chrome/.test(ballSay('e5'))) problems.push('bilinmeyen erişim yanıtı: ' + ballSay('e5'));
    if (ballOut.filter((x) => x.done).length < 5) problems.push('erişim komutları topa tamamlanmış yanıt göndermiyor');

    /* --- asistan eylemleri: kendini kapat, onaylı çalıştır, URL --- */
    const asist = await win.webContents.executeJavaScript(`(async () => {
      try {
      const out = {};
      out.sc1 = selfCloseIntent('kendini kapat');
      out.sc2 = selfCloseIntent('seni kapatabilir misin');
      out.sc3 = selfCloseIntent('merhaba nasılsın');
      out.lc1 = looksLikeCommand('aç chrome');
      out.lc2 = looksLikeCommand('saat kaçtır');
      const aj = parseActionJson('İşte cevap: {"action":"open","target":"Chrome","needsConfirm":false,"say":"açıyorum"} umarım');
      out.aj = aj ? aj.action + ':' + aj.target + ':' + aj.needsConfirm : null;
      const ar = parseActionJson('{"action":"run","command":"echo hi","needsConfirm":false,"say":"x"}');
      out.ar = ar ? ar.needsConfirm : null;
      const lj = parseLookJson('{"description":"Tarayıcı açık","nextAction":{"action":"open","target":"https://ornek.com","needsConfirm":true,"say":"şunu da açayım"}}');
      out.lj = lj ? lj.description + '|' + (lj.nextAction && lj.nextAction.target) : null;

      settings.access = [{ id: 'a1', name: 'Chrome', path: 'C:/Test/Chrome.exe', kind: 'app' }];
      settings.apis = [{ sid: 'as-test', provider: 'groq', key: 'k', model: 'llama-3.3-70b-versatile' }];
      settings.activeApiId = 'as-test'; settings.provider = 'groq';
      persist();

      /* 1) kayıtlı open, onaysız → doğrudan açılır */
      pendingAction = null;
      await performAction('as1', { action: 'open', target: 'chrome', needsConfirm: false, say: '' });

      /* 2) run → onay beklemede; “evet” deyince çalışır */
      pendingAction = null;
      await performAction('as2', { action: 'run', command: 'echo hi', needsConfirm: true, say: '' });
      out.onayBekliyor = !!pendingAction && pendingAction.action === 'run';
      await resolvePendingAction('as2', 'evet');

      /* 3) URL açma → onay beklemede; “hayır” deyince vazgeçilir */
      pendingAction = null;
      await performAction('as3', { action: 'open', target: 'https://ornek.com', needsConfirm: true, say: '' });
      out.urlOnay = !!pendingAction;
      await resolvePendingAction('as3', 'hayir');
      out.vazgecti = pendingAction === null;

      /* 4) kendini kapat → top uygulamaya döner */
      pendingAction = null;
      await answerBall({ id: 'as4', text: 'kendini kapat' });
      await new Promise((r) => setTimeout(r, 900));
      return out;
      } catch (e) { return { hata: String((e && e.stack) || e) }; }
    })()`);
    if (asist.hata) problems.push('asistan testi hatası: ' + asist.hata);
    if (asist.sc1 !== true) problems.push('“kendini kapat” algılanmıyor');
    if (asist.sc2 !== true) problems.push('“seni kapatabilir misin” algılanmıyor');
    if (asist.sc3 !== false) problems.push('normal cümle komut sanılıyor: ' + asist.sc3);
    if (asist.lc1 !== true) problems.push('“aç chrome” emir sayılmıyor');
    if (asist.lc2 !== false) problems.push('soru emir sanılıyor: ' + asist.lc2);
    if (asist.aj !== 'open:Chrome:false') problems.push('eylem JSON ayrışmıyor: ' + asist.aj);
    if (asist.ar !== true) problems.push('run eylemi onay gerektirmiyor: ' + asist.ar);
    if (asist.lj !== 'Tarayıcı açık|https://ornek.com') problems.push('ekrana bakma JSON ayrışmıyor: ' + asist.lj);
    if (asist.onayBekliyor !== true) problems.push('run eylemi onay beklemiyor');
    if (asist.urlOnay !== true) problems.push('URL açma onay beklemiyor');
    if (asist.vazgecti !== true) problems.push('“hayır” eylemi iptal etmiyor');
    if (JSON.stringify(accessSeen.open) !== JSON.stringify(['C:/Test/Chrome.exe', 'C:/Test/Belgeler', 'C:/Test/Chrome.exe'])) {
      problems.push('asistan açma eylemi yanlış: ' + JSON.stringify(accessSeen.open));
    }
    if (JSON.stringify(accessSeen.run) !== JSON.stringify(['echo hi'])) problems.push('onaylı komut çalışmıyor: ' + JSON.stringify(accessSeen.run));
    if ((accessSeen.url || []).length !== 0) problems.push('onaysız URL açıldı: ' + JSON.stringify(accessSeen.url));
    if (accessSeen.ret < 1) problems.push('kendini kapat topu uygulamaya döndürmüyor');
    if (!/Chrome açıldı/.test((ballOut.find((x) => x.id === 'as1' && x.delta) || {}).delta || '')) problems.push('asistan aç yanıtı eksik');

    /* --- mikrofon: ayarlar, bas-konuş tuşu, WAV ve metin ekleme --- */
    beklenenSesYedegi = true;
    const voice = await win.webContents.executeJavaScript(`(async () => {
      try {
      const out = { };
      const ids = ['micTile', 'micSelect', 'micRefresh', 'micStatus', 'micBtn', 'voiceSupport'];
      out.eksik = ids.filter((id) => !document.getElementById(id));
      out.pttYok = !document.getElementById('pttBtn') && !document.getElementById('pttClear');
      const mb = document.getElementById('micBtn');
      const inp = document.getElementById('input');
      out.micSagda = !!(mb && inp && (inp.compareDocumentPosition(mb) & Node.DOCUMENT_POSITION_FOLLOWING));
      out.formTipi = mb ? mb.type : '';
      openSettings('app');
      await new Promise((r) => setTimeout(r, 200));
      out.sesDestegi = voiceSupported();
      out.mikrofonSecenek = document.querySelectorAll('#micSelect option').length;
      out.destek = document.getElementById('voiceSupport').textContent;
      out.pttKaldirildi = !settings.ptt;
      /* Mikrofon açık: düğme görünür, cihaz seçimi etkin. */
      out.micGizli = !!(mb && (mb.hidden || getComputedStyle(mb).display === "none"));
      /* Sesle yazılamayan sağlayıcıda kayıt açılmaz (mikrofon boşuna açılmaz). */
      const eskiMic = { apis: settings.apis, aktif: settings.activeApiId, provider: settings.provider };
      settings.apis = [{ sid: 'mic-off', provider: 'anthropic', key: '', model: 'claude' }];
      settings.activeApiId = 'mic-off';
      settings.provider = 'anthropic';
      await voiceToggle("app");
      out.sesKapali = voiceState === "idle" && !voiceStream;
      out.sesDurum = typeof voiceState === "string" ? voiceState : "yok";
      settings.apis = eskiMic.apis;
      settings.activeApiId = eskiMic.aktif;
      settings.provider = eskiMic.provider;
      out.micSecim = !document.getElementById("micSelect").disabled;
      const eski = { apis: settings.apis, active: settings.activeApiId, provider: settings.provider };
      settings.apis = [{ sid: 'stt-test', provider: 'gemini', key: 'test-key', model: 'gemini-2.0-flash' }];
      settings.activeApiId = 'stt-test';
      settings.provider = 'gemini';
      out.sttHazir = sttReady();
      out.sttIpucu = voiceHintText();
      const rate = 16000;
      const n = 1600;
      const ab = new ArrayBuffer(44 + n * 2);
      const dv = new DataView(ab);
      const wr = (at, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(at + i, s.charCodeAt(i)); };
      wr(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); wr(8, 'WAVE'); wr(12, 'fmt ');
      dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true);
      dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
      wr(36, 'data'); dv.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.round(Math.sin(i / 8) * 8000), true);
      const wav = await wavFromBlob(new Blob([ab], { type: 'audio/wav' }));
      const head = new Uint8Array(await wav.slice(0, 4).arrayBuffer());
      out.wav = { boyut: wav.size, baslik: String.fromCharCode.apply(null, [...head]), tip: wav.type };
      document.getElementById('input').value = 'ilk';
      insertVoiceText('konuşma metni');
      out.yazi = document.getElementById('input').value;
      /* 3 saniyelik sessizlik kuralı (saf karar işlevi). */
      const now = Date.now();
      out.vadEsik = VOICE_SILENCE_MS;
      out.vad = [
        voiceShouldSend({ hadSpeech: true, voicedMs: 800, lastSound: now - 2990, started: now - 5000 }, now),
        voiceShouldSend({ hadSpeech: true, voicedMs: 800, lastSound: now - 3100, started: now - 5000 }, now),
        voiceShouldSend({ hadSpeech: false, voicedMs: 0, lastSound: now - 9000, started: now - 9000 }, now),
        voiceShouldSend({ hadSpeech: true, voicedMs: 100, lastSound: now - 9000, started: now - 9000 }, now)
      ];
      /* "bitir / ilet / gönder" komutu metinden ayrılmalı; komut tek
         başınaysa gönderilecek metin kalmamalı. */
      out.komut = [
        stripVoiceCommand('hava nasıl bugün bitir'),
        stripVoiceCommand('hava nasıl bugün ilet.'),
        stripVoiceCommand('hava nasıl bitir ve ilet'),
        stripVoiceCommand('GÖNDER'),
        stripVoiceCommand('İLET'),
        stripVoiceCommand('bitirmek istiyorum'),
        stripVoiceCommand('bunu gönder')
      ].map((r) => ({ text: r.text, command: r.command }));
      /* Whisper yolu: WAV'a çevirmeden webm ve hızlı model. */
      settings.apis = [{ sid: 'stt-whisper', provider: 'openai', key: 'test-key', model: 'gpt-4o-mini' }];
      settings.activeApiId = 'stt-whisper';
      settings.provider = 'openai';
      const eskiFetch = window.fetch;
      const formlar = [];
      window.fetch = async (url, init) => {
        formlar.push(init && init.body);
        return { ok: true, status: 200, json: async () => ({ text: 'hızlı metin' }) };
      };
      const ses = new Blob([new Uint8Array(4000)], { type: 'audio/webm' });
      try {
        const metin = await transcribeVoice(ses);
        const form = formlar[0];
        const dosya = form && form.get('file');
        out.hizli = {
          metin: metin, ad: dosya && dosya.name, tip: dosya && dosya.type,
          model: form && form.get('model'), boyut: ses.size,
          dil: form && form.get('language'), istem: form && form.get('prompt')
        };
        /* Canlı yazı hızlı modeli kullanmalı, final ise doğruluk modelini. */
        const canliMetin = await transcribeLive(ses);
        out.canliModel = {
          metin: canliMetin,
          model: formlar[1] && formlar[1].get('model')
        };
      } finally { window.fetch = eskiFetch; }
      /* Yeni modeller kapalıysa sıradaki modele, en son whisper-1'e düşmeli. */
      const modeller = [];
      window.fetch = async (url, init) => {
        const model = init.body.get('model');
        modeller.push(model);
        if (model !== 'whisper-1') {
          return { ok: false, status: 404, json: async () => ({ error: { message: 'model yok' } }) };
        }
        return { ok: true, status: 200, json: async () => ({ text: 'yedek metin' }) };
      };
      try { out.yedek = { metin: await transcribeVoice(ses), modeller: modeller };      } finally { window.fetch = eskiFetch; }
      /* Gemini önceliği: etkin sağlayıcı openai olsa bile ses Gemini'ye gider. */
      settings.apis = [
        { sid: 'stt-gem', provider: 'gemini', key: 'g-key', model: 'gemini-2.0-flash' },
        { sid: 'stt-oa', provider: 'openai', key: 'o-key', model: 'gpt-4o-mini' }
      ];
      settings.activeApiId = 'stt-oa';
      settings.provider = 'openai';
      const gemUrls = [];
      window.fetch = async (url) => {
        gemUrls.push(String(url));
        return { ok: true, status: 200,
          json: async () => ({ candidates: [{ content: { parts: [{ text: 'gemini metni' }] } }] }) };
      };
      try {
        const gemText = await transcribeLive(wav);
        out.geminiOncelik = {
          metin: gemText,
          geminiIstek: gemUrls.some((u) => /gemini-2\.0-flash/.test(u)),
          stt: sttProviderId(),
          ipucu: voiceHintText()
        };
      } finally { window.fetch = eskiFetch; }
      /* Konuşurken canlı yazı: metin yazma kutusunda görünür. */
      const inpEl = document.getElementById('input');
      inpEl.value = 'eski';
      voiceBaseText = '';
      showLiveVoiceText('yeni söz');
      out.canliYazi = inpEl.value;
      /* Sustuğunda kendiliğinden gönderim: send'e ulaşıyor mu? */
      voiceBaseText = '';
      const eskiSend = send;
      let gonderilen = null;
      send = (t) => { gonderilen = t; return Promise.resolve(); };
      voiceSubmit('merhaba dünya');
      await new Promise((r) => setTimeout(r, 300));
      send = eskiSend;
      out.otomatikGonder = { metin: gonderilen, girdi: inpEl.value };
      /* Konuşma parçası bitince (sessizlik) otomatik gönderim. */
      const eskiTrans = transcribeVoice;
      const eskiSend2 = send;
      let parcaMetin = null;
      transcribeVoice = async () => 'otomatik metin';
      send = (t) => { parcaMetin = t; return Promise.resolve(); };
      voiceTarget = 'app';
      voiceContinuous = true;
      voiceBaseText = '';
      handleSegment({ id: 99, hadSpeech: true, voicedMs: 900, chunks: [], liveText: '', sendText: '' },
        new Blob([new Uint8Array(2000)], { type: 'audio/webm' }));
      await new Promise((r) => setTimeout(r, 400));
      send = eskiSend2;
      transcribeVoice = eskiTrans;
      voiceContinuous = false;
      out.parcaGonder = parcaMetin;
      /* Topa geçişte mikrofon sessizce bırakılır (parça gönderilmez). */
      voiceState = 'listening';
      voiceSeg = null;
      cancelVoice();
      out.micIptal = voiceState === 'idle';
      settings.apis = eski.apis;
      settings.activeApiId = eski.active;
      settings.provider = eski.provider;
      closeSettings();
      return out;
      } catch (e) { return { hata: String((e && e.stack) || e) }; }
    })()`);
    if (voice.hata) problems.push('mikrofon testi: ' + voice.hata);
    if ((voice.eksik || []).length) problems.push('eksik mikrofon arayüzü: ' + (voice.eksik || []).join(', '));
    if (!voice.pttYok) problems.push('bas-konuş düğmeleri hâlâ arayüzde');
    if (!voice.pttKaldirildi) problems.push('settings.ptt hâlâ dolu');
    if (voice.micGizli) problems.push('mikrofon düğmesi görünmüyor');
    if (!voice.sesKapali || voice.sesDurum !== 'idle') {
      problems.push('sesle yazılamayan sağlayıcıda kayıt başlıyor: ' + JSON.stringify([voice.sesKapali, voice.sesDurum]));
    }
    if (!voice.micSecim) problems.push('mikrofon seçimi etkin değil');
    if (voice.formTipi !== 'button') problems.push('mikrofon düğmesi formu gönderiyor: ' + voice.formTipi);
    if (!voice.sesDestegi) problems.push('ses desteği algılanmıyor');
    if ((voice.mikrofonSecenek || 0) < 1) problems.push('mikrofon seçenekleri yok');
    if (!voice.sttHazir) problems.push('Gemini ile ses hazır sayılmıyor');
    if (!/Gemini/.test(voice.sttIpucu || '')) problems.push('ses sağlayıcı ipucu: ' + voice.sttIpucu);
    const gemOnc = voice.geminiOncelik || {};
    if (gemOnc.metin !== 'gemini metni' || !gemOnc.geminiIstek || gemOnc.stt !== 'gemini' || !/Gemini/.test(gemOnc.ipucu || '')) {
      problems.push('sesle yazma Gemini\'ye gitmiyor: ' + JSON.stringify(gemOnc));
    }
    if (voice.canliYazi !== 'yeni söz') problems.push('konuşurken canlı yazı gösterilmiyor: ' + voice.canliYazi);
    const og = voice.otomatikGonder || {};
    if (og.metin !== 'merhaba dünya' || String(og.girdi || '') !== '') {
      problems.push('sesli metin kendiliğinden gönderilmiyor: ' + JSON.stringify(og));
    }
    if (voice.parcaGonder !== 'otomatik metin') {
      problems.push('konuşma parçası otomatik gönderilmiyor: ' + voice.parcaGonder);
    }
    if (!voice.micIptal) problems.push('topa geçişte mikrofon bırakılmıyor');
    if (!voice.wav || voice.wav.baslik !== 'RIFF' || !(voice.wav.boyut > 44) || voice.wav.tip !== 'audio/wav') {
      problems.push('WAV dönüşümü bozuk: ' + JSON.stringify(voice.wav));
    }
    if (voice.yazi !== 'ilk konuşma metni') problems.push('ses metni yazma yerine eklenmiyor: ' + JSON.stringify(voice.yazi));
    if (voice.vadEsik !== 3000) problems.push('sessizlik eşiği 3 saniye değil: ' + voice.vadEsik);
    if (JSON.stringify(voice.vad) !== JSON.stringify([false, true, false, false])) {
      problems.push('3 saniyelik sessizlik kararı hatalı: ' + JSON.stringify(voice.vad));
    }
    const istenenKomut = [
      { text: 'hava nasıl bugün', command: 'bitir' },
      { text: 'hava nasıl bugün', command: 'ilet' },
      { text: 'hava nasıl', command: 'bitir' },
      { text: '', command: 'gönder' },
      { text: '', command: 'ilet' },
      { text: 'bitirmek istiyorum', command: '' },
      { text: 'bunu', command: 'gönder' }
    ];
    if (JSON.stringify(voice.komut) !== JSON.stringify(istenenKomut)) {
      problems.push('sesli gönderme komutu metinden ayrılmıyor: ' + JSON.stringify(voice.komut));
    }
    const hz = voice.hizli || {};
    if (hz.metin !== 'hızlı metin' || hz.ad !== 'konusma.webm' || hz.tip !== 'audio/webm' ||
        hz.model !== 'gpt-4o-transcribe' || !(hz.boyut > 0) || hz.dil !== 'tr' ||
        !/Noktalama/.test(String(hz.istem || ''))) {
      problems.push('final ses yolu (WAV\'sız webm, doğru model ve istem) bozuk: ' + JSON.stringify(hz));
    }
    const cm = voice.canliModel || {};
    if (cm.metin !== 'hızlı metin' || cm.model !== 'gpt-4o-mini-transcribe') {
      problems.push('canlı yazı hızlı modeli kullanmıyor: ' + JSON.stringify(cm));
    }
    const yd = voice.yedek || {};
    if (yd.metin !== 'yedek metin' ||
        JSON.stringify(yd.modeller) !== JSON.stringify(['gpt-4o-transcribe', 'gpt-4o-mini-transcribe', 'whisper-1'])) {
      problems.push('yeni modeller kapalıyken whisper-1 yedeği çalışmıyor: ' + JSON.stringify(yd));
    }
    setTimeout(() => { beklenenSesYedegi = false; }, 500);

    /* --- bilgisayar etkinliği + yedek ses + okurken mikrofon --- */
    const tts = await win.webContents.executeJavaScript(`(async () => {
      const out = {};
      try {
        /* 1) Etkinlik özeti isteme girer: gerçek uygulama, pencere ve süre.
              Tuş/tıklama sayacı artık istemde yok; cevap takılan bir dille. */
        await new Promise((r) => setTimeout(r, 300));
        const p = activityPrompt();
        out.prompt = p;
        out.chrome = /Chrome/.test(p);
        /* Sayaç yalnızca uygulama satırlarında olmamalı; kural metni sayacın
           adını anabilir (“tuş sayısı söyleme” gibi). */
        out.veri = p.split(String.fromCharCode(10)).filter((l) => l.startsWith('- ')).join(String.fromCharCode(10));
        out.sayacYok = !/[0-9]+ (tıklama|tuş)|keystroke|clicks?/i.test(out.veri);
        out.takilma = /ne işler peşindesin/.test(p);
        out.vscode = /VS Code/.test(p);
        settings.trackActivity = false;
        out.promptKapali = activityPrompt();
        settings.trackActivity = true;
        /* 2) Gemini TTS kotası dolu → Windows sesi devreye girer. */
        const eskiGem = geminiSpeak;
        const eskiOn = assistantCfg().voice.on;
        geminiSpeak = async () => { throw new Error('429 kota'); };
        assistantCfg().voice.on = true;
        speakReply('Yedek ses denemesi.');
        await new Promise((r) => setTimeout(r, 300));
        out.yedekBitti = speechActive === false;
        geminiSpeak = eskiGem;
        assistantCfg().voice.on = eskiOn;
        /* 3) Okuma sırasında mikrofon bekletilir, bitince yeniden başlar. */
        const eskiSeg = startSegment;
        let yeniParca = 0;
        startSegment = () => { yeniParca += 1; return true; };
        voiceState = 'listening';
        voiceSeg = { id: 5, rec: { state: 'inactive' }, aborted: false };
        voiceHold = false;
        speechActive = true;
        holdVoiceForSpeech();
        out.hold = { beklet: voiceHold, parca: voiceSeg };
        releaseVoiceAfterSpeech();
        out.holdSon = { beklet: voiceHold, yeniParca };
        /* 4) Kullanıcı sesi yükselirse okuma kesilir (barge-in). */
        voiceState = 'listening';
        voiceSeg = null;
        voiceHold = true;
        speechActive = true;
        speechStartedAt = Date.now() - 1200;
        voiceBargeTicks = 0;
        voiceBuf = new Uint8Array(1024);
        voiceAnalyser = { getByteTimeDomainData: (buf) => { for (let i = 0; i < buf.length; i += 1) buf[i] = 230; } };
        for (let i = 0; i < 10; i += 1) voiceTick();
        out.barge = { beklet: voiceHold, konusuyor: speechActive, yeniParca };
        voiceAnalyser = null; voiceBuf = null;
        startSegment = eskiSeg;
        voiceState = 'idle';
        voiceHold = false;
        voiceSeg = null;
        speechActive = false;
      } catch (e) { out.hata = String((e && e.stack) || e); }
      return out;
    })()`);
    if (tts.hata) problems.push('ses/etkinlik testi: ' + tts.hata);
    if (!tts.chrome) {
      problems.push('istemde bilgisayar etkinliği yok: ' + String(tts.prompt || '').slice(0, 160));
    }
    if (!tts.sayacYok) {
      problems.push('etkinlik isteminde tuş/tıklama sayacı duruyor: ' + String(tts.veri || '').slice(0, 160));
    }
    if (!tts.takilma) {
      problems.push('etkinlik isteminde samimi takılma kuralı yok');
    }
    if (!tts.vscode) problems.push('etkinlik isteminde ikinci uygulama yok');
    if (String(tts.promptKapali || '').length) problems.push('etkinlik kapalıyken isteme ekleniyor');
    if (!tts.yedekBitti) problems.push('yedek seslendirme sonrası mikrofon serbest bırakılmıyor');
    if (!ttsSeen.texts.some((x) => /Yedek ses denemesi/.test(x))) {
      problems.push('Gemini TTS hatasında Windows sesi devreye girmiyor');
    }
    const hd = tts.hold || {};
    if (!hd.beklet || hd.parca !== null) {
      problems.push('okuma sırasında mikrofon bekletilmiyor: ' + JSON.stringify(hd));
    }
    if ((tts.holdSon || {}).beklet || !((tts.holdSon || {}).yeniParca > 0)) {
      problems.push('okuma bitince mikrofon yeniden başlamıyor: ' + JSON.stringify(tts.holdSon));
    }
    const bg = tts.barge || {};
    if (bg.beklet || bg.konusuyor) {
      problems.push('kullanıcı sözü kesince okuma durmuyor: ' + JSON.stringify(bg));
    }

    /* --- yanıtın altındaki eylemler: kopyala, yeniden yaz, sesli oku --- */
    const chatUi = await win.webContents.executeJavaScript(`(async () => {
      const out = {};
      try {
        newChat();
        await new Promise((r) => setTimeout(r, 120));
        out.altCubukYok = !document.getElementById('chatActions') && !document.getElementById('voicePop');
        const c = activeChat();
        c.messages = [
          { role: 'user', content: 'Merhaba', ts: Date.now() },
          { role: 'assistant', content: 'Eski yanıt.', ts: Date.now() - 1000 },
          { role: 'user', content: 'Yine merhaba', ts: Date.now() },
          { role: 'assistant', content: 'Birinci cümle. İkinci cümle. Üçüncü cümle.', ts: Date.now() }
        ];
        renderChat();
        await new Promise((r) => setTimeout(r, 100));
        const msgs = [...document.querySelectorAll('#messages .msg.assistant')];
        const sonMsg = msgs[msgs.length - 1];
        const tools = sonMsg.querySelector('.msg-tools');
        out.dugmeSayisi = tools ? tools.querySelectorAll('button').length : 0;
        out.etiketler = tools ? [...tools.querySelectorAll('button')].map((b) => b.textContent.trim()) : [];
        out.sesli = !!(tools && tools.querySelector('[data-speak]'));
        out.yeniden = !!(tools && tools.querySelector('[data-retry]'));
        out.kopyala = !!(tools && tools.querySelector('[data-copy-msg]'));
        out.altKonum = !!tools && Math.round(tools.getBoundingClientRect().top) >=
          Math.round(sonMsg.querySelector('.prose').getBoundingClientRect().bottom) - 2;
        out.eskiYeniden = !!(msgs[0] && msgs[0].querySelector('[data-retry]'));

        /* Sesli oku: otomatik ses kapalıyken de çalışır, tam metni ister. */
        const eskiSpeak = speakReply;
        const eskiOn = assistantCfg().voice.on;
        assistantCfg().voice.on = false;
        let istenen = null;
        speakReply = (txt, o) => {
          istenen = { text: String(txt), opts: o || {} };
          speechActive = true;
          updateMessageActions();
          return true;
        };
        const sp = tools.querySelector('[data-speak]');
        sp.click();
        await new Promise((r) => setTimeout(r, 80));
        out.okuma = {
          metin: istenen && istenen.text,
          force: !!(istenen && istenen.opts.force),
          full: !!(istenen && istenen.opts.full),
          etiket: sp.textContent.trim(),
          on: sp.classList.contains('on')
        };
        sp.click();
        await new Promise((r) => setTimeout(r, 80));
        out.durdu = !speechActive && !sp.classList.contains('on');
        speakReply = eskiSpeak;
        assistantCfg().voice.on = eskiOn;

        /* Yeniden yaz yalnızca son yanıtta; eski yanıtta düğme yok. */
        const eskiRetry = retryLast;
        let retrySayi = 0;
        retryLast = () => { retrySayi += 1; };
        tools.querySelector('[data-retry]').click();
        await new Promise((r) => setTimeout(r, 60));
        retryLast = eskiRetry;
        out.retry = retrySayi;

        newChat();
      } catch (e) { out.hata = String((e && e.stack) || e); }
      return out;
    })()`);
    if (chatUi.hata) problems.push('yanıt eylemleri testi: ' + chatUi.hata);
    if (!chatUi.altCubukYok) {
      problems.push('yazma kutusunun üstünde eylem çubuğu/ses seçici hâlâ duruyor');
    }
    if (!chatUi.sesli || !chatUi.yeniden || !chatUi.kopyala || !(chatUi.dugmeSayisi >= 3)) {
      problems.push('yanıt altı kopyala/yeniden yaz/sesli oku düğmeleri eksik: ' +
        JSON.stringify([chatUi.dugmeSayisi, chatUi.etiketler]));
    }
    const etiket = (chatUi.etiketler || []).join(' ');
    if (!/Kopyala/.test(etiket) || !/Yeniden yaz/.test(etiket) || !/Sesli oku/.test(etiket)) {
      problems.push('yanıt altı düğme adları yanlış: ' + etiket);
    }
    if (!chatUi.altKonum) problems.push('yanıt eylemleri metnin altında değil');
    if (chatUi.eskiYeniden) problems.push('eski yanıtta “Yeniden yaz” düğmesi var');
    const ok = chatUi.okuma || {};
    if (!ok.force || !ok.full || !/Birinci cümle/.test(String(ok.metin || ''))) {
      problems.push('yanıt altı sesli oku yanıtı okumuyor: ' + JSON.stringify(ok));
    }
    if (!/Durdur/.test(String(ok.etiket)) || !ok.on) {
      problems.push('okuma sırasında yanıt altı düğme “Durdur” olmuyor: ' + JSON.stringify(ok));
    }
    if (!chatUi.durdu) problems.push('yanıt altı sesli oku durdurmuyor');
    if (chatUi.retry !== 1) problems.push('yanıt altı “Yeniden yaz” çalışmıyor: ' + chatUi.retry);

    /* --- ortak model: aynı sağlayıcıdaki bütün kayıtlar ve tüm model listesi --- */
    const gm = await win.webContents.executeJavaScript(`(async () => {
      try {
        const out = {};
        const eski = {
          apis: settings.apis, models: settings.models,
          active: settings.activeApiId, provider: settings.provider, draft: draft
        };
        settings.apis = [
          { sid: 'gpt-a', provider: 'openai', key: 'sk-test-a', model: 'gpt-4o' },
          { sid: 'gpt-b', provider: 'openai', key: 'sk-test-b', model: 'gpt-4o-mini' },
          { sid: 'gem', provider: 'gemini', key: 'AIza-test', model: 'gemini-2.0-flash' }
        ];
        settings.models = {
          openai: ['gpt-4o', 'gpt-4o-mini'],
          gemini: ['gemini-2.0-flash']
        };
        settings.activeApiId = 'gpt-a';
        settings.provider = 'openai';
        draft = null;
        renderApiGrid();
        const sec = document.getElementById('globalModelSelect');
        out.gruplar = sec.querySelectorAll('optgroup').length;
        out.secenekler = [...sec.querySelectorAll('option')].map((o) => o.textContent);
        out.durum = document.getElementById('globalModelStatus').textContent;
        sec.value = JSON.stringify(['openai', 'gpt-4o-mini']);
        sec.dispatchEvent(new Event('change', { bubbles: true }));
        out.apis = settings.apis.map((s) => s.provider + ':' + s.model);
        out.aktif = settings.activeApiId;
        out.rozet = document.getElementById('chipText').textContent;

        const eskiFetch = window.fetch;
        window.fetch = async (url) => {
          const u = String(url);
          if (u.includes('generativelanguage')) {
            return { ok: true, status: 200, json: async () => ({ models: [
              { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] },
              { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] }
            ] }) };
          }
          if (u.includes('/models')) {
            return { ok: true, status: 200, json: async () => ({ data: [
              { id: 'gpt-4o' }, { id: 'gpt-4o-mini' }, { id: 'o3' }, { id: 'text-embedding-3-small' }
            ] }) };
          }
          return { ok: false, status: 500, json: async () => ({ error: { message: 'yok' } }) };
        };
        try { await fetchAllModels(); } catch (e) { out.fetchHata = String((e && e.message) || e); }
        window.fetch = eskiFetch;
        out.modeller = Object.fromEntries(Object.entries(settings.models).map(([k, v]) => [k, v.slice()]));
        const sec2 = document.getElementById('globalModelSelect');
        out.sonraGruplar = sec2.querySelectorAll('optgroup').length;
        out.sonraSecenek = sec2.querySelectorAll('option').length;

        settings.apis = eski.apis;
        settings.models = eski.models;
        settings.activeApiId = eski.active;
        settings.provider = eski.provider;
        draft = eski.draft;
        persist();
        renderApiGrid();
        fillModelOptions();
        updateChip();
        return out;
      } catch (e) { return { hata: String((e && e.stack) || e) }; }
    })()`);
    if (gm.hata) problems.push('ortak model testi: ' + gm.hata);
    if (gm.gruplar !== 2) problems.push('ortak model sağlayıcı grupları: ' + gm.gruplar);
    if (!(gm.secenekler || []).includes('gpt-4o-mini') || !(gm.secenekler || []).includes('gemini-2.0-flash')) {
      problems.push('ortak model listesi eksik: ' + JSON.stringify(gm.secenekler));
    }
    if (!/model/.test(String(gm.durum || ''))) problems.push('ortak model durum metni yok: ' + gm.durum);
    if ((gm.apis || []).join(',') !== 'openai:gpt-4o-mini,openai:gpt-4o-mini,gemini:gemini-2.0-flash') {
      problems.push('ortak model bütün kayıtlara uygulanmıyor: ' + JSON.stringify(gm.apis));
    }
    if (gm.aktif !== 'gpt-a' || gm.rozet !== 'gpt-4o-mini') {
      problems.push('ortak model etkin modele yansımıyor: ' + JSON.stringify({ aktif: gm.aktif, rozet: gm.rozet }));
    }
    if (gm.fetchHata) problems.push('tüm modeller getirme hatası: ' + gm.fetchHata);
    const mm = gm.modeller || {};
    if (!(mm.openai || []).includes('o3') || !(mm.openai || []).includes('text-embedding-3-small') ||
        !(mm.gemini || []).includes('gemini-2.5-pro')) {
      problems.push('bütün modeller eklenmiyor: ' + JSON.stringify(mm));
    }
    if (gm.sonraGruplar !== 2 || gm.sonraSecenek !== 6) {
      problems.push('tüm modeller listeye eklenmiyor: ' + JSON.stringify({ gruplar: gm.sonraGruplar, secenek: gm.sonraSecenek }));
    }

    /* --- kamera: sol menü düğmesi, büyük görünüm, fotoğraf belleği ve uyarı --- */
    const cam = await win.webContents.executeJavaScript(`(async () => {
      try {
        const out = {};
        /* temiz başlangıç: önceki duman testinden kalan izin olmasın */
        settings.camera.permission = false;
        persist();
        camSetTabVisible(false);
        camStopAll();
        const ids = ['cameraNavBtn', 'camMiniVideo', 'camMiniEmpty', 'camStageModal', 'camBigVideo',
          'camChat', 'camChatInput', 'camChatForm', 'camSelect', 'camRefresh', 'camSaveCreator',
          'camPickCreator', 'camAlarmOn', 'camAutoClose', 'camCountdown', 'camIdleMin',
          'camPermit', 'camPermitYes', 'camPermitNo', 'camPermitCount', 'camRevokePermit'];
        out.eksik = ids.filter((id) => !document.getElementById(id));
        const navRect = document.getElementById('cameraNavBtn').getBoundingClientRect();
        const setRect = document.getElementById('settingsBtn').getBoundingClientRect();
        out.navAbove = navRect.bottom <= setRect.top + 1 && navRect.top < setRect.top;
        out.navLabel = document.getElementById('cameraNavBtn').textContent.trim();
        const camTab = document.querySelector('.settings-tab[data-panel="kamera"]');
        out.sekmeGizli = !!camTab && camTab.hidden;
        out.sekmeGenislik = camTab ? Math.round(camTab.getBoundingClientRect().width) : -1;
        out.izinYok = camSettings().permission === false;
        /* İzinsiz: ayarlarda kamera yeri yok, kamera hiç açılmaz; soru 3 saniyede kapanır. */
        openSettings('kamera');
        await new Promise((r) => setTimeout(r, 150));
        out.izinsizPanel = document.getElementById('panelKamera').hidden;
        out.soruGorunur = !document.getElementById('camPermit').hidden;
        out.soruSayi = document.getElementById('camPermitCount').textContent;
        out.izinsizVideo = !camStream && document.getElementById('camStageModal').hidden;
        closeSettings();
        await new Promise((r) => setTimeout(r, 3200));
        out.soruKapandi = document.getElementById('camPermit').hidden;
        out.izinHalaYok = camSettings().permission === false;
        /* İzin ver: sekme açılır, büyük görünüm açılır. */
        camStream = { getTracks: () => [] };
        document.getElementById('cameraNavBtn').click();
        await new Promise((r) => setTimeout(r, 160));
        out.soru2 = !document.getElementById('camPermit').hidden;
        document.getElementById('camPermitYes').click();
        await new Promise((r) => setTimeout(r, 320));
        out.izinVar = camSettings().permission === true;
        out.izinKayitli = ((JSON.parse(localStorage.getItem(ukey('settings'))) || {}).camera || {}).permission === true;
        out.sekmeAcik = !document.querySelector('.settings-tab[data-panel="kamera"]').hidden;
        out.soru2Kapandi = document.getElementById('camPermit').hidden;
        const modal = document.getElementById('camStageModal');
        const card = modal.querySelector('.cam-stage-card').getBoundingClientRect();
        const chat = modal.querySelector('.cam-stage-chat-col').getBoundingClientRect();
        const big = modal.querySelector('.cam-stage-video-col').getBoundingClientRect();
        out.stage = {
          visible: !modal.hidden,
          centeredX: Math.abs((card.left + card.right) / 2 - innerWidth / 2) < 40,
          centeredY: Math.abs((card.top + card.bottom) / 2 - innerHeight / 2) < 70,
          chatLeft: chat.right <= big.left + 1,
          bigWide: big.width > chat.width,
          bigVideo: !!document.getElementById('camBigVideo')
        };
        document.getElementById('camStageClose').click();
        await new Promise((r) => setTimeout(r, 150));
        out.stageClosed = modal.hidden;
        /* Ayarlardan “Kamerayı kapat”: izin durur, akış kapanır; yeniden açma
           sol menüdeki Kamera düğmesinden yapılır. */
        camStream = { getTracks: () => [] };
        openSettings('kamera');
        await new Promise((r) => setTimeout(r, 140));
        out.offGorunur = !document.getElementById('camShutdown').hidden;
        out.offIpucu = document.getElementById('camShutdownHint').textContent.trim();
        document.getElementById('camShutdown').click();
        await new Promise((r) => setTimeout(r, 120));
        out.offKapandi = !camStream && document.getElementById('camShutdown').hidden;
        out.offIpucuKapali = document.getElementById('camShutdownHint').textContent.trim();
        out.offIzniDuruyor = camSettings().permission === true;
        /* Geri aç: sol menüdeki Kamera düğmesi büyük görünümü yeniden açar. */
        camStream = { getTracks: () => [] };
        document.getElementById('cameraNavBtn').click();
        await new Promise((r) => setTimeout(r, 180));
        out.offYeniden = !document.getElementById('camStageModal').hidden;
        if (!document.getElementById('camStageModal').hidden) document.getElementById('camStageClose').click();
        await new Promise((r) => setTimeout(r, 100));
        camStream = null;
        openSettings('kamera');
        await new Promise((r) => setTimeout(r, 120));
        out.panel = !document.getElementById('panelKamera').hidden;
        out.digerGizli = document.getElementById('panelApi').hidden && document.getElementById('panelApp').hidden;
        out.tab = document.querySelector('.settings-tab.active').dataset.panel;
        out.ayarlardaVideoYok = !document.querySelector('#panelKamera video');
        out.ayarlardaSohbetYok = !document.querySelector('#panelKamera #camChat');
        closeSettings();
        out.varsayilan = Object.keys(camSettings()).sort();
        out.json = [
          parseSamePersonJson('{"same":true,"reason":"x"}'),
          parseSamePersonJson('{"same":false,"reason":"y"}'),
          parseSamePersonJson('kisa aciklama'),
          parseSamePersonJson('Aynı kişi görünüyor.')
        ];
        settings.camera.alarm = false;
        setCamPhoto('data:image/jpeg;base64,AAAA');
        out.creator = settings.camera.creatorPhoto;
        const st = JSON.parse(localStorage.getItem(ukey('settings'))) || {};
        out.kayit = (st.camera || {}).creatorPhoto;
        out.imgGorunur = !document.getElementById('camCreatorImg').hidden;
        settings.camera.autoClose = false;
        settings.camera.countdown = 1;
        triggerCamAlarm('deneme gerekçesi');
        out.alarmGorunur = !document.getElementById('camAlarm').hidden;
        out.alarmBaslik = document.querySelector('.cam-alarm-title').textContent;
        out.alarmSayi = document.getElementById('camAlarmCount').textContent;
        out.alarmMetin = document.getElementById('camAlarmSub').textContent;
        out.govdeSinifi = document.body.classList.contains('cam-alarm-on');
        await new Promise((r) => setTimeout(r, 1300));
        out.alarmKapandi = document.getElementById('camAlarm').hidden;
        closeCamAlarm();
        out.temizGovde = !document.body.classList.contains('cam-alarm-on');
        /* tanıma kartı: yükleniyor -> yeşil / kırmızı; kişi görüntüleri galerisi */
        settings.camera.captures = [];
        out.capture1 = !!camSaveCapture('data:image/jpeg;base64,CCCC', true);
        out.captures = settings.camera.captures.length;
        out.galleryOk = document.querySelectorAll('#camShots .cam-shot-item.ok').length;
        out.emptyHidden = document.getElementById('camShotsEmpty').hidden;
        out.shotStamp = (document.querySelector('#camShots .cam-shot-time') || {}).textContent || '';
        out.galleryButtons = ['camShotsAll', 'camShotsFolder', 'camShotsTitle', 'camShotsCount']
          .filter((id) => !document.getElementById(id));
        out.countText = document.getElementById('camShotsCount').textContent;
        out.captureMs = CAM_CAPTURE_MS;
        out.absenceMs = CAM_ABSENCE_MS;
        out.shotLimit = CAM_SHOT_LIMIT;
        out.absenceLimit = CAM_ABSENCE_LIMIT;
        for (let ci = 0; ci < 40; ci++) camSaveCapture('data:image/jpeg;base64,DDDD', ci % 2 === 0);
        out.capped = settings.camera.captures.length;
        clearCamShots();
        for (let ci = 0; ci < 5; ci++) camSaveCapture('data:image/jpeg;base64,FFFF', ci % 2 === 0);
        openCamShots(0);
        out.lbAll = !document.getElementById('lightbox').hidden;
        out.lbTotal = (LB.list || []).length;
        out.lbCaption = document.getElementById('lbCaption').textContent;
        closeLightbox();
        camSetWho('ok');
        out.whoOk = {
          hidden: document.getElementById('camBigWho').hidden,
          text: document.getElementById('camBigWhoText').textContent,
          sub: document.getElementById('camStageSub').textContent
        };
        camSetWho('bad');
        out.whoBad = document.getElementById('camBigWhoText').textContent;
        camSetWho('');
        out.whoHidden = document.getElementById('camBigWho').hidden;
        const yc = () => [...document.querySelectorAll('#camChat .cam-msg.ai')]
          .filter((x) => x.textContent === 'Yaratıcı kamerada.').length;
        const ycBefore = yc();
        camSetWho('ok');
        out.whoChat = [...document.querySelectorAll('#camChat .cam-msg.ai')].pop().textContent;
        const ycAfter = yc();
        camSetWho('ok');
        out.whoChatCount = ycAfter - ycBefore;
        out.whoChatRepeat = yc() - ycAfter;
        out.extraOk = camWhoExtra();
        camSetWho('bad');
        out.extraBad = camWhoExtra();
        camSetWho('');
        out.extraNone = camWhoExtra();
        const shotCard = camRecognitionCard('data:image/jpeg;base64,EEEE', { creatorPhoto: settings.camera.creatorPhoto });
        out.cardState = shotCard.root.querySelector('.cam-shot-frame').dataset.state;
        out.cardSpin = !!shotCard.root.querySelector('.cam-shot-spin');
        shotCard.setResult(true, '');
        out.cardOk = shotCard.root.querySelector('.cam-shot-frame').dataset.state;
        out.cardBadge = shotCard.root.querySelector('.cam-shot-badge').textContent;
        out.cardCaption = shotCard.root.querySelector('.cam-shot-caption').textContent;
        out.cardImgSrc = shotCard.root.querySelector('img.cam-shot').getAttribute('src');
        shotCard.setResult(false, 'farklı');
        out.cardBad = shotCard.root.querySelector('.cam-shot-frame').dataset.state;
        out.cardBadCaption = shotCard.root.querySelector('.cam-shot-caption').textContent;
        shotCard.setError('x');
        out.cardError = shotCard.root.querySelector('.cam-shot-frame').dataset.state;
        shotCard.remove();
        out.cardGone = !shotCard.root.isConnected;
        for (let cc = 0; cc < 8; cc++) camRecognitionCard('data:image/jpeg;base64,GGGG');
        out.cardCap = document.querySelectorAll('#camChat .cam-recognize').length;
        clearCamShots();
        out.cleared = settings.camera.captures.length;
        /* --- yokluk bölümü: insan yokken 1 dakikada bir kayıt --- */
        settings.camera.absences = [];
        camLastAbsenceAt = 0;
        renderCamAbsences();
        out.absence1 = !!camSaveAbsence('data:image/jpeg;base64,HHHH');
        out.absence2 = camSaveAbsence('data:image/jpeg;base64,IIII');
        out.absenceCount = settings.camera.absences.length;
        out.absenceItems = document.querySelectorAll('#camAbsences .cam-shot-item').length;
        out.absenceStamp = (document.querySelector('#camAbsences .cam-shot-time') || {}).textContent || '';
        out.absenceCountText = document.getElementById('camAbsencesCount').textContent;
        out.absenceAllShown = !document.getElementById('camAbsencesAll').hidden;
        openCamAbsences(0);
        out.absenceLb = !document.getElementById('lightbox').hidden && (LB.list || []).length === 1;
        closeLightbox();
        out.absenceButtons = ['camAbsencesFolder', 'camAbsencesAll', 'camAbsencesTitle', 'camAbsencesClear']
          .filter((id) => !document.getElementById(id));
        clearCamAbsences();
        out.absenceCleared = settings.camera.absences.length;
        /* Aynı görünen kareler kayda girmez; değişen kare girer. */
        out.idleMin = CAM_IDLE_MIN;
        out.idleField = (document.getElementById('camIdleMin') || {}).value || '';
        out.hashDiffSame = camHashDiff('aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa');
        out.hashDiffFar = camHashDiff('ffffffffffffffff', '0000000000000000');
        settings.camera.captures = [];
        out.dedup1 = !!camSaveCapture('data:image/jpeg;base64,KKKK', true, 'aaaaaaaaaaaaaaaa');
        out.dedup2 = camSaveCapture('data:image/jpeg;base64,LLLL', true, 'aaaaaaaaaaaaaaaa');
        out.dedup3 = !!camSaveCapture('data:image/jpeg;base64,MMMM', false, '5555555555555555');
        out.dedupCount = settings.camera.captures.length;
        clearCamShots();
        /* İzni geri al: kamera kapanır, izleme durur, bölüm gizlenir. */
        openSettings('kamera');
        await new Promise((r) => setTimeout(r, 100));
        document.getElementById('camRevokePermit').click();
        await new Promise((r) => setTimeout(r, 140));
        out.geriAlindi = camSettings().permission === false;
        out.sekmeGizli2 = document.querySelector('.settings-tab[data-panel="kamera"]').hidden;
        out.revokePanel = document.getElementById('panelKamera').hidden;
        out.revokeTab = document.querySelector('.settings-tab.active').dataset.panel;
        out.revokeStage = document.getElementById('camStageModal').hidden;
        out.revokeAyar = ((JSON.parse(localStorage.getItem(ukey('settings'))) || {}).camera || {}).permission === false;
        closeSettings();
        setCamPhoto('');
        out.temiz = [settings.camera.creatorPhoto];
        settings.camera.alarm = true;
        return out;
      } catch (e) { return { hata: String((e && e.stack) || e) }; }
    })()`);
    if (cam.hata) problems.push('kamera testi: ' + cam.hata);
    if ((cam.eksik || []).length) problems.push('eksik kamera arayüzü: ' + cam.eksik.join(', '));
    if (!cam.navAbove) problems.push('kamera düğmesi Ayarlar düğmesinin üstünde değil');
    if (!/^Kamera\s+BETA$/i.test(String(cam.navLabel || ''))) problems.push('kamera düğmesi beta etiketli değil: ' + cam.navLabel);
    if (!cam.sekmeGizli) problems.push('izin verilmeden kamera sekmesi görünüyor');
    if (cam.sekmeGenislik !== 0) problems.push('gizli kamera sekmesi yer kaplıyor: ' + cam.sekmeGenislik);
    if (!cam.izinYok) problems.push('kamera izni varsayılan olarak verilmiş');
    if (!cam.izinsizPanel) problems.push('izin verilmeden kamera paneli açılıyor');
    if (!cam.soruGorunur) problems.push('kamera izin sorusu çıkmıyor');
    if (String(cam.soruSayi) !== '3') problems.push('izin sorusu 3 saniyeden başlamıyor: ' + cam.soruSayi);
    if (!cam.izinsizVideo) problems.push('izin verilmeden kamera açılıyor');
    if (!cam.soruKapandi) problems.push('3 saniyede yanıt verilmeyince izin sorusu kapanmıyor');
    if (!cam.izinHalaYok) problems.push('yanıt verilmeden kamera izni verilmiş sayılıyor');
    if (!cam.soru2) problems.push('kamera düğmesi yeniden izin sormuyor');
    if (!cam.izinVar || !cam.izinKayitli) problems.push('“İzin ver” kamera iznini kaydetmiyor');
    if (!cam.sekmeAcik) problems.push('izin verilince kamera sekmesi görünmüyor');
    if (!cam.soru2Kapandi) problems.push('izin verilince soru kapanmıyor');
    if (!cam.panel) problems.push('kamera paneli açılmıyor');
    if (!cam.digerGizli) problems.push('kamera sekmesi diğer panelleri gizlemiyor');
    if (cam.tab !== 'kamera') problems.push('kamera sekmesi etkin değil: ' + cam.tab);
    if (!cam.ayarlardaVideoYok) problems.push('canlı görüntü hâlâ ayarlarda');
    if (!cam.ayarlardaSohbetYok) problems.push('yapay zekâ sohbeti hâlâ ayarlarda');
    const stg = cam.stage || {};
    if (!stg.visible) problems.push('kamera büyük görünümü açılmıyor');
    if (!stg.centeredX || !stg.centeredY) problems.push('kamera görünümü ekranın ortasında değil: ' + JSON.stringify(stg));
    if (!stg.chatLeft) problems.push('büyük görünümde sohbet solda değil');
    if (!stg.bigWide) problems.push('kamera görüntüsü sohbetten geniş değil');
    if (!stg.bigVideo) problems.push('büyük kamera video öğesi yok');
    if (!cam.stageClosed) problems.push('kamera büyük görünümü kapanmıyor');
    if ((cam.varsayilan || []).join(',') !== 'absences,alarm,autoClose,captures,countdown,creatorPhoto,deviceId,enabled,idleMin,permission') {
      problems.push('kamera varsayılanları yanlış: ' + (cam.varsayilan || []).join(','));
    }
    const jj = cam.json || [];
    if (!jj[0] || jj[0].same !== true) problems.push('eşleşen JSON okunamadı: ' + JSON.stringify(jj[0]));
    if (!jj[1] || jj[1].same !== false) problems.push('eşleşmeyen JSON okunamadı: ' + JSON.stringify(jj[1]));
    if (jj[2] !== null) problems.push('geçersiz yanıt yorumlandı: ' + JSON.stringify(jj[2]));
    if (!jj[3] || jj[3].same !== true) problems.push('Türkçe aynı kişi yanıtı okunamadı: ' + JSON.stringify(jj[3]));
    if (cam.creator !== 'data:image/jpeg;base64,AAAA') problems.push('yaratıcı fotoğrafı belleğe yazılmadı');
    if (cam.kayit !== 'data:image/jpeg;base64,AAAA') problems.push('yaratıcı fotoğrafı ayarlara kaydedilmedi');
    if (!cam.imgGorunur) problems.push('yaratıcı fotoğrafı önizlemesi görünmüyor');
    if (!cam.alarmGorunur) problems.push('güvenlik uyarısı açılmıyor');
    if (cam.alarmBaslik !== 'Sen şüpelisin!') problems.push('uyarı başlığı yanlış: ' + cam.alarmBaslik);
    if (cam.alarmSayi !== '1') problems.push('geri sayım başlangıcı yanlış: ' + cam.alarmSayi);
    if (cam.alarmMetin !== 'deneme gerekçesi') problems.push('uyarı gerekçesi gösterilmiyor: ' + cam.alarmMetin);
    if (!cam.govdeSinifi) problems.push('kırmızı yanıp sönme sınıfı eklenmiyor');
    if (!cam.alarmKapandi) problems.push('geri sayım sonunda uyarı kapanmıyor');
    if (!cam.temizGovde) problems.push('uyarı kapanınca yanıp sönme durmuyor');
    if ((cam.temiz || []).some(Boolean)) problems.push('yaratıcı fotoğrafı kaldırılamıyor');
    if (!cam.geriAlindi || !cam.revokeAyar) problems.push('kamera izni geri alınamıyor');
    if (!cam.sekmeGizli2 || !cam.revokePanel) problems.push('izin geri alınınca kamera bölümü gizlenmiyor');
    if (cam.revokeTab !== 'api') problems.push('izin geri alınınca kamera sekmesi kapanmıyor: ' + cam.revokeTab);
    if (!cam.revokeStage) problems.push('izin geri alınınca kamera görünümü kapanmıyor');
    if (!cam.capture1 || cam.captures !== 1) problems.push('kişi görüntüsü kaydedilmiyor: ' + cam.captures);
    if (cam.galleryOk !== 1) problems.push('galeri yeşil çerçeve göstermiyor: ' + cam.galleryOk);
    if (!cam.emptyHidden) problems.push('galeri boş metni gizlenmiyor');
    if (cam.capped !== 36) problems.push('kamera yakalama sınırı uygulanmıyor: ' + cam.capped);
    if (cam.captureMs !== 30000) problems.push('yaratıcı kontrolü 30 saniye değil: ' + cam.captureMs);
    if (cam.absenceMs !== 60000) problems.push('yokluk aralığı 1 dakika değil: ' + cam.absenceMs);
    if (cam.absenceLimit !== 36) problems.push('yokluk sınırı yanlış: ' + cam.absenceLimit);
    if (!/^\d{2}\.\d{2} \d{2}:\d{2}$/.test(String(cam.shotStamp))) problems.push('yakalama saati/tarihi yazılmıyor: ' + cam.shotStamp);
    if ((cam.galleryButtons || []).length) problems.push('kamera yakalama düğmeleri eksik: ' + (cam.galleryButtons || []).join(', '));
    if (cam.countText !== '1') problems.push('yakalama sayacı yanlış: ' + cam.countText);
    if (!cam.lbAll) problems.push('“Tümünü gör” tüm görüntüleri açmıyor');
    if (cam.lbTotal !== 5) problems.push('lightbox tüm yakalamaları göstermiyor: ' + cam.lbTotal);
    if (!/1\/5/.test(String(cam.lbCaption))) problems.push('lightbox sayacı yanlış: ' + cam.lbCaption);
    if (!cam.whoOk || cam.whoOk.hidden) problems.push('eşleşen kişi “Yaratıcı” etiketi göstermiyor');
    if (!cam.whoOk || cam.whoOk.text !== 'Yaratıcı') problems.push('etiket metni yanlış: ' + JSON.stringify(cam.whoOk));
    if (!cam.whoOk || cam.whoOk.sub !== 'Kamerası açık · Yaratıcı') problems.push('başlık altı “Kamerası açık · Yaratıcı” değil: ' + JSON.stringify(cam.whoOk));
    if (cam.whoBad !== 'Tanınmayan kişi') problems.push('tanınmayan etiketi yanlış: ' + cam.whoBad);
    if (!cam.whoHidden) problems.push('kimse yokken etiket gizlenmiyor');
    if (cam.whoChat !== 'Yaratıcı kamerada.') problems.push('eşleşince sohbet duyurusu yok: ' + cam.whoChat);
    if (cam.whoChatCount !== 1) problems.push('yaratıcı duyurusu eklenmiyor: ' + cam.whoChatCount);
    if (cam.whoChatRepeat !== 0) problems.push('yaratıcı duyurusu tekrarlanıyor: ' + cam.whoChatRepeat);
    if (!/Yaratıcı/.test(String(cam.extraOk || '')) || !/ona her zaman/.test(String(cam.extraOk || ''))) {
      problems.push('sohbet istemi yaratıcı demiyor: ' + cam.extraOk);
    }
    if (!/tanınmayan kişi/.test(String(cam.extraBad || ''))) problems.push('tanınmayan kişi istemi yok: ' + cam.extraBad);
    if (!/Kameradaki kişiyi kısaca/.test(String(cam.extraNone || ''))) problems.push('varsayılan sohbet istemi bozuldu: ' + cam.extraNone);
    if (cam.cardImgSrc !== 'data:image/jpeg;base64,AAAA') problems.push('eşleşince onaylı yaratıcı fotoğrafı gösterilmiyor: ' + cam.cardImgSrc);
    if (cam.cardState !== 'loading') problems.push('tanıma kartı yükleniyor durumunda değil: ' + cam.cardState);
    if (!cam.cardSpin) problems.push('tanıma kartında yüklenme animasyonu yok');
    if (cam.cardOk !== 'ok') problems.push('eşleşen kart yeşil değil: ' + cam.cardOk);
    if (cam.cardBadge !== 'YARATICI') problems.push('eşleşen kart rozeti yanlış: ' + cam.cardBadge);
    if (!/onaylı yaratıcı/.test(String(cam.cardCaption))) problems.push('eşleşen kart açıklaması yok: ' + cam.cardCaption);
    if (cam.cardBad !== 'bad') problems.push('tanınmayan kart kırmızı değil: ' + cam.cardBad);
    if (!/Tanınmayan kişi/.test(String(cam.cardBadCaption))) problems.push('tanınmayan kart açıklaması yok: ' + cam.cardBadCaption);
    if (cam.cardError !== 'error') problems.push('tanımlanamayan kart durumu yanlış: ' + cam.cardError);
    if (!cam.cardGone) problems.push('tanıma kartı kaldırılamıyor');
    if (cam.cleared !== 0) problems.push('kişi görüntüleri temizlenmiyor: ' + cam.cleared);
    if ((cam.cardCap || 0) > 6) problems.push('tanıma kartları birikiyor: ' + cam.cardCap);
    if (!cam.absence1) problems.push('yokluk kaydı oluşturulamıyor');
    if (cam.absence2) problems.push('yokluk kaydı 1 dakikadan sık alınıyor');
    if (cam.absenceCount !== 1) problems.push('yokluk kaydı sayısı yanlış: ' + cam.absenceCount);
    if (cam.absenceItems !== 1) problems.push('yokluk galerisi çizilmiyor: ' + cam.absenceItems);
    if (/^\d{2}\.\d{2} \d{2}:\d{2}$/.test(String(cam.absenceStamp))) { /* saat + tarih var */ }
    else problems.push('yokluk kaydında saat/tarih yok: ' + cam.absenceStamp);
    if (cam.absenceCountText !== '1') problems.push('yokluk sayacı yanlış: ' + cam.absenceCountText);
    if (!cam.absenceAllShown) problems.push('yokluk “Tümünü gör” düğmesi görünmüyor');
    if (!cam.absenceLb) problems.push('yokluk kayıtları birlikte açılmıyor');
    if ((cam.absenceButtons || []).length) problems.push('yokluk düğmeleri eksik: ' + (cam.absenceButtons || []).join(', '));
    if (cam.absenceCleared !== 0) problems.push('yokluk kayıtları temizlenmiyor: ' + cam.absenceCleared);
    if (cam.idleMin !== 10) problems.push('boşta kapatma varsayılanı 10 dk değil: ' + cam.idleMin);
    if (String(cam.idleField) !== '10') problems.push('boşta kapatma alanı yok/yanlış: ' + cam.idleField);
    if (cam.hashDiffSame !== 0) problems.push('aynı kare özeti farklı çıkıyor: ' + cam.hashDiffSame);
    if (cam.hashDiffFar !== 64) problems.push('uzak kare özeti yanlış: ' + cam.hashDiffFar);
    if (!cam.dedup1) problems.push('ilk kare kaydedilmiyor');
    if (cam.dedup2) problems.push('benzer kare tekrar kaydediliyor');
    if (!cam.dedup3) problems.push('farklı kare kaydedilmiyor');
    if (cam.dedupCount !== 2) problems.push('benzer kare ayıklaması yanlış: ' + cam.dedupCount);

    /* --- asistan ayarları: uyku düzeni ve yüz tasarımcısı --- */
    const asst = await win.webContents.executeJavaScript(`(async () => {
      try {
        const out = {};
        /* temiz başlangıç */
        settings.assistant = freshDefaults().assistant;
        asstDraft = null;
        persist();
        const ids = ['panelAsistan', 'asstSleepOn', 'asstSleepEvery', 'asstSleepLen', 'asstPreview',
          'asstEyeSize', 'asstEyeGap', 'asstEyeColor', 'asstMouthW', 'asstMouthCurve', 'asstMouthColor',
          'asstMouthRound', 'asstFaceName', 'asstSaveFace', 'asstFaces'];
        out.eksik = ids.filter((id) => !document.getElementById(id));
        const tab = document.querySelector('.settings-tab[data-panel="asistan"]');
        out.sekmeVar = !!tab && !tab.hidden;
        out.sekmeAd = tab ? tab.textContent.trim() : '';
        /* sekme düğmesi üzerinden açılmalı */
        tab.click();
        await new Promise((r) => setTimeout(r, 140));
        out.panel = !document.getElementById('panelAsistan').hidden;
        out.digerGizli = document.getElementById('panelApi').hidden && document.getElementById('panelApp').hidden;
        out.tab = document.querySelector('.settings-tab.active').dataset.panel;
        out.altBaslik = document.getElementById('settingsSub').textContent;
        /* varsayılanlar ve alanlar (kopyalanır: test ilerledikçe nesne değişir) */
        out.varsayilan = Object.assign({}, assistantCfg());
        out.alanEvery = document.getElementById('asstSleepEvery').value;
        out.alanLen = document.getElementById('asstSleepLen').value;
        out.alanOn = document.getElementById('asstSleepOn').checked;
        out.accIdler = [...document.querySelectorAll('#asstAccs [data-acc-key]')].map((b) => b.dataset.accKey).join(',');
        out.accVarsayilan = assistantCfg().accessory;
        out.sesVarsayilan = Object.assign({}, assistantCfg().voice);
        out.hazirYuzler = [...document.querySelectorAll('#asstFaces .asst-face-card')].map((c) => c.dataset.faceKey);
        out.onizleme = (() => {
          const p = document.getElementById('asstPreview');
          const e = p.querySelector('i'), m = p.querySelector('b');
          return { goz: e.style.width, agiz: m.style.width, kavis: m.style.borderBottomWidth };
        })();
        /* uyku alanlarını değiştir ve Kaydet */
        document.getElementById('asstSleepOn').checked = false;
        document.getElementById('asstSleepEvery').value = '25';
        document.getElementById('asstSleepLen').value = '120';
        document.getElementById('saveSettings').click();
        await new Promise((r) => setTimeout(r, 140));
        out.kayitUyku = ((JSON.parse(localStorage.getItem(ukey('settings'))) || {}).assistant) || {};
        /* yeniden aç: alanlar kayıtlı değerlerle dolu */
        openSettings('asistan');
        await new Promise((r) => setTimeout(r, 120));
        out.yenidenEvery = document.getElementById('asstSleepEvery').value;
        out.yenidenLen = document.getElementById('asstSleepLen').value;
        out.yenidenOn = document.getElementById('asstSleepOn').checked;
        /* yüz tasarla: kaydet ve hemen kullan */
        const set = (id, v) => {
          const elm = document.getElementById(id);
          elm.value = String(v);
          elm.dispatchEvent(new Event('input', { bubbles: true }));
        };
        set('asstEyeSize', 1.4); set('asstEyeGap', 15); set('asstMouthW', 21); set('asstMouthCurve', 12);
        set('asstEyeColor', '#0a6b52');
        set('asstMouthColor', '#7a1f8c');
        out.taslakGoz = document.querySelector('#asstPreview i').style.width;
        out.taslakKavis = document.querySelector('#asstPreview b').style.borderBottomWidth;
        document.getElementById('asstFaceName').value = 'Deneme';
        document.getElementById('asstSaveFace').click();
        await new Promise((r) => setTimeout(r, 90));
        out.kayitliYuz = assistantCfg().faces.length;
        out.kayitliAd = (assistantCfg().faces[0] || {}).name;
        out.aktifYuz = assistantCfg().face;
        out.kartAktif = !!document.querySelector('#asstFaces .asst-face-card.active[data-face-key^="ozel:"]');
        out.kullaniliyor = (document.querySelector('#asstFaces .asst-face-card.active .asst-face-use') || {}).textContent;
        /* Aksesuar: tıkla → ayarlara yazılır, düğme işaretlenir, topa gider. */
        const crown = [...document.querySelectorAll('#asstAccs [data-acc-key]')].find((b) => b.dataset.accKey === 'tac');
        crown.click();
        await new Promise((r) => setTimeout(r, 80));
        out.accSecilen = assistantCfg().accessory;
        out.accBasili = crown.getAttribute('aria-pressed');
        out.accAktif = crown.classList.contains('active');
        out.accKayit = ((JSON.parse(localStorage.getItem(ukey('settings'))) || {}).assistant || {}).accessory;
        out.accPayload = assistantPayload().accessory;
        /* Sesli asistan: aç, AI sesi seç — anında kaydedilir. */
        const von = document.getElementById('asstVoiceOn');
        von.checked = true;
        von.dispatchEvent(new Event('change'));
        const gsel = document.getElementById('asstVoiceGemini');
        out.aiSecenek = [...gsel.options].map((o) => o.value);
        out.aiEtiket = (document.querySelector('#asstGeminiRow .field-label') || {}).textContent.trim();
        /* Sistem sesi alanları artık yok. */
        out.sistemYok = !document.getElementById('asstSystemVoice') && !document.getElementById('asstVoiceStatus') &&
          !document.getElementById('asstVoiceEngine') && !document.getElementById('asstVoicePick') &&
          !document.getElementById('asstVoicePresets') && !document.getElementById('asstVoiceGender');
        gsel.value = 'Vindemiatrix';
        gsel.dispatchEvent(new Event('change'));
        await new Promise((r) => setTimeout(r, 60));
        out.ses = Object.assign({}, assistantCfg().voice);
        out.sesKayit = ((JSON.parse(localStorage.getItem(ukey('settings'))) || {}).assistant || {}).voice;
        /* Seslendirme: test anahtarı ve sahte ses yanıtıyla okuma denemesi. */
        const eskiAsst = { apis: slots().slice(), aktif: settings.activeApiId, provider: settings.provider };
        const eskiFetchAsst = window.fetch;
        settings.apis = [{ sid: 'asst-tts', provider: 'gemini', key: 'asst-key', model: 'gemini-2.0-flash' }];
        settings.activeApiId = 'asst-tts';
        settings.provider = 'gemini';
        window.fetch = async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: {
          mimeType: 'audio/L16;codec=pcm;rate=24000',
          data: btoa(String.fromCharCode.apply(null, new Array(80).fill(0))) } }] } }] }), { status: 200 });
        out.sesOkudu = speakReply('Merhaba, sesli asistan denemesi.');
        stopSpeaking();
        window.fetch = eskiFetchAsst;
        settings.apis = eskiAsst.apis;
        settings.activeApiId = eskiAsst.aktif;
        settings.provider = eskiAsst.provider;
        assistantCfg().voice.on = false;
        out.sesKapaliOkumaz = speakReply('sessiz');
        assistantCfg().voice.on = true;
        out.payload = assistantPayload();
        /* özel yüzü sil: aktif yüz varsayılana döner */
        document.querySelector('#asstFaces [data-face-del]').click();
        await new Promise((r) => setTimeout(r, 80));
        out.silinen = assistantCfg().faces.length;
        out.donus = assistantCfg().face;
        /* hazır yüz seç */
        document.querySelector('#asstFaces .asst-face-card[data-face-key="saskin"]').click();
        await new Promise((r) => setTimeout(r, 80));
        out.saskin = assistantCfg().face;
        out.saskinYuvarlak = assistantPayload().face.mouthRound;
        out.saskinKart = !!document.querySelector('#asstFaces .asst-face-card.active[data-face-key="saskin"]');
        closeSettings();
        return out;
      } catch (e) { return { hata: String((e && e.stack) || e) }; }
    })()`);
    /* --- AI sesler: sistem sesi yok, Gemini tınıları ve kısa okuma var --- */
    const ttsEng = await win.webContents.executeJavaScript(`(async () => {
      const out = {};
      const eski = { apis: slots().slice(), aktif: settings.activeApiId, provider: settings.provider };
      const eskiFetch = window.fetch;
      try {
        openSettings('asistan');
        await new Promise((r) => setTimeout(r, 150));
        out.motorYok = !document.getElementById('asstVoiceEngine') && !document.getElementById('asstSystemVoice');
        out.sistemAlanYok = !document.getElementById('asstVoicePick') && !document.getElementById('asstVoicePresets') &&
          !document.getElementById('asstVoiceGender') && !document.getElementById('asstVoiceStatus');
        out.geminiGorunur = !document.getElementById('asstGeminiRow').hidden;
        out.etiket = (document.querySelector('#asstGeminiRow .field-label') || {}).textContent;
        out.sesSayisi = document.querySelectorAll('#asstVoiceGemini option').length;
        out.secenekler = [...document.querySelectorAll('#asstVoiceGemini option')].map((o) => o.textContent);
        settings.apis = [{ sid: 'tts-test', provider: 'gemini', key: 'test-tts-key', model: 'gemini-2.0-flash' }];
        settings.activeApiId = 'tts-test';
        settings.provider = 'gemini';
        out.anahtar = geminiSpeechKey();
        const sel = document.getElementById('asstVoiceGemini');
        sel.value = 'Vindemiatrix';
        sel.dispatchEvent(new Event('change'));
        out.gvoice = assistantCfg().voice.gvoice;
        out.durum = document.getElementById('asstGeminiStatus').textContent;
        out.motor = assistantCfg().voice.engine;
        const pcmCevap = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: {
          mimeType: 'audio/L16;codec=pcm;rate=24000',
          data: btoa(String.fromCharCode.apply(null, new Array(240).fill(0))) } }] } }] }), { status: 200 });
        let istenen = null;
        window.fetch = async (url, opts) => {
          istenen = { url: String(url), body: JSON.parse(opts.body) };
          return pcmCevap();
        };
        out.okundu = await geminiSpeak('Merhaba dunya');
        out.istek = istenen ? {
          ses: istenen.body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,
          modalite: istenen.body.generationConfig.responseModalities[0],
          urlSes: /:generateContent/.test(istenen.url),
          anahtar: /test-tts-key/.test(istenen.url)
        } : null;
        out.caliyor = !!ttsNode;
        stopSpeaking();
        out.durdu = !ttsNode;
        /* “Karışık”: her yanıtta başka bir kadın ses; art arda aynı ses gelmez. */
        sel.value = 'mix';
        sel.dispatchEvent(new Event('change'));
        const sesler = [];
        window.fetch = async (url, opts) => {
          const b = JSON.parse(opts.body);
          sesler.push(b.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName);
          return pcmCevap();
        };
        await geminiSpeak('birinci');
        stopSpeaking();
        await geminiSpeak('ikinci');
        stopSpeaking();
        out.karisik = { sesler, farkli: sesler[0] !== sesler[1] };
        out.yeniSesler = GEMINI_VOICES.filter((v) => !String(v.key).startsWith('mix')).map((v) => v.key);
        out.sesGruplari = [...document.querySelectorAll('#asstVoiceGemini optgroup')].map((g) => g.label);
        /* Uzun yanıt seslendirirken kısalır: cümle sınırında kesilir. */
        const uzunMetin = Array.from({ length: 8 }, (_, i) =>
          'Bu ' + (i + 1) + '. cümle biraz uzun olsun ki seslendirme kesilsin.').join(' ');
        let uzunGovde = null;
        window.fetch = async (url, opts) => {
          uzunGovde = JSON.parse(opts.body);
          return pcmCevap();
        };
        await geminiSpeak(uzunMetin);
        out.kisa = uzunGovde ? uzunGovde.contents[0].parts[0].text : '';
        /* Anahtar yokken de yanıt okunur: Windows sesi yedek olarak devreye girer. */
        settings.apis = [];
        geminiTtsWarned = true;   // uyarıyı sustur
        out.anahtarsiz = speakReply('sessiz kalmalı');
        const f = pcm16ToFloat(btoa(String.fromCharCode(0, 128, 255, 127)));
        out.pcm = [f[0], Math.round(f[1] * 1000) / 1000];
        closeSettings();
      } catch (e) { out.hata = String((e && e.stack) || e); }
      window.fetch = eskiFetch;
      settings.apis = eski.apis;
      settings.activeApiId = eski.aktif;
      settings.provider = eski.provider;
      settings.assistant = freshDefaults().assistant;
      persist();
      return out;
    })()`);
    if (ttsEng.hata) problems.push('AI sesler testi: ' + ttsEng.hata);
    if (!ttsEng.motorYok || !ttsEng.sistemAlanYok) {
      problems.push('sistem sesi arayüzü hâlâ duruyor: ' + JSON.stringify([ttsEng.motorYok, ttsEng.sistemAlanYok]));
    }
    if (!ttsEng.geminiGorunur) problems.push('AI sesler satırı gizli');
    if (!/Gemini sesleri \(yedek\)/.test(String(ttsEng.etiket || ''))) problems.push('“Gemini sesleri (yedek)” etiketi yok: ' + ttsEng.etiket);
    if (!(ttsEng.sesSayisi >= 22)) problems.push('AI ses listesi eksik: ' + ttsEng.sesSayisi);
    const eskiSesler = ['Puck', 'Charon', 'Fenrir', 'Orus', 'Kore', 'Leda', 'Aoede', 'Zephyr'];
    if ((ttsEng.aiSecenek || []).some((k) => eskiSesler.includes(k))) {
      problems.push('eski sesler listede duruyor: ' + (ttsEng.aiSecenek || []).join(','));
    }
    const etiketler = ttsEng.secenekler || [];
    const kadinSay = etiketler.filter((t) => /kadın,/.test(String(t))).length;
    const erkekSay = etiketler.filter((t) => /erkek,/.test(String(t))).length;
    if (kadinSay < 10 || erkekSay < 12) {
      problems.push('kadın/erkek ses sayısı eksik: ' + JSON.stringify([kadinSay, erkekSay]));
    }
    if (!(ttsEng.sesGruplari || []).some((g) => /Kadın/.test(g)) ||
        !(ttsEng.sesGruplari || []).some((g) => /Erkek/.test(g))) {
      problems.push('AI ses listesi kadın/erkek olarak gruplanmıyor: ' + (ttsEng.sesGruplari || []).join(','));
    }
    const mx = ttsEng.karisik || {};
    if (!mx.farkli || (mx.sesler || []).some((x) => eskiSesler.includes(x))) {
      problems.push('karışık ses her yanıtta değişmiyor: ' + JSON.stringify(mx));
    }
    if (Array.isArray(mx.sesler) && mx.sesler.some((x) => !(ttsEng.yeniSesler || []).includes(x))) {
      problems.push('karışık modda yeni olmayan ses seçildi: ' + JSON.stringify(mx.sesler));
    }
    if (ttsEng.motor !== 'gemini') problems.push('ses motoru gemini değil: ' + ttsEng.motor);
    if (ttsEng.gvoice !== 'Vindemiatrix') problems.push('AI sesi seçilmiyor: ' + ttsEng.gvoice);
    if (!ttsEng.istek || ttsEng.istek.ses !== 'Vindemiatrix' || ttsEng.istek.modalite !== 'AUDIO' ||
        !ttsEng.istek.urlSes || !ttsEng.istek.anahtar) {
      problems.push('AI ses isteği yanlış: ' + JSON.stringify(ttsEng.istek));
    }
    if (!ttsEng.okundu || !ttsEng.caliyor || !ttsEng.durdu) problems.push('AI sesi çalınmıyor/durmuyor');
    if (!ttsEng.kisa || !/kesilsin\.$/.test(ttsEng.kisa) || ttsEng.kisa.length > 260 || /6\. cümle/.test(ttsEng.kisa)) {
      problems.push('uzun yanıt kısa okunmuyor: ' + ttsEng.kisa);
    }
    if (ttsEng.anahtarsiz !== true) problems.push('anahtarsız seslendirme Windows sesine düşmüyor');
    if (!ttsEng.pcm || Math.abs(Number(ttsEng.pcm[0]) + 1) > 0.01 || Math.abs(Number(ttsEng.pcm[1]) - 1) > 0.01) {
      problems.push('PCM çözümü yanlış: ' + JSON.stringify(ttsEng.pcm));
    }

    /* --- ElevenLabs: anahtar girişi, ses listesi, öncelik ve Gemini yedeği --- */
    beklenenSesYedegi = true;
    const eleven = await win.webContents.executeJavaScript(`(async () => {
      const out = {};
      const eskiFetch = window.fetch;
      const eskiAudio = window.Audio;
      const eskiApi = { apis: settings.apis.slice(), aktif: settings.activeApiId, provider: settings.provider };
      /* Sahte oynatıcı: biter bitmez onended çağırır, çalmayı simüle eder. */
      const FakeAudio = class {
        constructor(u) { this.url = String(u); this.onended = null; this.onerror = null; }
        play() { setTimeout(() => { if (this.onended) this.onended(); }, 25); return Promise.resolve(); }
        pause() { /* yok */ }
        removeAttribute() { /* yok */ }
      };
      /* 24000 örnek = 1 saniyelik sessiz PCM: denetim anında hâlâ çalıyor olur. */
      const pcmCevap = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: {
        mimeType: 'audio/L16;codec=pcm;rate=24000',
        data: btoa(String.fromCharCode.apply(null, new Array(24000).fill(0))) } }] } }] }), { status: 200 });
      try {
        openSettings('asistan');
        await new Promise((r) => setTimeout(r, 150));
        out.alanVar = !!document.getElementById('asstElevenKey');
        out.modelVar = !!document.getElementById('asstElevenModel');
        out.seciciVar = !!document.getElementById('asstElevenVoice');
        out.getirVar = !!document.getElementById('asstElevenFetch');
        /* Anahtar değişiminde kaydedilir; ayarlar yeniden açılınca alana geri yazılır. */
        const ki = document.getElementById('asstElevenKey');
        ki.value = 'elc-test-key';
        ki.dispatchEvent(new Event('change'));
        out.anahtar = assistantCfg().voice.elevenKey;
        out.anahtarKayit = ((JSON.parse(localStorage.getItem(ukey('settings'))) || {}).assistant || {}).voice.elevenKey;
        renderAssistantSettings();
        out.alanDolu = document.getElementById('asstElevenKey').value;
        out.durumAnahtarli = document.getElementById('asstElevenStatus').textContent;
        /* “Sesleri getir”: sahte hesap sesleri seçiciyi doldurur. */
        window.fetch = async (url) => {
          out.getirIstek = String(url);
          return new Response(JSON.stringify({ voices: [
            { voice_id: 'el-deneme-1', name: 'Birinci Ses' },
            { voice_id: 'el-deneme-2', name: 'İkinci Ses' }
          ] }), { status: 200 });
        };
        document.getElementById('asstElevenFetch').click();
        await new Promise((r) => setTimeout(r, 250));
        out.sesler = [...document.querySelectorAll('#asstElevenVoice option')].map((o) => ({ id: o.value, ad: o.textContent }));
        out.secilenSes = assistantCfg().voice.elevenVoice;
        /* Öncelik: anahtar varsa seslendirme isteği doğrudan ElevenLabs'e gider. */
        window.Audio = FakeAudio;
        let istek = null;
        window.fetch = async (url, opts) => {
          istek = { url: String(url), anahtar: (opts.headers || {})['xi-api-key'], govde: JSON.parse(opts.body) };
          return new Response(new Uint8Array([1, 2, 3, 4, 5]), { status: 200 });
        };
        assistantCfg().voice.on = true;
        out.okudu = speakReply('Merhaba ElevenLabs', { force: true });
        await new Promise((r) => setTimeout(r, 120));
        out.istek = istek ? {
          taban: istek.url.indexOf('https://api.elevenlabs.io/v1/text-to-speech/') === 0,
          format: istek.url.indexOf('output_format=mp3_44100_128') >= 0,
          anahtar: istek.anahtar === 'elc-test-key',
          model: istek.govde && istek.govde.model_id,
          ayar: !!(istek.govde && istek.govde.voice_settings),
          sesId: /el-deneme-1|el-deneme-2/.test(istek.url)
        } : null;
        /* ElevenLabs 400 dönerse Gemini'ye düşülür. */
        settings.apis = [{ sid: 'el-yedek', provider: 'gemini', key: 'yedek-key', model: 'gemini-2.0-flash' }];
        settings.activeApiId = 'el-yedek';
        settings.provider = 'gemini';
        const istekler = [];
        window.fetch = async (url) => {
          istekler.push(String(url));
          if (/elevenlabs/.test(String(url))) return new Response('hata', { status: 400 });
          return pcmCevap();
        };
        geminiTtsWarned = true; elevenTtsWarned = true;   // uyarıları sustur
        out.yedek = await new Promise((resolve) => {
          speakReply('Yedek yolunu dene', { force: true });
          setTimeout(() => resolve({ istekler: istekler.slice(), caliyor: !!ttsNode }), 450);
        });
        stopSpeaking();
        /* Anahtar kalkınca ElevenLabs hiç çağrılmaz. */
        assistantCfg().voice.elevenKey = '';
        istekler.length = 0;
        window.fetch = async (url) => { istekler.push(String(url)); return pcmCevap(); };
        out.anahtarsiz = speakReply('Anahtarsız oku', { force: true });
        await new Promise((r) => setTimeout(r, 200));
        out.anahtarsizIstek = istekler.some((u) => /elevenlabs/.test(u));
        stopSpeaking();
        out.durumAnahtarsiz = document.getElementById('asstElevenStatus').textContent;
        closeSettings();
      } catch (e) { out.hata = String((e && e.stack) || e); }
      window.fetch = eskiFetch;
      window.Audio = eskiAudio;
      settings.apis = eskiApi.apis;
      settings.activeApiId = eskiApi.aktif;
      settings.provider = eskiApi.provider;
      settings.assistant = freshDefaults().assistant;
      persist();
      return out;
    })()`);
    if (eleven.hata) problems.push('ElevenLabs testi: ' + eleven.hata);
    if (!eleven.alanVar || !eleven.modelVar || !eleven.seciciVar || !eleven.getirVar) {
      problems.push('ElevenLabs arayüzü eksik: ' + JSON.stringify([eleven.alanVar, eleven.modelVar, eleven.seciciVar, eleven.getirVar]));
    }
    if (eleven.anahtar !== 'elc-test-key' || eleven.anahtarKayit !== 'elc-test-key' || eleven.alanDolu !== 'elc-test-key') {
      problems.push('ElevenLabs anahtarı kaydedilmiyor: ' + JSON.stringify([eleven.anahtar, eleven.anahtarKayit, eleven.alanDolu]));
    }
    if (!/v2\/voices|v1\/voices/.test(String(eleven.getirIstek || ''))) {
      problems.push('ses listesi isteği yanlış: ' + eleven.getirIstek);
    }
    if ((eleven.sesler || []).length !== 2 || eleven.secilenSes !== 'el-deneme-1') {
      problems.push('getirilen sesler seçiciye gelmiyor: ' + JSON.stringify(eleven.sesler));
    }
    const ei = eleven.istek || {};
    if (!ei.taban || !ei.format || !ei.anahtar || !ei.ayar || ei.model !== 'eleven_flash_v2_5' || !ei.sesId) {
      problems.push('ElevenLabs ses isteği yanlış: ' + JSON.stringify(eleven.istek));
    }
    if (eleven.okudu !== true) problems.push('ElevenLabs ile okuma başlamıyor');
    const elYedek = eleven.yedek || {};
    if (!(elYedek.istekler || []).some((u) => /elevenlabs/.test(u)) ||
        !(elYedek.istekler || []).some((u) => /generateContent/.test(u)) || !elYedek.caliyor) {
      problems.push('ElevenLabs hatası Gemini yedeğine düşmüyor: ' + JSON.stringify(eleven.yedek));
    }
    if (eleven.anahtarsiz !== true || eleven.anahtarsizIstek) {
      problems.push('anahtarsız seslendirme ElevenLabs\'i çağırıyor: ' + JSON.stringify([eleven.anahtarsiz, eleven.anahtarsizIstek]));
    }
    setTimeout(() => { beklenenSesYedegi = false; }, 500);

    if (asst.hata) problems.push('asistan testi: ' + asst.hata);
    if ((asst.eksik || []).length) problems.push('eksik asistan arayüzü: ' + asst.eksik.join(', '));
    if (!asst.sekmeVar) problems.push('asistan sekmesi yok ya da gizli');
    if (!/^Asistan/.test(String(asst.sekmeAd || ''))) problems.push('asistan sekmesi etiketi yanlış: ' + asst.sekmeAd);
    if (!asst.panel) problems.push('asistan paneli açılmıyor');
    if (!asst.digerGizli) problems.push('asistan sekmesi diğer panelleri gizlemiyor');
    if (asst.tab !== 'asistan') problems.push('asistan sekmesi etkin değil: ' + asst.tab);
    if (!asst.varsayilan || asst.varsayilan.sleepEvery !== 7 || asst.varsayilan.sleepLen !== 60 ||
        asst.varsayilan.sleepOn !== true || asst.varsayilan.face !== 'varsayilan') {
      problems.push('asistan varsayılanları yanlış: ' + JSON.stringify(asst.varsayilan));
    }
    if (asst.alanEvery !== '7' || asst.alanLen !== '60' || !asst.alanOn) {
      problems.push('uyku alanları yanlış: ' + JSON.stringify([asst.alanEvery, asst.alanLen, asst.alanOn]));
    }
    if ((asst.hazirYuzler || []).join(',') !== 'varsayilan,mutlu,uykucu,saskin,kurnaz,robot') {
      problems.push('hazır yüzler eksik: ' + (asst.hazirYuzler || []).join(','));
    }
    if (!/px$/.test(String(asst.onizleme.goz || '')) || !/px$/.test(String(asst.onizleme.agiz || '')) ||
        !/px$/.test(String(asst.onizleme.kavis || ''))) {
      problems.push('yüz önizlemesi çizilmiyor: ' + JSON.stringify(asst.onizleme));
    }
    if (!asst.kayitUyku || asst.kayitUyku.sleepEvery !== 25 || asst.kayitUyku.sleepLen !== 120 ||
        asst.kayitUyku.sleepOn !== false) {
      problems.push('uyku ayarları kaydedilmiyor: ' + JSON.stringify(asst.kayitUyku));
    }
    if (asst.yenidenEvery !== '25' || asst.yenidenLen !== '120' || asst.yenidenOn) {
      problems.push('uyku alanları yeniden açılmıyor: ' + JSON.stringify([asst.yenidenEvery, asst.yenidenLen, asst.yenidenOn]));
    }
    if (Math.abs(parseFloat(asst.taslakGoz) - 7 * (76 / 64) * 1.4) > 0.2) {
      problems.push('tasarım önizlemesi değişmiyor: ' + asst.taslakGoz);
    }
    if (Math.abs(parseFloat(asst.taslakKavis) - 12 * (76 / 64)) > 0.2) {
      problems.push('tasarım önizleme kavisi güncellenmiyor: ' + asst.taslakKavis);
    }
    if (asst.kayitliYuz !== 1 || asst.kayitliAd !== 'Deneme') {
      problems.push('yüz kaydedilmiyor: ' + JSON.stringify([asst.kayitliYuz, asst.kayitliAd]));
    }
    if (!/^ozel:/.test(String(asst.aktifYuz || ''))) problems.push('kaydedilen yüz hemen kullanılmıyor: ' + asst.aktifYuz);
    if (!asst.kartAktif) problems.push('kaydedilen yüz kartı çizilmiyor/işaretlenmiyor');
    if (!/Kullan|In use/.test(String(asst.kullaniliyor || ''))) problems.push('aktif yüz etiketi yok: ' + asst.kullaniliyor);
    const pay = asst.payload || {};
    if (pay.sleepOn !== false || pay.sleepEvery !== 25 || pay.sleepLen !== 120) {
      problems.push('topa giden asistan ayarları yanlış: ' + JSON.stringify(pay));
    }
    const pf = pay.face || {};
    if (Math.abs(Number(pf.eyeSize) - 1.4) > 0.001 || Number(pf.eyeGap) !== 15 || Number(pf.mouthW) !== 21 ||
        Number(pf.mouthCurve) !== 12 || pf.eyeColor !== '#0a6b52' || pf.mouthColor !== '#7a1f8c') {
      problems.push('tasarlanan yüz ayarlara geçmiyor: ' + JSON.stringify(pf));
    }
    if (asst.saskin !== 'saskin' || !asst.saskinYuvarlak) {
      problems.push('hazır yüz seçilemiyor: ' + JSON.stringify([asst.saskin, asst.saskinYuvarlak]));
    }
    if (!asst.saskinKart) problems.push('seçili hazır yüz kartı işaretlenmiyor');
    /* --- sesli asistan: yalnızca AI sesler --- */
    const vs = asst.sesVarsayilan || {};
    if (vs.on !== false || vs.engine !== 'gemini' || vs.gvoice !== 'mix' || vs.gender !== 'kadin') {
      problems.push('sesli asistan varsayılanları yanlış: ' + JSON.stringify(vs));
    }
    const vs2 = asst.ses || {};
    if (vs2.on !== true || vs2.gvoice !== 'Vindemiatrix' || vs2.engine !== 'gemini') {
      problems.push('AI ses seçimi uygulanmıyor: ' + JSON.stringify(vs2));
    }
    if (!asst.sesKayit || asst.sesKayit.on !== true || asst.sesKayit.gvoice !== 'Vindemiatrix') {
      problems.push('AI ses seçimi kaydedilmiyor: ' + JSON.stringify(asst.sesKayit));
    }
    if (!asst.sistemYok) problems.push('sistem sesi alanları hâlâ arayüzde');
    if ((asst.aiSecenek || []).length < 10) problems.push('AI ses listesi eksik: ' + (asst.aiSecenek || []).length);
    if (!/Gemini sesleri \(yedek\)/.test(String(asst.aiEtiket || ''))) problems.push('“Gemini sesleri (yedek)” etiketi yok: ' + asst.aiEtiket);
    if (asst.sesOkudu !== true || asst.sesKapaliOkumaz !== false) {
      problems.push('sesli okuma açık/kapalı davranmıyor: ' + JSON.stringify([asst.sesOkudu, asst.sesKapaliOkumaz]));
    }
    if (asst.silinen !== 0 || asst.donus !== 'varsayilan') {
      problems.push('yüz silinemiyor ya da aktif yüz geri dönmüyor: ' + JSON.stringify([asst.silinen, asst.donus]));
    }

    /* Top kapatılınca uygulama “orbing” durumundan çıkmalı: asistan aynı
       tuşla/tepsiyle yeniden çağrılabilmeli. */
    await win.webContents.executeJavaScript('(document.body.classList.add("orbing"), 1)');
    win.webContents.send('ball:closed');
    await new Promise((r) => setTimeout(r, 220));
    const closed = await win.webContents.executeJavaScript(
      '({ orbing: document.body.classList.contains("orbing"), appGizli: document.getElementById("app").hidden })');
    if (closed.orbing) problems.push('top kapatılınca uygulama “orbing” durumunda kalıyor (asistan yeniden çağrılamaz)');
    const recall = await win.webContents.executeJavaScript(`(async () => {
      const eski = desktop; let istek = null;
      desktop = () => ({ openBall: (p) => { istek = p; return Promise.resolve({ ok: true }); } });
      sendToBall({ summon: true });
      await new Promise((r) => setTimeout(r, 700));
      desktop = eski;
      const out = { cagrildi: !!istek, summon: !!(istek && istek.summon) };
      document.body.classList.remove('orbing');
      document.getElementById('app').style.animation = 'none';
      return out;
    })()`);
    if (!recall.cagrildi) problems.push('asistan kapatıldıktan sonra yeniden çağrılamıyor');
    if (!recall.summon) problems.push('yeniden çağrı “summon” olarak gitmiyor');

    /* --- kota bitince otomatik anahtar değiştirme: gerçek akış yolu --- */
    const fail = await win.webContents.executeJavaScript(`(async () => {
      const out = {};
      const eskiFetch = window.fetch;
      const eskiApis = slots().slice();
      const eskiAktif = settings.activeApiId;
      const eskiProvider = settings.provider;
      const calls = [];
      try {
        settings.apis = [
          { sid: 'fa', provider: 'gemini', key: 'k1', model: 'gemini-2.0-flash' },
          { sid: 'fb', provider: 'gemini', key: 'k2', model: 'gemini-2.0-flash' }
        ];
        settings.activeApiId = 'fa';
        settings.provider = 'gemini';
        window.fetch = async (url, opts) => {
          const key = (opts && opts.headers && opts.headers['x-goog-api-key']) || '';
          calls.push(key);
          if (key === 'k1') {
            return new Response(JSON.stringify({ error: { message: 'You exceeded your current quota' } }),
              { status: 429, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'merhaba dünya' }] } }] }) + String.fromCharCode(10, 10),
            { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
        };
        let text = '';
        await streamReply([{ role: 'user', content: 'selam' }], (d) => { text += d; });
        out.text = text;
        out.aktif = settings.activeApiId;
        out.eskiIsaret = slotUsedUp(slotById('fa'));
        out.yeniTemiz = !slotUsedUp(slotById('fb'));
        out.cagri = calls;
      } catch (e) { out.hata = e.message; }
      window.fetch = eskiFetch;
      settings.apis = eskiApis;
      settings.activeApiId = eskiAktif;
      settings.provider = eskiProvider;
      persist();
      return out;
    })()`);
    if (fail.hata) problems.push('kota geçişi hata verdi: ' + fail.hata);
    if (fail.text !== 'merhaba dünya') problems.push('kota sonrası yanıt alınamadı: ' + JSON.stringify(fail.text));
    if (fail.aktif !== 'fb') problems.push('kota bitince etkin anahtar değişmedi: ' + fail.aktif);
    if (!fail.eskiIsaret) problems.push('kota biten anahtar işaretlenmedi');
    if (!fail.yeniTemiz) problems.push('yeni anahtar yanlışlıkla işaretlendi');
    if ((fail.cagri || []).join(',') !== 'k1,k2') problems.push('istek yeni anahtarla yeniden denenmedi: ' + (fail.cagri || []).join(','));

    /* --- beklenen sonuçlar --- */
    const u = result.util || {};
    if (result.missingUi && result.missingUi.length) problems.push('eksik arayüz: ' + result.missingUi.join(', '));
    if (!result.desktopFlag) problems.push('PRIME_DESKTOP köprüsü açılmamış');
    /* Kodlama modu tamamen kaldırıldı: arayüzü, köprüsü ve işlevleri geri gelmemeli. */
    if ((result.uiGone || []).length) problems.push('kaldırılan kodlama arayüzü hâlâ var: ' + result.uiGone.join(', '));
    if ((result.brGone || []).length) problems.push('dosya sistemi köprüsü hâlâ açık: ' + result.brGone.join(', '));
    if ((result.fnGone || []).length) problems.push('kodlama işlevleri hâlâ yüklü: ' + result.fnGone.join(', '));
    if ((result.bridgeKeys || []).join(',') !== 'activityGet,activitySet,ballAccessory,ballAsk,ballColor,ballCommit,ballDictate,ballDrag,ballDragEnd,ballDragStart,ballFinish,ballHide,ballLayout,ballListen,ballPartial,ballReturn,ballSay,ballSpeak,ballSpeaking,ballStream,ballVoice,ballWander,captureScreen,closeShortcut,findVideo,isDesktop,onActivity,onBallAccessory,onBallAsk,onBallClosed,onBallColor,onBallCommit,onBallCursor,onBallDictate,onBallFinish,onBallInit,onBallListen,onBallPartial,onBallPos,onBallReset,onBallReturned,onBallSay,onBallShake,onBallSpeak,onBallSpeaking,onBallStream,onSummonBall,onVoiceToggle,openBall,openCameraCaptures,openExternalUrl,openShortcut,pickShortcut,platform,quitApp,runShellCommand,saveCameraCapture,systemSpeak,systemSpeakStop,version,videoPlayerUrl') {
      problems.push('köprü beklenmeyen anahtarlar taşıyor: ' + (result.bridgeKeys || []).join(','));
    }
    if (!/frame-src[^;]*http:\/\/127\.0\.0\.1/.test(String(result.cspText || ''))) {
      problems.push('CSP yerel oynatıcı adresine izin vermiyor');
    }
    if (!result.csp) problems.push('CSP meta etiketi yok');
    if (!result.logoRendered) problems.push('açılış logosu çizilmemiş');
    if (result.emoji !== 'Merhaba dünya!') {
      problems.push('asistan metninden emoji temizlenmiyor: ' + JSON.stringify(result.emoji));
    }
    /* Kota bitince sıradaki kullanılmamış anahtar seçilmeli. */
    const af = u.apiFail || {};
    if (af.next !== 'b') problems.push('kota bitince sıradaki anahtar seçilmiyor: ' + JSON.stringify(af.next));
    if (!af.bosAtlanir) problems.push('hazır anahtar kalmayınca yanlış kayda geçiyor');
    if (!af.kullanildi) problems.push('kota biten anahtar işaretlenmiyor');
    if (JSON.stringify(af.kota) !== JSON.stringify([true, true, true, false])) {
      problems.push('kota/limit hatası tanınmıyor: ' + JSON.stringify(af.kota));
    }
    if (!result.svgIconCount) problems.push('SVG simgeleri yok');

    /* --- video kartı ve yeni sohbet logosu --- */
    const v = result.video || {};
    if (v.radius !== '16px') problems.push('video kartı stili yüklenmemiş: ' + v.radius);
    const lg = v.logoDuman || {};
    if (!lg.bagli) problems.push('yeni sohbet logosuna tıklama bağlanmamış (bindApp)');
    if (!lg.logoVar) problems.push('yeni sohbet logosunun SVG’si çizilmemiş');
    if (!(lg.duman > 4)) problems.push('logodan duman çıkmıyor: ' + lg.duman);
    if (!/shake/.test(String(lg.sinif)) || !/hot/.test(String(lg.sinif))) {
      problems.push('logo titreme/kızarma sınıfı almamış: ' + lg.sinif);
    }
    if (lg.anim !== 'logoShake') problems.push('logo titremiyor: ' + lg.anim);
    if (lg.renk !== 'rgb(255, 106, 61)') problems.push('logo kızarmıyor: ' + lg.renk);
    if (String(lg.katman) !== '0' || String(lg.logoKatman) !== '1') {
      problems.push('duman logonun arkasında değil: ' + lg.katman + '/' + lg.logoKatman);
    }

    /* --- masaüstü topu: renk, aksesuar, menü, uyku, yüz ve çağrı --- */
    const bt = await runBallTests();
    (bt.problems || []).forEach((p) => problems.push(String(p)));
    const b1 = bt.first || {}, b2 = bt.second || {}, b3 = bt.third || {};
    const b3l = bt.thirdLive || {}, b3c = bt.thirdCommit || {}, b4 = bt.fourth || {};
    const b5 = bt.fifth || {}, b6 = bt.sixth || {}, b7 = bt.seventh || {};
    const bResume = bt.resume || {}, bSumStart = bt.summonStart || {}, bSumEnd = bt.summonEnd || {};
    const bOff = bt.sleepOff || {}, bSeen = bt.seen || {};
    if (!b1.kanca) problems.push('top betiği yüklenmiyor');
    if (b1.durum !== 'ball') problems.push('top ilk durumu yanlış: ' + b1.durum);
    if (b1.renkler !== 9) problems.push('menüde 9 renk yok: ' + b1.renkler);
    if ((b1.renkAdlari || []).length !== 9) problems.push('renk adları eksik: ' + (b1.renkAdlari || []).length);
    if ((b1.ilkOlcu || []).join(',') !== '84,84') problems.push('top penceresi 84x84 değil: ' + (b1.ilkOlcu || []).join('x'));
    if (!b1.yaziGizli || !b1.balonGizli || !b1.uykuYok) problems.push('top ilk açılışta paneller kapalı değil');
    if (b1.renk !== 'mavi') problems.push('top rengi ayarlardan gelmiyor: ' + b1.renk);
    if (!/Type something/.test(String(b1.yer))) problems.push('yazma yeri İngilizce değil: ' + b1.yer);
    if (!/Back to app/.test(String(b1.geri))) problems.push('menü dönüş metni İngilizce değil: ' + b1.geri);
    if (!b1.micVar) problems.push('topun köşesinde mikrofon düğmesi yok');
    if (!b1.askMicVar) problems.push('topun yazma kutusunda mikrofon düğmesi yok');
    if (b1.okumaDugmesi) problems.push('topta sohbet eylemleri/sesli okuma düğmesi var');
    const bc = b1.uykuCfg || {};
    if (!bc.on || bc.every !== 3 || bc.len !== 30) problems.push('uyku ayarları topa geçmiyor: ' + JSON.stringify(bc));
    const by = b1.yuz || {};
    if (by.gap !== '14px') problems.push('göz aralığı topa geçmiyor: ' + by.gap);
    if (by.gozC !== 'rgb(18, 52, 86)') problems.push('göz rengi topa geçmiyor: ' + by.gozC);
    if (by.agizC !== 'rgb(101, 67, 33)') problems.push('ağız rengi topa geçmiyor: ' + by.agizC);
    if (b1.accDugmeleri !== 7) problems.push('menüde 7 aksesuar düğmesi yok: ' + b1.accDugmeleri);
    if (!b1.accAdlari || !/Glasses/.test(b1.accAdlari) || !/Cowboy hat/.test(b1.accAdlari) ||
        !/King crown/.test(b1.accAdlari) || !/Face mask/.test(b1.accAdlari)) {
      problems.push('aksesuar adları eksik/İngilizce değil: ' + b1.accAdlari);
    }
    if (b1.accBaslangic !== 'kovboy') problems.push('ayarlardaki aksesuar topa geçmiyor: ' + b1.accBaslangic);
    if (b1.accKatmanBaslangic !== 'block') problems.push('aksesuar katmanı çizilmiyor: ' + b1.accKatmanBaslangic);
    if (!b1.baktiSol || !b1.baktiSag || !b1.baktiYukari) problems.push('top bakış yönlerine dönmüyor');
    if (!b1.varsayilanMutlu) problems.push('top varsayılan olarak gülümsemiyor');
    if (b1.acik !== 'ask') problems.push('yazma kutusu açılmıyor: ' + b1.acik);
    if ((b1.acikOlcu || []).join(',') !== '320,150') problems.push('yazma kutusu ölçüsü yanlış: ' + (b1.acikOlcu || []).join('x'));
    if (!/none/.test(String(b1.menuGizli))) problems.push('menü kapalıyken görünüyor: ' + b1.menuGizli);
    if (b1.soruRenk !== 0) problems.push('yazma kutusunda renk seçici var');
    if (b1.renkSonra !== 'kirmizi' || b1.renkAttr !== 'kirmizi') problems.push('renk değişmiyor: ' + b1.renkSonra);
    if (b1.renkBasili !== 'true') problems.push('seçili renk işaretlenmiyor');
    if (!/gradient/.test(String(b1.renkDegrade))) problems.push('top rengi degradeye yansımıyor');
    if (!b1.kutuKapandi || b1.soruDurum !== 'speech') problems.push('yazılan soru kapanıp balona geçmiyor');
    if (String(b1.girisBos) !== '') problems.push('yazma yeri gönderimden sonra temizlenmiyor');
    if (b1.gecmis !== 0) problems.push('konuşma balonunda geçmiş listesi var');
    if (!b1.dusunuyor || b1.noktalar !== 1) problems.push('düşünme göstergesi çıkmıyor');
    if (!(Number(b1.dusunmeHalkasi) > 0)) problems.push('düşünme halkası yanmıyor: ' + b1.dusunmeHalkasi);
    if (!b2.titriyor || b2.titremeAnim !== 'orbShake') problems.push('erişim komutunda top titremiyor: ' + b2.titremeAnim);
    if (!/Merhaba, dünya/.test(String(b2.yanit))) problems.push('akan yanıt balonda birleşmiyor: ' + b2.yanit);
    if (b2.noktalarSonra !== 0 || !b2.dusunmeBitti) problems.push('yanıt gelince düşünme göstergesi kapanmıyor');
    if (!b2.konusuyor || b2.agizAnim !== 'orbTalk') problems.push('top yanıt verirken konuşmuyor: ' + b2.agizAnim);
    if (/none/.test(String(b2.balonGorunur))) problems.push('cevap balonu açılmıyor: ' + b2.balonGorunur);
    if ((b2.balonOlcu || []).join(',') !== '348,246') problems.push('cevap balonu ölçüsü yanlış: ' + (b2.balonOlcu || []).join('x'));
    if (!b2.konusmaBitti) problems.push('konuşma animasyonu bitmiyor');
    if (b2.menuDurum !== 'menu' || !b2.menuGorunur) problems.push('sağ tık menüsü açılmıyor: ' + b2.menuDurum);
    if (!/Back to app/.test(String(b2.menuDon))) problems.push('menü dönüş etiketi İngilizce değil: ' + b2.menuDon);
    if (b2.menuRenkler !== 9) problems.push('menüde renkler yok: ' + b2.menuRenkler);
    if ((b2.menuOlcu || []).join(',') !== '248,330') problems.push('menü ölçüsü aksesuarlara uymuyor: ' + (b2.menuOlcu || []).join('x'));
    if (b2.menuAccs !== 7) problems.push('menüde aksesuar düğmeleri yok: ' + b2.menuAccs);
    if (b2.menuIlkAcc !== 'kovboy') problems.push('menü açılınca takılı aksesuar işaretli değil: ' + b2.menuIlkAcc);
    if (b2.accSonra !== 'tac') problems.push('menüden aksesuar takılmıyor: ' + b2.accSonra);
    if (b2.accKatman !== 'block') problems.push('menüden takılan aksesuar çizilmiyor: ' + b2.accKatman);
    if (b2.accBasili !== 'true' || b2.accDigerBasili !== 0) problems.push('aksesuar düğmesi işaretlenmiyor');
    /* Duygu: kaşlar + ağız metinden okunur, sırasıyla değişir. */
    if (b2.kasSayisi !== 2) problems.push('kaşlar çizilmiyor: ' + b2.kasSayisi);
    const md = b2.moodler || {};
    if (md.uzgun !== 'uzgun') problems.push('üzgün metni anlaşılmıyor: ' + md.uzgun);
    if (md.neseli !== 'neseli') problems.push('sevinc metni anlaşılmıyor: ' + md.neseli);
    if (md.kizgin !== 'kizgin') problems.push('kızgınlık metni anlaşılmıyor: ' + md.kizgin);
    if (md.saskin !== 'saskin') problems.push('şaşkınlık metni anlaşılmıyor: ' + md.saskin);
    if (md.bos !== '') problems.push('nötr metin duygu üretiyor: ' + md.bos);
    if (md.karisik !== 'neseli') problems.push('aynı metindeki son duygu kazanmıyor: ' + md.karisik);
    if (md.ters !== 'uzgun') problems.push('metin sırasına göre duygu değişmiyor: ' + md.ters);
    if (b2.akanMood !== 'neseli') problems.push('akan yanıttan duygu okunmuyor: ' + b2.akanMood);
    const mu = b2.moodUzgun || {}, mn = b2.moodNeseli || {};
    if (mu.key !== 'uzgun') problems.push('üzgün duygusu uygulanmıyor: ' + mu.key);
    if (!(parseFloat(mu.agiz) > 0.5)) problems.push('üzgünken ağız aşağı kıvrılmıyor: ' + mu.agiz);
    if (!(parseFloat(mu.agizAlt) < 0.5)) problems.push('üzgünken eski gülümseme kalkmıyor: ' + mu.agizAlt);
    if (!mu.bas || mu.bas === 'none') problems.push('üzgünken kaşlar hareket etmiyor: ' + mu.bas);
    if (!mn.bas || mn.bas === mu.bas) problems.push('mutluyken kaşlar değişmiyor: ' + mn.bas);
    if (!(parseFloat(mn.agiz) > 0.5)) problems.push('mutluyken gülümseme geri gelmiyor: ' + mn.agiz);
    if (mn.key !== 'neseli') problems.push('mutlu duygusu uygulanmıyor: ' + mn.key);
    if (!/\.6s|600ms/.test(String(b2.basGecis))) problems.push('kaş geçişi yavaş değil: ' + b2.basGecis);
    if ((b2.moodSira || []).join(',') !== 'uzgun,neseli') {
      problems.push('aynı metindeki duygular sıraya konmuyor: ' + (b2.moodSira || []).join(','));
    }
    if (b2.moodIlk !== 'uzgun') problems.push('çok duygulu metinde ilk duygu uygulanmıyor: ' + b2.moodIlk);
    if (b2.moodSon !== 'neseli') problems.push('ikinci duyguya geçilmiyor: ' + b2.moodSon);
    if ((b2.moodGorulen || []).join(',') !== 'uzgun,neseli') {
      problems.push('duygular sırayla gösterilmiyor: ' + (b2.moodGorulen || []).join(','));
    }
    if (b2.menuTasma) problems.push('menü içeriği aksesuarlarla taşıyor');
    const accCizim = b2.accCizim || {};
    const accAdlari = { gozluk: 'gözlük', kovboy: 'kovboy şapkası', sapka: 'şapka', maske: 'siyah maske', tac: 'kral tacı', agiz: 'ağız maskesi' };
    for (const key of Object.keys(accAdlari)) {
      const c = accCizim[key] || {};
      const once = c.once || [0, 0];
      const sonra = c.sonra || [0, 0];
      if (!(once[0] > 0 && once[1] > 0) && !(sonra[0] > 0 && sonra[1] > 0)) {
        problems.push(accAdlari[key] + ' çizilmiyor: ' + JSON.stringify(c));
      }
      if ((c.katman || [0, 0])[0] < 20) problems.push(accAdlari[key] + ' katmanı boyanmıyor: ' + (c.katman || []).join('x'));
    }
    /* Şapkalar kafaya oturmalı ve büyük olmalı: tepe topun üstünden başlar,
       kenar/bant geniş ve başın üstüne değer (arada boşluk kalmaz). */
    const ss = (k) => accCizim[k] || {};
    if (!(ss('kovboy').onceUst <= 0) || !(ss('kovboy').sonra[0] >= 46)) {
      problems.push('kovboy şapkası büyük/kafada değil: ' + JSON.stringify(ss('kovboy')));
    }
    if (!(ss('sapka').onceUst <= 0) || !(ss('sapka').sonra[0] >= 24)) {
      problems.push('şapka büyük/kafada değil: ' + JSON.stringify(ss('sapka')));
    }
    if (!(ss('tac').onceUst <= -4) || !(ss('tac').sonra[0] >= 34)) {
      problems.push('taç büyük/kafada değil: ' + JSON.stringify(ss('tac')));
    }
    /* Siyah gözlük mavi modelin aynısı: iki ayrı siyah cam + köprü + iki sap. */
    const sp = (b2.accParca && b2.accParca.maske) || [];
    if (!(ss('maske').once[0] >= 13) || !(ss('maske').sonra[0] >= 13)) {
      problems.push('siyah gözlük iki cam değil: ' + JSON.stringify(ss('maske')));
    }
    if (Math.abs((ss('maske').once[0] || 0) - (ss('gozluk').once[0] || 0)) > 0.6 ||
        Math.abs((ss('maske').onceUst || 0) - (ss('gozluk').onceUst || 0)) > 0.6) {
      problems.push('siyah gözlük mavi gözlüğe benzemiyor: ' + JSON.stringify([ss('maske'), ss('gozluk')]));
    }
    if (!/rgb\(5, 7, 10\)/.test(String(ss('maske').kenar))) {
      problems.push('siyah gözlük çerçevesi siyah değil: ' + ss('maske').kenar);
    }
    if (sp.length < 3) problems.push('siyah gözlük köprü/sapları yok: ' + JSON.stringify(sp));
    /* Mavi gözlük iki ayrı cam + köprü ve iki saptan oluşur. */
    const gp = (b2.accParca && b2.accParca.gozluk) || [];
    if (!(ss('gozluk').once[0] >= 13) || !(ss('gozluk').sonra[0] >= 13)) {
      problems.push('mavi gözlük iki cam değil: ' + JSON.stringify(ss('gozluk')));
    }
    if (gp.length < 3) problems.push('gözlük köprüsü/sapları yok: ' + JSON.stringify(gp));
    if (!(b2.accParca && (b2.accParca.sapka || []).length) ||
        !(b2.accParca && (b2.accParca.kovboy || []).length)) {
      problems.push('şapka detayları çizilmiyor: ' + JSON.stringify(b2.accParca));
    }
    /* Konuşurken ağız da duyguya uyar: şaşkın “o”, kızgın düz, üzgün aşağı. */
    const ak = b2.agizKonus || {}, kk = b2.kasKonus || {};
    if (!ak.saskin || ak.saskin.yuk !== 0 || !/^50%/.test(String(ak.saskin.yuvarlak)) || !(ak.saskin.h >= 9)) {
      problems.push('şaşkın konuşurken ağız yuvarlak değil: ' + JSON.stringify(ak.saskin));
    }
    if (!ak.kizgin || !(ak.kizgin.yuk >= 2) || !/^0px/.test(String(ak.kizgin.yuvarlak))) {
      problems.push('kızgın konuşurken ağız düz değil: ' + JSON.stringify(ak.kizgin));
    }
    if (!ak.uzgun || !(ak.uzgun.yuk >= 4) || !/14px/.test(String(ak.uzgun.yuvarlak))) {
      problems.push('üzgün konuşurken ağız aşağı kıvrık değil: ' + JSON.stringify(ak.uzgun));
    }
    if (!kk.saskin || kk.saskin === kk.kizgin || kk.kizgin === kk.uzgun) {
      problems.push('duyguya göre kaşlar farklılaşmıyor: ' + JSON.stringify(kk));
    }
    /* Fare takibi, kendiliğinden sohbet ve emojisiz metin. */
    if (b2.gazeOnce || b2.gazeBasladi !== true || !b2.gazeSinif) {
      problems.push('fareyi takip başlamıyor: ' + JSON.stringify([b2.gazeOnce, b2.gazeBasladi, b2.gazeSinif]));
    }
    if (!(Number.parseFloat(b2.gazeX) >= 6)) problems.push('yüz sağdaki fareye dönmüyor: ' + b2.gazeX);
    if (!(Number.parseFloat(b2.gazeY) <= -3)) problems.push('yüz yukarıdaki fareye dönmüyor: ' + b2.gazeY);
    if (!(Number.parseFloat(b2.gazeR) >= 8)) problems.push('fare takibinde yüz açısı yok: ' + b2.gazeR);
    if (b2.gazeBitti || b2.gazeSinifSon) problems.push('fare takibi kapanmıyor');
    /* Sesli okurken ağız hareket eder, bitince durur. */
    if (!b2.konusuyorSinif || !/orbSpeak/.test(String(b2.agizSesAnim))) {
      problems.push('sesli okurken ağız hareket etmiyor: ' + JSON.stringify([b2.konusuyorSinif, b2.agizSesAnim]));
    }
    if (b2.konusuyorBitti) problems.push('ses bitince ağız durmuyor');
    /* Aksesuar yüze takılı: aynı transform + bakışa göre duruş. */
    if (!b2.accLook || b2.accLook === 'none' || b2.accLook !== b2.yuzLook) {
      problems.push('aksesuar yüzle aynı yöne dönmüyor: ' + JSON.stringify([b2.accLook, b2.yuzLook]));
    }
    if (!(Math.abs(Number.parseFloat(b2.durusRotate)) >= 2)) {
      problems.push('etrafa bakarken duruş yatmıyor: ' + b2.durusRotate);
    }
    if (!/px/.test(String(b2.durusTranslate || '')) || /^0px( 0px)?$/.test(String(b2.durusTranslate || '').trim())) {
      problems.push('etrafa bakarken top yana kaymıyor: ' + b2.durusTranslate);
    }
    if (!b2.accGaze || b2.accGaze === 'none' || b2.accGaze === b2.accLookSon) {
      problems.push('fareye bakarken aksesuar kaymıyor: ' + JSON.stringify([b2.accGaze, b2.accLookSon]));
    }
    if (!(Math.abs(Number.parseFloat(b2.durusGaze)) >= 2)) {
      problems.push('fareye bakarken duruş değişmiyor: ' + b2.durusGaze);
    }
    /* Kendiliğinden sorular artık kullanılan uygulamadan söz eder; yalnızca
       PRIME AI'da ne yapıldığını sormaz. */
    if (!(b2.sohbetSatir >= 2)) {
      problems.push('kendiliğinden cümleler eksik: ' + b2.sohbetSatir);
    }
    if (b2.sohbetSayac) {
      problems.push('kendiliğinden cümlelerde tuş/tıklama sayacı var: ' + JSON.stringify(b2.sohbetSayac));
    }
    if (!b2.sohbetTakil) {
      problems.push('kendiliğinden sorularda takılan dil yok: ' + JSON.stringify(b2.sohbetMetni));
    }
    if (!b2.sohbetUygulama || b2.sohbetPrime !== 0) {
      problems.push('kendiliğinden cümlelerde gerçek uygulama yok: ' +
        JSON.stringify([b2.sohbetUygulama, b2.sohbetPrime]));
    }
    if (!b2.etkinlik || !Array.isArray(b2.etkinlik.apps) || b2.etkinlik.apps[0].label !== 'Chrome') {
      problems.push('top bilgisayar etkinliğini almıyor: ' + JSON.stringify(b2.etkinlik));
    }
    if (!/Chrome|YouTube/.test(String(b2.sohbetMetni)) || b2.sohbetDurum !== 'speech' || !b2.sohbetGorunur) {
      problems.push('kendiliğinden sohbet görünmüyor: ' + JSON.stringify([b2.sohbetMetni, b2.sohbetDurum, b2.sohbetGorunur]));
    }
    if (b2.sohbetKapandi !== 'ball') problems.push('kendiliğinden sohbet kapanmıyor: ' + b2.sohbetKapandi);
    if (!b2.emojiYok) problems.push('asistan metninde emoji görünüyor: ' + b2.yanit);
    if (b2.emojiMood !== 'uzgun') problems.push('emoji duygu sinyali olarak okunmuyor: ' + b2.emojiMood);
    if (/😄|🎉/.test(String(b2.strip))) problems.push('emoji temizleme çalışmıyor: ' + b2.strip);
    if (!/again|Sure/.test(String(b2.donIlk))) problems.push('“Uygulamaya dön” iki basış istemiyor: ' + b2.donIlk);
    if (!b2.donArmed) problems.push('dönüş düğmesi ilk basışta hazırlanmıyor');
    if (b2.tikDurum !== 'ask') problems.push('sol tık yazma kutusunu açmıyor: ' + b2.tikDurum);
    if (!/none/.test(String(b2.tikMenu))) problems.push('sol tık menüyü kapatmıyor: ' + b2.tikMenu);
    if (b2.tikRenk !== 0) problems.push('yazma kutusunda renk seçici geri gelmiş');
    if (!b2.bedtime || !b2.yorgun) problems.push('uyku hazırlığı başlamıyor');
    if (!/bay bay|bye/i.test(String(b2.veda))) problems.push('uyku veda metni yok: ' + b2.veda);
    if (b2.govdeUykuAnim !== 'orbBedtime') problems.push('yorulma animasyonu yok: ' + b2.govdeUykuAnim);
    if (!b2.esyandi || b2.esnemeAgiz !== 'orbYawn') problems.push('esneme animasyonu yok: ' + b2.esnemeAgiz);
    if (!b2.yatti || !(Number(b2.yatak) > 0.4)) problems.push('top yatağa yatmıyor: ' + b2.yatak);
    if (b2.yatmaAnim !== 'orbLie') problems.push('yatma animasyonu yok: ' + b2.yatmaAnim);
    if (!b2.uyudu) problems.push('top uyumuyor');
    if (!/z/i.test(String(b2.zMetni)) || b2.zAnim !== 'zFloat' || !/px$/.test(String(b2.zBoyut))) {
      problems.push('uyku “z”leri çizilmiyor: ' + JSON.stringify([b2.zMetni, b2.zAnim, b2.zBoyut]));
    }
    if ((b2.uykuOlcu || []).join(',') !== '210,210') problems.push('uyku penceresi ölçüsü yanlış: ' + (b2.uykuOlcu || []).join('x'));
    if (b2.uykuAnim !== 'orbSleep') problems.push('uyku animasyonu yok: ' + b2.uykuAnim);
    if (!(Number(b2.yorgan) > 0.4)) problems.push('yorgan topun üstünü örtmüyor: ' + b2.yorgan);
    if (!b2.uyandi || b2.zTemiz !== 0) problems.push('uyanma olmuyor ya da “z”ler temizlenmiyor');
    if (b2.uyanmaAnim !== 'orbWake') problems.push('uyanma animasyonu yok: ' + b2.uyanmaAnim);
    if (!b2.uyanmaBitti || !b2.uyanmaSonra) problems.push('uyanma sonrası top mutlu değil');
    if (!(Number(b2.yatakSon) < 0.1)) problems.push('uyanınca yatak kaybolmuyor: ' + b2.yatakSon);
    if ((b2.panellerKapali || []).some((d) => !/none/.test(String(d)))) problems.push('uyanınca paneller kapalı değil: ' + (b2.panellerKapali || []).join('|'));
    if (b2.yeniden !== 'ask') problems.push('mikrofon düğmesi yazma kutusunu açmıyor: ' + b2.yeniden);
    if (!b2.titremeBitti) problems.push('titreme sınıfı temizlenmiyor');
    if (!b3.dinliyor) problems.push('dinleme göstergesi yanmıyor');
    if (!b2.micVar || !b3.micVar || !b3.askMicVar) {
      problems.push('topun mikrofon düğmeleri yok: ' + JSON.stringify([b2.micVar, b3.micVar, b3.askMicVar]));
    }
    if (!(Number(b3.halka) > 0)) problems.push('dinleme halkası görünmüyor: ' + b3.halka);
    if (/none/.test(String(b3.durdurma))) problems.push('dinlemeyi durdurma düğmesi yok');
    if (b3l.yazi !== 'Canlı yazı' || !b3l.canli || b3l.sorular !== 0) {
      problems.push('canlı ara metin yazma kutusuna yazılmıyor: ' + JSON.stringify(b3l));
    }
    /* Gönderim komutu yazı alanını kapatır, dinleme göstergesi geri gelir. */
    if (b3c.durum !== 'ball' || String(b3c.yazi) !== '' || b3c.canli || !b3c.yaziGizli || !b3c.dinliyor) {
      problems.push('gönderim komutu yazı alanını kapatmıyor: ' + JSON.stringify(b3c));
    }
    if (b4.yazi !== 'Sesle gelen metin' || b4.durum !== 'ask') problems.push('sesle yazma metni kutuya gelmiyor: ' + JSON.stringify(b4));
    if (!b4.odak) problems.push('sesle yazma kutuya odaklanmıyor');
    if (!/none/.test(String(b4.durdurma)) || b4.dinliyor) problems.push('dinleme bitince gösterge kapanmıyor');
    if (b5.durum !== 'speech' || !b5.dusunuyor || b5.noktalar !== 1) problems.push('sessizlikten gelen metin soru olmuyor: ' + JSON.stringify(b5));
    if (String(b5.yazi) !== '' || !b5.soruGorunur) problems.push('sessizlik sorusu balonda görünmüyor');
    if (b6.yazi !== 'Devam eden cümle' || !b6.canli || !b6.gorunur) problems.push('ara metin balonun üstünde görünmüyor: ' + JSON.stringify(b6));
    if (b6.durum !== 'speech') problems.push('ara metin cevap durumunu bozuyor: ' + b6.durum);
    /* Dinlerken gelen soru doğrudan gönderilir; canlı yazı temizlenir. */
    if (b7.durum !== 'speech' || b7.canli || b7.gorunur) problems.push('dinlerken gelen soru gönderilmiyor: ' + JSON.stringify(b7));
    const bLastAsk = (bSeen.ask || [])[(bSeen.ask || []).length - 1] || {};
    if (bLastAsk.text !== 'Canlı metinden sonra') problems.push('dinlerken gelen soru uygulamaya ulaşmıyor: ' + bLastAsk.text);
    if (bResume.durum !== 'ask' || bResume.canli || !bResume.yaziGorunur) problems.push('yanıt bitince top yazma durumuna dönmüyor: ' + JSON.stringify(bResume));
    if (!bResume.dinliyor) problems.push('yanıt bitince dinleme geri gelmiyor');
    if (!bResume.yanitGizli) problems.push('yanıt bitince balon kapanmıyor');
    if (!bSumStart.anim || !bSumStart.close) problems.push('asistan çağrısında büyüme/kapatma yok: ' + JSON.stringify(bSumStart));
    if (!/Kapat/.test(String(bSumStart.kapatma))) problems.push('çağrıda kapatma düğmesi başlığı yok: ' + bSumStart.kapatma);
    if (!bSumEnd.guluyor || bSumEnd.anim) problems.push('çağrı sonrası top gülümsemiyor: ' + JSON.stringify(bSumEnd));
    if (!/Kanka neler soracan|Chrome|YouTube/.test(String(bSumEnd.yazi))) {
      problems.push('çağrı karşılaması yok: ' + bSumEnd.yazi);
    }
    if (bt.closeSent !== 1) problems.push('kapat düğmesi topu gizlemiyor: ' + bt.closeSent);
    if (!bOff.cfg || bOff.cfg.on !== false || bOff.cfg.every !== 9 || bOff.cfg.len !== 45) {
      problems.push('uyku kapatma topa geçmiyor: ' + JSON.stringify(bOff.cfg));
    }
    if (!bOff.uyumadi) problems.push('uyku kapalıyken top uyuyor');
    if ((bOff.yuz || {}).gap !== '12px' || (bOff.yuz || {}).kavis !== '0px' ||
        !(bOff.yuz || {}).yuvarlak || (bOff.yuz || {}).gozR !== '20%') {
      problems.push('yüz ayarları topa geçmiyor: ' + JSON.stringify(bOff.yuz));
    }
    if (!bOff.yenidenCfg || bOff.yenidenCfg.on !== true || bOff.yenidenCfg.every !== 2 || bOff.yenidenCfg.len !== 15) {
      problems.push('uyku ayarları çalışırken değiştirilemiyor: ' + JSON.stringify(bOff.yenidenCfg));
    }
    if (!(bSeen.color || []).includes('kirmizi')) problems.push('renk seçimi uygulamaya bildirilmiyor');
    if ((bSeen.acc || []).join(',') !== 'tac') problems.push('aksesuar seçimi uygulamaya bildirilmiyor: ' + (bSeen.acc || []).join(','));
    if ((bSeen.ask || []).length < 3) problems.push('top soruları uygulamaya iletmiyor: ' + (bSeen.ask || []).length);
    if (!(bSeen.layout || []).includes('ask') || !(bSeen.layout || []).includes('menu')) problems.push('top pencere ölçüsü bildirilmiyor');
    if (!(bSeen.wander > 0)) problems.push('top boşta dolanmıyor');
    if (!(bSeen.dragStart > 0) || !(bSeen.drag > 0) || !(bSeen.dragEnd > 0) || bSeen.dragEnd !== bSeen.dragStart) {
      problems.push('top sürüklenemiyor: ' + JSON.stringify([bSeen.dragStart, bSeen.drag, bSeen.dragEnd]));
    }
    if (bSeen.ret !== 1) problems.push('“Uygulamaya dön” bir kez çalışmıyor: ' + bSeen.ret);
    if (bSeen.hide !== 1) problems.push('topu gizleme bir kez gönderilmiyor: ' + bSeen.hide);
    if (bSeen.voice < 2) problems.push('topun mikrofon düğmeleri sesle yazmayı açmıyor: ' + bSeen.voice);
    if (!(bSeen.speak > 0)) problems.push('topun selamı seslendirilmiyor');

    console.log('SMOKE_RESULT ' + JSON.stringify({ result, cam, asst, ball: bt, problems }, null, 2));
    console.log(problems.length ? 'SMOKE_FAIL ' + problems.length : 'SMOKE_OK');
    app.exit(problems.length ? 1 : 0);
  } catch (err) {
    console.error('SMOKE_HATA ' + ((err && err.stack) || err));
    app.exit(1);
  }
});
