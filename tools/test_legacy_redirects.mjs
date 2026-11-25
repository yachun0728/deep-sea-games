import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const script=read('404.html').match(/<script>([\s\S]*?)<\/script>/)[1];
const rules=read('_redirects').split('\n').filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.trim().split(/\s+/));
const ids=new Set(JSON.parse(read('games/catalog.json')).map(g=>g.id));
assert.equal(rules.length,15);assert.equal(new Set(rules.map(r=>r[0])).size,rules.length);
for(const [path,destination,status] of rules){
 assert.equal(status,'302');const game=destination.split('#')[1];if(game)assert(ids.has(game));
 for(const project of [false,true]){
  let target;const base=project?'/deep-sea-games':'',home={};
  vm.runInNewContext(script,{location:{hostname:project?'yachun0728.github.io':'ticaticagames.com',pathname:base+path,search:'?lang=en',hash:'#original',replace:v=>target=v},document:{getElementById:()=>home}});
  assert.equal(target,base+'/?lang=en'+(game?'#'+game:'#original'),path);
 }
}
let redirected=false;
vm.runInNewContext(script,{location:{hostname:'ticaticagames.com',pathname:'/not-a-legacy-path',search:'',hash:'',replace:()=>redirected=true},document:{getElementById:()=>({})}});
assert(!redirected,'unknown URLs retain the 404 page');
for(const name of ['dodge-run.html','dream-repair.html','index_v2.html','clock-out','last-hair','quack-pond'])assert(!fs.existsSync(new URL(name,root)),'old root entry removed: '+name);
console.log('PASS: 15 centralized legacy redirects, valid game destinations, query/hash and GitHub project paths, unknown 404 and root cleanup');
