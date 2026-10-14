import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {SCIENTIFIC_SOURCES} from '../models/evidence/scientificSources';
import {NAVIGATION_FACTORS,LEGACY_FACTOR_BINDINGS,LEGACY_DIAGNOSTIC_BINDINGS} from '../models/evidence/navigationEvidence';
import {NavigationFactorRegistry,createNavigationFactorRegistry,validateScientificSource} from '../models/evidence/navigationFactorRegistry';
import {EVIDENCE_CLASSES,FACTOR_LAYERS,OBSERVABILITIES,type NavigationFactorDefinition} from '../models/evidence/types';
import {TEMPORAL_SCALES,SPATIAL_SCALES,type TemporalScale,type SpatialScale,type EpisodeWindow,type LongitudinalWindow} from '../models/navigation/scales';
import type {HumanTraits,HumanStates,HumanBehaviors} from '../models/human/types';
import type {NavigationRepresentations} from '../models/human/navigationScience';
import type {HumanStateEstimate} from '../models/machine/types';
import type {NavigationOutcome} from '../models/human/outcomes';
import type {MobilityMode} from '../models/mobility/types';
import type {NavigationHistory} from '../models/navigation/history';
import {unknownValue} from '../models/shared';
import {NAVIGATION_TASKS} from '../models/navigation/task';
import {NAVIGATION_INTERACTION_QUESTIONS,EXAMPLE_NAVIGATION_CHALLENGE} from '../engine/navigationHypotheses';
import {legacyStoryAdapter} from '../compatibility/legacyStoryAdapter';
import {legacyHumanModel,legacyEnvironmentModel,unspecifiedStateEstimator,prototypePolicy} from '../compatibility/legacyModels';
import {createCouplingEngine} from '../engine/couplingEngine';
import {skipStory,submit,tick} from '../lib/story';

function typeContracts(trait:HumanTraits,state:HumanStates,behavior:HumanBehaviors,strategy:NavigationRepresentations,estimate:HumanStateEstimate,outcome:NavigationOutcome,episode:EpisodeWindow){
  // @ts-expect-error A context-dependent strategy is not a stable trait.
  const t:HumanTraits=strategy;
  // @ts-expect-error A conceptual latent state is not a strategy.
  const s:NavigationRepresentations=state;
  // @ts-expect-error Observable behavior is not a latent state.
  const h:HumanStates=behavior;
  // @ts-expect-error A machine estimate is not conceptual/true Human state.
  const groundTruth:HumanStates=estimate;
  // @ts-expect-error Outcomes are not observable behavior collections.
  const b:HumanBehaviors=outcome;
  // @ts-expect-error Seconds/episode windows are not lifetime/exposure windows.
  const years:LongitudinalWindow=episode;
  // @ts-expect-error Explicit scientific temporal vocabulary.
  const badTime:TemporalScale='some-time';
  // @ts-expect-error Explicit spatial vocabulary; micro is represented as immediate.
  const badSpace:SpatialScale='micro';
  void [trait,t,s,h,groundTruth,b,years,badTime,badSpace];
}
void typeContracts;
const registry=createNavigationFactorRegistry();
const lookup=(id:string)=>{const f=registry.get(id,'1.0.0');assert.ok(f,id);return f;};

test('Eight supplied sources have auditable metadata, valid optional DOIs and honest verification status',()=>{
  assert.equal(SCIENTIFIC_SOURCES.length,8);assert.equal(new Set(SCIENTIFIC_SOURCES.map(s=>s.id)).size,8);
  for(const source of SCIENTIFIC_SOURCES){
    validateScientificSource(source);assert.ok(source.title.trim());assert.ok(EVIDENCE_CLASSES.includes(source.evidenceClass));
    if(source.doi)assert.match(source.doi,/^10\.\d{4,9}\/[^\s]+$/);
    assert.equal(source.verification.metadata,'project-owner-supplied');assert.equal(source.verification.content,'not-independently-accessed');
    assert.match(source.verification.note,/403/);assert.ok(!('sampleSize' in source));
  }
  assert.equal(SCIENTIFIC_SOURCES.filter(s=>s.doi).length,7);
  assert.equal(SCIENTIFIC_SOURCES.find(s=>s.id==='masis-obando-2026')?.doi,undefined);
  assert.throws(()=>validateScientificSource({...SCIENTIFIC_SOURCES[0],title:' '}),/bibliographic/);
  assert.throws(()=>validateScientificSource({...SCIENTIFIC_SOURCES[0],doi:'made-up'}),/DOI/);
  assert.throws(()=>validateScientificSource({...SCIENTIFIC_SOURCES[0],evidenceClass:'invalid' as never}),/class/);
});
test('Factor ontology has unique IDs, explicit scales/observability and no empirical implementations',()=>{
  assert.equal(NAVIGATION_FACTORS.length,233);assert.equal(new Set(NAVIGATION_FACTORS.map(f=>f.id)).size,233);
  const usedSources=new Set<string>();
  for(const factor of registry.list()){
    assert.ok(FACTOR_LAYERS.includes(factor.layer));assert.ok(OBSERVABILITIES.includes(factor.observability));
    assert.ok(factor.temporalScale.length&&factor.spatialScale.length);
    assert.ok(factor.temporalScale.every(t=>TEMPORAL_SCALES.includes(t)));assert.ok(factor.spatialScale.every(s=>SPATIAL_SCALES.includes(s)));
    assert.equal(factor.causalStatus,'not-established');assert.notEqual(factor.implementationStatus,'empirical');
    assert.deepEqual(factor.populationApplicability,[]);assert.match(factor.applicabilityNote,/not mean universal/);
    for(const source of factor.sources)usedSources.add(source.id);
  }
  assert.equal(usedSources.size,8);assert.equal(registry.list({evidenceStatus:'source-linked-concept'}).length,57);
  assert.equal(registry.list({evidenceStatus:'framework-placeholder'}).length,149);
  assert.equal(registry.list({evidenceStatus:'synthetic'}).length,27);
  assert.equal(registry.list({evidenceStatus:'direct-source-support'}).length,0);
});
test('Factor registry versions, immutable records and duplicate/source checks are explicit',()=>{
  const r=new NavigationFactorRegistry(SCIENTIFIC_SOURCES),factor=NAVIGATION_FACTORS[0];
  r.register(factor);assert.throws(()=>r.register(factor),/Duplicate/);
  r.register({...factor,version:'1.0.1'});assert.equal(r.get(factor.id,'1.0.1')?.version,'1.0.1');
  assert.equal(r.get(factor.id,'missing'),undefined);assert.equal(r.get('missing','1.0.0'),undefined);
  assert.equal(Reflect.set(r.get(factor.id,'1.0.0')!,'claimScope','tamper'),false);
  assert.equal(Object.isFrozen(r.get(factor.id,'1.0.0')!.sources),true);
  assert.throws(()=>new NavigationFactorRegistry([SCIENTIFIC_SOURCES[0],SCIENTIFIC_SOURCES[0]]),/Duplicate/);
});
test('Factor metadata rejects invalid layers, classes, observability, scales, applicability and source promotion',()=>{
  const f=NAVIGATION_FACTORS[0],r=new NavigationFactorRegistry(SCIENTIFIC_SOURCES);
  const invalid:Partial<NavigationFactorDefinition>[]=[
    {layer:'planet' as never},{layer:'machine'},{evidenceClass:'made-up' as never},{observability:'maybe' as never},
    {temporalScale:['some-time' as never]},{spatialScale:['nowhere' as never]},{temporalScale:[]},
    {taskApplicability:['undefined-task' as never]},{mobilityApplicability:['teleport' as never]},
    {evidenceStatus:'direct-source-support'},
    {sources:[{...SCIENTIFIC_SOURCES[0],verification:{...SCIENTIFIC_SOURCES[0].verification,content:'full-text-reviewed'}}]},
    {sources:[],evidenceClass:'nature-primary',evidenceStatus:'framework-placeholder'},
    {implementationStatus:'interface-only',implementation:{kind:'model',reference:'fake',version:'1',validated:false}},
  ];
  for(const change of invalid)assert.throws(()=>r.register({...f,...change}),JSON.stringify(change));
});
test('SoD/anxiety/time pressure/signage/vibration remain placeholders; neural context is not visual salience',()=>{
  for(const id of ['human.navigation-trait.sense-of-direction','human.navigation-trait.spatial-anxiety-trait','human.state.spatial-anxiety',
    'environment.situation.time-pressure','environment.wayfinding-information.signage','machine.platform.smartwatch',
    'machine.intervention.vibration','environment.landmark-cue.salience']){
    const f=lookup(id);assert.equal(f.evidenceStatus,'framework-placeholder');assert.equal(f.sources.length,0);assert.equal(f.implementation.kind,'none');
  }
  const neural=lookup('environment.memory-context.spatial-context-reliability'),visual=lookup('environment.visual-context.visual-salience');
  assert.notEqual(neural.id,visual.id);assert.equal(visual.sources.length,0);assert.match(neural.exclusions.join(' '),/not be converted/);
  assert.equal(lookup('human.state.lostness').observability,'latent');assert.equal(lookup('human.behavior.backtracking').observability,'observed');
});
test('Legacy factor audit covers all pre-refinement traits/states/environment fields and diagnostic factors',()=>{
  const snapshot=legacyStoryAdapter.snapshot(skipStory());
  for(const [prefix,object] of [
    ['human.traits',snapshot.system.humans[5].profile.traits],['human.states',snapshot.system.humans[5].states],
    ['environment.physical',snapshot.system.environment.physical],['environment.spatial',snapshot.system.environment.spatial],
    ['environment.information',snapshot.system.environment.information],['environment.situational',snapshot.system.environment.situational],
  ] as const){
    for(const key of Object.keys(object).filter(k=>!['kind','extensions','coordinateSystem'].includes(k)))
      assert.ok(LEGACY_FACTOR_BINDINGS[`${prefix}.${key}`],`${prefix}.${key}`);
  }
  for(const id of [...Object.values(LEGACY_FACTOR_BINDINGS),...Object.values(LEGACY_DIAGNOSTIC_BINDINGS)])lookup(id);
  for(const key of Object.keys(snapshot.system.machine.detection.diagnostics.R06.inputs))assert.ok(LEGACY_DIAGNOSTIC_BINDINGS[key]);
  for(const estimate of [...snapshot.system.machine.detection.human,...snapshot.system.machine.detection.environment]){
    assert.equal(estimate.kind,'machine-estimate');assert.equal(estimate.uncertainty.kind,'unknown');assert.equal(estimate.provenance.basis,'scripted');
  }
  assert.equal(snapshot.system.humans[5].states.lostness.kind,'unknown');assert.equal(snapshot.system.machine.detection.diagnostics.R06.score.toFixed(4),'0.8394');
});
test('One person/environment can reference multiple contextual strategies without assigning a permanent trait',()=>{
  const base={kind:'representations-strategies' as const,humanId:'person',environmentId:'place',taskId:'task',
    window:{kind:'episode-window' as const,scale:'minutes' as const,episodeId:'episode',startSeconds:0,endSeconds:60},
    placeKnowledge:unknownValue<string>(),routeKnowledge:unknownValue<string>(),surveyKnowledge:unknownValue<string>(),
    egocentricRepresentation:unknownValue<string>(),allocentricRepresentation:unknownValue<string>()};
  const strategies:NavigationRepresentations[]=[{...base,strategies:[{strategy:'landmark-based',engagement:unknownValue()}]},
    {...base,strategies:[{strategy:'geometry-based',engagement:unknownValue()}]}];
  assert.equal(strategies[0].humanId,strategies[1].humanId);assert.equal(strategies[0].environmentId,strategies[1].environmentId);
  assert.notDeepEqual(strategies[0].strategies,strategies[1].strategies);
  const modes:MobilityMode[]=[{kind:'imagined-navigation'},{kind:'stationary-route-planning'}];assert.equal(modes.length,2);
  assert.equal(NAVIGATION_TASKS.length,9);
});
test('Interactions and person–environment challenge refer to valid versioned factors but encode no answers or scores',()=>{
  assert.deepEqual(NAVIGATION_INTERACTION_QUESTIONS.map(q=>q.participants.length),[2,2,2,3]);
  for(const question of NAVIGATION_INTERACTION_QUESTIONS){
    const layers=new Set(question.factorIds.map(id=>registry.get(id,question.factorVersion)!.layer));
    for(const participant of question.participants)assert.ok(layers.has(participant));
    for(const id of question.contextFactorIds)assert.equal(lookup(id).layer,'task');
    assert.equal(question.evidenceClass,'framework-hypothesis');assert.ok(!('answer' in question));assert.ok(!('coefficient' in question));
  }
  const c=EXAMPLE_NAVIGATION_CHALLENGE;assert.equal(c.assessment,'unassessed');assert.ok(!('score' in c));
  for(const id of [...c.capabilityFactorIds,...c.stateFactorIds,...c.demandFactorIds,...c.machineSupportFactorIds])lookup(id);
});
test('Episode/longitudinal histories remain separate and optional research context executes no feedback transition',()=>{
  const history:NavigationHistory={episodes:[],longitudinal:{environmentalExposures:[{
    kind:'historical-environmental-exposure',id:'upbringing',humanId:'hypothetical-person',
    window:{kind:'longitudinal-window',scale:'developmental',reference:'age',unit:'years',start:0,end:18},
    scope:{scale:'global',environmentId:'historical-town'},type:'upbringing',description:unknownValue(),factorIds:['environment.historical-exposure.upbringing'],
  }],technologyExposures:[],learningAndMemory:[]}};
  const system=legacyStoryAdapter.snapshot(skipStory()).system,before=JSON.stringify(system);
  assert.ok(!('historicalExposure' in system.environment));
  const result=createCouplingEngine({human:legacyHumanModel,environment:legacyEnvironmentModel,estimator:unspecifiedStateEstimator,machine:prototypePolicy}).evaluate({
    system,history:[],research:{task:{id:'hypothesis-only',type:'free-wayfinding',description:'No empirical task simulation'},history,
      interactions:NAVIGATION_INTERACTION_QUESTIONS,challenges:[EXAMPLE_NAVIGATION_CHALLENGE],feedbackProposals:[]}});
  assert.equal(JSON.stringify(system),before);assert.equal(result.decision.status,'awaiting-human');
  assert.deepEqual(result.outcomes,[]);assert.deepEqual(result.adaptations,[]);
  assert.equal(result.humanEstimates[5].value.kind,'unknown');assert.equal(system.humans[5].states.kind,'states');
});
function runtimeImports(entry:string,seen=new Set<string>()):Set<string>{
  const path=resolve(entry);if(seen.has(path))return seen;seen.add(path);
  const ast=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true);
  for(const node of ast.statements)if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
    const clause=node.importClause;if(clause?.isTypeOnly)continue;
    if(clause&&!clause.name&&clause.namedBindings&&ts.isNamedImports(clause.namedBindings)&&clause.namedBindings.elements.every(e=>e.isTypeOnly))continue;
    const spec=node.moduleSpecifier.text;if(!spec.startsWith('.')&&!spec.startsWith('@/'))continue;
    const base=spec.startsWith('@/')?resolve(spec.slice(2)):resolve(dirname(path),spec);
    const next=[base+'.ts',base+'.tsx',join(base,'index.ts')].find(existsSync);if(next)runtimeImports(next,seen);
  }return seen;
}
test('Evidence catalogs, research hypotheses and new composition engine do not control the current public runtime',()=>{
  const imports=runtimeImports('app/page.tsx');
  for(const path of imports)assert.doesNotMatch(path,/scientificSources\.ts|navigationEvidence\.ts|navigationFactorRegistry\.ts|navigationHypotheses\.ts|couplingEngine\.ts/);
  // V2.2-B authorizes Human presentation changes; Machine/report remain protected.
  for(const path of ['components/panels/SystemStatus.tsx','components/panels/CollaborationResult.tsx'])
    assert.deepEqual(readFileSync(path),execFileSync('git',['show',`7292b534c0a17d760b5554a192c3d166d86dfc9f:showcase-web/${path}`]));
  for(const name of readdirSync('components/scene').filter(n=>!['ResidentAvatar.tsx','SceneViewport.tsx'].includes(n)))assert.deepEqual(readFileSync(join('components/scene',name)),
    execFileSync('git',['show',`7292b534c0a17d760b5554a192c3d166d86dfc9f:showcase-web/components/scene/${name}`]));
  assert.deepEqual(readFileSync('lib/story.ts'),execFileSync('git',['show','8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0:showcase-web/lib/story.ts']));
  for(const choice of ['A','B','C'] as const){const story=tick(submit(skipStory(),choice,85),20);assert.deepEqual([story.total,story.automatic,story.escalations],[40,39,1]);}
});
test('Audit documentation lists all factors and distinguishes scientific versus software diagrams',()=>{
  const index=readFileSync('../docs/navigation-factor-index.md','utf8'),architecture=readFileSync('../HME_ARCHITECTURE.md','utf8');
  assert.equal((index.match(/^\| (?:human|environment|machine|task)\./gm)||[]).length,NAVIGATION_FACTORS.length);
  assert.match(architecture,/Figure A — scientific/);assert.match(architecture,/Figure B — software/);
  assert.match(architecture,/403/);assert.match(readFileSync('../NATURE_NAVIGATION_EVIDENCE.md','utf8'),/S8 has no supplied DOI/);
});
