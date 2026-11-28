// Runtime checks only; these do not certify the art or animation quality.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './test_last_hair.mjs';
const f=fixture();
const manifest=JSON.parse(fs.readFileSync(new URL('../games/last-hair/art/walk-v4/manifest.json',import.meta.url),'utf8'));assert.deepEqual(f.ev('WALK_RECTS'),manifest.frame_layout.rows.walk,'runtime uses the composed atlas rectangles');
const frames=new Set();for(let d=0;d<6.8;d+=.05)frames.add(f.ev(`walkFrameAt(${d})`));assert.equal(frames.size,6,'a walking cycle must actually visit all painted poses');
for(const distance of [0,1,10,128,499,500]){
 const header=f.ev(`distanceLayout(${distance})`);assert.equal(header.center,200,'flag and text are centered as one group');assert.equal(header.inkCenterY,27.5,'visible numeral bounds align to badge vertical center');assert.ok(header.left>=0&&header.width<=header.badgeWidth-20);
}
f.start();f.step(5);const before=f.ev('walkFrameAt(g.dist)');f.ptr('pointerdown',300,612,2);f.step(7);assert.notEqual(f.ev('walkFrameAt(g.dist)'),before,'holding hair must not stop walking poses');
f.el('lh-pause').handlers.click();assert.equal(f.ev('paused'),true);const pausedFrame=f.ev('walkFrameAt(g.dist)');f.step(20);assert.equal(f.ev('walkFrameAt(g.dist)'),pausedFrame,'pause freezes the actual walking pose');f.el('lh-pause').handlers.click();assert.equal(f.ev('paused'),false);
console.log('last-hair visual runtime: pose cycling, hold/pause and badge-centering checks passed');
