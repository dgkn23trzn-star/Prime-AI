/* PRIME AI — preload köprüsü
   Renderer süreci Node'a erişemez. Açılan tek yetki: konu için gerçek video
   aramak (dosya sistemi ya da kabuk erişimi yoktur) ve masaüstü topu köprüsü. */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const path = require('node:path');

/* Sürüm, paketli uygulamada da doğru görünsün diye package.json'dan okunur. */
let version = '1.7.0';
try {
  version = require(path.join(__dirname, '..', 'package.json')).version || version;
} catch { /* paket yoksa varsayılan kalır */ }

/* Kanalları dinleyip aboneliği geri verir. */
function on(channel, cb) {
  if (typeof cb !== 'function') return () => {};
  const handler = (_e, data) => cb(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('PRIME_DESKTOP', {
  isDesktop: true,
  platform: process.platform,
  version,

  /* Konuyla ilgili gerçek videoyu bulur: { ok, video: {url,title,channel,thumb,...} }
     Arayüz dili verilir; video dili zorunlu değildir. */
  findVideo: (query, lang) => ipcRenderer.invoke('video:find', query, { lang }),

  /* Uygulama içi oynatıcı adresi: YouTube gömülü oynatıcı geçerli bir http
     kaynağı ister; app:// adresi "Hata 153" verir. Yerel sayfa bu açığı kapatır. */
  videoPlayerUrl: (id) => ipcRenderer.invoke('video:player-url', String(id || '')),

  /* ---------------- masaüstü topu ---------------- */
  /* ---------------- mikrofon / sesle yazma ---------------- */
  /* Topun mikrofon düğmesi: uygulamadaki kaydı açar/kapatır. */
  ballVoice: () => ipcRenderer.send('ball:voice'),
  ballListen: (on) => ipcRenderer.send('ball:listen', !!on),
  ballDictate: (text) => ipcRenderer.send('ball:dictate', String(text == null ? '' : text)),
  /* Sesli okuma açıkken topun ağzı hareket etsin diye durum bildirilir. */
  ballSpeaking: (on) => ipcRenderer.send('ball:speaking', !!on),
  onVoiceToggle: (cb) => on('voice:toggle', cb),
  /* Topun selamı da uygulamanın sesiyle okunsun. */
  ballSpeak: (text) => ipcRenderer.send('ball:speak', { text: String(text == null ? '' : text) }),
  onBallSpeak: (cb) => on('ball:speak', cb),
  /* Gemini sesi üretilemezse Windows sesiyle okunur (kotasız yedek). */
  systemSpeak: (opts) => ipcRenderer.invoke('tts:say', opts || {}),
  systemSpeakStop: () => ipcRenderer.invoke('tts:stop'),

  /* ---------------- bilgisayar etkinliği ---------------- */
  /* Hangi uygulamada ne yapıldığının özeti: uygulama, pencere başlığı,
     tıklama ve tuş SAYILARI. Tuşların içeriği hiçbir zaman okunmaz. */

  /* ---------------- erişim (uygulama / klasör) ---------------- */
  /* İşletim sisteminin seçicisini açar; seçilen yol ve önerilen isim döner. */
  pickShortcut: (kind) => ipcRenderer.invoke('shortcut:pick', kind === 'folder' ? 'folder' : 'app'),
  openShortcut: (path) => ipcRenderer.invoke('shortcut:open', { path: String(path || '') }),
  closeShortcut: (path) => ipcRenderer.invoke('shortcut:close', { path: String(path || '') }),
  /* Asistan yetenekleri: ekran görüntüsü, URL açma, onaylı komut çalıştırma. */
  captureScreen: (match) => ipcRenderer.invoke('screen:capture', { match: String(match || '') }),
  openExternalUrl: (url) => ipcRenderer.invoke('app:open-url', { url: String(url || '') }),
  runShellCommand: (command) => ipcRenderer.invoke('app:run-command', { command: String(command || '') }),
  /* Asistanı çağır (tepsi menüsü) ve topu gizle (kapat tuşu). */
  onSummonBall: (cb) => on('ball:summon', cb),
  ballHide: () => ipcRenderer.send('ball:hide'),

  /* Kamera yakalamaları: kareyi klasöre yazar ve o klasörü açar. */
  saveCameraCapture: (dataUrl, meta) => ipcRenderer.invoke('cam:save-capture', {
    dataUrl: String(dataUrl || ''),
    at: Number(meta && meta.at) || Date.now(),
    same: !!(meta && meta.same),
    kind: meta && meta.kind === 'absence' ? 'absence' : 'capture'
  }),
  openCameraCaptures: (kind) => ipcRenderer.invoke('cam:open-captures', {
    kind: kind === 'absence' ? 'absence' : 'capture'
  }),
  /* Kamera güvenlik uyarısı geri sayımı bitince uygulamayı kapatır. */
  quitApp: () => ipcRenderer.invoke('app:quit'),

  /* Uygulamayı topa küçültür: { color, pos, lang } */
  openBall: (payload) => ipcRenderer.invoke('ball:open', payload || {}),
  /* Top penceresinin boyutu duruma göre değişir: ball | bubble | menu */
  ballLayout: (state) => ipcRenderer.send('ball:layout', String(state || 'ball')),
  ballDragStart: () => ipcRenderer.send('ball:drag-start'),
  ballDrag: (dx, dy) => ipcRenderer.send('ball:drag', { dx: Number(dx) || 0, dy: Number(dy) || 0 }),
  ballDragEnd: () => ipcRenderer.send('ball:drag-end'),
  ballReturn: () => ipcRenderer.send('ball:return'),
  /* Boşta dolanma: top (dx, dy) kadar yumuşakça kayar. */
  ballWander: (dx, dy) => ipcRenderer.send('ball:wander', { dx: Number(dx) || 0, dy: Number(dy) || 0 }),
  ballColor: (color) => ipcRenderer.send('ball:color', String(color || '')),
  /* Top menüsünden seçilen aksesuar (gözlük, şapka, maske, taç…) */
  ballAccessory: (acc) => ipcRenderer.send('ball:accessory', String(acc || '')),
  /* Top → uygulama: soru ve yanıt akışı */
  ballAsk: (id, text) => ipcRenderer.invoke('ball:ask', { id: String(id || ''), text: String(text || '') }),
  ballStream: (id, delta) => ipcRenderer.send('ball:chunk', { id: String(id || ''), delta: String(delta == null ? '' : delta) }),
  ballFinish: (id, error) => ipcRenderer.send('ball:finish', { id: String(id || ''), error: String(error || '') }),
  /* Topta sessizlik sonrası yazıya çevrilen metni doğrudan soru olarak gönderir. */
  ballSay: (text) => ipcRenderer.send('ball:say', { text: String(text || '') }),
  /* Topta konuşma sürerken yazıya çevrilen ara metin (gönderilmez). */
  ballPartial: (text) => ipcRenderer.send('ball:partial', { text: String(text || '') }),
  /* Sesli komutla gönderim: top yazılan metni hemen kapatıp dinlemeye döner. */
  ballCommit: () => ipcRenderer.send('ball:commit'),

  /* Tepsi menüsünün üstünde görünen açık hesabın adı. */
  setAccountName: (name) => ipcRenderer.send('app:account-name', String(name == null ? '' : name)),

  /* Uygulama tarafı dinleyicileri */
  onBallAsk: (cb) => on('ball:ask', cb),
  onBallReturned: (cb) => on('ball:returned', cb),
  /* Top × ile ya da kısayolla kapatıldı: uygulama “orbing” durumundan çıkar,
     pencere gizli kalır; asistan aynı tuşla yeniden çağrılabilir. */
  onBallClosed: (cb) => on('ball:closed', cb),
  onBallColor: (cb) => on('ball:color', cb),
  onBallAccessory: (cb) => on('ball:accessory', cb),
  onBallPos: (cb) => on('ball:pos', cb),

  /* Top tarafı dinleyicileri */
  onBallInit: (cb) => on('ball:init', cb),
  onBallStream: (cb) => on('ball:delta', cb),
  onBallFinish: (cb) => on('ball:done', cb),
  onBallReset: (cb) => on('ball:reset', cb),
  /* Top bir uygulamayı açarken/kapatırken kısa süre titrer. */
  onBallShake: (cb) => on('ball:shake', cb),
  /* Fare konumu (topun merkezine göre dx/dy): yüz ara sıra fareye döner. */
  onBallCursor: (cb) => on('ball:cursor', cb),
  /* Mikrofon dinleme durumu ve yazıya çevrilen metin (top penceresi). */
  onBallListen: (cb) => on('ball:listen', cb),
  onBallDictate: (cb) => on('ball:dictate', cb),
  onBallSay: (cb) => on('ball:say', cb),
  onBallPartial: (cb) => on('ball:partial', cb),
  onBallCommit: (cb) => on('ball:commit', cb),
  /* Sesli okuma sürüyor mu: topun ağzı buna göre oynar. */
  onBallSpeaking: (cb) => on('ball:speaking', cb)
});
