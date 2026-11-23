// Language switch for privacy.html and terms.html. Shares the lobby's language preference key.
(function () {
  'use strict';
  var languages = ['zh-Hant', 'zh-Hans', 'en'], key = 'deep-sea-language-v1';
  function pick() {
    var requested = new URLSearchParams(location.search).get('lang');
    if (languages.indexOf(requested) >= 0) return requested;
    try { var stored = localStorage.getItem(key); if (languages.indexOf(stored) >= 0) return stored; } catch (e) {}
    var nav = (navigator.language || '').toLowerCase();
    if (/^zh-(hans|cn|sg|my)\b/.test(nav)) return 'zh-Hans';
    if (/^zh\b/.test(nav)) return 'zh-Hant';
    return 'en';
  }
  function apply(language, remember) {
    document.documentElement.lang = language;
    document.querySelectorAll('article[lang]').forEach(function (article) { article.hidden = article.lang !== language; });
    document.querySelectorAll('[data-language]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.language === language)); });
    var title = document.querySelector('article[lang="' + language + '"] h1');
    if (title) document.title = title.textContent + ' · TICATICA GAMES';
    // Links to the lobby and the other legal page keep the chosen language.
    document.querySelectorAll('a[data-keep-lang]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('lang', language);
      link.href = url.href;
    });
    if (!remember) return;
    try { localStorage.setItem(key, language); } catch (e) {}
    var here = new URL(location.href);
    here.searchParams.set('lang', language);
    history.replaceState(null, '', here);
  }
  document.querySelectorAll('[data-language]').forEach(function (button) {
    button.addEventListener('click', function () { apply(button.dataset.language, true); });
  });
  apply(pick(), false);
})();
