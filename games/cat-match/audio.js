function createCatMatchSound($,isPaused,isEnded,T){return (()=>{
 const storageKey='deep-sea-cat-match-audio-v1';let music=true,effects=true,context=null,musicBus=null,effectBus=null,timer=null,next=0,beat=0,unavailable=false;
 const voices=new Set();
 try{let settings=JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem('proto-cat-match-audio-v1'));if(settings){music=settings.music!==false;effects=settings.effects!==false}}catch{}
 const notes=[72,76,79,76,74,0,72,0,69,72,76,72,67,0,69,0,65,69,72,76,74,72,69,0,67,71,74,79,76,74,72,0,76,79,81,79,76,0,74,0,72,76,79,76,72,0,69,0,69,72,77,76,74,72,69,0,67,71,74,76,74,71,72,0];
 const bass=[48,45,41,43,48,45,41,43];
 function tone(note,when,duration,volume,bus,type='sine'){
  if(!context||!bus)return;let osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(440*Math.pow(2,(note-69)/12),when);
  gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.012);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(gain);gain.connect(bus);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect()};osc.start(when);osc.stop(when+duration+.02);
 }
 function active(){return !document.hidden&&!isPaused()&&!isEnded()}
 function schedule(){if(!context||!music||!active()||context.state!=='running')return;let now=context.currentTime;if(next<now)next=now+.03;
  while(next<now+.16){let note=notes[beat%notes.length];if(note)tone(note,next,.55,.055,musicBus,'sine');if(beat%8===0){let root=bass[Math.floor(beat/8)%bass.length];tone(root,next,1.6,.045,musicBus);tone(root+7,next+.012,1.2,.02,musicBus)}beat++;next+=.29}
 }
 function sync(){
  for(let [id,on,label] of [['musicToggle',music,'音樂'],['soundToggle',effects,'音效']]){let button=$(id);button.textContent=unavailable?T('unsupported'):T(id==='musicToggle'?'music':'effects')+' · '+T(on?'on':'off');button.setAttribute?.('aria-pressed',String(on&&!unavailable));button.disabled=unavailable}
  if(!context)return;let now=context.currentTime;musicBus.gain.setValueAtTime(music&&active()?1:0,now);effectBus.gain.setValueAtTime(effects&&!document.hidden?1:0,now);
  if(music&&active()&&context.state==='running'){if(timer===null){next=now+.04;schedule();timer=setInterval(schedule,100)}}else if(timer!==null){clearInterval(timer);timer=null}
 }
 function unlock(){if(unavailable||document.hidden)return;try{if(!context){const Constructor=window.AudioContext||window.webkitAudioContext;if(!Constructor){unavailable=true;sync();return}context=new Constructor();musicBus=context.createGain();effectBus=context.createGain();musicBus.connect(context.destination);effectBus.connect(context.destination);context.onstatechange=sync}let result=context.state==='suspended'?context.resume():null;if(result?.then)result.then(sync).catch(()=>{});sync()}catch{unavailable=true;sync()}}
 function play(kind,chain=1){if(!context||context.state!=='running'||!effects||document.hidden)return;let phrase={swap:[67,74],invalid:[57,53],clear:[72,76,79],special:[79,83,86,91],win:[72,76,79,84,79,84],lose:[69,65,60],hint:[79,84],shuffle:[60,64,67,72]}[kind]||[];let now=context.currentTime;phrase.forEach((n,i)=>tone(n+Math.min(4,Math.max(0,chain-1))*2,now+i*.055,kind==='win'?.42:.19,kind==='swap'?.045:.075,effectBus,'sine'))}
 function toggle(which){unlock();if(which==='music')music=!music;else effects=!effects;try{localStorage.setItem(storageKey,JSON.stringify({music,effects}))}catch{}sync()}
 function background(){sync();if(document.hidden||!music&&!effects){context?.suspend()?.catch(()=>{})}}
 function leave(){if(timer!==null)clearInterval(timer);timer=null;try{musicBus?.gain.setValueAtTime(0,context.currentTime);effectBus?.gain.setValueAtTime(0,context.currentTime);context?.suspend()?.catch(()=>{})}catch{}}
 $('musicToggle').onclick=()=>toggle('music');$('soundToggle').onclick=()=>toggle('effects');
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});document.addEventListener('visibilitychange',background);window.addEventListener('pagehide',leave);sync();
 return {play,sync};
})();}
