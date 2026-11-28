/* Display-only rollout switch. No storage, reward or analytics mutation. */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('points-hidden')) return;
  const installed = new WeakSet();
  const reward = /BONUS|\bbonus\b|\b(?:wallet|virtual points|bonus points)\b|\b(?:earn(?:ed)?|award(?:ed)?|receive(?:d)?|gain(?:ed)?)\b[^.!;\n]{0,70}\b(?:points|pts)\b|\u9ede\u6578|\u70b9\u6570|(?:[+\uff0b]\s*\d+|[\u7372\u83b7\u8d08\u8d60\u9001\u9818\u9886][^\u3002\uff01\uff1b\n]{0,16}\d+)\s*[\u9ede\u70b9](?![\u64ca\u51fb])/i;
  function clean(text) {
    // Remove reward clauses, retaining ordinary scores, instructions and level goals.
    return text.split(/([\u3002\uff01\uff1b\n]|[.!;](?=\s|$))/).reduce((out,part,i,all)=> {
      if (i % 2) return out;
      return out + (reward.test(part) ? '' : part + (all[i+1] || ''));
    }, '');
  }
  function install(doc) {
    if (!doc || installed.has(doc)) return;
    installed.add(doc);
    doc.documentElement.classList.add('points-hidden');
    if (doc !== document) {
      const style = doc.createElement('style');
      style.textContent = '[data-points-hidden],[id$="-bonus"],[id$="-result-reward"],.game-card-bonus{display:none!important}';
      doc.head.appendChild(style);
    }
    const win = doc.defaultView;
    for (const method of ['fillText','strokeText']) {
      const proto = win.CanvasRenderingContext2D && win.CanvasRenderingContext2D.prototype;
      if (!proto) continue;
      const original = proto[method];
      proto[method] = function(text,...args) {
        const visible = clean(String(text));
        if (visible.trim()) return original.call(this,visible,...args);
      };
    }
    function scan(root) {
      if (!root || !root.isConnected) return;
      if (root.nodeType === 3) { scrub(root); return; }
      if (root.nodeType !== 1 || root.closest('script,style,pre,code,button,select,textarea,input,option')) return;
      const walker = doc.createTreeWalker(root,win.NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) scrub(walker.currentNode);
      const frames = root.matches('iframe') ? [root] : root.querySelectorAll('iframe');
      frames.forEach(frame=>{
        if (!frame.dataset.pointsWatched) {
          frame.dataset.pointsWatched='1';
          frame.addEventListener('load',()=>{try{install(frame.contentDocument)}catch(_){}});
        }
        try { install(frame.contentDocument); } catch (_) {}
      });
    }
    function scrub(node) {
      const parent=node.parentElement;
      if (!parent || parent.closest('script,style,pre,code,button,select,textarea,input,option,[id$="-bonus"]')) return;
      // Pure reward stat labels are hidden with their numeric partner.
      if (parent.matches('dt') && reward.test(node.data)) {
        const row=parent.parentElement;
        if(row && row.querySelector('dd'))row.setAttribute('data-points-hidden','');
        return;
      }
      if (reward.test(node.data)) {
        const visible=clean(node.data);
        if(node.data!==visible)node.data=visible;
      }
    }
    scan(doc.body);
    new win.MutationObserver(records=>{
      for (const record of records) {
        if(record.type==='characterData')scan(record.target);
        else record.addedNodes.forEach(scan);
      }
    }).observe(doc.body,{subtree:true,childList:true,characterData:true});
  }
  install(document);
})();
