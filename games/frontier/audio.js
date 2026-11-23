/* Frontier Islands sound effects: synthesized with the Web Audio API, no audio files. */
var ftSfx=(function(){
  var ctx=null,master=null,noiseBuf=null,muted=false,lastPlay={};
  try{muted=localStorage.getItem('frontier-muted')==='1';}catch(e){}
  function init(){
    if(ctx){if(ctx.state==='suspended')ctx.resume();return true;}
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    try{ctx=new AC();}catch(e){return false;}
    master=ctx.createGain();master.gain.value=muted?0:.5;master.connect(ctx.destination);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    return true;
  }
  /* Oscillator with pitch glide and attack/decay envelope. */
  function tone(type,f0,f1,dur,vol,delay){
    var t=ctx.currentTime+(delay||0),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02);
  }
  /* Filtered noise burst for thuds, chops and whooshes. */
  function noise(ftype,f0,f1,dur,vol,delay,q){
    var t=ctx.currentTime+(delay||0),s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=noiseBuf;f.type=ftype;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+.02);
  }
  var sounds={
    wood:function(){noise('bandpass',900,300,.09,.7,0,2);tone('square',180,90,.07,.18);},          /* chop a tree */
    stone:function(){noise('highpass',3000,2000,.06,.5);tone('triangle',1400,900,.09,.25);tone('square',2200,1600,.04,.08);}, /* mine a rock */
    pickup:function(){tone('sine',660,990,.09,.25);tone('sine',990,1320,.1,.22,.07);},
    delivery:function(){tone('triangle',523,523,.1,.25);tone('triangle',659,659,.1,.25,.08);tone('triangle',784,784,.16,.25,.16);},
    build:function(){noise('lowpass',500,150,.18,.8);tone('square',110,70,.14,.3);tone('triangle',440,660,.1,.2,.14);},
    hit:function(){noise('bandpass',1800,500,.12,.6,0,1.2);tone('sawtooth',220,70,.12,.3);},
    dash:function(){noise('bandpass',500,2400,.22,.5,0,.8);},
    hurt:function(){tone('sawtooth',300,90,.25,.4);noise('lowpass',800,200,.2,.5);},
    ui:function(){tone('triangle',700,900,.07,.22);},
    upgrade:function(){tone('square',392,392,.08,.18);tone('square',523,523,.08,.18,.08);tone('square',659,659,.08,.18,.16);tone('square',784,784,.2,.2,.24);},
    coin:function(){tone('square',988,988,.06,.18);tone('square',1319,1319,.18,.18,.06);},
    deny:function(){tone('square',160,120,.16,.22);},
    win:function(){[523,659,784,1047].forEach(function(f,i){tone('triangle',f,f,.28,.3,i*.12);});tone('sine',1047,1047,.6,.2,.5);},
    lose:function(){[392,330,262,196].forEach(function(f,i){tone('sawtooth',f,f*.97,.3,.25,i*.18);});}
  };
  function play(name){
    if(muted||!sounds[name]||!init())return;
    var now=ctx.currentTime,gap=name==='hit'?.05:name==='wood'||name==='stone'?.08:.03;
    if(lastPlay[name]&&now-lastPlay[name]<gap)return;lastPlay[name]=now;
    try{sounds[name]();}catch(e){}
  }
  var seen=typeof WeakSet==='function'?new WeakSet():null;
  /* Call every frame: plays a sound once per new world effect, and for player damage. */
  function scan(w){
    if(!w||!seen)return;
    var list=w.effects||[];
    for(var i=0;i<list.length;i++){
      var e=list[i];if(seen.has(e))continue;seen.add(e);
      if(e.kind==='wood'||e.kind==='stone'){if(e.px===undefined)continue;play(e.kind);} /* only the player's own swings, not workers */
      else if(sounds[e.kind]&&e.kind!=='hurt')play(e.kind);
    }
    var hp=w.p&&w.p.hp;
    if(typeof hp==='number'){if(scan.hp!==undefined&&hp<scan.hp)play('hurt');scan.hp=hp;}
  }
  function reset(){scan.hp=undefined;}
  function toggle(){muted=!muted;try{localStorage.setItem('frontier-muted',muted?'1':'0');}catch(e){}if(master)master.gain.value=muted?0:.5;if(!muted)play('ui');return muted;}
  return {play:play,scan:scan,reset:reset,toggle:toggle,init:init,isMuted:function(){return muted;}};
})();
