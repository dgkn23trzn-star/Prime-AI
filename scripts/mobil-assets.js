'use strict';
/* Mobil web uygulamasını Android kabuğunun assets klasörüne kopyalar.
   APK derlemeden önce: node scripts/mobil-assets.js */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'prime-ai-mobil');
const dest = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'www');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('prime-ai-mobil/index.html bulunamadı.');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });

const files = fs.readdirSync(dest);
console.log('Mobil dosyalar kopyalandı: ' + path.relative(root, dest));
console.log('  ' + files.join(', '));
