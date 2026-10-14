import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {HUMAN_ANALYSIS_LEVELS,validateHumanAnalysisLevels,type HumanAnalysisLevel} from '../models/human/analysisLevels';
import type {HumanAnalysisRecord,NeuralComputationalDescription,CrossLevelHumanHypothesis} from '../models/human/multilevel';
import type {ResearchNavigationOutcome} from '../models/human/outcomes';
import type {HumanStates} from '../models/human/types';
import type {HumanStateEstimate} from '../models/machine/types';
import {ENVIRONMENT_ANALYSIS_LEVELS} from '../models/environment/navigationScience';
import {MACHINE_PROCESS_LEVELS,type MachineResearchInputs} from '../models/machine/navigationScience';
import {validateModelAnalysis} from '../models/analysisMetadata';
import {ModelRegistry} from '../engine/modelRegistry';
import {legacyHumanModel} from '../compatibility/legacyModels';
import {NavigationFactorRegistry,createNavigationFactorRegistry,validateScientificSource} from '../models/evidence/navigationFactorRegistry';
import {SCIENTIFIC_SOURCES} from '../models/evidence/scientificSources';
import {legacyStoryAdapter} from '../compatibility/legacyStoryAdapter';
import {skipStory} from '../lib/story';
function negativeContracts(macro:Extract<HumanAnalysisRecord,{analysisLevel:'macro-behavior'}>,micro:NeuralComputationalDescription,estimate:HumanStateEstimate){
  // @ts-expect-error Observable behavior is not a micro mechanism.
  const mechanism:NeuralComputationalDescription=macro;
  // @ts-expect-error Neural mechanisms are not meso psychological states.
  const psychological:HumanStates=micro;
  // @ts-expect-error A Machine estimate is not a Human latent state.
  const state:HumanStates=estimate;
  // @ts-expect-error Explicit levels only.
  const level:HumanAnalysisLevel='neural';
  // @ts-expect-error Long-term learning is not an immediate outcome.
  const horizon:ResearchNavigationOutcome={kind:'research-outcome',horizon:'immediate',type:'skill-retention',window:{kind:'episode-window',scale:'seconds',episodeId:'e',startSeconds:0,endSeconds:1},value:{kind:'unknown',reason:'not measured'}};
  void [mechanism,psychological,state,level,horizon];
}
void negativeContracts;
test('Human levels are explicit, optional and noninterchangeable',()=>{
  assert.equal(HUMAN_ANALYSIS_LEVELS.length,3);validateHumanAnalysisLevels(undefined);validateHumanAnalysisLevels(HUMAN_ANALYSIS_LEVELS);
  assert.throws(()=>validateHumanAnalysisLevels(['neural' as never]));assert.throws(()=>validateHumanAnalysisLevels([]));
  assert.throws(()=>validateHumanAnalysisLevels(['macro-behavior','macro-behavior']));
  const macro:HumanAnalysisRecord={analysisLevel:'macro-behavior',behavior:{kind:'behaviors',observations:[]}};
  assert.equal(macro.behavior.kind,'behaviors');assert.ok(!('description' in macro));
  const inputs:MachineResearchInputs={humanLevels:['macro-behavior'],environmentScales:['global','local','immediate']};assert.equal(inputs.humanLevels.length,1);
});
test('One Human model may span multiple levels; legacy registry registration still works',()=>{
  const model={...legacyHumanModel,metadata:{...legacyHumanModel.metadata,id:'test-cross-level',analysis:{domain:'human' as const,
    analysisLevels:['behavioral','psychometric-cognitive'] as const,humanAnalysisLevels:['macro-behavior','meso-psychometric-cognitive'] as const}}};
  const registry=new ModelRegistry();registry.register('human',model);assert.equal(registry.get('human','test-cross-level',model.metadata.version),model);
  assert.throws(()=>registry.register('human',{...model,metadata:{...model.metadata,id:'bad',analysis:{domain:'human',analysisLevels:['machine-policy']}}}),/domain/);
  assert.throws(()=>validateModelAnalysis({domain:'human',analysisLevels:['behavioral'],humanAnalysisLevels:['micro-neural-computational']},'human'),/Inconsistent/);
  validateModelAnalysis({domain:'coupling',analysisLevels:['behavioral','environmental-local','machine-policy']},'human');
  const legacy=new ModelRegistry();legacy.register('human',legacyHumanModel);assert.equal(legacy.list('human').length,1);
});
test('Behavior classification never silently promotes cited sources to neural or psychometric evidence',()=>{
  const r=createNavigationFactorRegistry(),behavior=r.get('human.behavior.backtracking','1.0.0')!;
  assert.deepEqual(behavior.humanAnalysisLevels,['macro-behavior']);
  for(const key of ['state.navigation-uncertainty','navigation-trait.sense-of-direction','representation.place-knowledge','strategy.geometry-based'])
    assert.deepEqual(r.get('human.'+key,'1.0.0')?.humanAnalysisLevels,['meso-psychometric-cognitive']);
  for(const source of SCIENTIFIC_SOURCES)assert.equal(source.humanAnalysisLevels,undefined);
  validateScientificSource({...SCIENTIFIC_SOURCES[0],humanAnalysisLevels:HUMAN_ANALYSIS_LEVELS}); // Explicit multi-level declarations are permitted, not inferred.
  const explicit={...SCIENTIFIC_SOURCES[0],humanAnalysisLevels:['macro-behavior'] as const};
  const scoped=new NavigationFactorRegistry([explicit]);scoped.register({...behavior,sources:[explicit],evidenceClass:explicit.evidenceClass,evidenceStatus:'source-linked-concept'});
  assert.deepEqual(scoped.get(behavior.id,behavior.version)?.sources[0].humanAnalysisLevels,['macro-behavior']);
  assert.throws(()=>validateScientificSource({...explicit,humanAnalysisLevels:['neural' as never]}),/Human analysis/);
  assert.throws(()=>new NavigationFactorRegistry().register({...behavior,humanAnalysisLevels:['unknown' as never]}),/Human analysis/);
});
test('Environment scales and Machine process remain distinct from Human resolutions',()=>{
  assert.deepEqual(Object.keys(ENVIRONMENT_ANALYSIS_LEVELS),['global','local','immediate']);assert.equal(new Set(Object.values(ENVIRONMENT_ANALYSIS_LEVELS)).size,3);
  assert.deepEqual(MACHINE_PROCESS_LEVELS,['sense','estimate','decide','intervene','observe-response','adapt-escalate']);
});
test('Cross-level hypotheses support competing mechanisms and bottom-up inference without enforcing causality',()=>{
  const q:CrossLevelHumanHypothesis={kind:'cross-level-human-hypothesis',id:'example-only',question:'Could competing mechanisms explain hesitation?',
    levels:HUMAN_ANALYSIS_LEVELS,direction:'bottom-up-inference',competingMechanismIds:['candidate-a','candidate-b'],outcomeFactorIds:['human.outcome.route-efficiency'],
    evidenceClass:'framework-hypothesis',causalStatus:'not-established'};
  assert.equal(q.competingMechanismIds.length,2);assert.ok(!('coefficient' in q));assert.ok(!('apply' in q));
});
test('Legacy snapshot and Showcase files remain unchanged',()=>{
  const s=legacyStoryAdapter.snapshot(skipStory());assert.equal(s.system.humans[5].states.lostness.kind,'unknown');assert.equal(s.system.humans[5].representations,undefined);
  assert.equal(s.system.humans[5].states.kind,'states');
  const base='4135e0a94888fc11309e8371587cf0efb5bc4a83';
  const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'showcase-web/app','showcase-web/components','showcase-web/lib','showcase-web/compatibility','showcase-web/presentation','demo.py','app.py','triage.py'],{cwd:'..',encoding:'utf8'}).trim().split('\n');
  for(const p of paths)assert.deepEqual(readFileSync('../'+p),execFileSync('git',['show',base+':'+p],{cwd:'..'}),p);
});
