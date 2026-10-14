import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {initialStory,startStory,skipStory,tick,submit,RESIDENTS,NODES,EDGES,BASE,factors,assess,position,residentColor,residentState,currentPlace,routeFor,blocked,type Story,type Choice} from '../lib/story';
import {legacyStoryAdapter} from '../compatibility/legacyStoryAdapter';
import {legacyHumanModel,legacyEnvironmentModel,unspecifiedStateEstimator,prototypePolicy,createLegacyModelRegistry} from '../compatibility/legacyModels';
import {presentHuman} from '../presentation/adapters/humanPresentation';
import {presentEnvironment} from '../presentation/adapters/environmentPresentation';
import {presentMachine} from '../presentation/adapters/machinePresentation';
import {createCouplingEngine,type CouplingModules} from '../engine/couplingEngine';
import {ModelRegistry} from '../engine/modelRegistry';
import {exampleConfigurations} from '../models/exampleConfigurations';
import {unspecifiedHuman} from '../models/human/defaults';
import type {HumanTraits,HumanStates,HumanBehaviors} from '../models/human/types';
import type {MachinePolicy} from '../models/machine/interventionPolicy';
import type {MobilityMode} from '../models/mobility/types';

function deepFreeze<T>(value:T):T {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);
  }return value;
}
// These checks are compiled by typecheck/build, never executed as runtime casts.
function compileTimeContracts(traits:HumanTraits,states:HumanStates,behaviors:HumanBehaviors,policy:MachinePolicy){
  // @ts-expect-error A relatively stable trait is not a latent state.
  const invalidState:HumanStates=traits;
  // @ts-expect-error An observable action collection is not a trait collection.
  const invalidTraits:HumanTraits=behaviors;
  // @ts-expect-error A latent state is not a behavior observation collection.
  const invalidBehavior:HumanBehaviors=states;
  // @ts-expect-error Machine policies cannot be registered in the Human namespace.
  new ModelRegistry().register('human',policy);
  // @ts-expect-error Walking is not a Machine platform.
  const invalidPlatform:import('../models/machine/types').PlatformType='walking';
  void [invalidState,invalidTraits,invalidBehavior,invalidPlatform];
}
void compileTimeContracts;

test('Human categories remain distinct and unmodelled latent states/traits remain unknown',()=>{
  const human=unspecifiedHuman('unrelated-person');
  assert.equal(human.profile.traits.kind,'traits');assert.equal(human.states.kind,'states');assert.equal(human.behaviors.kind,'behaviors');
  assert.equal(human.profile.traits.senseOfDirection.kind,'unknown');assert.equal(human.states.lostness.kind,'unknown');
  assert.equal(human.states.confidence.kind,'unknown');assert.deepEqual(human.behaviors.observations,[]);
  assert.ok(!('timePressure' in human.profile.traits));
});

test('SystemState composes separate HME categories, mobility, clock and contextual provenance',()=>{
  const system=legacyStoryAdapter.snapshot(skipStory()).system;
  assert.equal(system.humans.length,8);assert.equal(system.environment.physical.kind,'physical');
  assert.equal(system.environment.spatial.kind,'spatial');assert.equal(system.environment.information.kind,'information');
  assert.equal(system.environment.situational.kind,'situational');assert.ok('timePressure' in system.environment.situational);
  assert.deepEqual(system.environment.spatial.nodes.map(n=>n.id),Object.keys(NODES));
  assert.deepEqual(system.environment.spatial.edges,EDGES.map(([from,to])=>({from,to})));
  assert.deepEqual(system.machine.sensing.map(s=>s.modality),['uwb','camera','ble']);
  assert.equal(system.machine.detection.human.length,8);assert.equal(system.machine.detection.environment.length,1);
  assert.equal(system.machine.decision.status,'awaiting-human');assert.equal(system.machine.interaction.phase,'await-human');
  assert.deepEqual(system.machine.interaction.availableActions.map(a=>a.id),['A','B','C']);
  assert.deepEqual(system.mobility.R06,{kind:'walking',assistiveDevice:'walker'});
  assert.equal(system.time.elapsedSeconds,35);assert.equal(system.time.paused,true);
  assert.equal(system.context.provenance.basis,'scripted');assert.equal(system.humans[5].states.confidence.kind,'unknown');
  assert.equal(system.humans[5].states.navigationUncertainty.kind,'unknown');
  assert.equal(system.environment.spatial.localDynamicComplexity.kind,'unknown');
  assert.ok(!('score' in system)); // No collapsed Human × Environment × Machine score.
});

function checkLegacy(story:Story){
  const before=JSON.stringify(story),snapshot=legacyStoryAdapter.snapshot(deepFreeze(story));
  assert.equal(snapshot.sourceStory,story);assert.equal(presentEnvironment(snapshot).story,story);
  assert.equal(presentEnvironment(snapshot).blocked,blocked(story));
  assert.equal(snapshot.system.time.elapsedSeconds,story.elapsed);
  for(let i=0;i<RESIDENTS.length;i++){
    const view=presentHuman(snapshot,i),input=i===5?factors(story):BASE;
    assert.equal(view.id,RESIDENTS[i].id);assert.equal(view.age,RESIDENTS[i].age);assert.equal(view.mobility,RESIDENTS[i].mobility);
    assert.equal(view.color,residentColor(story,i));assert.equal(view.status,residentState(story,i));assert.equal(view.location,currentPlace(story,i));
    const expectedRoute=i===5&&story.choice?routeFor(story):i===5&&blocked(story)?['Junction B','East Corridor','East Exit']:RESIDENTS[i].route;
    assert.equal(view.route,expectedRoute.join(' →'));
    assert.deepEqual(snapshot.system.machine.detection.diagnostics[view.id].inputs,input);
    assert.equal(snapshot.system.machine.detection.diagnostics[view.id].score,assess(input).score);
    for(const row of view.factors)assert.equal(row.value,input[row.key as keyof typeof input]);
    assert.equal(view.triageScore,i===5&&blocked(story)&&!story.choice?assess(input).score.toFixed(4):null);
  }
  const view=presentMachine(snapshot),waiting=blocked(story)&&!story.choice;
  assert.equal(view.automation,story.stage==='idle'?'READY':story.stage==='result'?'COMPLETE':story.paused||waiting?'PAUSED':'ACTIVE');
  assert.equal(view.report.total,story.total);assert.equal(view.report.automatic,story.automatic);assert.equal(view.report.escalations,story.escalations);
  assert.equal(JSON.stringify(story),before);
  return snapshot;
}
test('Legacy adapters preserve every stage, manually paused state and all profile/diagnostic values',()=>{
  checkLegacy(initialStory());
  for(const elapsed of [0,3,6,10,12,14.4,19.4,24.9,25,30,35]){
    const story=tick(startStory(),elapsed);checkLegacy(story);checkLegacy({...story,paused:true});
  }
  const crisis=checkLegacy(skipStory());assert.equal(presentHuman(crisis,5).triageScore,'0.8394');
  assert.equal(crisis.system.environment.situational.blockages[0].to,'East Exit');
  assert.equal(presentHuman(crisis,5,'West Corridor').location,'West Corridor');
  assert.throws(()=>presentHuman(crisis,100));
});
test('A/B/C compatibility preserves endpoints, human confidence, ledger and indefinite human gate',()=>{
  const waiting=skipStory();assert.equal(tick(waiting,10000),waiting);
  for(const choice of ['A','B','C'] as Choice[]){
    for(const elapsed of [0,5,10,20]){
      const story=tick(submit(waiting,choice,85),elapsed),snapshot=checkLegacy(story);
      assert.deepEqual(snapshot.system.machine.interaction.operatorResponse,{actionId:choice,confidence:85});
      assert.equal(snapshot.system.machine.decision.intervention?.id,choice);
      if(elapsed>=10){
        assert.deepEqual([story.total,story.automatic,story.escalations],[40,39,1]);assert.equal(presentMachine(snapshot).report.coverageLabel,'97.5');
        assert.deepEqual(position(story,5),NODES[choice==='A'?'West Exit':choice==='B'?'East Corridor':'Refuge Point']);
      }
    }
  }
});
test('Snapshot graph is copied; callers cannot mutate legacy constants through structural adapters',()=>{
  const snapshot=legacyStoryAdapter.snapshot(initialStory()),before=JSON.stringify(NODES);
  (snapshot.system.environment.spatial.nodes[0].coordinates as number[])[0]=-999;
  assert.equal(JSON.stringify(NODES),before);
});
test('Clock suspension is distinct from legacy crisis/result avatar freezes',()=>{
  for(const story of [startStory(),tick(startStory(),25),tick(submit(skipStory(),'A',85),10)]){
    const snapshot=legacyStoryAdapter.snapshot(story);
    assert.equal(snapshot.system.time.paused,false);
    assert.equal(snapshot.system.context.extensions.legacyMotionFrozen,true);
    assert.ok(tick(story,.1).elapsed>story.elapsed);
  }
  for(const story of [initialStory(),skipStory(),tick(submit(skipStory(),'A',85),20),{...startStory(),paused:true}]){
    assert.equal(legacyStoryAdapter.snapshot(story).system.time.paused,true);
    assert.equal(tick(story,.1),story);
  }
});

test('Three illustrative configurations use walking/driving/wheelchair without instantiating adaptive models',()=>{
  const configs=exampleConfigurations();assert.equal(configs.length,3);
  assert.deepEqual(configs.map(c=>Object.values(c.system.mobility)[0].kind),['walking','driving','wheelchair']);
  const modes:MobilityMode[]=[{kind:'cycling'},{kind:'public-transit'},{kind:'other',name:'a future task'}];assert.equal(modes.length,3);
  for(const config of configs){
    assert.equal(config.system.context.provenance.basis,'configuration');
    assert.equal(config.system.machine.decision.intervention,null);assert.equal(config.system.humans[0].states.lostness.kind,'unknown');
    assert.ok(config.requestedModules.every(m=>m.status==='not-implemented'));
  }
  assert.equal(configs[0].system.environment.situational.timePressure.kind,'value');
  assert.equal(configs[1].system.environment.physical.setting,'outdoor');
  assert.deepEqual(configs[2].system.environment.spatial.accessibilityConstraints,['Step-free routes required']);
});

test('Registry retrieves typed mock models by layer/ID/version and rejects duplicates and wrong layers',()=>{
  const registry=createLegacyModelRegistry();
  const mock={...legacyHumanModel,metadata:{...legacyHumanModel.metadata,id:'test-human',evidence:'synthetic' as const}};
  registry.register('human',mock);assert.equal(registry.get('human','test-human','1'),mock);
  assert.equal(registry.get('machine','test-human','1'),undefined);assert.equal(registry.get('human','missing','1'),undefined);
  assert.throws(()=>registry.register('human',mock),/already registered/);
  const next={...mock,metadata:{...mock.metadata,version:'2'}};registry.register('human',next);
  assert.equal(registry.get('human','test-human','2'),next);
  assert.throws(()=>registry.register('human',prototypePolicy as never),/must match/);
  assert.throws(()=>registry.register('human',{...mock,metadata:{...mock.metadata,id:' '}}),/must match/);
  assert.ok(registry.list('human').every(m=>m.metadata.evidence!=='empirical'));
});
test('Coupling composes injected modules with history, returns proposals, and never applies or advances them',()=>{
  const system=deepFreeze(exampleConfigurations()[1].system),history=deepFreeze([exampleConfigurations()[0].system]);
  const original=JSON.stringify({system,history}),calls:string[]=[];
  const modules:CouplingModules={
    environment:{...legacyEnvironmentModel,evaluateEnvironment:c=>{calls.push('environment');assert.equal(c.history,history);return c.system.environment;}},
    human:{...legacyHumanModel,evaluateHumanBehavior:c=>{calls.push('human');return legacyHumanModel.evaluateHumanBehavior(c);}},
    estimator:{...unspecifiedStateEstimator,evaluateHumanState:(b,c)=>{calls.push('estimator');assert.equal(b[0].humanId,'driver-b');return unspecifiedStateEstimator.evaluateHumanState(b,c);}},
    machine:{...prototypePolicy,selectMachineIntervention:(c,e)=>{calls.push('machine');assert.equal(e.environment,c.system.environment);
      return {...c.system.machine.decision,status:'selected',source:'model',reason:'Synthetic test proposal only'};}},
  };
  const result=createCouplingEngine(modules).evaluate({system,history});
  assert.deepEqual(calls,['environment','human','estimator','machine']);assert.equal(result.decision.status,'selected');
  assert.equal(system.machine.decision.status,'none');assert.deepEqual(result.outcomes,[]);assert.deepEqual(result.adaptations,[]);
  assert.equal(JSON.stringify({system,history}),original);
});
test('Default pass-through composition cannot auto-select a human action or infer latent states',()=>{
  const system=deepFreeze(legacyStoryAdapter.snapshot(skipStory()).system);
  const result=createCouplingEngine({human:legacyHumanModel,environment:legacyEnvironmentModel,estimator:unspecifiedStateEstimator,machine:prototypePolicy}).evaluate({system,history:[]});
  assert.equal(result.decision.status,'awaiting-human');assert.equal(result.decision.intervention?.id,'human-review');
  assert.equal(system.machine.interaction.operatorResponse,null);assert.equal(result.humanStates[5].states.lostness.kind,'unknown');
});

function files(root:string):string[]{return readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(root,e.name)):/\.tsx?$/.test(e.name)?[join(root,e.name)]:[]);}
test('Domain models and engine have no renderer, legacy Story, browser or scientific formula dependencies',()=>{
  for(const path of [...files('models'),...files('engine')]){
    const source=readFileSync(path,'utf8'),ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);
    for(const node of ast.statements)if(ts.isImportDeclaration(node)){
      const name=(node.moduleSpecifier as ts.StringLiteral).text;
      assert.doesNotMatch(name,/components|presentation|lib\/story|compatibility|react|three/,path);
    }
    assert.doesNotMatch(source,/window\.|document\.|localStorage|fetch\(/,path);
  }
});
test('Presentation components delegate scientific calculations and contain no copied triage equation',()=>{
  for(const path of [...files('components'),...files('app')]){
    const source=readFileSync(path,'utf8'),ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    for(const node of ast.statements)if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&/lib\/story$/.test(node.moduleSpecifier.text)){
      const bindings=node.importClause?.namedBindings;
      if(bindings&&ts.isNamedImports(bindings))for(const symbol of bindings.elements)
        assert.ok(!['assess','factors','BASE','CRISIS'].includes((symbol.propertyName??symbol.name).text),`${path} must use a presentation adapter`);
    }
    const walk=(node:ts.Node)=>{
      if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.AsteriskToken,ts.SyntaxKind.SlashToken].includes(node.operatorToken.kind))
        assert.doesNotMatch(node.getText(ast),/navigationConfidence|sensorAgreement|modelDisagreement|behaviorAnomaly|safetyRisk|vulnerability|automatic\s*\//,path);
      ts.forEachChild(node,walk);
    };walk(ast);
  }
  const baseline=execFileSync('git',['show','8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0:showcase-web/lib/story.ts']);
  assert.deepEqual(readFileSync('lib/story.ts'),baseline);
});
