  // Formal native-DOM controller; rules and server-clock ranking stay in their own modules.
  function createSolitaireGame(gameId,prefix,kind){
    const R=solitaireRules,E=suffix=>$(prefix+'-'+suffix),view=$('view-'+gameId),windowEl=E('window');
    const ranks=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♣','♦','♥','♠'];
    const words={ready:'{{t:solitaire.ui.ready}}',invalid:'{{t:solitaire.ui.invalid}}',noHint:'{{t:solitaire.ui.nohint}}',draw:'{{t:solitaire.ui.drawhint}}',win:'{{t:solitaire.ui.win}}',ended:'{{t:solitaire.ui.ended}}',start:'{{t:solitaire.ui.start}}',again:'{{t:solitaire.ui.again}}',restart:'{{t:solitaire.ui.restarttext}}'};
    let g=R.create(kind),phase='idle',selection=null,drag=null,round=null,helpFocus=null,progress=0;
    const rank=completionTimeLeaderboard(gameId+'-time',gameId,prefix,ui);
    const cards=new Map(),table=E('table'),rack=E('rack');let cw=40,ch=58;
    function message(text){E('message').textContent=text;}
    function foundationCount(){return g.found.reduce((n,p)=>n+p.length,0);}
    function label(card){return ranks[R.rank(card)]+suits[R.suit(card)];}
    function cardNode(card,from,index,hidden=false){
      let b=cards.get(card);if(!b){b=document.createElement('button');b.type='button';b.className='sc-card';cards.set(card,b);}
      b.dataset.from=from;b.dataset.index=index;b.dataset.card=card;b.className='sc-card'+(R.red(card)?' red':'')+(hidden?' down':'');
      if(selection?.from===from&&index>=selection.index)b.classList.add('selected');
      b.disabled=hidden;b.setAttribute('aria-label',hidden?'{{t:solitaire.ui.facedown}}':label(card));
      if(!hidden){b.replaceChildren();const top=document.createElement('span');top.className='sc-rank';top.textContent=label(card);b.append(top);
        const art=document.createElement('span');art.className=R.rank(card)>10?'sc-court':'sc-suit';
        if(R.rank(card)>10){art.style.backgroundPosition=(R.suit(card)*100/3)+'% '+((R.rank(card)-11)*50)+'%';}else art.textContent=suits[R.suit(card)];b.append(art);
      }else b.replaceChildren();return b;
    }
    function paint(){
      if(view.hidden)return;
      cw=(table.clientWidth-(g.cols.length-1)*4)/g.cols.length;ch=cw*1.42;
      table.style.setProperty('--sc-cw',cw+'px');table.style.setProperty('--sc-ch',ch+'px');
      const activeCards=new Set(),frag=document.createDocumentFragment();
      g.cols.forEach((pile,from)=>{
        const hidden=g.hidden[from],maxHeight=Math.max(ch*1.5,table.clientHeight),up=Math.max(0,pile.length-hidden-1);
        let downStep=ch*.19,upStep=Math.min(cw*.43,Math.max(7,(maxHeight-ch-hidden*downStep)/Math.max(1,up)));
        if(hidden*downStep+up*upStep+ch>maxHeight)downStep=Math.max(ch*.06,(maxHeight-ch-up*upStep)/Math.max(1,hidden));
        const empty=document.createElement('button');empty.type='button';empty.className='sc-empty';empty.dataset.from=from;empty.style.left=from*(cw+4)+'px';empty.setAttribute('aria-label','{{t:solitaire.ui.empty}}');frag.append(empty);
        let y=0;pile.forEach((card,index)=>{const b=cardNode(card,from,index,index<hidden);b.style.left=from*(cw+4)+'px';b.style.top=y+'px';b.style.zIndex=index+1;frag.append(b);activeCards.add(card);y+=index<hidden?downStep:upStep;});
      });table.replaceChildren(frag);
      rack.replaceChildren();const slots=kind==='classic'?[17,16,-1,12,13,14,15]:[8,9,10,11,12,13,14,15];
      slots.forEach(from=>{
        if(from===-1){rack.append(document.createElement('span'));return;}
        const pile=from===17?null:R.pile(g,from);let b;
        if(pile?.length){const card=pile[pile.length-1];b=cardNode(card,from,pile.length-1);activeCards.add(card);b.style.cssText='';}
        else{b=document.createElement('button');b.type='button';b.dataset.from=from;b.className='sc-slot';b.textContent=from>=12&&from<16?suits[from-12]:from===17?'↶':'＋';}
        b.classList.add('sc-rack-card');if(from>=8&&from<12)b.classList.add('sc-cell');if(from>=12&&from<16)b.classList.add('sc-foundation');
        b.setAttribute('aria-label',from===17?'{{t:solitaire.ui.stock}}':from===16?'{{t:solitaire.ui.waste}}':from<12?'{{t:solitaire.ui.cell}}':'{{t:solitaire.ui.foundation}}');
        if(from===17){b.classList.toggle('sc-stock',!!g.stock.length);const n=document.createElement('small');n.textContent=g.stock.length;b.append(n);}rack.append(b);
      });
      for(const [id,node] of cards)if(!activeCards.has(id)){node.remove();cards.delete(id);}
      E('moves').textContent=g.moves;E('home').textContent=foundationCount()+'/52';
      E('undo').disabled=phase!=='run'||!g.history.length;E('hint').disabled=phase!=='run';
    }
    function ui(){
      const cover=E('cover');cover.hidden=phase==='run';E('go').disabled=rank.busy();
      E('go').textContent=phase==='idle'?words.start:words.again;
      if(phase==='over'){E('result').textContent=g.won?words.win+' '+rank.formatted():words.ended;}
      paint();
    }
    function finish(result){
      if(phase!=='run')return;phase='over';selection=null;clearDrag();
      if(g.won){rank.finish();try{const key='deep-sea-'+gameId+'-time-best-v1',prior=Number(localStorage.getItem(key));if(!prior||rank.elapsed()<prior)localStorage.setItem(key,String(rank.elapsed()));}catch{}}
      else rank.abandon();
      AN.end(round,0,result,{score:foundationCount(),step:g.moves,elapsed_seconds:g.won?Math.ceil(rank.elapsed()/1000):undefined});round=null;ui();
    }
    function changed(code){
      rank.record(code);const total=foundationCount();if(Math.floor(total/13)>progress){progress=Math.floor(total/13);AN.progress(round,{stage:progress,score:total,step:g.moves});}
      selection=null;message(words.ready);paint();if(g.won)finish('complete');
    }
    function attempt(from,index,to){if(!R.move(g,from,index,to))return false;changed(R.encode(from,index,to));return true;}
    function choose(from,index){
      if(phase!=='run'||view.hidden||!E('help').hidden)return;
      if(from===17){if(R.draw(g))changed(0);return;}
      if(selection){if(selection.from===from&&selection.index===index){selection=null;paint();return;}if(attempt(selection.from,selection.index,from))return;}
      if(index!==null&&R.run(g,from,index)){selection={from,index};message(label(R.pile(g,from)[index]));}else{selection=null;message(words.invalid);}paint();
    }
    function clearDrag(){if(!drag)return;drag.ghosts?.forEach(n=>n.remove());drag=null;}
    function down(event){
      if(phase!=='run'||view.hidden||!E('help').hidden||event.button>0||!event.isPrimary)return;
      const node=event.target.closest('[data-from]');if(!node)return;const from=Number(node.dataset.from),index=node.dataset.index===undefined?null:Number(node.dataset.index);
      if(from===17){choose(17,null);return;}
      event.preventDefault();drag={from,index,id:event.pointerId,x:event.clientX,y:event.clientY,started:false,ghosts:[]};try{windowEl.setPointerCapture(event.pointerId);}catch{}
    }
    function motion(event){
      if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.started){if(Math.hypot(dx,dy)<8)return;if(drag.index===null||!R.run(g,drag.from,drag.index)){clearDrag();return;}drag.started=true;
        const wr=windowEl.getBoundingClientRect();R.pile(g,drag.from).slice(drag.index).forEach(card=>{const original=cards.get(card),r=original.getBoundingClientRect(),ghost=original.cloneNode(true);ghost.className='sc-card sc-ghost'+(original.classList.contains('red')?' red':'');ghost.style.cssText='left:'+(r.left-wr.left)+'px;top:'+(r.top-wr.top)+'px;width:'+r.width+'px;height:'+r.height+'px';ghost.style.setProperty('--sc-cw',r.width+'px');ghost.style.setProperty('--sc-ch',r.height+'px');windowEl.append(ghost);drag.ghosts.push(ghost);});}
      drag.ghosts.forEach(n=>n.style.transform='translate('+dx+'px,'+dy+'px)');
    }
    function release(event,cancel=false){
      if(!drag||event.pointerId!==drag.id)return;const d=drag;
      if(!d.started){clearDrag();if(!cancel)choose(d.from,d.index);return;}
      const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-from]');const to=hit?Number(hit.dataset.from):-1;
      clearDrag();if(cancel||to<0||!attempt(d.from,d.index,to)){message(words.invalid);paint();}
    }
    windowEl.addEventListener('pointerdown',down);windowEl.addEventListener('pointermove',motion);windowEl.addEventListener('pointerup',e=>release(e));windowEl.addEventListener('pointercancel',e=>release(e,true));
    // Keyboard activation uses the same move path, with no Escape or browser shortcut interception.
    windowEl.addEventListener('click',event=>{if(event.detail!==0)return;const b=event.target.closest('[data-from]');if(b)choose(Number(b.dataset.from),b.dataset.index===undefined?null:Number(b.dataset.index));});
    E('go').addEventListener('click',()=>{if(rank.busy()||phase==='run')return;rank.start(random=>{g=R.create(kind,random||Math.random);phase='run';progress=0;selection=null;round=AN.start(gameId,0);E('help').hidden=true;message(words.ready);ui();});});
    E('undo').addEventListener('click',()=>{if(phase==='run'&&R.undo(g))changed(1);});
    E('hint').addEventListener('click',()=>{if(phase!=='run')return;const hint=R.hint(g);if(hint?.draw){message(words.draw);return;}if(!hint){message(words.noHint);return;}selection={from:hint.from,index:hint.index};paint();const destination=hint.to<8?table.querySelector('.sc-empty[data-from="'+hint.to+'"]'):rack.querySelector('[data-from="'+hint.to+'"]');destination?.classList.add('sc-suggestion');message(label(R.pile(g,hint.from)[hint.index])+' → '+(hint.to<8?hint.to+1:hint.to<12?'□':suits[hint.to-12]));});
    E('restart').addEventListener('click',()=>{if(phase==='run'){E('confirm').hidden=false;E('confirm-yes').focus();}else E('go').click();});
    E('confirm-no').addEventListener('click',()=>E('confirm').hidden=true);
    E('confirm-yes').addEventListener('click',()=>{E('confirm').hidden=true;finish('restart');E('go').click();});
    E('info').addEventListener('click',()=>{helpFocus=document.activeElement;E('help').hidden=false;E('help-close').focus();});
    E('help-close').addEventListener('click',()=>{E('help').hidden=true;helpFocus?.focus();});
    E('board-list').addEventListener('toggle',async()=>{if(!E('board-list').open)return;const list=E('entries');list.textContent='';try{const api=await import('./frontend/services/api.mjs'),data=await api.createApiClient(api.arcadeApiOrigin()).leaderboard(gameId+'-time',AbortSignal.timeout(10000));if(!data.entries.length){const li=document.createElement('li');li.textContent='目前尚無排行榜紀錄。';list.append(li);}for(const entry of data.entries){const li=document.createElement('li');li.setAttribute('data-i18n-ignore','');li.textContent=(entry.displayName||'Guest')+' · '+entry.time;list.append(li);}}catch{const li=document.createElement('li');li.textContent='目前無法載入排行榜。';list.append(li);}});
    window.addEventListener('hashchange',()=>{clearDrag();if(view.hidden&&phase==='run')finish('abandoned');else requestAnimationFrame(paint);});
    window.addEventListener('resize',()=>{clearDrag();paint();});window.addEventListener('arcade-languagechange',paint);
    const observer=new MutationObserver(()=>{if(!view.hidden)requestAnimationFrame(paint);});observer.observe(view,{attributes:true,attributeFilter:['hidden']});
    setInterval(()=>{if(phase==='run'&&!view.hidden)rank.update();},50);
    ui();
  }
