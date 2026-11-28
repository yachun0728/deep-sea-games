import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import R from '../shared/meow-link-rules.cjs';
for(const [mode,rows,cols,pool] of [['easy',6,8,12],['standard',14,18,24],['challenge',16,26,36]]){
 const rules=R.meowLinkBoard(rows,cols);
 for(let level=1;level<=10;level++){
  const [,direction,reefs]=rules.levels[mode==='easy'?0:level-1];
  const layout=rules.reefBoard(reefs),pairs=(rows*cols-reefs*4)/2;
  const bag=Array.from({length:pairs},(_,i)=>i%pool+1);
  const replay=({board,moves})=>{assert.equal(board.filter(x=>x===-1).length,reefs*4);for(const [a,b] of moves){assert.equal(board[a],board[b]);assert(rules.linkPath(board,a,b));board[a]=board[b]=0;rules.slide(board,direction);}assert(!board.some(v=>v>0));};
  const dealt=rules.deal(layout,bag,direction);assert.equal(new Set(dealt.board.filter(x=>x>0)).size,pool);replay(dealt);
  const again=rules.deal(layout,bag,direction),before=again.board.filter(v=>v>0).sort((a,b)=>a-b);
  const shuffled=rules.recover(again.board,direction);assert.deepEqual(shuffled.board.filter(v=>v>0).sort((a,b)=>a-b),before);replay(shuffled);
 }
 console.log('PASS '+mode+': 10 stage solutions and shuffled solutions, exact pool, barriers and directional movement');
}
const tiles=JSON.parse(readFileSync(new URL('../games/meow-link/design/tiles.json',import.meta.url)));
for(const [count,expected] of [[12,{cat:6,toy:2,food:2,care:2}],[24,{cat:12,toy:4,food:4,care:4}],[36,{cat:12,toy:8,food:8,care:8}]]){const counts={};for(const a of tiles.slice(0,count))counts[a.category]=(counts[a.category]||0)+1;assert.deepEqual(counts,expected);}
const hashes=JSON.parse(readFileSync(new URL('../games/meow-link/design/ocean-link-source-hashes.json',import.meta.url)));for(const [file,hash] of Object.entries(hashes)){assert.equal(createHash('sha256').update(readFileSync(new URL('../games/ocean-link/'+file,import.meta.url))).digest('hex'),hash,'Ocean Link original untouched: '+file)}
console.log('PASS: objects included in every mode, all 36 categories, original Ocean Link source hashes unchanged');
