(async function(){
  var results=[], errors=[];
  window.addEventListener('error',function(e){errors.push(e.message)});
  function assert(ok,message){if(!ok)throw new Error(message);results.push(message)}
  function settle(ms){return new Promise(function(resolve){setTimeout(resolve,ms||80)})}
  function report(){var result=document.createElement('pre');result.id='test-results';result.setAttribute('data-i18n-ignore','');result.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';result.textContent=JSON.stringify(results,null,2);document.body.appendChild(result);}
  try{
    await settle(200);
    var i=window.deepSeaI18n, hans=JSON.parse(document.getElementById('arcade-hans').textContent);
    var traditional=new RegExp('['+hans.chars[0]+']');
    function left(node){var m=(node.innerText||'').match(traditional);return m?m[0]:''}
    assert(!!i&&i.getLanguage()==='zh-Hans','?lang=zh-Hans selects Simplified Chinese');
    assert(document.documentElement.lang==='zh-Hans','html lang is zh-Hans');
    var buttons=[].slice.call(document.querySelectorAll('.top .language-switch [data-language]'));
    assert(buttons.length===3&&buttons.filter(function(b){return b.getAttribute('aria-pressed')==='true'}).map(function(b){return b.dataset.language}).join()==='zh-Hans','Language switch has three options and marks 简中: '+buttons.map(function(b){return b.dataset.language+'='+b.getAttribute('aria-pressed')}).join());
    var lobby=document.getElementById('view-lobby');
    assert(lobby.innerText.indexOf('游戏')>=0&&lobby.innerText.indexOf('遊戲')<0,'Lobby shows Simplified text: '+lobby.innerText.slice(0,60));
    assert(!left(lobby),'Lobby has no Traditional-only characters: '+left(lobby));
    assert(i.simplified('軟體與滑鼠')==='软件与鼠标'&&i.simplified('核心被攻破')==='核心被攻破','Mainland word choices apply, rejected ones do not');
    assert(i.text('遊戲大廳')==='游戏大厅','deepSeaI18n.text converts on demand');
    // switch back and forth without reloading or touching saved data
    var held=localStorage.getItem('crush-depth-balance');
    i.setLanguage('zh-Hant');await settle();
    assert(lobby.innerText.indexOf('遊戲')>=0&&lobby.innerText.indexOf('游戏')<0,'Switching to Traditional restores the original text');
    i.setLanguage('en');await settle();
    assert(lobby.innerText.indexOf('Game categories')>=0||!/[㐀-鿿]/.test(lobby.innerText),'English still works');
    i.setLanguage('zh-Hans');await settle();
    assert(localStorage.getItem('deep-sea-language-v1')==='zh-Hans'&&new URL(location.href).searchParams.get('lang')==='zh-Hans','Preference and URL record zh-Hans');
    assert(localStorage.getItem('crush-depth-balance')===held,'Switching language leaves wallet data unchanged');
    // game views, rules and dynamic messages
    var ids=['tetris','book-sort','market-desk','outpost','mines','pet-walk'], bad=[];
    for(var k=0;k<ids.length;k++){
      location.hash='#'+ids[k];await settle(250);
      var view=document.getElementById('view-'+ids[k]);
      if(!view)continue;
      var c=left(view);if(c)bad.push(ids[k]+':'+c);
    }
    assert(!bad.length,'Game views have no Traditional-only characters: '+bad.join(' '));
    // text a game writes itself (data-i18n-ignore) converts too, and is restored when leaving Simplified
    location.hash='#tetris';await settle(250);
    var msg=document.getElementById('tt-msg');
    assert(msg&&msg.textContent.indexOf('开始')>=0&&msg.textContent.indexOf('開始')<0,'Game-owned message is simplified: '+(msg&&msg.textContent));
    i.setLanguage('zh-Hant');await settle();
    assert(msg.textContent.indexOf('開始')>=0&&msg.textContent.indexOf('开始')<0,'Game-owned message is restored in Traditional: '+msg.textContent);
    i.setLanguage('zh-Hans');await settle();
    assert(!errors.length,'No browser runtime errors: '+JSON.stringify(errors));
    document.body.dataset.testStatus='PASS';
  }catch(e){document.body.dataset.testStatus='FAIL';results.push(e.stack)}
  report();
})();
