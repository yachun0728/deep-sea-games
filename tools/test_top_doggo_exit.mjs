// Regression: dismount must consider the occupied car and leave a walkable exit.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../games/top-doggo/play.html', import.meta.url), 'utf8');
const helper = source.slice(source.indexOf('  function findCarExit('), source.indexOf('  function toggleCar()'));
const car = { mesh: { position: { x: 0, z: 0 }, rotation: { y: 0 } } };
const ctx = { car, drivingMesh: car.mesh, Math, walls: [], checks: 0 };
ctx.moveBlockedAt = (x, z, r) => {
  ctx.checks++;
  assert.equal(ctx.drivingMesh, null, 'occupied car must participate in exit collision checks');
  const boxes = [{ x1: -1.2, x2: 1.2, z1: -3, z2: 3 }, ...ctx.walls];
  return boxes.some(b => x+r>b.x1 && x-r<b.x2 && z+r>b.z1 && z-r<b.z2);
};
vm.createContext(ctx); vm.runInContext(helper, ctx);
function checkExit() {
  const point = ctx.findCarExit(car);
  assert.ok(point);
  assert.equal(ctx.drivingMesh, car.mesh, 'collision skip restored after search');
  ctx.drivingMesh = null;
  assert.equal(ctx.moveBlockedAt(point.x, point.z, .85), false);
  ctx.drivingMesh = car.mesh;
  return point;
}
checkExit();
ctx.walls = [{ x1:-8,x2:-1.3,z1:-8,z2:8 }];
assert.ok(checkExit().x > 0, 'wall beside car selects open side');
ctx.walls.push({x1:-8,x2:8,z1:-8,z2:-3.1});
checkExit();
car.mesh.rotation.y=Math.PI/2; checkExit();
ctx.walls=[{x1:-20,x2:20,z1:-20,z2:20}];
assert.equal(ctx.findCarExit(car),null,'fully blocked area cannot force an unsafe exit');
assert.equal(ctx.drivingMesh,car.mesh,'failed search restores collision skip');
console.log('PASS: car collision, wall-side exit, corner, rotation, blocked exit and state restoration');
