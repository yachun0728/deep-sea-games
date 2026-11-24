// TOP DOGGO: Paw City 排行榜規則（Worker 與前端共用，不碰 DOM）。
// 即時 3D 動作遊戲無法在伺服器完整重播，所以只做「合理性驗證」：
// 成績 = 該難度下到達的關卡數（死亡時所在關卡；通關後進入下一關即算到達）。
// Worker 發開局憑證並記錄開局時間，結束時前端送 [關卡, 累計擊倒數, 遊玩毫秒]。
const topDoggoRules = (() => {
const VERSION = 1;
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const MAX_LEVEL = 60;          // 榜上最高關卡
const MIN_LEVEL_MS = 18000;    // 通過一關的最短合理時間：清 8 個敵人、4 根骨頭、3 次撞擊、5 連擊（奇數關另有頭目）
const OPENING_MS = 6000;       // 第 1 關開始前的最短時間
const MIN_KILLS_PER_LEVEL = 8; // 每通過一關至少擊倒 8 名敵人
const MAX_KILLS_PER_SEC = 3;   // 擊倒速度上限（含手榴彈／大砲連殺）
const SLACK_MS = 3000;         // 網路與計時誤差

const isInt = value => Number.isSafeInteger(value);
const accepts = action => Array.isArray(action) && action.length === 3 && action.every(isInt);
const boardId = difficulty => 'top-doggo-' + difficulty;
const difficultyOf = gameId => DIFFICULTIES.find(d => boardId(d) === gameId) ?? null;
const minPlayMs = level => OPENING_MS + (level - 1) * MIN_LEVEL_MS;

// action = [level, kills, playMs]；elapsedMs 是 Worker 量到的開局至今時間。回傳 {score} 或 null。
function verify(action, elapsedMs) {
  if (!accepts(action)) return null;
  const [level, kills, playMs] = action;
  if (level < 1 || level > MAX_LEVEL) return null;
  if (kills < MIN_KILLS_PER_LEVEL * (level - 1)) return null;
  if (playMs < minPlayMs(level)) return null;
  if (playMs > elapsedMs + SLACK_MS) return null;       // 不能宣稱玩得比實際經過時間還久
  if (elapsedMs < minPlayMs(level) - SLACK_MS) return null;
  if (kills > 10 + (playMs / 1000) * MAX_KILLS_PER_SEC) return null;
  return { score: level };
}

return { VERSION, DIFFICULTIES, MAX_LEVEL, MIN_LEVEL_MS, OPENING_MS, MIN_KILLS_PER_LEVEL, MAX_KILLS_PER_SEC, SLACK_MS, boardId, difficultyOf, minPlayMs, accepts, verify };
})();
if (typeof module !== 'undefined') module.exports = topDoggoRules;
