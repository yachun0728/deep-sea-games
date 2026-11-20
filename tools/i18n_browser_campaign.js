(async function () {
  const results = [];
  const test = window.__campaignTest;
  const get = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (ok, label) => {
    if (!ok) throw new Error(label);
    results.push(label);
  };
  const pointer = (type, canvas, pointerId = 1) => {
    canvas.dispatchEvent(new PointerEvent(type, {pointerId, pointerType:'touch', button:0, clientY:innerHeight-80}));
  };
  try {
    await wait(120);
    const view = get('view-campaign');
    const canvas = get('cp-canvas');
    const go = get('cp-go');
    const exit = get('cp-exit');
    const i18n = window.deepSeaI18n;
    const balance = get('balance').textContent;
    assert(!view.hidden && test.phase() === 'ready', 'Direct hash opens the start overlay');
    if (innerWidth < 880) {
      const bounds = canvas.getBoundingClientRect();
      const button = exit.getBoundingClientRect();
      assert(bounds.width === innerWidth && bounds.height === innerHeight, `Playfield fills the actual mobile viewport (${bounds.width}×${bounds.height} / ${innerWidth}×${innerHeight}, stage ${get('cp-stage').getBoundingClientRect().height})`);
      assert(button.width >= 44 && button.height >= 44 && button.top < 60, 'Exit stays within the top HUD');
    }
    await wait(100);
    assert(test.artReady(), 'Truck and hospital art load through their deployed relative paths');
    go.click();
    await wait(80);
    assert(test.phase() === 'run' && get('balance').textContent === balance, 'Start is free and opens the run');
    test.turnOffUpdates();
    test.hospital();
    pointer('pointerdown', canvas);
    await wait(80);
    assert(test.held() && get('cp-signal').textContent.includes('Keep holding'), 'Holding in the hospital zone mutes the truck');
    const votes = test.votes();
    i18n.setLanguage('zh-Hant');
    await wait(50);
    assert(test.held() && test.votes() === votes && get('cp-signal').textContent.includes('繼續按住'), 'Language changes preserve a held round');
    i18n.setLanguage('en');
    window.__untranslatedCanvas.length = 0;
    await wait(80);
    assert(!window.__untranslatedCanvas.length, 'The live HUD and scenario render in English');
    pointer('pointerup', canvas);
    assert(!test.held(), 'Releasing resumes broadcast');
    pointer('pointerdown', canvas);
    pointer('pointercancel', canvas);
    assert(!test.held(), 'Pointer cancellation clears mute');
    pointer('pointerdown', canvas);
    window.dispatchEvent(new Event('blur'));
    assert(!test.held(), 'Backgrounding clears the held input');
    test.finish();
    await wait(80);
    const end = go.getBoundingClientRect();
    assert(test.phase() === 'lost' && end.bottom <= innerHeight && end.width > 0, 'Result overlay keeps the restart action visible');
    if (innerWidth < 880) exit.click();
    else location.hash = 'lobby';
    await wait(80);
    assert(view.hidden && location.hash === '#lobby', 'Leaving returns to the lobby');
    document.body.dataset.testStatus = 'PASS';
  } catch (error) {
    document.body.dataset.testStatus = 'FAIL';
    results.push(error.stack);
  }
  const output = document.createElement('script');
  output.type = 'application/json';
  output.id = 'test-results';
  output.textContent = JSON.stringify(results);
  document.body.append(output);
})();
