/* PRIME AI — Electron ana süreç
   Uygulama, localStorage'ın güvenilir çalışması için file:// yerine
   app:// özel şeması üzerinden sunulur.
   PRIME AI yalnızca sohbet uygulamasıdır: dosya sistemine yazmaz.
   Masaüstü topu ayrı, çerçevesiz ve saydam bir penceredir; boyutu içeriğe göre
   değişir, top ekranda hep aynı noktada kalır. */
'use strict';

const { app, BrowserWindow, protocol, net, shell, Menu, Tray, nativeImage, ipcMain, screen, dialog, session, desktopCapturer, globalShortcut } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const { pathToFileURL } = require('node:url');
const { execFile } = require('node:child_process');
const { findVideo } = require('./youtube');

const ROOT = path.join(__dirname, '..');
const HOST = 'prime';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
  }
]);

/* --------------------------- gerçek video arama --------------------------- */
/* Konu için YouTube'dan gerçek bir video seçilir. Anahtar gerekmez;
   ana süreçte çalıştığı için tarayıcı CORS engeli yoktur. */
ipcMain.handle('video:find', async (_e, query) => {
  try {
    const video = await findVideo(query);
    return { ok: true, video: video || null };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

/* ------------------------ erişim: uygulama ve klasör ------------------------ */
/* Kullanıcı Ayarlar → Erişim'den bir uygulama ya da klasör seçer ve ona isim
   verir. Top hâlindeyken "aç <isim>" / "kapat <isim>" yazınca buradaki yollar
   kullanılır. Seçim yalnızca işletim sisteminin kendi seçicisiyle yapılır;
   renderer dosya okuyup yazamaz. */
const ACCESS_BLOCKED = ['explorer.exe', 'winlogon.exe', 'csrss.exe', 'lsass.exe', 'services.exe',
  'svchost.exe', 'dwm.exe', 'wininit.exe', 'smss.exe', 'taskhostw.exe', 'sihost.exe',
  'ctfmon.exe', 'fontdrvhost.exe'];

/* PowerShell, hedefi ve kendi exe yolunu ortam değişkeninden okur; böylece
   yol içindeki tırnak/boşluk komut enjeksiyonuna dönüşmez. */
const ACCESS_CLOSE_PS = [
  '$ErrorActionPreference = "SilentlyContinue"',
  '$target = $env:PRIME_TARGET',
  'if ($target -like "*.lnk") { try { $sh = New-Object -ComObject WScript.Shell; $t = $sh.CreateShortcut($target).TargetPath; if ($t) { $target = $t } } catch {} }',
  '$name = [System.IO.Path]::GetFileName($target)',
  '$blocked = @("' + ACCESS_BLOCKED.join('","') + '")',
  'if ($blocked -contains $name.ToLower()) { Write-Output "PRIME_BLOCKED"; exit 0 }',
  '$p = @(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and ($_.ExecutablePath -ieq $target) -and ($_.ExecutablePath -ine $env:PRIME_SELF) })',
  'if (-not $p.Count) { Write-Output "PRIME_NONE"; exit 0 }',
  'foreach ($x in $p) { Stop-Process -Id $x.ProcessId -Force }',
  'Write-Output ("PRIME_KILLED " + $p.Count)'
].join('; ');

function runPowerShell(script, env) {
  return new Promise((resolve) => {
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { env: Object.assign({}, process.env, env || {}), windowsHide: true, timeout: 15000 },
      (err, stdout, stderr) => resolve({ err, stdout: String(stdout || ''), stderr: String(stderr || '') }));
  });
}

function shakeBall(ms) {
  if (!ballWin || ballWin.isDestroyed() || !ballWin.isVisible()) return;
  ballWin.webContents.send('ball:shake', { ms: Math.max(400, Number(ms) || 1500) });
}

/* ------------------------ yedek seslendirme ------------------------ */
/* Gemini TTS kotası dolduğunda (429) ya da internetsizken asistan sessiz
   kalmasın: Windows'un kendi konuşma sesiyle okunur. Birincil ses hâlâ
   Gemini'dir; bu yalnızca yedektir. */
let speechProc = null;
let speechSeq = 0;
let voiceCache = null;

function stopSystemSpeech() {
  if (!speechProc) return;
  const child = speechProc;
  speechProc = null;
  try { child.kill(); } catch { /* zaten bitmiş */ }
}

/* Kurulu Windows sesleri: Türkçe varsa önce o, sonra cinsiyete uygun ses. */
function systemVoices() {
  if (voiceCache) return voiceCache;
  voiceCache = new Promise((resolve) => {
    const ps = [
      '$ErrorActionPreference = "SilentlyContinue"',
      'Add-Type -AssemblyName System.Speech',
      '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
      '$s.GetInstalledVoices() | ForEach-Object { $i = $_.VoiceInfo; $i.Name + "|" + $i.Culture.Name + "|" + $i.Gender }',
      '$s.Dispose()'
    ].join('; ');
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { windowsHide: true, timeout: 12000 }, (err, stdout) => {
        const list = String(stdout || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
          const [name, culture, gender] = l.split('|');
          return { name: name || '', culture: culture || '', gender: gender || '' };
        }).filter((v) => v.name);
        resolve(list);
      });
  });
  return voiceCache;
}

function pickSystemVoice(voices, gender) {
  const list = Array.isArray(voices) ? voices : [];
  if (!list.length) return '';
  const tr = list.filter((v) => /^tr/i.test(v.culture));
  const istenen = gender === 'erkek' ? 'Male' : 'Female';
  /* Önce Türkçe + istenen cinsiyet, yoksa o cinsiyette herhangi bir ses,
     yoksa Türkçe ses. Cinsiyet, uygulamada seçilen AI sesinden gelir. */
  const uygunTr = tr.find((v) => v.gender === istenen);
  if (uygunTr) return uygunTr.name;
  const uygun = list.find((v) => v.gender === istenen);
  if (uygun) return uygun.name;
  return (tr[0] || list[0]).name;
}

ipcMain.handle('tts:say', async (event, data) => {
  const fromApp = appWin && event.sender === appWin.webContents;
  if (!fromApp) return { ok: false, error: 'unknown sender' };
  const text = String((data && data.text) || '').replace(/\s+/g, ' ').trim().slice(0, 700);
  if (!text) return { ok: false, error: 'empty' };
  stopSystemSpeech();
  const seq = ++speechSeq;
  const volume = Math.max(10, Math.min(100, Math.round((Number(data && data.volume) || 1) * 100)));
  const rate = Math.max(-6, Math.min(6, Math.round(((Number(data && data.rate) || 1) - 1) * 8)));
  const voices = await systemVoices();
  const voice = pickSystemVoice(voices, String((data && data.gender) || 'kadin'));
  const ps = [
    '$ErrorActionPreference = "Stop"',
    'Add-Type -AssemblyName System.Speech',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    '$s.Volume = ' + volume,
    '$s.Rate = ' + rate,
    'if ($env:PRIME_TTS_VOICE) { try { $s.SelectVoice($env:PRIME_TTS_VOICE) } catch {} }',
    '$s.Speak($env:PRIME_TTS_TEXT)',
    '$s.Dispose()'
  ].join('; ');
  return new Promise((resolve) => {
    const t0 = Date.now();
    let child;
    try {
      child = execFile('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
        windowsHide: true,
        timeout: 60000,
        maxBuffer: 1024 * 1024,
        env: Object.assign({}, process.env, { PRIME_TTS_TEXT: text, PRIME_TTS_VOICE: voice || '' })
      }, (err, stdout, stderr) => {
        if (speechProc === child) speechProc = null;
        if (seq !== speechSeq) { resolve({ ok: false, interrupted: true }); return; }
        resolve({
          ok: !err,
          voice,
          ms: Date.now() - t0,
          error: err ? String((stderr || err.message || '').slice(0, 200)) : ''
        });
      });
    } catch (err) {
      resolve({ ok: false, error: String((err && err.message) || err) });
      return;
    }
    speechProc = child;
  });
});

ipcMain.handle('tts:stop', (event) => {
  if (!appWin || event.sender !== appWin.webContents) return { ok: false };
  speechSeq += 1;
  stopSystemSpeech();
  return { ok: true };
});

/* --------------------- sesle yazma (yalnızca top) --------------------- */
/* Bas-konuş (global tuş) kaldırıldı: mikrofon yalnızca topun mikrofon
   düğmesiyle açılır; ana süreç yalnızca top aktifliğini bildirir. */

function ballIsActive() {
  return !!(ballWin && !ballWin.isDestroyed() && ballWin.isVisible());
}

/* Topun mikrofon düğmesi → uygulama kaydı açar/kapatır. */
ipcMain.on('ball:voice', (event) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  if (appWin && !appWin.isDestroyed()) appWin.webContents.send('voice:toggle', { target: 'ball' });
});

ipcMain.on('ball:listen', (event, on) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (ballWin && !ballWin.isDestroyed()) ballWin.webContents.send('ball:listen', !!on);
});

ipcMain.on('ball:dictate', (event, text) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (ballWin && !ballWin.isDestroyed()) ballWin.webContents.send('ball:dictate', String(text || ''));
});

/* Topun kendi cümlesi (selam) uygulamanın sesiyle okunur. */
ipcMain.on('ball:speak', (event, payload) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  if (!appWin || appWin.isDestroyed()) return;
  const text = String((payload && payload.text) || '').trim();
  if (!text) return;
  appWin.webContents.send('ball:speak', text);
});

/* Sesli okuma başladı/bitti: topun ağzı sesle birlikte oynar. */
ipcMain.on('ball:speaking', (event, on) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (ballWin && !ballWin.isDestroyed()) ballWin.webContents.send('ball:speaking', !!on);
});

/* Topta sessizlikten sonra yazıya çevrilen metin doğrudan soru olur. */
ipcMain.on('ball:say', (event, payload) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (ballWin && !ballWin.isDestroyed()) {
    ballWin.webContents.send('ball:say', String((payload && payload.text) || ''));
  }
});

/* Konuşma sürerken gelen ara metin: balonda yazılır, gönderilmez. */
ipcMain.on('ball:partial', (event, payload) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (ballWin && !ballWin.isDestroyed()) {
    ballWin.webContents.send('ball:partial', String((payload && payload.text) || ''));
  }
});

/* "bitir / ilet": yazı alanı hemen kapanır, dinleme göstergesi geri gelir. */
ipcMain.on('ball:commit', (event) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (ballWin && !ballWin.isDestroyed()) ballWin.webContents.send('ball:commit');
});

ipcMain.handle('shortcut:pick', async (event, kind) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const folder = kind === 'folder';
  try {
    const res = await dialog.showOpenDialog(win, {
      title: folder ? 'Klasör seç' : 'Uygulama seç',
      buttonLabel: 'Seç',
      properties: folder ? ['openDirectory'] : ['openFile'],
      filters: folder ? undefined : [
        { name: 'Uygulamalar', extensions: ['exe', 'lnk', 'bat', 'cmd', 'com'] },
        { name: 'Tüm dosyalar', extensions: ['*'] }
      ]
    });
    if (res.canceled || !res.filePaths.length) return { ok: false, canceled: true };
    const file = res.filePaths[0];
    return {
      ok: true, path: file, kind: folder ? 'folder' : 'app',
      name: path.basename(file, folder ? '' : path.extname(file))
    };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

ipcMain.handle('shortcut:open', async (event, data) => {
  const target = String((data && data.path) || '').trim();
  if (!target) return { ok: false, error: 'empty' };
  shakeBall(1600);
  try {
    const problem = await shell.openPath(target);
    if (problem) return { ok: false, error: problem };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

ipcMain.handle('shortcut:close', async (event, data) => {
  const target = String((data && data.path) || '').trim();
  if (!target) return { ok: false, error: 'empty' };
  shakeBall(1600);
  const { err, stdout } = await runPowerShell(ACCESS_CLOSE_PS, {
    PRIME_TARGET: target, PRIME_SELF: process.execPath
  });
  const line = String(stdout || '').trim().split(/\r?\n/).pop() || '';
  if (line.startsWith('PRIME_KILLED')) return { ok: true, closed: Number(line.split(' ')[1]) || 1 };
  if (line === 'PRIME_NONE') return { ok: false, error: 'not-running' };
  if (line === 'PRIME_BLOCKED') return { ok: false, error: 'blocked' };
  return { ok: false, error: (err && err.message) || 'failed' };
});

/* Ekran/pencere görüntüsü: asistan açılan uygulamaya bakabilsin diye.
   match verilirse pencere adında geçen kaynak, yoksa tam ekran seçilir. */
ipcMain.handle('screen:capture', async (event, data) => {
  const match = String((data && data.match) || '').toLowerCase().trim();
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 1280, height: 720 },
      fetchWindowIcons: false
    });
    let pick = null;
    if (match) {
      pick = sources.find((s) => s.id.startsWith('window:') && String(s.name || '').toLowerCase().includes(match)) || null;
    }
    if (!pick) pick = sources.find((s) => s.id.startsWith('screen:')) || sources[0] || null;
    if (!pick) return { ok: false, error: 'no-source' };
    const dataUrl = pick.thumbnail && typeof pick.thumbnail.toDataURL === 'function' ? pick.thumbnail.toDataURL() : '';
    if (!dataUrl || dataUrl.length < 32) return { ok: false, error: 'empty' };
    return { ok: true, name: String(pick.name || ''), dataUrl };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

/* Bir URL aç: asistan "şunu da aç" dediğinde varsayılan tarayıcıda açılır. */
ipcMain.handle('app:open-url', async (event, data) => {
  const url = String((data && data.url) || '').trim();
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: 'invalid-url' };
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

/* Üretilen komutu çalıştır — yalnızca kullanıcı onayladıktan sonra çağrılır. */
ipcMain.handle('app:run-command', async (event, data) => {
  const cmd = String((data && data.command) || '').trim();
  if (!cmd) return { ok: false, error: 'empty' };
  if (cmd.length > 4000) return { ok: false, error: 'too-long' };
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const file = isWin ? 'powershell' : 'sh';
    const args = isWin ? ['-NoProfile', '-NonInteractive', '-Command', cmd] : ['-c', cmd];
    execFile(file, args, { windowsHide: true, timeout: 25000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        error: err ? String((err && err.message) || err) : '',
        stdout: String(stdout || '').slice(0, 4000),
        stderr: String(stderr || '').slice(0, 1500)
      });
    });
  });
});

/* ---------------- kamera yakalamaları ---------------- */
/* Kamerada insan görülen kareler hem uygulamada hem bu klasörde tutulur;
   kullanıcı görselleri buradan kopyalayabilir. */
function camCaptureDir(kind) {
  let base = '';
  try { base = app.getPath('pictures'); } catch { base = ''; }
  if (!base) base = app.getPath('userData');
  return path.join(base, 'PRIME AI', kind === 'absence' ? 'Yokluk' : 'Kamera Yakalamalari');
}

ipcMain.handle('cam:save-capture', async (_e, data) => {
  const url = String((data && data.dataUrl) || '');
  const m = url.match(/^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return { ok: false, error: 'invalid-image' };
  const kind = data && data.kind === 'absence' ? 'absence' : 'capture';
  const dir = camCaptureDir(kind);
  const at = Number(data && data.at) || Date.now();
  const d = new Date(at);
  const p = (n) => String(n).padStart(2, '0');
  const tag = kind === 'absence' ? '_yokluk' : ((data && data.same) ? '_yaratici' : '_taninmayan');
  const name = (kind === 'absence' ? 'yokluk-' : 'kamera-') + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' +
    p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds()) + '-' +
    String(d.getMilliseconds()).padStart(3, '0') + tag + '.jpg';
  try {
    await fs.mkdir(dir, { recursive: true });
    const full = path.join(dir, name);
    await fs.writeFile(full, Buffer.from(m[1].replace(/\s+/g, ''), 'base64'));
    return { ok: true, path: full, dir };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

ipcMain.handle('cam:open-captures', async (_e, data) => {
  const dir = camCaptureDir(data && data.kind === 'absence' ? 'absence' : 'capture');
  try {
    await fs.mkdir(dir, { recursive: true });
    const err = await shell.openPath(dir);
    return err ? { ok: false, error: err } : { ok: true, dir };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

/* Uygulamayı kapat: kamera güvenlik uyarısının geri sayımı bitince çağrılır. */
ipcMain.handle('app:quit', () => {
  setTimeout(() => app.quit(), 60);
  return { ok: true };
});

/* --------------------------------- pencere -------------------------------- */
function resolveTarget(requestUrl) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(requestUrl).pathname || '/');
  } catch {
    return null;
  }
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(ROOT, rel));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

let appWin = null;          // ana uygulama penceresi
let ballWin = null;         // masaüstü topu
let tray = null;            // gizli simge (sistem tepsisi)
let accountName = '';       // tepsi menüsünde görünen açık hesap
let isQuitting = false;     // kapanış gerçekten uygulamayı kapatıyor mu
let ballAnchor = null;      // topun ekrandaki merkezi (DIP) — boyut değişse de sabit kalır
let ballDragFrom = null;    // sürükleme başındaki merkez

/* Ölçüler ball.css ile birebir aynı olmalı. */
const BALL_SIZE = 64;       // topun çapı
const BALL_PAD = 10;        // pencere kenarı ile top arası
const BALL_STATES = {
  ball: { width: 84, height: 84 },
  sleep: { width: 210, height: 210 },   // yatak, yorgan ve z harfleri için yer
  ask: { width: 320, height: 150 },     // yalnızca yazma kutusu
  speech: { width: 348, height: 246 },  // ayrı cevap balonu
  menu: { width: 248, height: 330 }   // renkler + aksesuarlar
};
let wanderAnim = null;
let cursorFeed = null;      // fare konumunu topa yollar (ara sıra yüz fareye döner)
let ballState = 'ball';     // topun açık paneli: fare takibi yalnızca boştayken
let lastCursor = null;

const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

function workAreaAt(point) {
  const d = screen.getDisplayNearestPoint({ x: Math.round(point.x), y: Math.round(point.y) });
  return d.workArea;
}

function clampAnchor(point) {
  const wa = workAreaAt(point);
  const half = BALL_SIZE / 2 + BALL_PAD;
  return {
    x: clamp(point.x, wa.x + half, wa.x + wa.width - half),
    y: clamp(point.y, wa.y + half, wa.y + wa.height - half)
  };
}

/* Topun merkezi `anchor`; pencere boyutu büyüdükçe sola/yukarı açılır. */
function boundsFor(anchor, size) {
  const wa = workAreaAt(anchor);
  const x = Math.round(anchor.x - (size.width - BALL_PAD - BALL_SIZE / 2));
  const y = Math.round(anchor.y - (size.height - BALL_PAD - BALL_SIZE / 2));
  return {
    x: clamp(x, wa.x, wa.x + wa.width - size.width),
    y: clamp(y, wa.y, wa.y + wa.height - size.height),
    width: size.width,
    height: size.height
  };
}

function anchorFromBounds(bounds) {
  return {
    x: bounds.x + bounds.width - BALL_PAD - BALL_SIZE / 2,
    y: bounds.y + bounds.height - BALL_PAD - BALL_SIZE / 2
  };
}

function defaultAnchor() {
  const wa = screen.getPrimaryDisplay().workArea;
  return { x: wa.x + wa.width - BALL_PAD - BALL_SIZE / 2 - 14, y: wa.y + wa.height - BALL_PAD - BALL_SIZE / 2 - 14 };
}

function nudgeRepaint() {
  if (!ballWin || ballWin.isDestroyed()) return;
  try { ballWin.webContents.invalidate(); } catch { /* yok */ }
  setTimeout(() => {
    if (!ballWin || ballWin.isDestroyed()) return;
    try { ballWin.webContents.invalidate(); } catch { /* yok */ }
  }, 60);
}

function stopWander() {
  if (!wanderAnim) return;
  clearInterval(wanderAnim);
  wanderAnim = null;
}

/* Fare konumu beslemesi: topun merkezine göre dx/dy yollar. Yalnızca top
   görünür ve boşta (balon/menü kapalı) iken çalışır; renderer her güncellemeyi
   yalnızca kendi “bakış” anında kullanır, böylece hep fareye bakmaz. */
function startCursorFeed() {
  stopCursorFeed();
  cursorFeed = setInterval(() => {
    if (!ballWin || ballWin.isDestroyed() || !ballWin.isVisible()) return;
    if (ballState !== 'ball') return;
    let pt;
    try { pt = screen.getCursorScreenPoint(); } catch { return; }
    const b = ballWin.getBounds();
    const cx = b.x + b.width - BALL_PAD - BALL_SIZE / 2;
    const cy = b.y + b.height - BALL_PAD - BALL_SIZE / 2;
    const dx = Math.round(pt.x - cx);
    const dy = Math.round(pt.y - cy);
    if (lastCursor && lastCursor.dx === dx && lastCursor.dy === dy) return;
    lastCursor = { dx, dy };
    ballWin.webContents.send('ball:cursor', { dx, dy });
  }, 120);
}

function stopCursorFeed() {
  if (cursorFeed) {
    clearInterval(cursorFeed);
    cursorFeed = null;
  }
  lastCursor = null;
}

function applyBallBounds(state) {
  if (!ballWin || ballWin.isDestroyed()) return;
  stopWander();
  ballState = BALL_STATES[state] ? state : 'ball';
  const size = BALL_STATES[state] || BALL_STATES.ball;
  const bounds = boundsFor(ballAnchor, size);
  ballWin.setBounds(bounds);
  ballAnchor = anchorFromBounds(bounds);   // ekran kenarında kırpıldıysa gerçek konumu sakla
  /* Saydam pencerede boyut değişince eski karenin izleri kalabiliyor;
     tam yeniden çizim iste (hemen, bir de kare oturduktan sonra). */
  nudgeRepaint();
}

function createBallWindow() {
  const size = BALL_STATES.ball;
  const bounds = boundsFor(ballAnchor, size);
  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: size.width,
    height: size.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: 'PRIME AI',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadURL('app://' + HOST + '/ball.html');

  win.once('ready-to-show', () => win.showInactive());
  win.on('closed', () => { if (ballWin === win) { ballWin = null; stopCursorFeed(); } });

  /* Yalnızca kendi sayfasına izin ver. */
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());

  return win;
}

function showBall(payload) {
  const p = payload || {};
  stopWander();
  ballAnchor = clampAnchor(p.pos && Number.isFinite(p.pos.x) && Number.isFinite(p.pos.y) ? p.pos : defaultAnchor());
  if (ballWin && !ballWin.isDestroyed()) {
    applyBallBounds('ball');
    ballWin.webContents.send('ball:init', { color: p.color || 'gri', lang: p.lang || 'tr', summon: !!p.summon, assistant: p.assistant || null });
    ballWin.showInactive();
    startCursorFeed();
    return { ok: true, reused: true };
  }
  ballWin = createBallWindow();
  startCursorFeed();
  ballWin.webContents.once('did-finish-load', () => {
    if (!ballWin || ballWin.isDestroyed()) return;
    ballWin.webContents.send('ball:init', { color: p.color || 'gri', lang: p.lang || 'tr', summon: !!p.summon, assistant: p.assistant || null });
  });
  return { ok: true, reused: false };
}

function showApp() {
  if (!appWin || appWin.isDestroyed()) {
    appWin = createWindow();
    return;
  }
  if (appWin.isMinimized()) appWin.restore();
  appWin.show();
  appWin.focus();
}

/* Asistanı çağır: uygulama penceresinden ayarlarıyla açmasını ister;
   pencere yoksa varsayılanlarla topu gösterir. */
function summonBall() {
  if (appWin && !appWin.isDestroyed()) {
    appWin.webContents.send('ball:summon');
    return;
  }
  showBall({ summon: true });
}

/* Top kapatıldığında uygulamaya haber verilir: uygulama penceresi “orbing”
   durumunda kalırsa asistan aynı tuşla/tepsiyle bir daha çağrılamıyordu. */
function notifyBallClosed() {
  if (appWin && !appWin.isDestroyed()) appWin.webContents.send('ball:closed');
}

/* Genel kısayol (Ctrl+Shift+A): top kapalıysa çağırır, açıksa kapatır. */
function toggleBallHotkey() {
  if (ballIsActive()) {
    if (ballWin && !ballWin.isDestroyed()) {
      ballWin.hide();
      ballWin.webContents.send('ball:reset');
      notifyBallClosed();
    }
    return;
  }
  summonBall();
}

/* Tepsi menüsü: en üstte açık hesabın adı, altında uygulamayı aç ve
   asistanı çağır. Hesap değişince menü yeniden kurulur. */
function trayMenu() {
  return Menu.buildFromTemplate([
    { label: accountName || 'Oturum açılmadı', enabled: false },
    { type: 'separator' },
    { label: 'Uygulamayı aç', click: () => showApp() },
    { label: 'Asistanı çağır', click: () => summonBall() },
    { type: 'separator' },
    { label: 'Çıkış', click: () => { isQuitting = true; app.quit(); } }
  ]);
}

function refreshTrayMenu() {
  if (!tray || tray.isDestroyed()) return;
  tray.setContextMenu(trayMenu());
}

function createTray() {
  if (tray) return tray;
  /* Simge asar içinden okunur: doğrudan yol bazı ortamlarda boş dönebilir. */
  const iconPath = path.join(ROOT, 'build', 'icon.png');
  let icon = nativeImage.createEmpty();
  try {
    icon = nativeImage.createFromBuffer(fsSync.readFileSync(iconPath));
  } catch {
    icon = nativeImage.createFromPath(iconPath);
  }
  if (!icon.isEmpty()) icon = icon.resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('PRIME AI');
  refreshTrayMenu();
  tray.on('click', () => showApp());
  tray.on('double-click', () => showApp());
  return tray;
}

function returnToApp() {
  if (ballWin && !ballWin.isDestroyed()) {
    ballWin.hide();
    ballWin.webContents.send('ball:reset');
  }
  if (appWin && !appWin.isDestroyed()) {
    if (appWin.isMinimized()) appWin.restore();
    appWin.show();
    appWin.focus();
    appWin.webContents.send('ball:returned');
  }
}

/* Topa gelen istek uygulamaya, uygulamanın yanıtı topa aktarılır. */
/* Arayüz açık hesabı bildirir; tepsi menüsü anında güncellenir. */
ipcMain.on('app:account-name', (_e, name) => {
  const next = String(name || '').trim().slice(0, 64);
  if (next === accountName) return;
  accountName = next;
  refreshTrayMenu();
});

ipcMain.handle('ball:open', (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) appWin = win;
  const result = showBall(payload);
  if (appWin && !appWin.isDestroyed()) appWin.hide();
  return result;
});

ipcMain.on('ball:layout', (event, state) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  const next = ['ask', 'speech', 'menu', 'sleep'].includes(state) ? state : 'ball';
  applyBallBounds(next);
  if (next === 'ask') ballWin.focus();
});

ipcMain.on('ball:drag-start', (event) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  stopWander();
  ballDragFrom = { x: ballAnchor.x, y: ballAnchor.y };
});

/* Boşta dolanma: top hedefe yumuşakça kayar, sonunda konum hesaba yazılır.
   Dolanırken hep ekranın ALT şeridinde yürür (görev çubuğu üstünde). */
const WANDER_BAND = 130;                 // alttaki yürüme şeridinin yüksekliği
ipcMain.on('ball:wander', (event, delta) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  if (ballDragFrom) return;
  const dx = Number(delta && delta.dx) || 0;
  const dy = Number(delta && delta.dy) || 0;
  const start = { x: ballAnchor.x, y: ballAnchor.y };
  const dest = clampAnchor({ x: start.x + dx, y: start.y + dy });
  /* Alt şeride sabitle: hedef bu şeridin dışına çıkarsa içeri çekilir. */
  const wa = workAreaAt(dest);
  const half = BALL_SIZE / 2 + BALL_PAD;
  const alt = wa.y + wa.height - half;
  dest.y = clamp(dest.y, alt - WANDER_BAND, alt);
  if (Math.abs(dest.x - start.x) + Math.abs(dest.y - start.y) < 4) return;
  stopWander();
  const t0 = Date.now();
  /* Yavaş dolanma: mesafe arttıkça süre uzar, kısa adımlar bile acele etmez. */
  const dist = Math.hypot(dest.x - start.x, dest.y - start.y);
  const ms = Math.round(clamp(900 + dist * 9, 1400, 4200));
  wanderAnim = setInterval(() => {
    if (!ballWin || ballWin.isDestroyed()) { stopWander(); return; }
    const t = Math.min(1, (Date.now() - t0) / ms);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // ease-in-out
    ballAnchor = clampAnchor({ x: start.x + (dest.x - start.x) * e, y: start.y + (dest.y - start.y) * e });
    const b = ballWin.getBounds();
    ballWin.setBounds(boundsFor(ballAnchor, { width: b.width, height: b.height }));
    ballAnchor = anchorFromBounds(ballWin.getBounds());
    if (t >= 1) {
      stopWander();
      if (appWin && !appWin.isDestroyed()) appWin.webContents.send('ball:pos', { x: ballAnchor.x, y: ballAnchor.y });
    }
  }, 16);
});

ipcMain.on('ball:drag', (event, delta) => {
  if (!ballWin || !ballDragFrom || event.sender !== ballWin.webContents) return;
  const dx = Number(delta && delta.dx) || 0;
  const dy = Number(delta && delta.dy) || 0;
  ballAnchor = clampAnchor({ x: ballDragFrom.x + dx, y: ballDragFrom.y + dy });
  const b = ballWin.getBounds();
  ballWin.setBounds(boundsFor(ballAnchor, { width: b.width, height: b.height }));
  ballAnchor = anchorFromBounds(ballWin.getBounds());
});

ipcMain.on('ball:drag-end', (event) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  ballDragFrom = null;
  if (appWin && !appWin.isDestroyed()) appWin.webContents.send('ball:pos', { x: ballAnchor.x, y: ballAnchor.y });
});

ipcMain.on('ball:hide', (event) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  ballWin.hide();
  ballWin.webContents.send('ball:reset');
  notifyBallClosed();
});

ipcMain.on('ball:return', (event) => {
  /* Hem top (kullanıcı “Uygulamaya dön”) hem de uygulama penceresi
     (asistan “kendini kapat”) topu kapatabilir. */
  const fromBall = ballWin && event.sender === ballWin.webContents;
  const fromApp = appWin && event.sender === appWin.webContents;
  if (!fromBall && !fromApp) return;
  returnToApp();
});

ipcMain.on('ball:color', (event, color) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  if (appWin && !appWin.isDestroyed()) appWin.webContents.send('ball:color', String(color || ''));
});

/* Top menüsünden seçilen aksesuar uygulama ayarlarına yazılır. */
ipcMain.on('ball:accessory', (event, acc) => {
  if (!ballWin || event.sender !== ballWin.webContents) return;
  if (appWin && !appWin.isDestroyed()) appWin.webContents.send('ball:accessory', String(acc || ''));
});

ipcMain.handle('ball:ask', (event, data) => {
  if (!ballWin || event.sender !== ballWin.webContents) return { ok: false, error: 'unknown sender' };
  if (!appWin || appWin.isDestroyed()) return { ok: false, error: 'app closed' };
  const text = String((data && data.text) || '').trim();
  if (!text) return { ok: false, error: 'empty' };
  appWin.webContents.send('ball:ask', { id: String((data && data.id) || ''), text });
  return { ok: true };
});

ipcMain.on('ball:chunk', (event, data) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (!ballWin || ballWin.isDestroyed()) return;
  ballWin.webContents.send('ball:delta', { id: String((data && data.id) || ''), delta: String((data && data.delta) || '') });
});

ipcMain.on('ball:finish', (event, data) => {
  if (!appWin || event.sender !== appWin.webContents) return;
  if (!ballWin || ballWin.isDestroyed()) return;
  ballWin.webContents.send('ball:done', { id: String((data && data.id) || ''), error: String((data && data.error) || '') });
});

/* --------------------------------- pencere -------------------------------- */
function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 780,
    minHeight: 580,
    backgroundColor: '#000000',
    title: 'PRIME AI',
    icon: path.join(ROOT, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      /* Pencere topa küçültülünce gizlenir; yanıt akışı yine de durmadan aksın. */
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadURL('app://' + HOST + '/index.html');

  /* Dış bağlantılar (video, kaynak, API anahtarı sayfaları) sistem tarayıcısında açılır. */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://' + HOST)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  /* Kapat düğmesi uygulamayı kapatmaz: tepsiye küçültür, arka planda sürer. */
  win.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    win.hide();
    if (ballWin && !ballWin.isDestroyed()) ballWin.hide();
  });

  win.on('closed', () => {
    if (appWin === win) appWin = null;
    if (ballWin && !ballWin.isDestroyed()) ballWin.destroy();
    ballWin = null;
  });

  return win;
}

/* Tek örnek: PRIME AI zaten açıksa (tepside gizli ya da top hâlinde) ikinci bir
   kopya açılmaz; masaüstünden yeniden açınca var olan pencere öne gelir. */
const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    /* Top modundaysa uygulamaya dön; pencere tepside gizliyse göster. */
    if (ballIsActive()) returnToApp();
    else showApp();
  });
}

app.whenReady().then(() => {
  /* İkinci kopya: pencere, tepsi ve kısayol oluşturmadan çık. */
  if (!singleInstance) return;

  /* Mikrofon izni yalnızca uygulamanın kendi sayfalarına verilir; dış siteler isteyemez. */
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, cb) => {
    cb(permission === 'media' && !!wc && String(wc.getURL()).startsWith('app://' + HOST));
  });
  ses.setPermissionCheckHandler((wc, permission) => {
    return permission === 'media' && !!wc && String(wc.getURL()).startsWith('app://' + HOST);
  });

  protocol.handle('app', async (request) => {
    const file = resolveTarget(request.url);
    if (!file) return new Response('Forbidden', { status: 403 });
    try {
      return await net.fetch(pathToFileURL(file).toString());
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });

  Menu.setApplicationMenu(null);
  createTray();
  appWin = createWindow();

  /* Asistanı tek tuşla çağır/kapat: Ctrl+Shift+A (tuz kaydedilmez, kalıcıdır). */
  try {
    globalShortcut.register('CommandOrControl+Shift+A', toggleBallHotkey);
  } catch { /* kısayol alınamazsa tepsi menüsü yeterli */ }

  app.on('activate', () => showApp());
});

app.on('before-quit', () => {
  isQuitting = true;
  try { globalShortcut.unregisterAll(); } catch { /* yok */ }
  stopSystemSpeech();
});

app.on('window-all-closed', () => {
  /* Tepside çalışmaya devam eder; çıkış yalnızca tepsi menüsünden. */
  if (process.platform === 'darwin') return;
});
