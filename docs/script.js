/* ==================================================================
   PRIME AI — tanıtım sitesi etkileşimleri
   Mobil menü, slider, galeri lightbox, kaydırma animasyonları.
   ================================================================== */
'use strict';

const $ = (id) => document.getElementById(id);

/* Gizleme animasyonu ancak bu sınıf varsa devrede — JS çalışmazsa
   .reveal içeriği görünür kalır. */
document.documentElement.classList.add('js');

/* Güvenlik devresi: bazı gömülü tarayıcılarda CSS geçişleri hiç ilerlemiyor
   (opacity başlangıçta takılıp kalıyor). Böyle bir ortamda .reveal ve slider
   boş görünürdü; kısa bir ölçümle anlaşılır ve animasyon kapatılır. */
(function probeTransitions() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:8px;height:8px;opacity:0;transition:opacity .25s linear';
  document.body.appendChild(probe);
  void probe.offsetWidth;
  probe.style.opacity = '1';
  setTimeout(() => {
    const stuck = parseFloat(getComputedStyle(probe).opacity) < 0.5;
    probe.remove();
    if (stuck) {
      document.documentElement.classList.add('no-anim');
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    }
  }, 340);
})();

/* --------------------------- Yıl --------------------------- */
$('year').textContent = String(new Date().getFullYear());

/* --------------------------- Header durumu --------------------------- */
const header = $('header');
const toTop = $('toTop');

function onScroll() {
  const y = window.scrollY || document.documentElement.scrollTop;
  header.classList.toggle('scrolled', y > 24);
  toTop.hidden = y < 600;
  highlightNav(y);
}window.addEventListener('scroll', onScroll, { passive: true });

 /* --------------------------- Yumuşak kaydırma ---------------------------
    Bazı gömülü tarayıcılarda `behavior: 'smooth'` ve CSS smooth kaydırma
    hiç başlamıyor; bu yüzden animasyon elle yürütülür. */
 function animateScrollTo(targetY) {
   const startY = window.scrollY || document.documentElement.scrollTop;
   const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
   const end = Math.max(0, Math.min(targetY, max));
   const delta = end - startY;
   if (Math.abs(delta) < 2) return;
   if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
     window.scrollTo({ top: end, left: 0, behavior: 'instant' });
     return;
   }
   const dur = Math.min(900, Math.max(320, Math.abs(delta) * 0.5));
   const t0 = Date.now();
   const ease = (p) => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
   /* setInterval kullanılır: bazı gömülü tarayıcılarda requestAnimationFrame
      arka planda hiç tetiklenmez, kaydırma o zaman hiç başlamaz. */
   const id = setInterval(() => {
     const p = Math.min(1, (Date.now() - t0) / dur);
     /* behavior 'instant' olmalı: CSS scroll-behavior: smooth bu çağrıları da
        yavaş animasyona çevirir ve bazı gömülü tarayıcılarda hiç kaydırmaz. */
     window.scrollTo({ top: startY + delta * ease(p), left: 0, behavior: 'instant' });
     if (p >= 1) clearInterval(id);
   }, 16);
 }

 function scrollToId(id) {
   const el = document.getElementById(id);
   if (!el) return;
   const top = el.getBoundingClientRect().top + (window.scrollY || 0);
   animateScrollTo(top - ((header.offsetHeight || 64) + 14));
 }

 toTop.addEventListener('click', () => animateScrollTo(0));

 /* Sayfa içi bağlantılar: adres çubuğunda kalır, kaydırma JS ile yapılır. */
 document.addEventListener('click', (e) => {
   const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
   if (!a) return;
   const id = a.getAttribute('href').slice(1);
   if (!id || !document.getElementById(id)) { e.preventDefault(); animateScrollTo(0); return; }
   e.preventDefault();
   try { history.pushState(null, '', '#' + id); } catch { /* yok */ }
   scrollToId(id);
 });

/* --------------------------- Mobil menü --------------------------- */
const navToggle = $('navToggle');
const navLinks = $('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});

/* Bağlantıya tıklayınca menü kapansın. */
navLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* --------------------------- Aktif bölüm vurgusu --------------------------- */
const sections = ['ozellikler', 'nasil', 'galeri', 'indir']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function highlightNav(y) {
  const probe = y + 140;
  let current = '';
  for (const s of sections) {
    if (s.offsetTop <= probe) current = s.id;
  }
  navLinks.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current && !a.classList.contains('btn'));
  });
}

/* --------------------------- Hero slider --------------------------- */
const track = $('sliderTrack');
const slides = Array.from(track.querySelectorAll('.slide'));
const dotsWrap = $('sliderDots');
let index = 0;
let timer = null;

slides.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', (i + 1) + '. görsel');
  b.addEventListener('click', () => { go(i); restart(); });
  dotsWrap.appendChild(b);
});
const dots = Array.from(dotsWrap.children);

function go(i) {
  index = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
  dots.forEach((d, k) => {
    d.classList.toggle('on', k === index);
    d.setAttribute('aria-selected', String(k === index));
  });
}

function next() { go(index + 1); }
function prev() { go(index - 1); }

function restart() {
  clearInterval(timer);
  timer = setInterval(next, 5200);
}

$('sliderNext').addEventListener('click', () => { next(); restart(); });
$('sliderPrev').addEventListener('click', () => { prev(); restart(); });

/* Üzerine gelince otomatik ilerleme durur. */
const slider = $('heroSlider');
slider.addEventListener('mouseenter', () => clearInterval(timer));
slider.addEventListener('mouseleave', restart);

/* Dokunmatik kaydırma. */
let touchX = null;
slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
slider.addEventListener('touchend', (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 46) { if (dx < 0) next(); else prev(); restart(); }
}, { passive: true });

/* Klavye okları slider odaktayken. */
slider.tabIndex = 0;
slider.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { next(); restart(); }
  else if (e.key === 'ArrowLeft') { prev(); restart(); }
});

go(0);
restart();

/* --------------------------- Galeri lightbox --------------------------- */
const lightbox = $('lightbox');
const lbImg = $('lbImg');
const items = Array.from(document.querySelectorAll('.g-item'));
let lbIndex = 0;

function openLb(i) {
  lbIndex = (i + items.length) % items.length;
  lbImg.src = items[lbIndex].dataset.full || items[lbIndex].querySelector('img').src;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLb() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

items.forEach((el, i) => el.addEventListener('click', () => openLb(i)));
$('lbClose').addEventListener('click', closeLb);
$('lbPrev').addEventListener('click', () => openLb(lbIndex - 1));
$('lbNext').addEventListener('click', () => openLb(lbIndex + 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });

document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLb();
  else if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  else if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
});

/* --------------------------- Kaydırınca görünme ---------------------------
   IntersectionObserver bazı gömülü tarayıcılarda hiç geri çağırmıyor; bu
   yüzden sayaç tabanlı bir yedek denetleyici de çalışır. */
const revealables = Array.from(document.querySelectorAll('.reveal'));

function revealVisible() {
  const h = window.innerHeight || 800;
  for (const el of revealables) {
    if (el.classList.contains('visible')) continue;
    const r = el.getBoundingClientRect();
    if (r.top < h - 40 && r.bottom > 0) el.classList.add('visible');
  }
}

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  revealables.forEach((el) => io.observe(el));
}

revealVisible();
window.addEventListener('scroll', revealVisible, { passive: true });
window.addEventListener('resize', revealVisible, { passive: true });
/* Yedek: tümü görünür hâle gelene kadar belirli aralıklarla bakılır. */
const revealGuard = setInterval(() => {
  revealVisible();
  if (revealables.every((el) => el.classList.contains('visible'))) clearInterval(revealGuard);
}, 300);

/* Animasyon donmuşsa 3 saniye içinde her şey görünür hâle getirilir. */
setTimeout(() => {
  revealables.forEach((el) => el.classList.add('visible'));
}, 3000);

/* --------------------------- İlk durum --------------------------- */
onScroll();
