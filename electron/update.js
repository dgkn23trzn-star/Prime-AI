/* PRIME AI — masaüstü güncellemesi
   Yeni sürüm bilgisi GitHub'daki update.json dosyasından okunur. Yeni sürüm
   varsa uygulama ortada, bulanık zeminli bir pencere açar; "Güncelle"
   denince kurulum dosyası arka planda indirilir, sessizce kurulur ve uygulama
   yeniden başlar.

   Bu modül yalnızca ana süreçte çalışır; renderer dosya indiremez. */

'use strict';

const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { URL } = require('node:url');

const REPO = 'dgkn23trzn-star/Prime-AI';

/* Sürüm bilgisi: depodaki main dalında duran küçük dosya. Yayın yaparken
   güncellenir, böylece eski sürümler yeni sürümü görür. */
const FEED_URL = process.env.PRIME_UPDATE_FEED ||
  'https://raw.githubusercontent.com/' + REPO + '/main/update.json';

/* Yalnızca bu adreslerden indirme yapılır: arayüzden gelen bir bağlantı
   başka bir yere yönlendirilirse indirme reddedilir. */
const FEED_HOSTS = ['raw.githubusercontent.com'];
const FILE_HOSTS = [
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com'
];

const MAX_FEED_BYTES = 256 * 1024;
const MIN_INSTALLER_BYTES = 1024 * 1024;          // 1 MB: HTML hata sayfası kurtulmaz
const MAX_INSTALLER_BYTES = 400 * 1024 * 1024;    // 400 MB üstü indirilmez

/* Testler yerel bir sunucu kullanabilsin diye açıkça istenirse izin verilir. */
function allowLocal() {
  return process.env.PRIME_UPDATE_ALLOW_LOCAL === '1';
}

function isLocalHost(host) {
  return allowLocal() && (host === '127.0.0.1' || host === 'localhost');
}

function hostAllowed(url, hosts) {
  const host = String(url.hostname || '').toLowerCase();
  return hosts.indexOf(host) !== -1 || isLocalHost(host);
}

/* Yönlendirmeleri izleyerek yanıt akışını verir (GitHub sürüm dosyaları
   başka bir alan adına yönlendirir). */
function requestStream(target, redirectsLeft, timeoutMs) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(target);
    } catch {
      reject(new Error('geçersiz adres'));
      return;
    }
    if (url.protocol !== 'https:' && !(allowLocal() && url.protocol === 'http:')) {
      reject(new Error('adres https olmalı'));
      return;
    }
    const mod = url.protocol === 'http:' ? http : https;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'PRIME-AI-Updater/1.0',
        Accept: '*/*',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      const code = Number(res.statusCode) || 0;
      if ([301, 302, 303, 307, 308].indexOf(code) !== -1 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) {
          reject(new Error('çok fazla yönlendirme'));
          return;
        }
        let next;
        try {
          next = new URL(res.headers.location, url).toString();
        } catch {
          reject(new Error('geçersiz yönlendirme'));
          return;
        }
        requestStream(next, redirectsLeft - 1, timeoutMs).then(resolve, reject);
        return;
      }
      resolve(res);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('zaman aşımı')));
    req.on('error', reject);
  });
}

async function fetchJson(target, timeoutMs) {
  const res = await requestStream(target, 4, timeoutMs);
  if (res.statusCode !== 200) {
    res.resume();
    throw new Error('HTTP ' + res.statusCode);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of res) {
    size += chunk.length;
    if (size > MAX_FEED_BYTES) {
      res.destroy();
      throw new Error('sürüm dosyası çok büyük');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('sürüm dosyası okunamadı');
  }
}

/* "1.10.0" > "1.9.9" — sayı sayı karşılaştırılır; "-beta" gibi ek yok sayılır. */
function versionParts(value) {
  return String(value == null ? '' : value)
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((part) => {
      const n = parseInt(part, 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    });
}

function compareVersions(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const x = left[i] || 0;
    const y = right[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/* İndirilecek dosyanın gerçekten bu depoya ait bir .exe olduğunu doğrular. */
function assertInstallerUrl(value) {
  let url;
  try {
    url = new URL(String(value || ''));
  } catch {
    throw new Error('indirme adresi geçersiz');
  }
  if (url.protocol !== 'https:' && !(allowLocal() && url.protocol === 'http:')) {
    throw new Error('indirme adresi https olmalı');
  }
  if (!hostAllowed(url, FILE_HOSTS)) {
    throw new Error('indirme adresi bu depoya ait değil');
  }
  if (!/\.exe$/i.test(url.pathname)) {
    throw new Error('güncelleme dosyası .exe olmalı');
  }
  return url;
}

function notesOf(entry) {
  if (!Array.isArray(entry.notes)) return [];
  return entry.notes.map((note) => String(note)).filter(Boolean).slice(0, 6);
}

/* Sürüm bilgisini okur ve yüklü sürümle karşılaştırır.
   { ok, current, latest, hasUpdate, notes, url, page, date } ya da { ok:false, error } */
async function checkForUpdate(currentVersion, options) {
  const opts = options || {};
  const feedUrl = opts.feedUrl || FEED_URL;
  try {
    const url = new URL(feedUrl);
    if (!hostAllowed(url, FEED_HOSTS)) throw new Error('sürüm adresi bu depoya ait değil');
    const feed = await fetchJson(url.toString(), Number(opts.timeoutMs) || 12000);
    const entry = feed && feed.desktop;
    if (!entry || typeof entry !== 'object') throw new Error('sürüm bilgisinde masaüstü kaydı yok');
    const latest = String(entry.version || '').trim();
    if (!/^\d+(\.\d+)*$/.test(latest)) throw new Error('sürüm numarası geçersiz');
    const hasUpdate = compareVersions(latest, currentVersion) > 0;
    let download = '';
    if (hasUpdate) download = assertInstallerUrl(entry.url).toString();
    return {
      ok: true,
      current: String(currentVersion || ''),
      latest,
      hasUpdate,
      notes: notesOf(entry),
      url: download,
      page: /^https:\/\/github\.com\//i.test(String(entry.page || '')) ? String(entry.page) : '',
      date: String(entry.date || '')
    };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

/* Kurulum dosyasını indirir. onProgress({ received, total, pct }) aralıklarla çağrılır. */
async function downloadUpdate(downloadUrl, destDir, onProgress, options) {
  const opts = options || {};
  let url;
  try {
    url = assertInstallerUrl(downloadUrl);
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
  const name = path.basename(url.pathname).replace(/[^\w.\-]/g, '_') || 'PRIME-AI-Setup.exe';
  const finalPath = path.join(destDir, name);
  const partPath = finalPath + '.part';

  try {
    await fsp.mkdir(destDir, { recursive: true });
    await fsp.rm(partPath, { force: true });
  } catch (err) {
    return { ok: false, error: 'klasör oluşturulamadı: ' + String((err && err.message) || err) };
  }

  let res;
  try {
    res = await requestStream(url.toString(), 5, Number(opts.timeoutMs) || 60000);
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
  if (res.statusCode !== 200) {
    res.resume();
    return { ok: false, error: 'HTTP ' + res.statusCode };
  }
  const type = String(res.headers['content-type'] || '').toLowerCase();
  if (type.indexOf('text/html') !== -1) {
    res.resume();
    return { ok: false, error: 'indirme bir web sayfası döndürdü' };
  }
  const total = Number(res.headers['content-length']) || 0;
  if (total > MAX_INSTALLER_BYTES) {
    res.resume();
    return { ok: false, error: 'güncelleme dosyası çok büyük' };
  }

  let received = 0;
  let lastReport = 0;
  const out = fs.createWriteStream(partPath);
  try {
    await new Promise((resolve, reject) => {
      let done = false;
      const fail = (err) => {
        if (done) return;
        done = true;
        reject(err);
      };
      out.on('error', fail);
      res.on('error', fail);
      res.on('data', (chunk) => {
        received += chunk.length;
        if (received > MAX_INSTALLER_BYTES) {
          res.destroy();
          fail(new Error('güncelleme dosyası çok büyük'));
          return;
        }
        const now = Date.now();
        if (typeof onProgress === 'function' && (now - lastReport > 120 || (total && received >= total))) {
          lastReport = now;
          onProgress({
            received,
            total,
            pct: total ? Math.min(100, Math.round((received / total) * 100)) : 0
          });
        }
      });
      res.pipe(out);
      out.on('finish', () => {
        if (done) return;
        done = true;
        resolve();
      });
    });
  } catch (err) {
    out.destroy();
    await fsp.rm(partPath, { force: true }).catch(() => {});
    return { ok: false, error: String((err && err.message) || err) };
  }

  try {
    const stat = await fsp.stat(partPath);
    if (!stat.size || stat.size < MIN_INSTALLER_BYTES) {
      await fsp.rm(partPath, { force: true }).catch(() => {});
      return { ok: false, error: 'indirilen dosya eksik görünüyor' };
    }
    await fsp.rename(partPath, finalPath);
    if (typeof onProgress === 'function') {
      onProgress({ received: stat.size, total: total || stat.size, pct: 100 });
    }
    return { ok: true, file: finalPath, bytes: stat.size };
  } catch (err) {
    await fsp.rm(partPath, { force: true }).catch(() => {});
    return { ok: false, error: String((err && err.message) || err) };
  }
}

/* Uygulama kapanınca kurulum başlar: /S sessiz kurulum, --updated güncelleme
   sayfalarını atlar, --force-run yeni sürümü açar (bkz. NSIS şablonu). */
function installUpdate(file) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'bu platformda otomatik kurulum yok' };
  }
  const script = [
    '$ErrorActionPreference = "SilentlyContinue"',
    '$p = Get-Process -Id $env:PRIME_UPDATE_PID',
    'if ($p) { $p.WaitForExit(120000) | Out-Null }',
    'Start-Sleep -Milliseconds 700',
    'Start-Process -FilePath $env:PRIME_UPDATE_FILE -ArgumentList "/S","--updated","--force-run" -WindowStyle Hidden'
  ].join('; ');

  try {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: Object.assign({}, process.env, {
        PRIME_UPDATE_PID: String(process.pid),
        PRIME_UPDATE_FILE: String(file)
      })
    });
    child.on('error', () => {});
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

module.exports = {
  FEED_URL,
  compareVersions,
  checkForUpdate,
  downloadUpdate,
  installUpdate
};
