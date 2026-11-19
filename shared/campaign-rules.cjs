const campaignRules=(()=>{
function create(random=Math.random,event=()=>{},CP={}) {
  var CP_START=200,CP_GAIN=200,CP_QUIET=100,CP_PENALTY=400,CP_MAX_MISS=5,CP_NOISE_LIMIT=.3,CP_NEGLECT=.3;
  // The truck starts fast and keeps accelerating up to a cap; quiet zones get more frequent as the street goes on.
  var CP_V0=300,CP_VK=.06,CP_VMAX=800,CP_TRUCK=150,CP_GAP=26,CP_LEAD=430,CP_GROUND=330,CP_PQ0=.35,CP_PQK=.004,CP_PQMAX=.6;
  // Milestones count votes and were calibrated with a mute-timing simulation (see GAME_RULES.md).
  var CP_MILESTONES=[[8000,3],[10000,7],[12000,15],[15000,30]],CP_ENDLESS_FROM=15000,CP_ENDLESS_STEP=3000,CP_ENDLESS_BONUS=40;
  function cpNextMilestone(v){for(var i=0;i<CP_MILESTONES.length;i++)if(CP_MILESTONES[i][0]>v)return CP_MILESTONES[i];return [CP_ENDLESS_FROM+(Math.floor((v-CP_ENDLESS_FROM)/CP_ENDLESS_STEP)+1)*CP_ENDLESS_STEP,CP_ENDLESS_BONUS];}
  var CP_KINDS={'學校':{w:220,h:150,quiet:true},'醫院':{w:190,h:184,quiet:true},'豪宅':{w:210,h:150,quiet:true},'住宅':{w:170,h:158},'公寓':{w:160,h:178},'商店':{w:150,h:112},'市場':{w:200,h:104},'夜市':{w:200,h:122},'公園':{w:190,h:112},'廟口':{w:190,h:150}};
  function cpSpeed(){return Math.min(CP_VMAX,CP_V0+CP_VK*CP.dist);}
  function cpPassed(){return CP.cleared+CP.idx;}
  // Endless street: buildings are generated just ahead of the truck. The first two are ordinary and quiet buildings never come three in a row.
  function cpMake(){
    var quiet=['學校','醫院','豪宅'],normal=['住宅','商店','公寓','市場','公園','廟口','夜市'],n=CP.n++,pq=Math.min(CP_PQMAX,CP_PQ0+CP_PQK*n),isQ=n>=2&&CP.qrun<2&&random()<pq,name;
    CP.qrun=isQ?CP.qrun+1:0;
    name=isQ?quiet[Math.floor(random()*3)]:normal[Math.floor(random()*7)];
    var k=CP_KINDS[name],x=CP.nx;CP.nx=x+k.w+CP_GAP;
    CP.lots.push({name:name,quiet:!!k.quiet,w:k.w,h:k.h,x0:x,x1:x+k.w,seed:n,tot:0,noisy:0,flash:-9,good:true});
  }
  function cpEnsure(){while(CP.lots.length<CP.idx+14)cpMake();}
  function cpCity(){CP.lots=[];CP.n=0;CP.qrun=0;CP.nx=CP_LEAD;CP.cleared=0;CP.idx=0;cpEnsure();}
  function cpSettle(lot){
    var frac=lot.tot>0?lot.noisy/lot.tot:0;lot.flash=CP.clock;
    if(lot.quiet){
      if(frac>CP_NOISE_LIMIT){
        CP.miss++;CP.votes=Math.max(0,CP.votes-CP_PENALTY);lot.good=false;cpFloat(lot,'吵到'+lot.name+' −'+CP_PENALTY,'bad');
        if(CP.miss>=CP_MAX_MISS){cpLose('吵到安靜區了。');return;}
      }else{CP.votes+=CP_QUIET;lot.good=true;cpFloat(lot,'安靜通過 +'+CP_QUIET,'good');}
    }else{
      var gain=Math.round(CP_GAIN*frac/10)*10;CP.votes+=gain;
      if(frac<CP_NEGLECT){CP.miss++;lot.good=false;cpFloat(lot,'沒宣傳到'+(gain>0?' +'+gain:''),'bad');if(CP.miss>=CP_MAX_MISS){cpLose('一般路段靜音太久，沒有拉到票。');return;}}
      else{lot.good=true;cpFloat(lot,'+'+gain+' 票','gain');}
    }
    event('settled');
  }
  function cpStep(dt){
    // Small slices keep zone entry and exit accurate on delayed frames.
    while(dt>1e-8&&CP.phase==='run'){
      var step=Math.min(dt,.012),v=cpSpeed();
      CP.dist+=v*step;CP.clock+=step;CP.wheel+=v*step/12;dt-=step;
      CP.pops.forEach(function(p){p.age+=step;});CP.pops=CP.pops.filter(function(p){return p.age<2.2;});
      var wx=CP.dist+CP_TRUCK;
      while(CP.idx<CP.lots.length&&wx>=CP.lots[CP.idx].x1){
        cpSettle(CP.lots[CP.idx]);if(CP.phase!=='run')return;
        CP.idx++;if(cpPassed()%15===0)event('progress');
        if(CP.idx>40){CP.lots.splice(0,20);CP.idx-=20;CP.cleared+=20;}
        cpEnsure();
      }
      if(CP.idx<CP.lots.length){var lot=CP.lots[CP.idx];if(wx>=lot.x0){lot.tot+=step;if(!CP.hold)lot.noisy+=step;}}
    }
  }

function cpFloat(lot,text,kind){event('float',{lot,text,kind});}
function cpLose(reason){CP.dead=true;CP.phase='lost';event('lost',reason);}
Object.assign(CP,{dist:0,votes:CP_START,miss:0,clock:0,wheel:0,pops:[],hold:false,phase:'run',dead:false});
cpCity();
CP.advance=cpStep;
return CP;
}
function input(state,code){
if(state.dead||(code!==0&&code!==1)||state.hold===(code===0))return false;
state.hold=code===0;return true;
}
return {create,inputCount:2,input,advance:(state,dt)=>state.advance(dt),score:state=>state.votes};
})();
if(typeof module!=='undefined')module.exports=campaignRules;
