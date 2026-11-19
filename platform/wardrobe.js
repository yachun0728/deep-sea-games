/* Platform-owned cosmetics and fixed play rewards. Existing wallet key and game bonuses stay intact. */
(function(){
 var KEY='deep-sea-wardrobe-v1',ready=false,queue=Promise.resolve(),data=null;
 var items=[
  {id:'explorer',slot:'hat',name:'探險家軟帽',price:80,icon:'🧭',color:'#d6b375'},
  {id:'sailor',slot:'hat',name:'水手帽',price:120,icon:'⚓',color:'#e6eee7'},
  {id:'tide',slot:'jacket',name:'潮汐外套',price:160,icon:'🌊',color:'#5faeb1'},
  {id:'coral',slot:'jacket',name:'珊瑚外套',price:180,icon:'🪸',color:'#e99c8c'},
  {id:'robot',slot:'friend',name:'口袋機器人',price:240,icon:'🤖',color:'#b2dbd5'},
  {id:'catfriend',slot:'friend',name:'跟隨小貓',price:260,icon:'🐈',color:'#e5b980'}
 ];
 function day(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
 function fresh(){return {version:1,owned:[],equipped:{hat:null,jacket:null,friend:null},day:day(),playMs:0,playPaid:0,completed:[]};}
 function read(){
  var raw=localStorage.getItem(KEY),d=raw?JSON.parse(raw):fresh();
  if(!d||d.version!==1||!Array.isArray(d.owned)||!d.equipped||!Array.isArray(d.completed)||![d.playMs,d.playPaid].every(function(n){return Number.isFinite(n)&&n>=0;}))throw Error('invalid wardrobe');
  d.owned=d.owned.filter(function(id,i,a){return items.some(function(x){return x.id===id;})&&a.indexOf(id)===i;});
  ['hat','jacket','friend'].forEach(function(slot){if(!items.some(function(x){return x.id===d.equipped[slot]&&x.slot===slot&&d.owned.includes(x.id);}))d.equipped[slot]=null;});
  if(d.day!==day()){d.day=day();d.playMs=0;d.playPaid=0;d.completed=[];}
  d.playPaid=Math.min(60,d.playPaid);d.playMs=Math.min(1800000,d.playMs);return d;
 }
 function message(t){$('wardrobe-message').textContent=t;}
 function locked(fn){
  queue=queue.catch(function(){}).then(function(){
   var run=function(){try{data=read();return fn(data);}catch(e){message('無法儲存或讀取收藏，未完成兌換；請保留此頁並確認儲存權限。');}};
   return window.navigator&&navigator.locks?navigator.locks.request('deep-sea-wardrobe-wallet',run):run();
  });return queue;
 }
 function write(d){localStorage.setItem(KEY,JSON.stringify(d));data=d;}
 function bank(){var stored=Number(localStorage.getItem(STORE));if(localStorage.getItem(STORE)!==null&&Number.isFinite(stored)&&stored>=0)S.balance=Math.floor(stored);}
 function credit(d,n,kind,game){
  if(n<=0)return;bank();
  // Claim first: storage failure cannot grant a reward repeatedly. Two storage keys are not atomic.
  write(d);S.balance+=n;save();renderAll();
  if(AN.reward)AN.reward(kind,n,game);message('獲得平台點數 +'+n);paint();
 }
 function avatar(d){
  var hat=items.find(function(x){return x.id===d.equipped.hat;}),coat=items.find(function(x){return x.id===d.equipped.jacket;}),friend=items.find(function(x){return x.id===d.equipped.friend;});
  var svg='<svg viewBox="0 0 220 260" role="img" aria-label="我的平台角色"><ellipse cx="110" cy="239" rx="65" ry="12" fill="#082f37"/><path d="M78 207v27m62-27v27" stroke="#476a74" stroke-width="22" stroke-linecap="round"/><path d="M70 139q40-22 80 0l12 70H58z" fill="'+(coat?coat.color:'#76988a')+'"/><path d="m67 152-18 42m103-42 18 42" stroke="#e4ba97" stroke-width="17" stroke-linecap="round"/><circle cx="110" cy="99" r="43" fill="#e9c5a0"/><path d="M67 97q-4-61 49-47 46-3 39 50l-17-26-57 4z" fill="#334e53"/><circle cx="94" cy="103" r="4" fill="#233f44"/><circle cx="126" cy="103" r="4" fill="#233f44"/><path d="M101 119q9 8 18 0" fill="none" stroke="#ae7364" stroke-width="3"/><path d="m110 140 0 65" stroke="#ffffff38" stroke-width="3"/>';
  if(hat)svg+=hat.id==='explorer'?'<path d="M67 62q4-49 47-35 40-10 39 35z" fill="'+hat.color+'"/><ellipse cx="110" cy="66" rx="60" ry="10" fill="'+hat.color+'"/><path d="M73 53h75" stroke="#647c62" stroke-width="9"/>':'<path d="M62 58q-4-38 48-34 56-2 48 34z" fill="#edf2e9"/><path d="M64 58h93v14H64z" fill="#66979c"/><circle cx="110" cy="43" r="9" fill="#92b9ba"/>';
  if(friend)svg+=friend.id==='robot'?'<rect x="160" y="181" width="42" height="42" rx="10" fill="#b2dbd5"/><path d="M181 180v-12" stroke="#bed6ad" stroke-width="4"/><circle cx="181" cy="166" r="5" fill="#e9c882"/><circle cx="173" cy="196" r="4" fill="#37616b"/><circle cx="190" cy="196" r="4" fill="#37616b"/><path d="M174 211h15" stroke="#37616b" stroke-width="3"/>':'<path d="M166 198l1-21 14 9 15-9 3 22v28h-32z" fill="#e5b980"/><circle cx="176" cy="199" r="3" fill="#334e53"/><circle cx="190" cy="199" r="3" fill="#334e53"/><path d="M198 222q24 0 12-20" fill="none" stroke="#e5b980" stroke-width="8"/>';
  return svg+'</svg>';
 }
 function paint(){
  if(!data)return;
  var html=avatar(data);$('wardrobe-avatar').innerHTML=html;$('wardrobe-mini').innerHTML=html;
  $('wardrobe-daily').textContent='今日遊玩獎勵 '+data.playPaid+' / 60 點 · 完成獎勵 '+data.completed.length+' 款';
  $('wardrobe-summary').textContent='已收藏 '+data.owned.length+' / '+items.length+' 件';
  items.forEach(function(item){var b=$('wardrobe-buy-'+item.id),owns=data.owned.includes(item.id),equipped=data.equipped[item.slot]===item.id;b.disabled=equipped;b.textContent=equipped?'已裝備':owns?'穿上':'兌換 · '+item.price+' 點';});
 }
 function purchase(id){return locked(function(d){
  var item=items.find(function(x){return x.id===id;});if(!item)return;
  if(d.owned.includes(id)){d.equipped[item.slot]=id;write(d);message('已換上新造型');paint();return;}
  bank();if(S.balance<item.price){message('點數不足，玩遊戲累積點數後再來。');return;}
  d.owned.push(id);d.equipped[item.slot]=id;write(d);S.balance-=item.price;save();renderAll();
  if(AN.cosmetic)AN.cosmetic(id,item.price);message('兌換成功，已永久收藏');paint();
 });}
 window.deepSeaProgress={
  active:function(game,ms){if(!ready||!game||!Number.isFinite(ms)||ms<=0)return;
   locked(function(d){d.playMs=Math.min(1800000,d.playMs+ms);var n=Math.max(0,Math.min(60,Math.floor(d.playMs/60000)*2)-d.playPaid);d.playPaid+=n;if(n)credit(d,n,'play_time',game);else write(d);});
  },
  complete:function(game,result,activeMs){if(!ready||result!=='complete'||activeMs<10000)return;
   locked(function(d){if(d.completed.includes(game))return;d.completed.push(game);credit(d,5,'daily_complete',game);});
  }
 };
 window.deepSeaWardrobe={
  init:function(){ready=true;try{data=read();paint();}catch(e){data=fresh();paint();message('收藏讀取失敗，原資料已保留。');}},
  refresh:function(){if(ready)try{data=read();paint();}catch(e){}},
  open:function(){location.hash='wardrobe';}
 };
 items.forEach(function(item){var card=document.createElement('article');card.className='wardrobe-item';card.innerHTML='<span class="wardrobe-icon" aria-hidden="true">'+item.icon+'</span><h4>'+item.name+'</h4><p>'+({hat:'帽子',jacket:'服裝',friend:'跟隨配件'}[item.slot])+'</p><button type="button" id="wardrobe-buy-'+item.id+'"></button>';$('wardrobe-items').appendChild(card);$('wardrobe-buy-'+item.id).addEventListener('click',function(){purchase(item.id);});});
 document.querySelectorAll('[data-wardrobe-default]').forEach(function(b){b.addEventListener('click',function(){locked(function(d){d.equipped[b.dataset.wardrobeDefault]=null;write(d);paint();});});});
 $('open-wardrobe').addEventListener('click',function(){window.deepSeaWardrobe.open();});
 window.addEventListener('storage',function(e){if(e.key===KEY||e.key===STORE)window.deepSeaWardrobe.refresh();});
})();
