/* Y8 export adapter. Public per-game IDs supplied by the game's owner. */
let y8Sdk;
let y8AdsReady = false;
let y8AdBusy = false;
window.addEventListener('y8sdk.ready', function () {
  y8Sdk = y8.sdk();
  y8Sdk.init({ appId: '6b03ea57e1e0e654199f21fb', autoLogin: true }, {
    gameId: '295027', preloadAdBreaks: 'on', sound: 'on',
    onReady: () => { y8AdsReady = true; }
  });
  y8Sdk.onAuth((user, error) => {
    if (error) console.error('Y8 authentication:', error);
  });
}, { once: true });
if (window.y8 && window.y8.emitReadyEvent) window.y8.emitReadyEvent();

function requestY8Ad(type, name, grantReward) {
  if (!y8Sdk || !y8AdsReady || y8AdBusy) return Promise.resolve(false);
  y8AdBusy = true;
  let wasPlaying = false, started = false, granted = false;
  const restore = () => {
    if (!started) return;
    started = false;
    window.frontierY8Game.restoreAudio();
    if (wasPlaying) window.frontierY8Game.resume();
  };
  return Promise.resolve().then(() => y8Sdk.showAd({
    type, name,
    beforeAd: () => {
      wasPlaying = window.frontierY8Game.isPlaying();
      started = true;
      window.frontierY8Game.pause();
    },
    afterAd: restore,
    beforeReward: (showAdFn) => showAdFn(),
    adDismissed: () => {},
    adViewed: () => {
      if (type === 'reward' && !granted && typeof grantReward === 'function') {
        granted = true;
        grantReward();
      }
    },
    adBreakDone: (info) => console.info('Y8 ad break:', info.breakStatus)
  })).then(() => granted).catch((error) => {
    restore();
    console.error('Y8 ad request:', error);
    return false;
  }).finally(() => { y8AdBusy = false; });
}
function showMidgameAd() { return requestY8Ad('next', 'level-complete'); }
function showRewardedAd(grantReward) {
  // Reward design is intentionally not invented by this export.
  if (typeof grantReward !== 'function') return Promise.resolve(false);
  return requestY8Ad('reward', 'extra-life', grantReward);
}
