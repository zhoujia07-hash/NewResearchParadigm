import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {SYNTHETIC_PROFILES,syntheticProfile,syntheticHuman} from '../models/human/syntheticProfiles';
import {SyntheticHumanBehaviorModel as model} from '../models/human/syntheticBehaviorModel';
import {illustrativeStyleLabel,type BehaviorContext,type HumanBehaviorStyleModel} from '../models/human/behaviorStyle';
import {ModelRegistry} from '../engine/modelRegistry';
import {createHumanBehaviorProvider} from '../presentation/humanBehaviorProvider';
import {humanMotionPose,expressionTime,residentBehaviorStyle} from '../presentation/humanMotion';
import {avatarPose} from '../lib/navigationModel';
import {startStory,tick,skipStory,submit,type Choice} from '../lib/story';
import {legacyStoryAdapter} from '../compatibility/legacyStoryAdapter';
import {createCouplingEngine} from '../engine/couplingEngine';
import {legacyEnvironmentModel,prototypePolicy,unspecifiedStateEstimator} from '../compatibility/legacyModels';
import {presentHumanNavigation} from '../presentation/adapters/humanNavigationPresentation';
const context:BehaviorContext={environmentId:'same-hospital',stage:'normal',mobility:{kind:'walking'}};
const style=(id:string)=>model.behaviorStyle(syntheticProfile(id),context);
function vary(changes:Partial<typeof SYNTHETIC_PROFILES[number]['parameters']>){
  const profile=syntheticProfile('R08');return {...profile,traits:{...profile.traits,extensions:{syntheticHumanParameters:{...profile.parameters,...changes}}}};
}
test('Synthetic fixtures: eight explicit unique normalized reproducible profiles, no participant or neural data',()=>{
  assert.deepEqual(SYNTHETIC_PROFILES.map(p=>p.id),['R01','R02','R03','R04','R05','R06','R07','R08']);
  const again=JSON.stringify(SYNTHETIC_PROFILES);
  for(const p of SYNTHETIC_PROFILES){
    assert.equal(p.evidenceStatus,'synthetic');assert.equal(syntheticProfile(p.id),p);
    assert.equal(Object.isFrozen(p.parameters),true);assert.equal(Object.keys(p.parameters).length,6);
    for(const v of Object.values(p.parameters))assert.ok(Number.isFinite(v)&&v>=0&&v<=1);
    assert.doesNotMatch(JSON.stringify(p),/lostProbability|lostnessProbability|grid-cell|neural|successor|predictive-map/);
    const h=syntheticHuman(p.id);for(const s of Object.values(h.states).filter(v=>typeof v==='object'&&'kind' in v))assert.equal(s.kind,'unknown');
    assert.deepEqual(h.behaviors.observations,[]);
  }
  assert.equal(JSON.stringify(SYNTHETIC_PROFILES),again);assert.throws(()=>syntheticProfile('R09'));
  const r06=syntheticProfile('R06');assert.deepEqual(r06.traits.ageGroup.kind==='value'&&r06.traits.ageGroup.value,'Older adult');
  assert.deepEqual(r06.traits.mobilityCapability.kind==='value'&&r06.traits.mobilityCapability.value,'Walker');assert.equal(r06.parameters.vulnerability,.9);
});
test('Synthetic rules only: deterministic bounded styles and explicit meso-to-macro metadata',()=>{
  assert.equal(model.metadata.evidence,'synthetic');assert.equal(model.metadata.analysis?.domain,'human');
  assert.deepEqual(model.metadata.analysis?.humanAnalysisLevels,['meso-psychometric-cognitive','macro-behavior']);
  const registry=new ModelRegistry();registry.register('human',model);assert.equal(registry.get('human',model.metadata.id,model.metadata.version),model);
  for(const p of SYNTHETIC_PROFILES){const a=style(p.id);assert.deepEqual(a,style(p.id));assert.equal(a.evidenceStatus,'synthetic');
    for(const [key,v] of Object.entries(a))if(typeof v==='number')assert.ok(v>=(key==='speedMultiplier'?.8:0)&&v<=(key==='speedMultiplier'?1.12:1),key);
    assert.match(a.provenance.note!,/not validated/);
  }
  assert.deepEqual(new Set(SYNTHETIC_PROFILES.map(p=>illustrativeStyleLabel(style(p.id)))),new Set(['Direct navigator','Cautious navigator','High-scanning navigator']));
  assert.throws(()=>model.behaviorStyle(vary({spatialAnxiety:NaN}),context),/normalized/);
});
test('Synthetic implementation assumptions: isolated trait changes affect declared expression dimensions',()=>{
  const derive=(changes:Parameters<typeof vary>[0])=>model.behaviorStyle(vary(changes),context);
  assert.ok(derive({senseOfDirection:.1}).turnDecisiveness<derive({senseOfDirection:.9}).turnDecisiveness);
  assert.ok(derive({spatialAnxiety:.9}).scanIntensity>derive({spatialAnxiety:.1}).scanIntensity);
  assert.ok(derive({spatialAnxiety:.9}).hesitationIntensity>derive({spatialAnxiety:.1}).hesitationIntensity);
  assert.ok(derive({navigationExperience:.9}).movementConsistency>derive({navigationExperience:.1}).movementConsistency);
  assert.ok(derive({vulnerability:.9}).speedMultiplier<derive({vulnerability:.1}).speedMultiplier);
  for(const D of [0,1])for(const A of [0,1])for(const E of [0,1])for(const V of [0,1]){
    const s=derive({senseOfDirection:D,spatialAnxiety:A,navigationExperience:E,vulnerability:V});
    assert.ok(s.speedMultiplier>=.8&&s.speedMultiplier<=1.12);assert.ok(s.scanIntensity<=1&&s.hesitationIntensity<=1);
  }
});
test('Synthetic HumanModel proposals use existing coupling port and do not populate latent states or affect Machine',()=>{
  const snapshot=legacyStoryAdapter.snapshot(skipStory());
  const system={...snapshot.system,humans:SYNTHETIC_PROFILES.map(p=>syntheticHuman(p.id))},before=JSON.stringify(system);
  const result=createCouplingEngine({human:model,environment:legacyEnvironmentModel,estimator:unspecifiedStateEstimator,machine:prototypePolicy}).evaluate({system,history:[]});
  assert.equal(result.behaviors.length,8);assert.equal(result.behaviors[0].behaviors.observations[0].provenance.basis,'model-output');
  assert.equal(result.humanEstimates[0].kind,'machine-estimate');assert.equal(result.humanEstimates[0].value.kind,'unknown');
  assert.equal(result.decision,system.machine.decision);assert.equal(JSON.stringify(system),before);
  assert.deepEqual(result.outcomes,[]);assert.deepEqual(result.adaptations,[]);
});
test('Human presentation provider can be replaced without a scene, Story or Machine change',()=>{
  const replacement:HumanBehaviorStyleModel={...model,behaviorStyle:()=>({...style('R01'),scanIntensity:0})};
  const provider=createHumanBehaviorProvider(replacement,syntheticProfile);
  assert.equal(provider.style('R06',context).scanIntensity,0);assert.equal(provider.profile('R06').id,'R06');
});
test('Synthetic expression: bounded forward path progress and endpoint-preserving holds',()=>{
  for(const p of SYNTHETIC_PROFILES){const s=style(p.id);let previous=-1;
    for(let t=0;t<=48;t+=.01){const expressed=expressionTime(t,s);assert.ok(expressed>=previous-1e-9);assert.ok(Math.abs(expressed-t)<.6);previous=expressed;}
    for(let t=0;t<=45;t+=3)assert.ok(Math.abs(expressionTime(t,s)-t)<1e-9);
  }
  const story=tick(startStory(),7),before=JSON.stringify(story);
  for(let i=0;i<8;i++){humanMotionPose(story,i);assert.equal(humanMotionPose(story,i,true).looking,0);assert.equal(humanMotionPose({...story,paused:true},i).walking,false);}
  assert.equal(JSON.stringify(story),before);
});
test('Synthetic expression leaves R06 official choreography, timing, crisis and A/B/C endpoints intact',()=>{
  for(const t of [4,8,12,14.4,17,19.4,24,25,35]){
    const s=tick(startStory(),t);assert.deepEqual(humanMotionPose(s,5).position,avatarPose(s,5).position);
    if(s.stage==='emerging')assert.deepEqual(humanMotionPose(s,5),avatarPose(s,5));
  }
  for(const choice of ['A','B','C'] as Choice[]){const s=tick(submit(skipStory(),choice,85),10);
    assert.deepEqual(humanMotionPose(s,5),avatarPose(s,5));assert.deepEqual([s.total,s.automatic,s.escalations],[40,39,1]);
  }
  assert.deepEqual(readFileSync('lib/story.ts'),execFileSync('git',['show','8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0:showcase-web/lib/story.ts']));
});
test('Public profile separates synthetic traits, observable actions and legacy diagnostics',()=>{
  const s=tick(startStory(),5);assert.notDeepEqual(presentHumanNavigation(s,0).traits,presentHumanNavigation(s,5).traits);
  assert.equal(presentHumanNavigation(s,0).styleLabel,'Direct navigator');assert.equal(presentHumanNavigation(s,3).styleLabel,'Cautious navigator');
  assert.equal(presentHumanNavigation(s,4).styleLabel,'High-scanning navigator');
  assert.equal(residentBehaviorStyle(s,5).evidenceStatus,'synthetic');
});
