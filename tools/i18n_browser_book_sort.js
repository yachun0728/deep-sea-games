(async function () {
  const results = [];
  const get = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms || 80));
  const i18n = window.deepSeaI18n;
  function assert(ok, message) { if (!ok) throw new Error(message); results.push(message); }
  function chinese(root) {
    const out = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) if (!node.parentElement.closest('script,style,[data-i18n-ignore]') && /[㐀-鿿]/.test(node.nodeValue)) out.push(node.nodeValue);
    root.querySelectorAll('[aria-label],[title]').forEach(el => ['aria-label', 'title'].forEach(a => { if (!el.closest('[data-i18n-ignore]') && /[㐀-鿿]/.test(el.getAttribute(a) || '')) out.push(a + ':' + el.getAttribute(a)); }));
    return out;
  }
  const slots = () => [...document.querySelectorAll('.bs-slot')];
  async function clearStage(){
    for(let i=0;i<150&&get('bs-modal').hidden;i++){
      if(slots().every(slot=>slot.classList.contains('sealed')||!slot.querySelector('.bs-book'))){
        await wait(750);continue;
      }
      get('bs-hint').click();
      const from=document.querySelector('.bs-slot.hint-from'),to=document.querySelector('.bs-slot.hint-to');
      assert(from&&to,'Hint highlights a source and a target');
      const fi=from.dataset.index,ti=to.dataset.index;
      slots()[fi].click(); slots()[ti].click(); await wait(355);
    }
    assert(!get('bs-modal').hidden,'Following the hints clears the stage');
  }
  async function checkCampaign(probe){
    const picker=get('bs-level');
    if(probe==='campaign-next'){
      picker.value='5';picker.dispatchEvent(new Event('change'));
      await clearStage();
      assert(get('bs-next').textContent==='Go to stage 6','Stage 5 continues to numbered stage 6');
      get('bs-next').click();get('bs-next').click();await wait();
      assert(get('bs-level-text').textContent==='Stage 6'&&slots().length===11,'Stage 6 opens a nine-color board exactly once');
      assert(JSON.parse(localStorage.getItem('deep-sea-book-sort-best'))['5']>0,'Stage 5 clears into the existing score record');
      return;
    }
    const view=get('view-book-sort'),board=view.querySelector('.bs-table');
    const signature=()=>slots().map(slot=>[...slot.querySelectorAll('.bs-badge')].map(book=>book.textContent).join('')).join('|');
    const original=signature();
    assert(get('bs-level-text').textContent==='Stage 36'&&picker.value==='36','Reload starts at the highest unlocked numbered stage');
    assert(slots().length===13&&slots().filter(slot=>!slot.querySelector('.bs-book')).length===1,'Stage 36 has 13 boxes and one starting empty box');
    assert(new Set(original.replaceAll('|','')).size===11,'All eleven books have distinct spine symbols');
    assert(!chinese(view).length&&picker.selectedOptions[0].text==='Stage 36','Advanced stage and book labels appear in English');
    i18n.setLanguage('zh-Hant');await wait();
    assert(get('bs-level-text').textContent==='第 36 關'&&picker.selectedOptions[0].text==='第 36 關'&&signature()===original,'Switching language preserves the numbered board and translates its picker');
    get('bs-add').click();await wait();
    assert(slots().length===14&&board.scrollWidth<=board.clientWidth+1,'Fourteen boxes fit the viewport width with the spare');
    assert(board.scrollHeight<=board.clientHeight+1,'All fourteen boxes fit without scrolling');
    get('bs-restart').click();await wait();
    assert(signature()===original&&picker.value==='36','Restart preserves the exact numbered puzzle');
  }
  try {
    await wait();
    const probe=new URLSearchParams(location.search).get('probe');
    if(probe?.startsWith('campaign-')){
      try{await checkCampaign(probe)}
      finally{i18n.setLanguage('en')}
      document.body.dataset.testStatus='PASS';
      return;
    }
    const view = get('view-book-sort'), balance = get('balance').textContent;
    const events = [], analytics = window.deepSeaAnalytics;
    ['start', 'progress', 'end'].forEach(name => {
      const original = analytics[name];
      analytics[name] = function (...args) { events.push([name, ...args]); return original.apply(this, args); };
    });
    assert(!view.hidden && get('bs-undo').textContent === 'Undo', 'English direct hash opens Cat Book Stack');
    assert(chinese(view).length === 0, 'No Chinese is left in the English game view: ' + chinese(view).join('|'));
    assert(innerWidth <= 880 ? document.documentElement.scrollWidth <= innerWidth : true, 'Page has no horizontal overflow at ' + innerWidth + 'px');
    const menu = get('bs-menu'), menuToggle = menu.querySelector('summary');
    const stage = get('bs-stage').getBoundingClientRect();
    assert(stage.top === 0 && stage.left === 0 && stage.width === innerWidth && stage.height === innerHeight, 'The stage fills the viewport');
    assert(!view.querySelector('.side') && !menu.open, 'Secondary settings start collapsed');
    menuToggle.click();
    assert(menu.open && menuToggle.getAttribute('aria-label') === 'Game menu', 'The translated game menu opens');
    menu.querySelector('[data-language="zh-Hant"]').click(); await wait();
    assert(get('bs-title').textContent === '貓咪疊書舖' && get('bs-moves').textContent === '0', 'In-game language control restores Chinese without starting a round');
    menu.querySelector('[data-language="en"]').click(); await wait();
    menuToggle.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    assert(!menu.open && document.activeElement === menuToggle, 'Escape closes the game menu and restores keyboard focus');
    assert(slots().length === 5 && get('bs-level-text').textContent === 'Stage 1', 'Stage 1 renders five boxes');
    const box = slots()[0].getBoundingClientRect();
    assert(box.width > 60 && box.height > 120, 'Boxes have a usable tap size');
    // Wrong move first: an empty box cannot be lifted and starts no round.
    slots()[3].click(); await wait();
    assert(get('bs-moves').textContent === '0' && events.length === 0, 'Tapping an empty box does nothing and starts no round');
    await clearStage();
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
    menuToggle.click(); get('bs-add').click(); await wait();
    assert(slots().length === 7 && get('bs-add').disabled && !menu.open, 'The spare box appears once');
    get('bs-undo').click(); await wait();
    assert(slots().length === 6 && !get('bs-add').disabled, 'Undo takes the spare box back');
    slots()[0].click(); await wait(); slots()[4].click(); await wait(420);
    const before = events.filter(e => e[0] === 'end').length;
    view.querySelector('.bs-home').click(); await wait(150);
    assert(view.hidden && !get('view-lobby').hidden, 'The in-game back button returns to the lobby');
    assert(events.filter(e => e[0] === 'end').length === before + 1 && events[events.length - 1][3] === 'abandoned', 'Leaving mid-round ends it once as abandoned');
    location.hash = 'book-sort'; await wait(150);
    get('bs-random').click(); await wait(200);
    assert(slots().length === 8 && get('bs-level-text').textContent === 'Random stage', 'Random stage loads eight boxes');
    menuToggle.click();
    get('bs-level').value = '5';
    get('bs-level').dispatchEvent(new Event('change'));
    menuToggle.click(); get('bs-add').click(); await wait();
    const board = view.querySelector('.bs-table');
    assert(slots().length === 11 && board.scrollWidth <= board.clientWidth + 1, 'The largest board fits the viewport width');
    if (innerWidth >= 390 && innerHeight >= 844 || innerWidth >= 820 && innerHeight === 390) {
      assert(board.scrollHeight <= board.clientHeight + 1, 'All eleven boxes fit without scrolling at this viewport');
    }
    document.body.dataset.testStatus = 'PASS';
  } catch (error) {
    document.body.dataset.testStatus = 'FAIL';
    results.push(error.stack);
  } finally {
    const output = document.createElement('pre');
    output.id = 'test-results';
    output.setAttribute('data-i18n-ignore', '');
    output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';
    output.textContent = JSON.stringify(results);
    document.body.appendChild(output);
  }
})();
