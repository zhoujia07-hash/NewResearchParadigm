import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tick,startStory,skipStory} from '../lib/story';
import {avatarPose} from '../lib/navigationModel';


test('integrated art has no prototype clock dependency; frozen poses cannot look around',()=>{
 for(const path of ['components/scene/HospitalModel.tsx','components/scene/ResidentAvatar.tsx','lib/spatialPresentation.ts']){
  const source=readFileSync(path,'utf8');assert.doesNotMatch(source,/visualTimeline|prototypes\/v2|VisualClock|samplePose/);
 }
 const hesitation=tick(startStory(),14.4);
 assert.ok(Math.abs(avatarPose(hesitation,5).looking)>0);
 assert.equal(avatarPose({...hesitation,paused:true},5).looking,0);
 assert.equal(avatarPose(hesitation,5,true).looking,0);
 assert.equal(avatarPose(skipStory(),5).looking,0);
});


test('emerging avatar gait slows within Story time without advancing any observations',()=>{
 const normal=tick(startStory(),8),emerging=tick(startStory(),13);
 const phaseStep=(s:typeof normal)=>avatarPose({...s,elapsed:s.elapsed+.1},5).phase-avatarPose(s,5).phase;
 assert.ok(phaseStep(emerging)<phaseStep(normal));
 const ledger=JSON.stringify(emerging.observations);avatarPose(emerging,5);
 assert.equal(JSON.stringify(emerging.observations),ledger);
});
