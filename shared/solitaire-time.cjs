/* Scores preserve the existing higher-is-better storage model; public views show elapsed time. */
const solitaireTime=(()=>{
 const LIMIT_MS=2*60*60*1000;
 const IDS={'mermaid-time-1':{base:'mermaid',mode:1},'mermaid-time-2':{base:'mermaid',mode:2},'mermaid-time-4':{base:'mermaid',mode:4},'midnight-solitaire-time':{base:'midnight-solitaire',kind:'classic'},'orbit-freecell-time':{base:'orbit-freecell',kind:'freecell'}};
 const format=ms=>Number.isFinite(ms)&&ms>=0?String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+'.'+String(Math.floor(ms)%1000).padStart(3,'0'):'—';
 return {LIMIT_MS,IDS,format};
})();
if(typeof module!=='undefined')module.exports=solitaireTime;
