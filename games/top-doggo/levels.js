/* Add a level here to extend the campaign; the picker paginates automatically. */
(function(root){
 const levels=[
  {hp:1.4,dmg:.65,rate:1.5,speed:.85,bspeed:14,melee:6,extra:0,kills:8,bones:4,ram:3,combo:3,elite:3,bosses:['boss']},
  {hp:1.7,dmg:.8,rate:1.3,speed:.9,bspeed:15,melee:7,extra:3,kills:12,bones:5,ram:4,combo:4,elite:5,bosses:[]},
  {hp:2.05,dmg:1,rate:1.12,speed:.96,bspeed:16,melee:9,extra:6,kills:16,bones:6,ram:5,combo:5,elite:7,bosses:['boss','boss']},
  {hp:2.45,dmg:1.2,rate:.96,speed:1.02,bspeed:17,melee:11,extra:9,kills:20,bones:7,ram:6,combo:6,elite:9,bosses:[]},
  {hp:2.9,dmg:1.4,rate:.82,speed:1.08,bspeed:18,melee:13,extra:12,kills:24,bones:8,ram:7,combo:7,elite:11,bosses:['boss','warlord']},
  {hp:3.4,dmg:1.65,rate:.7,speed:1.14,bspeed:19,melee:15,extra:15,kills:28,bones:9,ram:8,combo:8,elite:13,bosses:[]},
  {hp:3.95,dmg:1.9,rate:.6,speed:1.2,bspeed:20,melee:17,extra:18,kills:32,bones:10,ram:9,combo:9,elite:15,bosses:['boss','warlord','warlord']},
  {hp:4.55,dmg:2.15,rate:.52,speed:1.26,bspeed:21,melee:19,extra:21,kills:36,bones:11,ram:10,combo:10,elite:17,bosses:[]},
  {hp:5.2,dmg:2.4,rate:.45,speed:1.32,bspeed:22,melee:21,extra:24,kills:40,bones:12,ram:11,combo:11,elite:19,bosses:['boss','warlord','warlord','warlord']},
  {hp:5.9,dmg:2.7,rate:.39,speed:1.38,bspeed:23,melee:24,extra:27,kills:44,bones:13,ram:12,combo:12,elite:21,bosses:['warlord','warlord','warlord','warlord','warlord']}
 ];
 const api={levels,PAGE_SIZE:10,get:n=>levels[n-1]||levels[0]};
 if(typeof module==='object')module.exports=api;else root.TopDoggoLevels=api;
})(typeof window==='object'?window:this);
