// Keep this standalone introduction's search metadata in its selected language.
(function () {
  'use strict';
  function refresh() {
    var intro = document.querySelector('article[lang="' + document.documentElement.lang + '"] .about-intro');
    if (intro) document.querySelector('meta[name="description"]').content = intro.textContent;
  }
  document.querySelectorAll('[data-language]').forEach(function (button) {
    button.addEventListener('click', refresh);
  });
  refresh();
})();
