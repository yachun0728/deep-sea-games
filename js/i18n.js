/* Presentation-only localization. Game state, storage and analytics keep their original values. */
(function () {
  'use strict';
  var dictionary = JSON.parse(document.getElementById('arcade-english').textContent);
  var language = 'zh-Hant', preferenceKey = 'deep-sea-language-v1';
  var records = new WeakMap(), attributeRecords = new WeakMap(), cache = new Map();
  var frameDocuments = new Map(), canvasPrototypes = new WeakSet();
  var attributes = ['aria-label', 'title', 'placeholder', 'alt'];
  var ignored = 'script,style,noscript,[data-i18n-ignore]';
  var han = /[\u3400-\u9fff]/;
  // Numeric sample labels are exact matches only; matching "1 關" inside "21 關…" would corrupt a live sentence.
  var keys = Object.keys(dictionary).filter(function (key) { return !/^\d/.test(key); }).sort(function (a, b) { return b.length - a.length; });
  var phrases = new RegExp(keys.map(function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
  var names = ['Deep Sea Arcade','Crush Depth','Minesweeper','Pearl Drop','Pearl Merge','Sonar Dice','Deep Probe','High Tide','Gold Digger','Compass','Ascent','Reef Run','Dream Repair Shop','Dodge Run','Queue Cutter','Sneak Out','Fishing','Campaign Truck','Boba Straw','Rooftop Cat','Poop Bird vs Wolves','Reaper Shift','Reef Blaster','Sky Builder','Carp Leap','Rider vs Dogs','Chubby Boss','Fruit Thief Cat','Baby Bath Escape','Frog Snack','Nap Master','One Breath Dive','MRT Seat Grab','Noodle Pancake','Pudding Dash','Clock Out','Midnight Mosquito','Don’t Peek','The Last Hair','Breakout'];
  var numbered = { '關': 'Stage', '班': 'Shift', '隊': 'Queue', '條': 'Fish', '層': 'Floor', '道': 'Crossing', '格': 'Cell', '列': 'Row', '階': 'Tier', '段': 'Segment', '晚': 'Night', '站': 'Station' };

  function english(value) {
    var text = String(value), trimmed = text.trim();
    if (!han.test(text)) return text;
    if (cache.has(text)) return cache.get(text);
    var result;
    if (Object.prototype.hasOwnProperty.call(dictionary, trimmed)) {
      result = text.slice(0, text.indexOf(trimmed)) + dictionary[trimmed] + text.slice(text.indexOf(trimmed) + trimmed.length);
    } else {
      result = text.replace(/礦區第\s*(\d+)\s*列第\s*(\d+)\s*格/g, 'Mine row $1, cell $2')
        .replace(/重玩第\s*(\d+)\s*關（扣\s*(\d+)\s*點）/g, 'Retry stage $1 ($2 pts)')
        .replace(/第\s*(\d+)\s*(關|班|隊|條|層|道|格|列|階|段|晚|站)/g, function (_, n, unit) { return numbered[unit] + ' ' + n + ' ' + unit; })
        .replace(phrases, function (match) { return dictionary[match]; });
      names.forEach(function (name) { result = result.split(name + ' ' + name).join(name); });
      result = result.replace(/[ \t]{2,}/g, ' ').replace(/。/g, '.').replace(/，/g, ', ').replace(/：/g, ': ').replace(/；/g, '; ').replace(/（/g, '(').replace(/）/g, ')');
      [['Stage','stages'],['Shift','shifts'],['Queue','queues'],['Fish','fish'],['Floor','floors'],['Crossing','crossings'],['Cell','cells'],['Row','rows'],['Tier','tiers'],['Segment','segments'],['Night','nights'],['Station','stops']].forEach(function (pair) {
        result = result.replace(new RegExp('(' + pair[0] + ' \\d+) ' + pair[1] + '\\b', 'g'), '$1');
      });
    }
    if (cache.size >= 2048) cache.clear();
    cache.set(text, result);
    return result;
  }
  function translate(value) { return language === 'en' ? english(value) : String(value); }
  function excluded(node) { var el = node.nodeType === 1 ? node : node.parentElement; return !el || !!el.closest(ignored); }
  function original(node) {
    var saved = records.get(node);
    return saved && node.nodeValue === saved.rendered ? saved.source : node.nodeValue;
  }
  // Mobile action placement uses source text, never the translated label, for its existing tests.
  function sourceText(element) {
    if (element.nodeType === 3) return original(element);
    var text = '';
    for (var node = element.firstChild; node; node = node.nextSibling) text += sourceText(node);
    return text;
  }
  function localizeText(node) {
    if (excluded(node)) return;
    var source = original(node), rendered = translate(source);
    if (han.test(source)) records.set(node, { source: source, rendered: rendered });
    else records.delete(node);
    if (node.nodeValue !== rendered) node.nodeValue = rendered;
  }
  function localizeAttributes(el) {
    if (excluded(el)) return;
    var saved = attributeRecords.get(el) || {};
    attributes.forEach(function (name) {
      if (!el.hasAttribute(name)) { delete saved[name]; return; }
      var value = el.getAttribute(name), record = saved[name];
      var source = record && value === record.rendered ? record.source : value;
      var rendered = translate(source);
      if (han.test(source)) saved[name] = { source: source, rendered: rendered };
      else delete saved[name];
      if (value !== rendered) el.setAttribute(name, rendered);
    });
    attributeRecords.set(el, saved);
  }
  function visit(root) {
    if (root.nodeType === 3) { localizeText(root); return; }
    if (root.nodeType === 1 && excluded(root)) return;
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) localizeAttributes(root);
    var walker = (root.ownerDocument || root).createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) { return excluded(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    }), node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) localizeText(node);
      else localizeAttributes(node);
    }
  }
  var observer = new MutationObserver(function (mutations) {
    observer.disconnect();
    var roots = new Set();
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList') mutation.addedNodes.forEach(function (node) { roots.add(node); });
      else roots.add(mutation.target);
    });
    roots.forEach(function (root) { if (root.isConnected) visit(root); });
    observe();
  });
  function observe() {
    var options = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes };
    observer.observe(document.documentElement, options);
    frameDocuments.forEach(function (doc, frame) {
      if (frame.isConnected && frame.contentDocument === doc) observer.observe(doc.documentElement, options);
      else frameDocuments.delete(frame);
    });
  }
  function localizeFrame(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement || !doc.body) return;
      frameDocuments.set(frame, doc);
      // The Boba original is already English in both site languages.
      if (frame.id !== 'boba-frame') doc.documentElement.lang = language;
      installCanvas(frame.contentWindow);
      visit(doc);
    } catch (e) { /* Cross-origin frames are deliberately left untouched. */ }
  }
  function refresh() {
    observer.disconnect();
    document.documentElement.lang = language;
    visit(document);
    document.querySelectorAll('iframe').forEach(localizeFrame);
    document.querySelectorAll('[data-language]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.language === language)); });
    observe();
  }
  function setLanguage(next) {
    if (next !== 'en' && next !== 'zh-Hant') return;
    language = next;
    try { localStorage.setItem(preferenceKey, next); } catch (e) {}
    try {
      var url = new URL(location.href);
      url.searchParams.set('lang', next === 'en' ? 'en' : 'zh-Hant');
      history.replaceState(history.state, '', url.href);
    } catch (e) {}
    refresh();
    window.dispatchEvent(new CustomEvent('arcade-languagechange', { detail: { language: language } }));
  }
  try { if (localStorage.getItem(preferenceKey) === 'en') language = 'en'; } catch (e) {}
  var requested = new URLSearchParams(location.search).get('lang');
  if (requested === 'en' || requested === 'zh-Hant') {
    language = requested;
    try { localStorage.setItem(preferenceKey, language); } catch (e) {}
  }
  window.deepSeaI18n = { text: translate, english: english, sourceText: sourceText, setLanguage: setLanguage, getLanguage: function () { return language; } };
  document.querySelectorAll('[data-language]').forEach(function (button) { button.addEventListener('click', function () { setLanguage(button.dataset.language); }); });

  // Translate canvas text at the drawing boundary; never replace game strings or state.
  // Fitting uses the current transform and alignment so longer English labels stay in the canvas.
  function installCanvas(targetWindow) {
    var prototype = targetWindow.CanvasRenderingContext2D && targetWindow.CanvasRenderingContext2D.prototype;
    if (!prototype || canvasPrototypes.has(prototype)) return;
    canvasPrototypes.add(prototype);
    var measure = prototype.measureText;
    prototype.measureText = function (text) { return measure.call(this, translate(text)); };
    ['fillText', 'strokeText'].forEach(function (method) {
      var native = prototype[method];
      prototype[method] = function (text, x, y, maxWidth) {
        var translated = translate(text), limit = maxWidth;
        if (language === 'en' && translated !== String(text)) {
          var matrix = this.getTransform(), scale = Math.abs(matrix.a);
          if (scale && !matrix.b && !matrix.c) {
            var px = matrix.a * x + matrix.e, width = this.canvas.width;
            var align = this.textAlign;
            if (align === 'start') align = this.direction === 'rtl' ? 'right' : 'left';
            if (align === 'end') align = this.direction === 'rtl' ? 'left' : 'right';
            var available = (align === 'center' ? 2 * Math.min(px, width - px) : align === 'right' ? px : width - px) / scale - 8;
            if (available > 0) limit = limit === undefined ? available : Math.min(limit, available);
          }
        }
        if (limit === undefined) return native.call(this, translated, x, y);
        return native.call(this, translated, x, y, limit);
      };
    });
  }
  installCanvas(window);
  document.querySelectorAll('iframe').forEach(function (frame) {
    frame.addEventListener('load', function () {
      observer.disconnect();
      localizeFrame(frame);
      observe();
    });
  });
  refresh();
})();
