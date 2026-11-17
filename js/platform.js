
(function () {
  'use strict';
  var AN=window.deepSeaAnalytics||{start:function(){return null;},progress:function(){},resume:function(){},end:function(){},view:function(){},points:function(){}};
{{include:js/config.js}}  var $ = function (id) { return document.getElementById(id); };
  var sea = $('sea'), cv = $('cv'), ctx = cv.getContext('2d');
  var elMult = $('mult'), elSub = $('subline'), elGo = $('go'), elMsg = $('msg');
  var elBal = $('balance'), elAmt = $('bet-amount'), elAuto = $('auto-out'), elPills = $('pills'), elCrew = $('crew');
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = getComputedStyle(document.documentElement);
  var C = {}; ['abyss', 'sea', 'sea-top', 'line', 'fg', 'muted', 'lamp', 'glow', 'crush', 'panel-2', 'lamp-ink'].forEach(function (k) { C[k] = css.getPropertyValue('--' + k).trim(); });

  var S = { phase: 'betting', phaseEnd: 0, t0: 0, crash: 1, m: 1, crashedAt: 0,
            balance: START_BALANCE, bet: null, queued: false, history: [], bots: [] };
  var BOT_NAMES = ['燈籠魚', '老船長', '聲納手', '壓載艙', '潮汐', '珊瑚仔', '七號艇', '浮游生物'];
  var W = 0, H = 0, lastFrame = 0, snow = [];

  function fmt(n) { return Math.round(n).toLocaleString('zh-TW'); }
  function fx(m) { return m.toFixed(2); }
  function rollCrash() { var r = Math.random(); return Math.min(1000, Math.max(1, Math.floor(97 / (1 - r)) / 100)); }
{{include:js/wallet.js}}

  function readAmount() { var v = Math.floor(Number(elAmt.value)); return isFinite(v) ? v : 0; }
  function readAuto() { var v = Number(elAuto.value); return isFinite(v) && v >= 1.01 ? Math.round(v * 100) / 100 : null; }
  function say(text, cls) { elMsg.textContent = text; elMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function checkAmount() {
    var a = readAmount();
    if (a < MIN_BET) { say('最低下注 ' + MIN_BET + ' 點。', 'lose'); return 0; }
    if (a > S.balance) { say('餘額不足，請調低下注或重設點數。', 'lose'); return 0; }
    return a;
  }

