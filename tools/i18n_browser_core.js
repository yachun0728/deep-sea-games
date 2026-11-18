(async function(){
  var results=[], errors=[];
  window.addEventListener('error',function(e){errors.push(e.message)});
  function assert(ok,message){if(!ok)throw new Error(message);results.push(message)}
  function settle(){return new Promise(function(resolve){setTimeout(resolve,60)})}
  function click(id){document.getElementById(id).click()}
  function report(){var result=document.createElement('pre');result.id='test-results';result.setAttribute('data-i18n-ignore','');result.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';result.textContent=JSON.stringify(results,null,2);document.body.appendChild(result);}
  try{
    await settle();
    var i=window.deepSeaI18n;
    assert(!!i,'Localization initializes');
    var probe=new URLSearchParams(location.search).get('probe');
    if(probe){
      var expected=probe==='default'?'zh-Hant':new URLSearchParams(location.search).get('lang')||'en';
      assert(i.getLanguage()===expected,'Reload / query preference: '+probe+' '+expected);
      if(probe==='blocked'){
        var held=localStorage.getItem('crush-depth-balance');
        i.setLanguage('zh-Hant');await settle();i.setLanguage('en');await settle();
        assert(i.getLanguage()==='en'&&localStorage.getItem('crush-depth-balance')===held,'Blocked preference storage still allows safe switching');
      }
      document.body.dataset.testStatus='PASS';
      report();
      return;
    }
    assert(document.documentElement.lang==='en','English query selects English');
    assert(!document.getElementById('reset')&&!document.getElementById('regen-hint'),'Reset button and regen hint removed');
    assert(!/[\u3400-\u9fff]/.test(document.getElementById('view-lobby').innerText),'Lobby has no untranslated Chinese');
    assert(document.querySelectorAll('.game-card[data-game-hidden]').length===8,'Eight hidden games remain hidden');
    var untranslated=[];
    document.querySelectorAll('.view').forEach(function(view){
      var walker=document.createTreeWalker(view,NodeFilter.SHOW_TEXT),n;
      while(n=walker.nextNode()){if(!n.parentElement.closest('script,style')&&/[\u3400-\u9fff]/.test(n.nodeValue))untranslated.push({view:view.id,text:n.nodeValue});}
      view.querySelectorAll('[aria-label],[title]').forEach(function(e){for(var key of ['aria-label','title']){if(/[\u3400-\u9fff]/.test(e.getAttribute(key)||''))untranslated.push({view:view.id,text:e.getAttribute(key)})}});
    });
    assert(!untranslated.length,'All static game views and accessibility labels translated: '+JSON.stringify(untranslated.slice(0,80)));
    var analytics={};['start','progress','resume','end','view'].forEach(function(method){var native=window.deepSeaAnalytics[method];analytics[method]=0;window.deepSeaAnalytics[method]=function(){analytics[method]++;return native.apply(this,arguments)}});
    var balance=localStorage.getItem('crush-depth-balance'),before=Number(document.getElementById('balance').textContent.replace(/,/g,''));
    location.hash='dream'; await settle();
    assert(document.title==='Dream Repair Shop','Direct hash title translated without duplicate subtitle');
    click('dr-go');await settle();
    assert(Number(document.getElementById('balance').textContent.replace(/,/g,''))===before,'English Start is free and charges nothing');
    var paid=localStorage.getItem('crush-depth-balance'),oldHash=location.hash;
    assert(analytics.start===1,'English Start creates exactly one analytics round');
    var lifecycle=JSON.stringify(analytics);
    var saved={};Object.keys(localStorage).forEach(function(key){if(key!=='deep-sea-language-v1')saved[key]=localStorage.getItem(key)});
    i.setLanguage('zh-Hant');await settle();
    assert(document.getElementById('dr-go').textContent==='停針','Switch to Chinese preserves active repair round');
    assert(document.getElementById('game-name').textContent.indexOf('時序修復')>=0,'Chinese heading restored');
    i.setLanguage('en');await settle();
    assert(document.getElementById('dr-go').textContent==='Stop','Switch back preserves active round and translates action');
    assert(localStorage.getItem('crush-depth-balance')===paid,'Language switching does not charge or credit points');
    assert(JSON.stringify(analytics)===lifecycle,'Language switching does not invoke analytics lifecycle methods');
    assert(Object.keys(saved).every(function(key){return localStorage.getItem(key)===saved[key]}),'Language switching leaves all existing saved data unchanged');
    assert(location.hash===oldHash,'Language switching preserves hash');
    assert(localStorage.getItem('deep-sea-language-v1')==='en','English preference saved');
    assert(new URLSearchParams(location.search).get('lang')==='en','English share link updated');
    assert(new URLSearchParams(location.search).get('keep')==='1','Language links preserve other query parameters');
    assert(document.querySelector('[data-language="en"]').getAttribute('aria-pressed')==='true','Selected language is accessible');
    assert(i.sourceText(document.getElementById('dr-go'))==='停針','Mobile behavior reads original action label');
    assert(i.english('第 12 關 · 目標寬度 24°')==='Stage 12 · Target width 24°','Dynamic stage label uses English ordering');
    assert(!document.getElementById('dr-cash'),'Dream Repair has no collection control');
    assert(!/collect|multiplier/i.test(document.querySelector('#view-dream .rules').textContent),'English Dream rules contain no collection or multiplier rewards');
    assert(i.english('注意！中心燈閃爍，0.5 秒後指針反轉。')==='Watch out! The center light is flashing. The needle reverses in 0.5 seconds.','Reversal warning has synchronized English');
    var spread=i.english('散彈倒數 12 秒 · 撿箱刷新至12秒');
    assert(!/[\u3400-\u9fff]/.test(spread)&&/12/.test(spread),'Timed spread and crate-refresh prompt translated');
    assert(i.english('散彈強化結束，恢復雙管速射，火力等級保留。')==='Spread boost ended. Twin rapid fire restored; firepower level retained.','Spread expiry prompt has synchronized English');
    location.hash='crash';await settle();
    assert(location.hash==='#lobby','Hidden game still blocked in English');
    location.hash='keno';await settle();
    var miningBefore=Number(document.getElementById('balance').textContent.replace(/,/g,''));
    click('ke-go');await settle();
    assert(Number(document.getElementById('balance').textContent.replace(/,/g,''))===miningBefore,'Free mining stays free');
    assert(!/[\u3400-\u9fff]/.test(document.getElementById('view-keno').innerText),'Mining dynamic labels translated');
    location.hash='boba';await settle();await settle();
    var frame=document.getElementById('boba-frame');
    assert(!!frame.contentWindow.setBobaPlatformActive,'Boba iframe bridge initializes');
    assert(frame.contentDocument.documentElement.lang==='en','Original Boba screen remains English');
    assert(!errors.length,'No browser runtime errors: '+JSON.stringify(errors));
    document.body.dataset.testStatus='PASS';
  }catch(e){document.body.dataset.testStatus='FAIL';results.push(e.stack)}
  report();
})();
