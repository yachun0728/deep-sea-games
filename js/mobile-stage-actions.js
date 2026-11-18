  /* Move the existing buttons on mobile; never duplicate their wallet or game handlers. */
  (function(){
    if(!window.matchMedia||!window.MutationObserver)return;
    var media=window.matchMedia('(max-width:880px)'),groups=[];
    function actionText(button){return window.deepSeaI18n?window.deepSeaI18n.sourceText(button):button.textContent||'';}
    function eligible(button){
      if(button.hidden)return false;
      var text=actionText(button);
      if(button.disabled&&!/重玩第.*關/.test(text))return false;
      return ['surface','cancel'].indexOf(button.dataset.mode)<0||/下一關|下一班|下一條/.test(text);
    }
    document.querySelectorAll('.view .console').forEach(function(console){
      var side=console.querySelector('.side'),stage=console.firstElementChild;
      if(!side||!stage||stage===side)return;
      var buttons=[].slice.call(side.querySelectorAll('button.go'));if(!buttons.length)return;
      var freeEntry=buttons.some(function(button){return button.id==='mines-go'||button.id==='br-go';});
      stage.classList.add('mobile-start-stage');
      var tray=document.createElement('div');tray.className='mobile-stage-actions';tray.setAttribute('role','group');tray.setAttribute('aria-label','開始、續關與重玩');stage.appendChild(tray);
      var records=buttons.map(function(button){
        var marker=document.createComment('original game action position'),wrapper=document.createElement('div');
        button.parentNode.insertBefore(marker,button);wrapper.className='mobile-stage-action';tray.appendChild(wrapper);return {button:button,marker:marker,wrapper:wrapper};
      });
      var note=document.createElement('p');note.className='mobile-stage-note';tray.appendChild(note);
      function sync(){
        var shown=false,label='';
        records.forEach(function(record){
          var show=media.matches&&eligible(record.button);record.wrapper.hidden=!show;
          if(show){if(record.button.parentNode!==record.wrapper)record.wrapper.appendChild(record.button);shown=true;label=actionText(record.button);}
          else if(record.marker.parentNode&&record.button.parentNode!==record.marker.parentNode)record.marker.parentNode.insertBefore(record.button,record.marker.nextSibling);
        });
        note.textContent='免費遊玩';
        note.hidden=!note.textContent;tray.hidden=!shown;
      }
      var observer=new window.MutationObserver(sync);
      records.forEach(function(record){observer.observe(record.button,{attributes:true,attributeFilter:['hidden','disabled','data-mode'],childList:true,characterData:true,subtree:true});});
      groups.push(sync);sync();
    });
    function resize(){groups.forEach(function(sync){sync();});}
    if(media.addEventListener)media.addEventListener('change',resize);else if(media.addListener)media.addListener(resize);
  })();
