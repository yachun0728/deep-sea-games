  /* ---------- Midnight Mosquito: hold to dive, let go to rise; land on skin and keep holding to suck blood while the sleeper's alertness climbs ---------- */
  var mqBusy=false,mqStake=0,mqSay=function(){};
  (function(){
const cv=$('mq-canvas'),g=cv.getContext('2d'),W=480,H=720;
// Fixed BONUS (points are credited the moment the milestone is reached; each once per round, never taken back).
const MQ_REWARDS=[[25,1],[50,2],[75,3]],MQ_WIN_REWARD=4;
let best=0;try{best=+localStorage.getItem('deep-sea-mosquito-best')||0}catch(e){}
let analytics=null,earned=0,paid=[false,false,false],winPaid=false,paidCount=0;
// ---- game rules (pure logic) ----
const {MQC,MQZ,BLANKET_Y,mqNew,mqStep,mqSurface,mqInWin}=mosquitoRules;
// ---- drawing ----
  var FONT = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',system-ui,sans-serif";
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(s, x, y, size, color, align, stroke) {
    g.font = '700 ' + size + 'px ' + FONT; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = Math.max(3, size / 7); g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = color; g.fillText(s, x, y);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bloodColor(p) { var r = Math.round(lerp(255, 160, p)), gg = Math.round(lerp(170, 8, p)), b = Math.round(lerp(170, 28, p)); return 'rgb(' + r + ',' + gg + ',' + b + ')'; }
  var INK = '#2a0f33', WALL = '#3814ae';
  // Art atlases: 2×2 frames of the sleeper (same camera in every sheet) and a six-pose mosquito strip.
  // Loaded the first time this view is drawn on screen, so the lobby never downloads them.
  var ART = null, FW = 590, FH = 596, BED_Y = 186, BED_H = FH * 480 / FW;
  var MQ_SPRITE = [[198,152],[202,136],[176,126],[214,174],[203,112],[207,150]];
  function loadArt() {
    if (ART || typeof Image === 'undefined') return;
    ART = {};
    ['idle','face','arm','foot','roll','swat','mosquito'].forEach(function (n) { var im = new Image(); im.src = 'games/mosquito/art/' + n + '.webp'; ART[n] = im; });
  }
  function ready(n) { return !!(ART && ART[n] && ART[n].complete && ART[n].naturalWidth); }
  // How far above the rule surface the drawn skin sits, per x. Drawing only: landing and hit tests are unchanged.
  var SKIN_LIFT = [
    [[128,0],[134,48],[151,48]],
    [[152,5],[176,0]],
    [[249,0],[262,36],[300,48],[360,46],[415,30]],
    [[402,0],[416,-10],[430,2],[445,15],[458,20]]
  ];
  function skinLift(x) {
    for (var i = 0; i < SKIN_LIFT.length; i++) {
      var t = SKIN_LIFT[i];
      for (var j = 1; j < t.length; j++) if (x >= t[j - 1][0] && x <= t[j][0]) return lerp(t[j - 1][1], t[j][1], (x - t[j - 1][0]) / (t[j][0] - t[j - 1][0]));
    }
    return 0;
  }

  function line(color, w) { g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }

  function drawRoom(alertP, lightOn) {
    g.fillStyle = WALL; g.fillRect(0, 0, W, H);
    g.fillStyle = '#7f55e6'; g.fillRect(0, BED_Y + BED_H - 1, W, H);
    // window with a torn screen: the ragged hole spans the exit height (winY0..winY1)
    g.fillStyle = '#5b3f8f'; rr(-8, 40, 86, 136, 6); g.fill(); line(INK, 4);
    g.fillStyle = '#141a52'; g.fillRect(0, 48, 70, 120);
    g.strokeStyle = 'rgba(190,200,255,0.28)'; g.lineWidth = 1; g.beginPath();
    for (var i = 7; i < 70; i += 9) { g.moveTo(i, 48); g.lineTo(i, 168); }
    for (var j = 57; j < 168; j += 9) { g.moveTo(0, j); g.lineTo(70, j); }
    g.stroke();
    g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(52, 66, 9, 0, 6.3); g.fill();
    g.fillStyle = '#141a52'; g.beginPath(); g.arc(56, 63, 8, 0, 6.3); g.fill();
    var hole = [[0,62],[14,70],[24,63],[27,80],[46,82],[34,94],[48,106],[31,108],[36,126],[20,118],[10,130],[0,126]];
    g.beginPath(); hole.forEach(function (pt, k) { if (k) g.lineTo(pt[0], pt[1]); else g.moveTo(pt[0], pt[1]); }); g.closePath();
    g.fillStyle = '#070a24'; g.fill(); line('#ffe36b', 3);
    g.beginPath(); g.moveTo(54, 80); g.lineTo(66, 76); g.moveTo(56, 96); g.lineTo(70, 96); g.moveTo(54, 112); g.lineTo(66, 118); line('#ffe36b', 3);
    // curtain and sill
    g.beginPath(); g.moveTo(68, 40); g.quadraticCurveTo(100, 78, 76, 122); g.quadraticCurveTo(96, 150, 92, 186); g.lineTo(74, 184); g.quadraticCurveTo(78, 150, 68, 124); g.closePath(); g.fillStyle = '#a47be0'; g.fill(); line(INK, 3);
    g.fillStyle = '#7a55b8'; rr(-8, 170, 100, 12, 4); g.fill(); line(INK, 3);
    g.fillStyle = '#7a55b8'; rr(-8, 34, 112, 10, 5); g.fill(); line(INK, 3);
  }

  // Which sheet and frame to show. Reactions follow the rule timers; `after` only holds the last frame a moment.
  function sleeperPose(q) {
    if (q.state === 'dead' && q.result) {
      if (q.result.cause === 'itch') return [q.result.part, overT < 0.4 ? 2 : 3];
      if (q.result.cause === 'roll') return ['roll', overT < 0.55 ? 2 : 3];
      return ['swat', 3];
    }
    if (q.light.on) return ['swat', swatFrame(q)];
    if (q.roll.phase === 'sweep') return ['roll', 2];
    if (q.itch.phase === 'grab' && q.itch.zone) return [q.itch.zone.id, 2];
    if (q.roll.phase === 'warn') return ['roll', q.roll.t > MQC.rollWarn / 2 ? 0 : 1];
    if (q.itch.phase === 'wind' && q.itch.zone) return [q.itch.zone.id, q.itch.t > MQC.itchWind * 0.65 ? 0 : 1];
    if (after.t > 0) return [after.sheet, 3];
    return ['idle', q.alert < 35 ? 0 : q.alert < 65 ? 1 : 2];
  }

  function drawHuman(q, tt) {
    var pose = sleeperPose(q), sheet = ready(pose[0]) ? pose[0] : 'idle';
    if (ready(sheet)) {
      var f = sheet === pose[0] ? pose[1] : 2;
      g.drawImage(ART[sheet], (f % 2) * FW, Math.floor(f / 2) * FH, FW, FH, 0, BED_Y, W, BED_H);
    }
    var rl = q.roll, it = q.itch;
    if (st !== 'run') return;
    // landing markers on the three bare-skin spots
    if (!q.light.on && rl.phase !== 'sweep') for (var i = 0; i < MQZ.length; i++) {
      var z = MQZ[i], mx = (z.x0 + z.x1) / 2, my = z.y - skinLift(mx) - (z.id === 'face' ? 74 : 56) + (reduceMotion ? 0 : Math.sin(tt * 5 + i) * 3);
      if (q.mode === 'suck' && q.zone === z) continue;
      if (z.id === 'foot') mx = 428;
      g.beginPath(); g.moveTo(mx - 9, my); g.lineTo(mx + 9, my); g.lineTo(mx, my + 11); g.closePath(); g.fillStyle = '#ffe36b'; g.fill(); line(INK, 2.5);
    }
    if (it.phase === 'wind' && it.zone) {
      var zn = it.zone, cx = (zn.x0 + zn.x1) / 2, cy = zn.y - skinLift(cx), pp = 1 - it.t / MQC.itchWind;
      for (var k = 0; k < 3; k++) { var rad = ((pp * 2 + k / 3) % 1) * 34 + 6; g.strokeStyle = 'rgba(255,90,90,' + (0.9 - rad / 45) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, rad * 1.5, rad * 0.55, 0, 0, 6.3); g.stroke(); }
      text('{{t:mosquito.msg.001}}', Math.max(90, Math.min(390, cx)), zn.y - 150 + Math.sin(tt * 10) * 3, 20, '#fff0f0', 'center', INK);
    }
    // roll: everything below rollSafeY is lethal, so show that line clearly
    if (rl.phase === 'warn' || rl.phase === 'sweep') {
      var hot = rl.phase === 'sweep', y0 = MQC.rollSafeY;
      g.fillStyle = hot ? 'rgba(255,70,90,0.24)' : 'rgba(255,70,90,0.1)'; g.fillRect(0, y0, W, BED_Y + BED_H - y0);
      g.setLineDash([12, 9]); g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); line(hot || Math.floor(tt * 6) % 2 === 0 ? '#ff5a6e' : '#ffc0c8', 4); g.setLineDash([]);
    }
  }

  function drawMosquito(q, tt) {
    var p = q.blood / 100, d = q.light.on ? -1 : q.dir, suck = q.mode === 'suck', stun = q.mode === 'stun';
    var n = stun ? 4 : suck ? 2 : q.light.on ? 5 : p >= 0.6 ? 3 : (!reduceMotion && Math.floor(tt * 18) % 2) ? 1 : 0;
    var k = 0.3 * (1 + p * 0.18), w = MQ_SPRITE[n][0] * k, h = MQ_SPRITE[n][1] * k;
    // ease from "centred on the rule position" to "feet on the drawn skin" as it gets close
    var surf = mosquitoRules.mqSurface(q.x), near = suck ? 1 : Math.max(0, Math.min(1, (q.y + MQC.R - surf.y + 90) / 90));
    var bottom = lerp(q.y + h * 0.45, q.y + MQC.R + 2 - skinLift(q.x), near);
    if (!suck && !stun && !reduceMotion && st === 'run') {
      // whiny buzz: a short zigzag tail that fades out behind it
      g.beginPath(); for (var b = 0; b <= 6; b++) { var bx = q.x - d * (w * 0.5 + b * 7), by = q.y + Math.sin(b * 2.2 - tt * 26) * (3 + b); if (b) g.lineTo(bx, by); else g.moveTo(bx, by); }
      line('rgba(225,215,255,0.4)', 2);
    }
    g.save(); g.translate(q.x, bottom - h / 2);
    g.scale(d, 1); if (!suck && !stun) g.rotate(Math.max(-0.35, Math.min(0.4, q.vy / 520)));
    if (ready('mosquito')) g.drawImage(ART.mosquito, n * 240 + (240 - MQ_SPRITE[n][0]) / 2, 200 - MQ_SPRITE[n][1], MQ_SPRITE[n][0], MQ_SPRITE[n][1], -w / 2, -h / 2, w, h);
    else { g.fillStyle = bloodColor(p); g.beginPath(); g.arc(0, 0, 9, 0, 6.3); g.fill(); }
    if (suck && p > 0.08) {
      var br = 3 + p * 11; g.beginPath(); g.ellipse(-w * 0.2, h * 0.04, br * 1.2, br, 0, 0, 6.3); g.fillStyle = bloodColor(Math.max(0.35, p)); g.fill(); line(INK, 2);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(-w * 0.2 - br * 0.4, h * 0.04 - br * 0.4, br * 0.22, 0, 6.3); g.fill();
    }
    g.restore();
    if (stun) { for (var s2 = 0; s2 < 3; s2++) { var a = tt * 8 + s2 * 2.1; text('★', q.x + Math.cos(a) * 22, bottom - h - 4 + Math.sin(a) * 5, 14, '#ffe066', 'center', INK); } }
  }

  // The zapper is part of the art (swat sheet: frame 2 wind-up, frame 3 swing). Here: only the spark that reaches
  // the mosquito at the end of the swing. SWAT_HEAD is the centre of the mesh in each of those two frames.
  var SWAT_HEAD = { 2: [162, 321], 3: [326, 374] };
  function swatFrame(q) { return MQC.lightTime - q.light.t < MQC.lightTime * 0.65 ? 2 : 3; }
  function drawZap(q) {
    var p = (MQC.lightTime - q.light.t) / MQC.lightTime;
    if (p <= 0.85) return;
    var from = SWAT_HEAD[swatFrame(q)], aim = Math.atan2(q.y - from[1], q.x - from[0]);
    g.beginPath(); g.moveTo(from[0], from[1]);
    for (var k = 1; k < 6; k++) { var u = k / 6, side = (k % 2 ? 1 : -1) * 12; g.lineTo(lerp(from[0], q.x, u) - Math.sin(aim) * side, lerp(from[1], q.y, u) + Math.cos(aim) * side); }
    g.lineTo(q.x, q.y); line(INK, 8); line('#fff27a', 4);
  }
  // While the lights are on, the only way out is the hole: show the height to fly at.
  function drawExitGuide(tt) {
    var y0 = MQC.winY0, y1 = MQC.winY1, on = reduceMotion || Math.floor(tt * 6) % 2 === 0;
    g.fillStyle = 'rgba(110,255,170,0.22)'; g.fillRect(0, y0, 190, y1 - y0);
    g.setLineDash([10, 7]); g.beginPath(); g.moveTo(0, y0); g.lineTo(190, y0); g.moveTo(0, y1); g.lineTo(190, y1); line(on ? '#6effaa' : '#ffffff', 4); g.setLineDash([]);
    var my = (y0 + y1) / 2, ax = 62 + (reduceMotion ? 0 : Math.sin(tt * 12) * 6);
    g.beginPath(); g.moveTo(ax, my); g.lineTo(ax + 28, my - 20); g.lineTo(ax + 28, my - 8); g.lineTo(ax + 62, my - 8); g.lineTo(ax + 62, my + 8); g.lineTo(ax + 28, my + 8); g.lineTo(ax + 28, my + 20); g.closePath(); g.fillStyle = '#6effaa'; g.fill(); line(INK, 3);
  }

  function drawBar(x, y, w, h, p, color) {
    rr(x, y, w, h, h / 2); g.fillStyle = '#fff3d6'; g.fill();
    if (p > 0) { g.fillStyle = color; rr(x, y, Math.max(h, w * p), h, h / 2); g.fill(); }
    rr(x, y, w, h, h / 2); line(INK, 3);
  }

  function drawHUD(q, tt) {
    var p = q.blood / 100, a = q.alert / 100;
    text('{{t:mosquito.msg.002}}', 16, 22, 15, '#ffd6d6', 'left', INK);
    drawBar(64, 13, 356, 18, p, bloodColor(Math.max(0.35, p)));
    text(q.blood.toFixed(1) + '%', 470, 22, 13, '#fff', 'right', INK);
    text('{{t:mosquito.msg.003}}', 16, 46, 15, '#ffe9b0', 'left', INK);
    var col = a > 0.7 ? '#ff4040' : a > 0.4 ? '#ff9f2e' : '#ffd23f';
    drawBar(64, 37, 356, 18, a, col);
    text(Math.floor(q.alert) + '%', 470, 46, 13, '#fff', 'right', INK);
    if (a > 0.7 && Math.floor(tt * 6) % 2 === 0) { g.strokeStyle = '#ff4040'; g.lineWidth = 2; rr(64, 37, 356, 18, 9); g.stroke(); }
    if (hintText) text(hintText, 240, 214, 18, '#fff', 'center', 'rgba(0,0,0,0.75)');
  }

  function computeHint(q) {
    if (q.light.on) return '{{t:mosquito.msg.004}}';
    if (q.itch.phase === 'wind') return '{{t:mosquito.msg.005}}';
    if (q.roll.phase === 'warn') return '{{t:mosquito.msg.006}}';
    if (q.blood >= 100) return '{{t:mosquito.msg.007}}';
    if (q.mode === 'suck') return '{{t:mosquito.msg.008}}';
    if (q.t < 6) return '{{t:mosquito.msg.009}}';
    return '';
  }

const rank=timedLeaderboard('mosquito','mq',mosquitoRules.inputCount,ui);
let st='ready',mo=mqNew(Math.random),tt=0,last=0,overT=0,rec=false,shake=0,flash=0,hintText='',splat=[],result=null;
const after={sheet:'idle',t:0}; // holds a reaction's last frame (drawing only)
const CAUSE={face:'{{t:mosquito.msg.010}}',arm:'{{t:mosquito.msg.011}}',foot:'{{t:mosquito.msg.012}}',roll:'{{t:mosquito.msg.013}}',light:'{{t:mosquito.msg.014}}'};
const ptrs=new Set();let keyHeld=false;
const held=()=>ptrs.size>0||keyHeld;
const releaseInput=()=>{ptrs.clear();keyHeld=false};
function say(text,kind){$('mq-msg').textContent=text;$('mq-msg').className='msg'+(kind?' '+kind:'')}
mqSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('mq-blood',mo.blood.toFixed(1)+'%');setText('mq-alert',Math.floor(mo.alert)+'%');setText('mq-best',best.toFixed(1)+'%');
 $('mq-amount').disabled=mqBusy;$('mq-go').disabled=live||rank.busy();setText('mq-go',live?'{{t:mosquito.msg.015}}':st==='over'?'{{t:mosquito.msg.016}}':'{{t:mosquito.msg.017}}');
}
function pay(n){
 earned+=n;paidCount++;S.balance+=n;save();renderAll();
 AN.progress(analytics,{stage:1,step:paidCount,score:Math.round(mo.blood),bonus_points:n,total_bonus_points:earned});
}
function checkMilestones(){
 for(let i=0;i<MQ_REWARDS.length;i++){
  if(!paid[i]&&mo.blood>=MQ_REWARDS[i][0]){paid[i]=true;pay(MQ_REWARDS[i][1]);say('吸血達 '+MQ_REWARDS[i][0]+'{{t:mosquito.msg.018}}'+MQ_REWARDS[i][1]+' 點已入帳。','win')}}
}
function finish(kind){
 if(st!=='run')return;
 rank.finish(Math.round(mo.blood));
 st='over';overT=0;releaseInput();
 const r=mo.result||{blood:mo.blood};
 result={kind:kind,blood:r.blood,cause:r.cause||'',part:r.part||'',time:r.time||mo.t};
 rec=result.blood>best;
 if(rec){best=Math.round(result.blood*10)/10;try{localStorage.setItem('deep-sea-mosquito-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:Math.round(result.blood),step:paidCount,stage:1});mqBusy=false;save();renderAll();
 const pct=result.blood.toFixed(1);
 if(kind==='won')say('吸飽了！成功飛出窗戶，本局共入帳 '+fmt(earned)+' 點。','win');
 else if(kind==='escaped'){if(earned)say('死裡逃生！只吸到 '+pct+'%，沒有過關，本局共入帳 '+fmt(earned)+' 點。','win');else say('死裡逃生！只吸到 '+pct+'{{t:mosquito.msg.019}}','lose')}
 else{if(earned)say('被拍扁了。吸飽度 '+pct+'%，本局共入帳 '+fmt(earned)+' 點。','win');else say('被拍扁了。吸飽度 '+pct+'{{t:mosquito.msg.020}}','lose')}
 ui();
}
function handleEvents(){
 const evs=mo.events.slice();mo.events.length=0;
 for(const e of evs){
  if(e.type==='crash'&&!reduceMotion)shake=.25;
  else if(e.type==='grab'&&!reduceMotion)shake=.3;
  else if(e.type==='roll'&&!reduceMotion)shake=.5;
  else if(e.type==='light'&&!reduceMotion)flash=1;
  else if(e.type==='dead'){
   if(!reduceMotion)shake=.4;
   for(let k=0;k<14;k++)splat.push({x:mo.x+(Math.random()-.5)*20,y:mo.y+(Math.random()-.5)*20,r:2+Math.random()*6,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160});
   finish('dead')}
  else if(e.type==='win'){if(!winPaid){winPaid=true;pay(MQ_WIN_REWARD)}finish('won')}
  else if(e.type==='escape')finish('escaped');
 }
}
function tick(dt){
 if(helpOpen)return; // the how-to card pauses the round; leaderboard ticks stop with it
 tt+=dt;
 if(st==='run'){
  if(mo.roll.phase==='sweep'){after.sheet='roll';after.t=.45}
  else if(mo.itch.phase==='grab'&&mo.itch.zone){after.sheet=mo.itch.zone.id;after.t=.7}
  else if(after.t>0)after.t-=dt;
 }
 if(shake>0)shake=Math.max(0,shake-dt*1.5);if(flash>0)flash=Math.max(0,flash-dt*2.5);
 if(st==='run'){
   if(mo.held!==held()){const code=held()?0:1;mosquitoRules.input(mo,code);rank.record(code);}
   rank.update(dt*1000,()=>st==='run',step=>{mosquitoRules.advance(mo,step);checkMilestones();handleEvents();});
   hintText=st==='run'?computeHint(mo):'';
 }
 else if(st==='over'){
  overT+=dt;
  for(const s of splat){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=400*dt;s.vx*=.96}
 }
}
function drawOverlay(){
 if(st==='ready'){
  g.fillStyle='rgba(8,8,16,.72)';g.fillRect(0,0,W,H);
  text('{{t:mosquito.msg.021}}',240,130,54,'#ff5a5a','center','#200');text('{{t:mosquito.msg.022}}',240,184,26,'#ffd6d6','center','#200');
  const ins=['{{t:mosquito.msg.023}}','{{t:mosquito.msg.024}}','{{t:mosquito.msg.025}}','{{t:mosquito.msg.026}}','{{t:mosquito.msg.027}}','{{t:mosquito.msg.028}}'];
  for(let i=0;i<ins.length;i++)text(ins[i],240,250+i*30,18,'#e8e8f4');
  text('{{t:mosquito.msg.029}}',240,560,24,'#ffd23f','center','#000');
  return}
 if(st!=='over'||!result)return;
 const r=result;
 if(r.kind==='dead'){
  if(!reduceMotion&&overT<.8)return;
  g.fillStyle='rgba(30,0,0,'+(reduceMotion?.6:Math.min(.6,(overT-.8)*3))+')';g.fillRect(0,0,W,H);
  text('{{t:mosquito.msg.030}}',240,250,32,'#ffd6d6','center','#200');
  text('吸飽度 '+r.blood.toFixed(1)+'%',240,330,52,'#ff2a2a','center','#200');
  text(r.blood>=95?'{{t:mosquito.msg.031}}':r.blood>=80?'{{t:mosquito.msg.032}}':'{{t:mosquito.msg.033}}',240,388,20,'#ffd6d6');
  text(CAUSE[r.cause==='itch'?r.part:r.cause],240,426,18,'#ffb0b0');
 }else if(r.kind==='won'){
  g.fillStyle='rgba(0,20,10,.6)';g.fillRect(0,0,W,H);
  text('{{t:mosquito.msg.034}}',240,270,52,'#7dffb0','center','#031');
  text('成功飛出窗戶　用時 '+r.time.toFixed(1)+' 秒',240,340,20,'#d8ffe8');
 }else{
  g.fillStyle='rgba(10,10,30,.6)';g.fillRect(0,0,W,H);
  text('{{t:mosquito.msg.035}}',240,270,48,'#9ec3ff','center','#012');
  text('但你只吸到 '+r.blood.toFixed(1)+'{{t:mosquito.msg.036}}',240,340,20,'#dce8ff');
 }
 text(earned>0?'本局入帳 '+fmt(earned)+' 點':'{{t:mosquito.msg.037}}',240,468,22,earned>0?'#ffd23f':'#fff1c1');
 if(rec)text('{{t:mosquito.msg.038}}',240,502,20,'#ffd23f');
 text('{{t:mosquito.msg.039}}',240,560,20,'#fff1c1');
}
function draw(){
 if(shown())loadArt();
 const sx=shake>0?(Math.random()-.5)*20*shake:0,sy=shake>0?(Math.random()-.5)*20*shake:0;
 g.save();g.translate(sx,sy);
 drawRoom(mo.alert/100,mo.light.on);
 drawHuman(mo,tt);
 const showMq=st!=='ready'&&!(st==='over'&&result&&result.kind==='dead')&&mo.state!=='escaped';
 if(st==='ready')drawMosquito({x:240+Math.sin(tt)*140,y:300+Math.sin(tt*1.7)*50,dir:Math.cos(tt)>0?1:-1,blood:0,mode:'fly',pressed:false,vy:0,light:{on:false}},tt);
 else if(showMq&&!mo.light.on)drawMosquito(mo,tt);
 if(mo.light.on&&st!=='ready'){g.fillStyle='rgba(255,226,130,'+(reduceMotion?.3:.3+Math.sin(tt*30)*.05)+')';g.fillRect(0,0,W,H);if(st==='run')drawExitGuide(tt);if(mo.state==='play'||mo.state==='dead')drawZap(mo);if(showMq)drawMosquito(mo,tt)}
 for(const s of splat){g.fillStyle='#b00020';g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill()}
 if(st==='run')drawHUD(mo,tt);
 g.restore();
 if(flash>0){g.fillStyle='rgba(255,255,255,'+flash*.6+')';g.fillRect(0,0,W,H)}
 drawOverlay();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 rank.start(random=>{
 analytics=AN.start('mosquito',amount);mqStake=amount;mqBusy=true;save();renderAll();
 mo=mosquitoRules.create(random||Math.random);earned=0;paid=[false,false,false];winPaid=false;paidCount=0;rec=false;result=null;splat=[];shake=0;flash=0;hintText='';after.t=0;releaseInput();
 st='run';last=performance.now();say('{{t:mosquito.msg.040}}');ui();cv.focus();
 },ui,{rulesVersion:mosquitoRules.rulesVersion});
}
const shown=()=>!$('view-mosquito').hidden&&!document.hidden;
let helpOpen=false;
function setHelp(open){
 if(helpOpen===open)return;
 helpOpen=open;releaseInput();last=performance.now();$('mq-help').hidden=!open;
 if(open)$('mq-help-close').focus();else if(st==='run')cv.focus();else $('mq-info').focus();
}
$('mq-info').addEventListener('click',()=>setHelp(true));
$('mq-help-close').addEventListener('click',()=>setHelp(false));
$('mq-help').addEventListener('click',e=>{if(e.target===$('mq-help'))setHelp(false)});
window.addEventListener('hashchange',()=>setHelp(false));
$('mq-go').addEventListener('click',start);
cv.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'{{t:mosquito.msg.041}}':'{{t:mosquito.msg.042}}');return}
 if(!shown())return;e.preventDefault();cv.focus();try{cv.setPointerCapture(e.pointerId)}catch(_){}
 ptrs.add(e.pointerId)});
const endPointer=e=>{ptrs.delete(e.pointerId)};
cv.addEventListener('pointerup',endPointer);cv.addEventListener('pointercancel',endPointer);cv.addEventListener('lostpointercapture',endPointer);
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!shown()||helpOpen||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(e.key===' '){e.preventDefault();keyHeld=true}});
addEventListener('keyup',e=>{if(e.key===' ')keyHeld=false});
addEventListener('blur',()=>{releaseInput();last=performance.now()});
document.addEventListener('visibilitychange',()=>{releaseInput();last=performance.now()});
window.addEventListener('hashchange',()=>{releaseInput();last=performance.now()});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){tick(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
