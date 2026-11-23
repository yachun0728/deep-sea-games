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
    // Header labels carry "zh-Hant|zh-Hans|en" so the shared header follows the page language.
    var slot = languages.indexOf(language);
    document.querySelectorAll('[data-legal-text]').forEach(function (el) { el.textContent = el.dataset.legalText.split('|')[slot]; });
    document.querySelectorAll('[data-legal-aria]').forEach(function (el) {
      var label = el.dataset.legalAria.split('|')[slot];
      el.setAttribute('aria-label', label); el.title = label;
    });
    var title = document.querySelector('article[lang="' + language + '"] .legal-title');
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
  // Same balance the lobby header shows, read-only.
  try {
    var balance = parseInt(localStorage.getItem('crush-depth-balance'), 10);
    if (localStorage.getItem('deep-sea-balance-zero-v1') === '1' && isFinite(balance) && balance >= 0) document.getElementById('balance').textContent = balance.toLocaleString('zh-TW');
  } catch (e) {}
  apply(pick(), false);
})();
