/* PRIME AI — ilk boyamadan önce tema ve renk uygulanır (ekran titremesini önler).
   Ayrı dosya olmasının nedeni: index.html'de satır içi script olmadan CSP kullanabilmek. */
(function () {
  'use strict';
  try {
    var session = JSON.parse(localStorage.getItem('primeai.session') || 'null');
    var uid = session && session.userId;
    var settings = uid ? JSON.parse(localStorage.getItem('primeai.u.' + uid + '.settings') || '{}') : {};
    var pref = settings.theme || 'dark';
    var theme = pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : pref;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', settings.accent || 'alev');
  } catch (e) {
    /* varsayılan koyu tema */
  }
})();
