  var K = 0.12;                 // multiplier growth: m = e^(K·秒)
  var BET_MS = 6000, REST_MS = 3200, MIN_BET = 10, START_BALANCE = 500;
  var ENTRY_FEE = 0, REGEN_CAP = 100, REGEN_MS = 60000;   // Free entry; points are earned through play and achievements.
  var LOW_MSG = '餘額不足，每局需要 ' + ENTRY_FEE + ' 點。低於 ' + REGEN_CAP + ' 點時每分鐘會自動回 1 點。';
  var STORE = 'crush-depth-balance';
