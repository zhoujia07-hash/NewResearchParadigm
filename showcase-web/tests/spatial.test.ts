import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {EDGES,NODES,RESIDENTS,skipStory,startStory,submit,tick,type Choice} from '../lib/story';
import {CONNECTIONS,SPATIAL_NODES,toWorld} from '../lib/environmentModel';
import {avatarPose,r06Choreography,spatialLocation} from '../lib/navigationModel';

test('V1 story source is byte-identical, including timing, triage, identities and outcomes',()=>{
 const stable=execFileSync('git',['show','8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0:showcase-web/lib/story.ts']);
 assert.deepEqual(readFileSync('lib/story.ts'),stable);
});
test('3D environment preserves all nine named nodes and ten logical connections',()=>{
 assert.equal(SPATIAL_NODES.length,9);assert.equal(CONNECTIONS.length,10);
 assert.deepEqual(CONNECTIONS.map(c=>[c.a,c.b]),EDGES);
 for(const n of SPATIAL_NODES)assert.deepEqual(n.position,toWorld(NODES[n.name]));
 assert.ok(toWorld(NODES['West Exit'])[0]<toWorld(NODES['East Exit'])[0]);
});
test('R06 visual choreography has two emerging backtracks and explicit hesitation',()=>{
 let reversing=false,count=0;
 for(let t=12.05;t<25;t+=.05){const delta=r06Choreography(t)[0]-r06Choreography(t-.05)[0];
  if(delta<-.001&&!reversing){count++;reversing=true;}else if(delta>.001)reversing=false;
 }
 assert.equal(count,2);assert.deepEqual(r06Choreography(14.2),r06Choreography(14.6));
 assert.deepEqual(r06Choreography(19.2),r06Choreography(19.7));
 assert.deepEqual(r06Choreography(25),[520,200]);
 assert.deepEqual(r06Choreography(15,true),r06Choreography(16,true));
});
test('avatar presentation cannot mutate story and stops at manual or human pause',()=>{
 let s=tick(startStory(),10);const original=JSON.stringify(s);
 assert.ok(avatarPose(s,5).walking);avatarPose(s,5);assert.equal(JSON.stringify(s),original);
 assert.equal(avatarPose({...s,paused:true},5).walking,false);
 s=skipStory();for(let i=0;i<RESIDENTS.length;i++)assert.equal(avatarPose(s,i).walking,false);
 assert.deepEqual(avatarPose(tick(s,1000),5).position,toWorld(NODES['Junction B']));
});
test('3D A/B/C endpoints and nearest profile location match the preserved outcome',()=>{
 for(const c of ['A','B','C'] as Choice[]){const s=tick(submit(skipStory(),c,85),10);
  const place=c==='A'?'West Exit':c==='B'?'East Corridor':'Refuge Point';
  assert.deepEqual(avatarPose(s,5).position,toWorld(NODES[place]));assert.equal(spatialLocation(s,5),place);
  assert.equal(s.total,40);assert.equal(s.automatic,39);assert.equal(s.escalations,1);
 }
});
