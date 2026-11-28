(async function(){
  var results=[],errors=[];
  function assert(ok,label){if(!ok)throw new Error(label);results.push(label);}
  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms||50);});}
  async function until(test){for(var n=0;n<160;n++){if(test())return;await wait();}throw new Error('Reaper did not become ready');}
  window.addEventListener('error',function(e){errors.push(e.message);});
  try{
    location.hash='reaper';
    var view=document.getElementById('view-reaper'),button=document.getElementById('rp-go');
    await until(function(){return !button.disabled;});
    assert(!view.hidden,'Reaper direct route opens approved artwork');
    var rect=document.getElementById('rp-canvas').getBoundingClientRect();
    assert(rect.left>=0&&rect.right<=innerWidth+.5&&rect.bottom<=innerHeight+.5,'Artwork fits viewport without cropping');
    assert(Math.abs(rect.width/rect.height-400/523)<.002,'Approved composition keeps original proportions');
    var action=button.getBoundingClientRect();assert(action.width>=44&&action.height>=44,'Action target is at least 44px');
    button.click();await until(function(){return button.dataset.mode==='surface';});
    assert(button.textContent==='SWING','English action reads SWING');
    var before=document.getElementById('rp-lives').textContent;
    window.deepSeaI18n.setLanguage('zh-Hant');await wait();
    assert(button.textContent==='揮鐮','Traditional Chinese action is localized');
    window.deepSeaI18n.setLanguage('zh-Hans');await wait();
    assert(button.textContent==='挥镰','Simplified Chinese action is localized');
    window.deepSeaI18n.setLanguage('en');await wait();
    assert(button.dataset.mode==='surface'&&document.getElementById('rp-lives').textContent===before,'Language changes preserve the current round');
    assert(!(window.__untranslatedCanvasById?.['rp-canvas']||[]).length,'English Reaper canvas contains no Chinese text');
    assert(!errors.length,'No runtime errors');
    document.body.dataset.testStatus='PASS';
  }catch(error){results.push(String(error.stack||error));document.body.dataset.testStatus='FAIL';}
  var output=document.createElement('pre');output.id='test-results';output.setAttribute('data-i18n-ignore','');output.textContent=JSON.stringify(results);document.body.appendChild(output);
})();
