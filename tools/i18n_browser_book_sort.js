(async function () {
  const results = [];
  const get = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms || 80));
  const i18n = window.deepSeaI18n;
  function assert(ok, message) { if (!ok) throw new Error(message); results.push(message); }
  function chinese(root) {
    const out = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) if (!node.parentElement.closest('script,style') && /[㐀-鿿]/.test(node.nodeValue)) out.push(node.nodeValue);
    root.querySelectorAll('[aria-label],[title]').forEach(el => ['aria-label', 'title'].forEach(a => { if (/[㐀-鿿]/.test(el.getAttribute(a) || '')) out.push(a + ':' + el.getAttribute(a)); }));
    return out;
  }
  try {
    await wait();
    const view = get('view-book-sort'), balance = get('balance').textContent;
    const events = [], analytics = window.deepSeaAnalytics;
    ['start', 'progress', 'end'].forEach(name => {
      const original = analytics[name];
      analytics[name] = function (...args) { events.push([name, ...args]); return original.apply(this, args); };
    });
    assert(!view.hidden && get('bs-undo').textContent === 'Undo', 'English direct hash opens Cat Book Stack');
    assert(chinese(view).length === 0, 'No Chinese is left in the English game view: ' + chinese(view).join('|'));
    assert(innerWidth <= 880 ? document.documentElement.scrollWidth <= innerWidth : true, 'Page has no horizontal overflow at ' + innerWidth + 'px');
    const slots = () => [...document.querySelectorAll('.bs-slot')];
    assert(slots().length === 5 && get('bs-level-text').textContent === 'Stage 1', 'Stage 1 renders five boxes');
    const box = slots()[0].getBoundingClientRect();
    assert(box.width > 60 && box.height > 120, 'Boxes have a usable tap size');
    // Wrong move first: an empty box cannot be lifted and starts no round.
    slots()[3].click(); await wait();
    assert(get('bs-moves').textContent === '0' && events.length === 0, 'Tapping an empty box does nothing and starts no round');
    // Play the whole stage with the in-game hint.
    for (let i = 0; i < 150 && get('bs-modal').hidden; i++) {
      if (document.querySelectorAll('.bs-slot.sealed').length === 3) { await wait(900); continue; }
      get('bs-hint').click(); await wait(20);
      const from = document.querySelector('.bs-slot.hint-from'), to = document.querySelector('.bs-slot.hint-to');
      assert(from && to, 'Hint highlights a source and a target');
      const fi = from.dataset.index, ti = to.dataset.index;
      slots()[fi].click(); await wait(20); slots()[ti].click(); await wait(420);
    }
    assert(!get('bs-modal').hidden, 'Following the hints clears the stage');
    assert(events.filter(e => e[0] === 'start').length === 1 && events.filter(e => e[0] === 'end').length === 1, 'One start and one end for the round');
    assert(events.find(e => e[0] === 'end')[2] === 0 && events.find(e => e[0] === 'end')[3] === 'complete', 'End reports zero payout and complete');
    assert(get('balance').textContent === balance, 'The wallet is untouched');
    assert(document.querySelectorAll('.bs-slot.sealed').length === 3, 'Three boxes are sealed at the end');
    assert(get('bs-next').textContent === 'Go to stage 2' && chinese(view).length === 0, 'English win dialog and next-stage button');
    assert(JSON.parse(localStorage.getItem('deep-sea-book-sort-best'))['1'] > 0, 'Best moves are saved per stage');
    i18n.setLanguage('zh-Hant'); await wait();
    assert(get('bs-next').textContent === '前往第 2 關' && get('bs-undo').textContent === '撤銷上一步' && get('bs-level-text').textContent === '第 1 關', 'Switching to Chinese restores the original text');
    i18n.setLanguage('en'); await wait();
    assert(get('bs-next').textContent === 'Go to stage 2', 'Switching back to English re-renders dynamic text');
    get('bs-next').click(); await wait(200);
    assert(get('bs-modal').hidden && slots().length === 6 && get('bs-moves').textContent === '0', 'Next stage loads six boxes and resets moves');
    // Spare box + undo restores the box count; leaving mid-round reports one abandoned end.
    get('bs-add').click(); await wait();
    assert(slots().length === 7 && get('bs-add').disabled, 'The spare box appears once');
    get('bs-undo').click(); await wait();
    assert(slots().length === 6 && !get('bs-add').disabled, 'Undo takes the spare box back');
    slots()[0].click(); await wait(); slots()[4].click(); await wait(420);
    const before = events.filter(e => e[0] === 'end').length;
    location.hash = 'lobby'; await wait(150);
    assert(events.filter(e => e[0] === 'end').length === before + 1 && events[events.length - 1][3] === 'abandoned', 'Leaving mid-round ends it once as abandoned');
    location.hash = 'book-sort'; await wait(150);
    get('bs-random').click(); await wait(200);
    assert(slots().length === 8 && get('bs-level-text').textContent === 'Random stage', 'Random stage loads eight boxes');
    document.body.dataset.testStatus = 'PASS';
  } catch (error) {
    document.body.dataset.testStatus = 'FAIL';
    results.push(error.stack);
  }
  const output = document.createElement('pre');
  output.id = 'test-results';
  output.setAttribute('data-i18n-ignore', '');
  output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';
  output.textContent = JSON.stringify(results);
  document.body.appendChild(output);
})();
