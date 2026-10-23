/* PRIME AI — gerçek video bulma (ana süreç)
   Kullanıcının konusu için YouTube'da arama yapılır, sonuçlar puanlanır ve
   en güvenilir/en uygun video seçilir. Anahtar gerekmez.
   Tarayıcıdan değil ana süreçten çalıştığı için CORS engeli yoktur. */
'use strict';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map();

/* Arayüzde görünen metinleri "şaşırtıcı" biçimde döndüren alanları güvenle okur. */
function textOf(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs) && node.runs.length) return node.runs.map((r) => r.text || '').join('');
  return '';
}

/* ytInitialData içindeki nesneleri ayraç eşleştirerek güvenle keser (string farkındalıklı). */
function sliceObject(src, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function extractRenderers(html) {
  const out = [];
  const key = '"videoRenderer":';
  let from = 0;
  while (out.length < 40) {
    const at = html.indexOf(key, from);
    if (at < 0) break;
    const braceAt = html.indexOf('{', at + key.length);
    if (braceAt < 0) break;
    const end = sliceObject(html, braceAt);
    if (end < 0) break;
    from = end + 1;
    try { out.push(JSON.parse(html.slice(braceAt, end + 1))); } catch { /* eksik/bozuk kayıt atlanır */ }
  }
  return out;
}

const TR_ASCII = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c', 'â': 'a', 'î': 'i', 'û': 'u' };

function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (c) => TR_ASCII[c] || c)
    .replace(/\s+/g, ' ')
    .trim();
}

/* "1,2 Mn görüntüleme" · "12 B görüntüleme" · "1.2M views" → sayı */
function viewsNumber(text) {
  const t = String(text || '').replace(/\u00a0/g, ' ');
  const m = t.match(/([\d.,]+)\s*(Mn|M|B|K|bin|milyon|billion|million|thousand)?/i);
  if (!m) return 0;
  let n = parseFloat(m[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  if (!isFinite(n)) return 0;
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'mn' || unit === 'm' || unit === 'milyon' || unit === 'million') n *= 1e6;
  else if (unit === 'b' || unit === 'bin' || unit === 'k' || unit === 'thousand') n *= 1e3;
  else if (unit === 'billion') n *= 1e9;
  return Math.round(n);
}

function secondsOf(text) {
  const m = String(text || '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const a = +m[1], b = +m[2], c = m[3] ? +m[3] : null;
  return c == null ? a * 60 + b : a * 3600 + b * 60 + c;
}

function yearsAgo(text) {
  const t = norm(text);
  const m = t.match(/(\d+)\s*(yil|year)/);
  if (m) return +m[1];
  if (/(ay|month)/.test(t)) return 0.2;
  if (/(gun|day|hafta|week|saat|hour|dakika|minute)/.test(t)) return 0.1;
  return null;
}

/* Eğitim/öğretim odaklı kanallar ve başlık kalıpları "güvenilir" sayılır. */
const TRUST_CHANNEL = ['akademi', 'egitim', 'egitimhane', 'ders', 'ogren', 'bilgi', 'rehber', 'kilavuz',
  'tutorial', 'kodlama', 'yazilim', 'programlama', 'bilgisayar', 'teknoloji', 'muhendis', 'universite',
  'okul', 'hoca', 'prof', 'dr', 'khan', 'freecodecamp', 'academy', 'course', 'kurs', 'akademi'];
const TRUST_TITLE = ['nasil', 'egitim', 'ders', 'anlatim', 'ogren', 'baslangic', 'sifirdan', 'adim adim',
  'tutorial', 'guide', 'rehber', 'kilavuz', 'ornek', 'uygulama', 'ozet'];
const BAD_TITLE = ['shorts', '#short', 'canli yayin', 'live stream', 'full movie', 'tam film', 'reaction',
  'tepki', 'komik', 'saka', 'prank', 'challenge', 'muzik', 'sarki', 'klip', 'vlog', 'magazin',
  'sosyal medya', 'unboxing', 'kutu acilisi'];
/* Sızıntı/klik tuzağı başlıklar öğretici video değildir. */
const CLICKBAIT_TITLE = ['leak', 'leaks', 'sizinti', 'sizdir', 'ifsa', 'gizli kod', 'secret code', 'secret op',
  'exposed', 'spoiler', 'drama', 'free robux', 'bedava kod', 'kod dagitiyorum', 'kod veriyorum', 'hack veriyorum'];
/* Arayüz dili yalnızca küçük bir tercih puanı verir; başka dildeki videolar
   cezalandırılmaz (kullanıcı "illa Türkçe olmasın" dedi). */
const TR_CHARS = /[ıİşŞğĞüÜöÖçÇ]/;
const TR_WORDS = ['nasil', 'icin', 'hile', 'oyun', 'oyunu', 'oyunda', 'yap', 'anlat', 'ders', 'nedir',
  'degil', 'bir', 'ile', 'kullan', 'oner', 'icerik', 'hakkinda', 'tanitim'];
function looksTurkish(text) {
  const t = String(text || '');
  if (TR_CHARS.test(t)) return true;
  const n = norm(t);
  return TR_WORDS.some((w) => new RegExp('(^|[^a-z])' + w + '([^a-z]|$)').test(n));
}

/* Bağıran/emoji dolu, magazin tarzı başlıklar öğretici video değildir. */
function noisyTitle(rawTitle) {
  const t = String(rawTitle || '');
  const letters = t.replace(/[^\p{L}]/gu, '');
  const caps = t.replace(/[^\p{Lu}]/gu, '').length;
  let bad = 0;
  if (letters.length >= 8 && caps / letters.length > 0.55) bad += 6;      // ÇOĞU BÜYÜK HARF
  const emoji = (t.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  if (emoji >= 2) bad += 3; else if (emoji === 1) bad += 1;
  if (/[!?]{2,}/.test(t)) bad += 2;
  if ((t.match(/\.\.\./) || []).length) bad += 1;
  return bad;
}

function scoreOf(v, words, preferLang) {
  const title = norm(v.title);
  const chan = norm(v.channel);
  let s = 0;
  const hits = words.filter((w) => title.includes(w)).length;
  s += hits * 6 - Math.max(0, words.length - hits) * 2;
  if (TRUST_CHANNEL.some((k) => chan.includes(k))) s += 5;
  if (TRUST_TITLE.some((k) => title.includes(k))) s += 2;
  if (BAD_TITLE.some((k) => title.includes(k))) s -= 9;
  if (CLICKBAIT_TITLE.some((k) => title.includes(k))) s -= 12;
  /* Arayüz diliyle aynı dildeki anlatım küçük bir artı alır; farklı dil ceza almaz. */
  if (preferLang === 'tr' && looksTurkish(v.title)) s += 3;
  if (preferLang === 'en' && /[a-z]/.test(norm(v.title))) s += 1;
  s -= noisyTitle(v.title);
  if (v.verified) s += 4;
  const sec = secondsOf(v.duration);
  if (sec == null) return -100;                       // süresiz → canlı/shorts
  if (sec >= 90 && sec <= 1500) s += 5;               // ~1,5–25 dk: anlatım videosu
  else if (sec >= 60 && sec <= 2700) s += 3;
  else if (sec < 55) s -= 7;                          // shorts
  else s -= 1;
  s += Math.min(4, Math.log10(1 + (v.viewsNum || 0))); // izlenme: güven sinyali
  const yrs = yearsAgo(v.published);
  if (yrs != null) { if (yrs <= 3) s += 2; else if (yrs <= 6) s += 1; else if (yrs > 10) s -= 1; }
  return s;
}

function parseCandidates(html) {
  const out = [];
  for (const v of extractRenderers(html)) {
    const id = v.videoId;
    if (!id) continue;
    const badgeLabels = [];
    for (const list of [v.badges, v.ownerBadges]) {
      for (const b of list || []) {
        const m = b && (b.metadataBadgeRenderer || b);
        const label = textOf(m && m.label) || String((m && m.style) || '');
        if (label) badgeLabels.push(label);
      }
    }
    const flags = badgeLabels.join(' ');
    out.push({
      id,
      title: textOf(v.title),
      channel: textOf(v.ownerText) || textOf(v.longBylineText),
      duration: textOf(v.lengthText),
      views: textOf(v.viewCountText) || textOf(v.shortViewCountText),
      viewsNum: viewsNumber(textOf(v.viewCountText) || textOf(v.shortViewCountText)),
      published: textOf(v.publishedTimeText),
      verified: /VERIFIED|CHECK/i.test(flags),
      live: /CANLI|LIVE/i.test(flags) || !!v.upcomingEventData,
      url: 'https://www.youtube.com/watch?v=' + id,
      thumb: 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'   // 16:9, kenarsız kapak
    });
  }
  return out;
}

async function fetchText(url, ms, accept) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': accept || 'tr-TR,tr;q=0.9,en;q=0.6' },
    signal: AbortSignal.timeout(ms || 9000)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.text();
}

/* Bir video gerçekten var mı ve gömülebilir mi? (oEmbed, anahtar gerekmez) */
async function verify(id) {
  const url = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id);
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error('oEmbed HTTP ' + res.status);
  const j = await res.json();
  return { title: String(j.title || ''), author: String(j.author_name || ''), thumb: String(j.thumbnail_url || '') };
}

/* Konu için en uygun videoyu seçer. Bulamazsa null döner. */
async function findVideo(query, opts) {
  const q = String(query || '').trim();
  if (q.length < 2) return null;
  const preferLang = opts && opts.lang === 'en' ? 'en' : 'tr';
  const cacheKey = preferLang + '|' + norm(q);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.video;

  const words = norm(q).split(' ').filter((w) => w.length >= 3).slice(0, 8);
  const locale = preferLang === 'en'
    ? { hl: 'en', gl: 'US', accept: 'en-US,en;q=0.9,tr;q=0.5' }
    : { hl: 'tr', gl: 'TR', accept: 'tr-TR,tr;q=0.9,en;q=0.6' };
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) +
    '&hl=' + locale.hl + '&gl=' + locale.gl;
  const html = await fetchText(url, (opts && opts.timeoutMs) || 9000, locale.accept);
  const list = parseCandidates(html);
  const ranked = list
    .filter((v) => !v.live)
    .map((v) => ({ v, s: scoreOf(v, words, preferLang) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 6);

  /* Doğrulamalar paralel yapılır: kart daha hızlı dolar. */
  const checked = await Promise.allSettled(ranked.map((item) => verify(item.v.id)));
  for (let i = 0; i < ranked.length; i++) {
    const item = ranked[i];
    const res = checked[i];
    if (!res || res.status !== 'fulfilled') continue;
    const info = res.value;
    const video = Object.assign({}, item.v, {
      title: info.title || item.v.title,
      channel: info.author || item.v.channel,
      thumb: info.thumb || item.v.thumb,
      score: item.s,
      url: 'https://www.youtube.com/watch?v=' + item.v.id
    });
    cache.set(cacheKey, { at: Date.now(), video });
    return video;
  }
  cache.set(cacheKey, { at: Date.now(), video: null });
  return null;
}

module.exports = { findVideo, parseCandidates, secondsOf, viewsNumber, norm, scoreOf, extractRenderers, looksTurkish };
