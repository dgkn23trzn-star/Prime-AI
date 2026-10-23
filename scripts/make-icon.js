/* PRIME AI — logodan yuvarlak (512x512) uygulama ikonu üretir.
   Logonun zaten koyu bir dairesi var; burada dairenin dışına taşan köşeler
   şeffaf bırakılır. Böylece masaüstünde ve görev çubuğunda ikon tam bir daire
   gibi görünür, kare bir zemin taşımaz. electron-builder bundan .ico yapar. */
'use strict';

const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'logo.svg');
const outDir = path.join(root, 'build');
const out = path.join(outDir, 'icon.png');
const SIZE = 512;
const R = SIZE / 2 - 1;          // 1 px kenar payı: kıvrım temiz olsun

fs.mkdirSync(outDir, { recursive: true });

/* Daire maskesi: yalnızca dairenin içi kalır, köşeler tamamen şeffaf olur. */
const mask = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE + '">' +
  '<circle cx="256" cy="256" r="' + R + '" fill="#fff"/></svg>'
);

sharp(src, { density: 420 })
  .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toFile(out)
  .then((info) => console.log('icon.png → ' + info.width + 'x' + info.height + ' (' + info.size + ' bayt, yuvarlak)'))
  .catch((err) => { console.error('ikon üretilemedi: ' + err.message); process.exit(1); });
