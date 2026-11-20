// Shared by the Worker share page and the browser share SDK. Games listed here get a
// share button after each round. `param` names the AN.end parameter that holds the
// round score; games on the shared timedLeaderboard use the leaderboard score instead.
export const SHARE_ORIGIN = 'https://ticaticagames.com';
export const SHARE_ID = /^[A-Za-z0-9]{10}$/;
export const SHARE_PATH = /^\/s\/([A-Za-z0-9]{10})\/?$/;

const COVERS = new Set(['academy', 'banquet', 'blaster', 'boba', 'breakout', 'dive', 'eat-smaller', 'elevator',
  'frontier', 'last-hair', 'market-desk', 'merge', 'mines', 'mirror-twins', 'mosquito', 'mrt', 'ocean-link',
  'office-shoot', 'one-line-defense', 'outpost', 'pancake', 'peek', 'quack-pond', 'rocket-chair', 'shadow-relay',
  'skybuilder', 'tetris']);

// Games whose largest canvas is a background layer rather than the play field.
const ART_ONLY = new Set(['mrt']);

const POINTS = { unit: ['分', 'pts'], result: ['拿到 {score} 分', 'scored {score} points'] };
const METERS = verb => ({ unit: ['公尺', 'm'], result: [verb[0] + ' {score} 公尺', verb[1] + ' {score} m'] });
const CLEARED = { unit: ['關', 'stages'], result: ['過了 {score} 關', 'cleared {score} stages'] };

// id: [中文名, English name, score param, scoring]
const TABLE = {
  bird: ['便便鳥大戰狼群', 'Poop Bird vs Wolves', 'score', METERS(['跑了', 'ran'])],
  boss: ['胖老闆追人', 'Chubby Boss', 'score', METERS(['逃了', 'escaped'])],
  baby: ['寶寶逃洗澡', 'Baby Bath Escape', 'score', METERS(['逃了', 'escaped'])],
  cat: ['屋頂貓貓', 'Rooftop Cat', 'score', METERS(['跑了', 'ran'])],
  'last-hair': ['尊嚴保衛戰', 'The Last Hair', 'score', METERS(['走了', 'made it'])],
  runner: ['閃避跑酷', 'Dodge Run', 'distance', METERS(['跑了', 'ran'])],
  carp: ['鯉魚躍龍門', 'Carp Leap', 'score', { unit: ['道', 'falls'], result: ['跳過 {score} 道瀑布', 'leapt {score} waterfalls'] }],
  elevator: ['插隊大師', 'Queue Cutter', 'step', { unit: ['人', 'people'], result: ['插隊超過 {score} 人', 'cut past {score} people'] }],
  campaign: ['宣傳車', 'Campaign Truck', 'votes', { unit: ['票', 'votes'], result: ['拿下 {score} 票', 'won {score} votes'] }],
  fishing: ['深海釣手', 'Fishing', 'landed_fish', { unit: ['條', 'fish'], result: ['釣到 {score} 條魚', 'landed {score} fish'] }],
  'rocket-chair': ['社畜要下班', 'Roar Through the Ceiling', 'score', { unit: ['分鐘', 'min'], result: ['提早 {score} 分鐘下班', 'clocked out {score} minutes early'] }],
  sneak: ['偷偷下班', 'Sneak Out', 'stage', { unit: ['關', 'stages'], result: ['闖過 {score} 關', 'cleared {score} stages'] }],
  mosquito: ['血壓上升', 'Midnight Mosquito', 'score', { unit: ['%', '%'], result: ['吸了 {score}% 的血', 'drained {score}% blood'] }],
  skybuilder: ['蓋樓大師', 'Sky Builder', 'floors', { unit: ['層', 'floors'], result: ['蓋了 {score} 層樓', 'built {score} floors'] }],
  reaper: ['死神打工', 'Reaper Shift', 'score', { unit: ['位', 'souls'], result: ['接走 {score} 位靈魂', 'collected {score} souls'] }],
  nap: ['偷睡大師', 'Nap Master', 'score', POINTS],
  mermaid: ['人魚接龍', 'Mermaid Spider', 'score', POINTS],
  rider: ['外送員大戰惡犬', 'Rider vs Dogs', 'score', POINTS],
  thief: ['偷水果的貓', 'Fruit Thief Cat', 'score', POINTS],
  tetris: ['俄羅斯方塊', 'Block Drop', 'score', POINTS],
  merge: ['養珠', 'Pearl Merge', 'score', POINTS],
  frog: ['青蛙吃蟲', 'Frog Snack', 'score', POINTS],
  mines: ['踩地雷', 'Minesweeper', 'step', { unit: ['格', 'cells'], result: ['翻開 {score} 格', 'opened {score} cells'] }],
  'ocean-link': ['深海連連看', 'Ocean Link', 'step', CLEARED],
  dream: ['時序修復', 'Dream Repair Shop', 'score', CLEARED],
  frontier: ['荒島遠征', 'Frontier Islands', 'stage', { unit: ['島', 'islands'], result: ['抵達第 {score} 座島', 'reached island {score}'] }],
  'market-desk': ['收盤之前', 'Closing Call', 'score', { unit: ['分', 'pts'], result: ['查證分數拿到 {score} 分', 'earned a verification score of {score}'] }],
  'book-sort': ['貓咪疊書舖', 'Cat Book Stack', 'stage', { unit: ['關', 'stages'], result: ['來到第 {score} 關', 'reached stage {score}'] }],
  blaster: ['深海火線', 'Reef Blaster', 'distance_m', METERS(['航行了', 'sailed'])],
  outpost: ['深海前哨', 'Deep Sea Outpost', 'score', { unit: ['分', 'pts'], result: ['守下 {score} 分', 'defended for {score} points'] }],
  academy: ['百萬大學堂', 'Millionaire Academy', 'score', { unit: ['學分', 'credits'], result: ['拿到 {score} 學分', 'earned {score} credits'] }],
  dive: ['一口氣探險', 'One Breath Dive', 'score', POINTS],
  mrt: ['捷運搶位', 'MRT Seat Grab', 'score', { unit: ['階', 'tiers'], result: ['爬到 {score} 階', 'reached tier {score}'] }],
  pancake: ['泡麵煎餅翻面', 'Noodle Pancake', 'score', { unit: ['份', 'served'], result: ['端出 {score} 份煎餅', 'served {score} pancakes'] }],
  pudding: ['布丁突圍', 'Pudding Dash', 'score', POINTS],
  'clock-out': ['下班保衛戰', 'Clock Out', 'score', POINTS],
  peek: ['別看', 'Don’t Peek', 'step', { unit: ['次', 'dodges'], result: ['躲過 {score} 次襲擊', 'dodged {score} attacks'] }],
  breakout: ['打磚塊', 'Breakout', 'score', POINTS],
  'pet-walk': ['小灰出門', 'Pet Walkies', 'score', POINTS],
  'office-shoot': ['拒絕加班', 'No Overtime!', 'score', POINTS],
  banquet: ['最後的晚餐', 'The Last Banquet', 'stage', { unit: ['幕', 'acts'], result: ['撐到第 {score} 幕', 'reached act {score}'] }],
  'eat-smaller': ['數字吞噬', 'Number Gulp', 'step', CLEARED],
  'mirror-twins': ['鏡像雙子', 'Mirror Twins', 'step', CLEARED],
  'shadow-relay': ['影子接力', 'Shadow Relay', 'step', CLEARED],
  'one-line-defense': ['一筆畫守城', 'One-Line Defense', 'score', POINTS],
  'quack-pond': ['呱呱池塘', 'Quack Pond', 'score', { unit: ['關', 'levels'], result: ['來到第 {score} 關', 'reached level {score}'] }],
  'on-pitch': ['不准跑調', 'Stay On Pitch', 'score', POINTS],
  boba: ['插珍奶', 'Boba Straw', 'score', { unit: ['杯', 'drinks'], result: ['插好 {score} 杯珍奶', 'made {score} boba drinks'] }],
};

const capital = text => text.charAt(0).toUpperCase() + text.slice(1);

export const SHARE_GAMES = Object.freeze(Object.fromEntries(Object.entries(TABLE).map(([id, [zh, en, param, scoring]]) => {
  const cover = COVERS.has(id) ? `games/${id}/cover.webp` : null;
  return [id, Object.freeze({
    name: { zh, en },
    param,
    snapshot: !ART_ONLY.has(id),
    unit: { zh: scoring.unit[0], en: scoring.unit[1] },
    // Open Graph previews need a raster image; the card falls back to the cover or icon.
    image: cover || 'images/ticatica-logo.png',
    art: cover || `games/${id}/icon.svg`,
    result: { zh: scoring.result[0], en: capital(scoring.result[1]) },
    brag: {
      zh: `我在《${zh}》${scoring.result[0]}，你能超越嗎？`,
      en: `I ${scoring.result[1]} in ${en}. Can you beat that?`,
    },
    invite: {
      zh: `來玩《${zh}》，在 TICATICA GAMES 免費遊玩！`,
      en: `Play ${en} free on TICATICA GAMES!`,
    },
  })];
})));

export function shareLang(value) {
  return /^en\b/i.test(String(value ?? '')) ? 'en' : 'zh';
}

export function formatScore(score) {
  return Number(score).toLocaleString('en-US');
}

export function shareCopy(gameId, kind, lang, score) {
  const game = SHARE_GAMES[gameId];
  if (!game) return '';
  return game[kind][shareLang(lang)].replace('{score}', formatScore(score));
}
