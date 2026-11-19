const marketDeskRules = (() => {
  const OPENING_INDEX = 1000;
  // Best action and benchmark percent, aligned with the translated case text.
  const cases = [
    [1, 3.2], [2, 4.6], [0, 5.8], [1, -2.1], [1, 2.5], [2, -1.9], [0, -2.8],
    [1, 3.3], [0, 4.1], [0, -2.7], [1, 3.6], [2, -2.3], [2, 2.9], [0, 3.7],
    [1, -2.4], [0, 4.3], [0, 6.1], [2, -1.7], [0, 4.9], [2, 4.4]
  ];
  function deck(random) {
    const order = cases.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }
  function judge(caseId, action, focus, streak) {
    const [bestAction, marketMove] = cases[caseId];
    const correct = action === bestAction;
    const late = bestAction === 0 && action === 1;
    const focusLoss = correct ? 0 : Math.min(18, focus);
    const delta = correct ? 24 + Math.min(streak, 4) * 7 : late ? (marketMove > 0 ? 8 : 0) : -47;
    return {
      correct, delta, marketMove, focusLoss,
      focus: Math.min(100, focus + (correct ? 4 : -focusLoss)),
      streak: correct ? streak + 1 : 0,
      outcome: correct ? 'correct' : late ? (marketMove > 0 ? 'missed' : 'flat') : 'lost'
    };
  }
  function accepts(actions) {
    return Array.isArray(actions) && actions.length > 0 && actions.length <= cases.length &&
      actions.every(action => Number.isInteger(action) && action >= 0 && action <= 2);
  }
  function revenue(index) { return index * 100; }
  function replay(order, actions) {
    let focus = 100, streak = 0, index = OPENING_INDEX;
    for (let day = 0; day < actions.length; day++) {
      const result = judge(order[day], actions[day], focus, streak);
      ({focus, streak} = result);
      index += result.delta;
      if (!focus || day === order.length - 1) return day === actions.length - 1 ? revenue(index) : null;
    }
    return null;
  }
  return { OPENING_INDEX, cases, deck, judge, accepts, revenue, replay };
})();
if (typeof module !== 'undefined') module.exports = marketDeskRules;
