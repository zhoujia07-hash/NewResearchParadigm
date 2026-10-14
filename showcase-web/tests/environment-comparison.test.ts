import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import ts from 'typescript';
import {simpleEnvironment as simple} from '../models/environment/comparison/simpleEnvironment';
import {complexEnvironment as complex} from '../models/environment/comparison/complexEnvironment';
import {structuralMetrics,neighbors,nodeAt,nextTurnAngle,edgeLength,localContext} from '../models/environment/comparison/structure';
import {initialExperiment,advanceExperiment,resetExperiment,selectExperimentResident,comparisonSnapshot,COMPARISON_NETWORKS} from '../engine/comparison/experiment';
import {syntheticProfile,SYNTHETIC_PROFILES} from '../models/human/syntheticProfiles';
import type {RouteNetwork} from '../models/environment/comparison/types';
function shortest(n:RouteNetwork):number {
 const costs=new Map(n.nodes.map(p=>[p.id,Infinity]));costs.set(n.start,0);const seen=new Set<string>();
 while(seen.size<n.nodes.length){const id=[...costs].filter(([id])=>!seen.has(id)).sort((a,b)=>a[1]-b[1])[0][0];seen.add(id);
  for(const next of neighbors(n,id))costs.set(next,Math.min(costs.get(next)!,costs.get(id)!+edgeLength(nodeAt(n,id),nodeAt(n,next))));
 }return costs.get(n.goal)!;
}
test('Synthetic fixtures declare exact separate structure variables and valid connected shortest planned routes',()=>{
 const a=structuralMetrics(simple),b=structuralMetrics(complex);
 assert.deepEqual([a.nodes,a.edges,a.decisionPoints,a.totalTurns,a.branchSurplus,a.routeLength,a.routeAlternatives],[9,8,2,0,2,36,0]);
 assert.deepEqual([b.nodes,b.edges,b.decisionPoints,b.totalTurns,b.branchSurplus,b.routeLength,b.routeAlternatives],[21,23,9,4,10,52,7]);
 assert.ok(a.meanBranching<b.meanBranching);assert.ok(a.nodes<b.nodes&&a.branchSurplus<b.branchSurplus&&a.routeAlternatives<b.routeAlternatives);
 for(const n of COMPARISON_NETWORKS){
  assert.equal(n.evidenceStatus,'synthetic');assert.ok(structuralMetrics(n).connected);
  assert.equal(new Set(n.nodes.map(p=>p.id)).size,n.nodes.length);assert.equal(n.route[0],n.start);assert.equal(n.route.at(-1),n.goal);
  assert.deepEqual([...n.decisionPoints].sort(),n.nodes.filter(p=>neighbors(n,p.id).length>=3).map(p=>p.id).sort());
  assert.equal(structuralMetrics(n).routeLength,shortest(n),'No artificial detour is chosen to manufacture demand');
  for(let i=1;i<n.route.length;i++)assert.ok(neighbors(n,n.route[i-1]).includes(n.route[i]));
  assert.ok(n.route.every((_,i)=>nextTurnAngle(n,i)===0||Math.abs(nextTurnAngle(n,i)-90)<1e-8));
 }
 assert.equal(localContext(simple,5).visibility,1,'A clearly visible goal is not low visibility merely because it is close');
 assert.equal(simple.signage,complex.signage);assert.equal(simple.landmark,complex.landmark);
});
test('Controlled comparison holds the same immutable Human, task, baseline support and clock references on both sides',()=>{
 for(const profile of SYNTHETIC_PROFILES){const state={...initialExperiment(),residentId:profile.id,elapsed:7,running:true},snapshot=comparisonSnapshot(state);
  assert.equal(snapshot.simple.human,snapshot.complex.human);assert.equal(snapshot.simple.human,syntheticProfile(profile.id));
  assert.equal(snapshot.simple.task,snapshot.complex.task);assert.equal(snapshot.simple.support,snapshot.complex.support);
  assert.equal(snapshot.simple.clock,state);assert.equal(snapshot.complex.clock,state);
  assert.deepEqual(snapshot.simple.human.parameters,snapshot.complex.human.parameters);
 }assert.equal(initialExperiment().residentId,'R04');
});
test('One shared clock pauses, resumes and resets both scenes; selecting a resident resets both together',()=>{
 const start={...initialExperiment(),running:true},step=advanceExperiment(start,5),snapshot=comparisonSnapshot(step);
 assert.equal(snapshot.simple.clock.elapsed,5);assert.equal(snapshot.complex.clock.elapsed,5);assert.equal(start.elapsed,0);
 const paused={...step,running:false};assert.equal(advanceExperiment(paused,100),paused);
 const reset=resetExperiment(step),zero=comparisonSnapshot(reset);assert.equal(zero.simple.clock.elapsed,0);assert.equal(zero.complex.clock.elapsed,0);
 assert.deepEqual(zero.simple.position,[-18,0]);assert.deepEqual(zero.complex.position,[-18,0]);
 assert.equal(selectExperimentResident(step,'R01').elapsed,0);assert.equal(selectExperimentResident(step,'R01').running,false);
 assert.throws(()=>advanceExperiment(start,NaN));assert.throws(()=>advanceExperiment(start,-1));assert.throws(()=>selectExperimentResident(start,'R09'));
});
test('Synthetic rules, not scientific truth: local geometry changes context and H×E presentation while preserving Human traits',()=>{
 const profile=syntheticProfile('R04'),before=JSON.stringify(profile),start=comparisonSnapshot({...initialExperiment(),running:true}),later=comparisonSnapshot({...initialExperiment(),elapsed:8,running:true});
 assert.notDeepEqual(start.complex.local,later.complex.local);assert.notDeepEqual(start.simple.position,later.simple.position);
 assert.ok(start.complex.local.syntheticLocalDemand>start.simple.local.syntheticLocalDemand);
 assert.ok(start.complex.response.speed<start.simple.response.speed);assert.ok(start.complex.response.scanning>start.simple.response.scanning);
 assert.ok(start.complex.response.hesitation>start.simple.response.hesitation);assert.equal(JSON.stringify(profile),before);
 assert.equal(start.simple.response.evidenceStatus,'synthetic');assert.equal(start.complex.response.evidenceStatus,'synthetic');
 assert.doesNotMatch(JSON.stringify(start),/lostProbability|lostnessProbability|failureProbability|neuralState|triage|escalation|safetyRisk/);
});
test('Research traversal is deterministic, bounded and both routes reach the same task goal without adaptive support',()=>{
 for(const profile of SYNTHETIC_PROFILES){let last=[-18,-18];
  for(let t=0;t<=70;t+=.5){const s={...initialExperiment(),residentId:profile.id,elapsed:t,running:true},pair=comparisonSnapshot(s);
   assert.deepEqual(pair,comparisonSnapshot(s));
   for(const [i,scene] of [pair.simple,pair.complex].entries()){
    for(const x of scene.position)assert.ok(Number.isFinite(x));
    assert.ok(scene.response.speed>0&&scene.response.speed<2.5);assert.ok(scene.response.scanning>=0&&scene.response.scanning<=1);
    assert.ok(scene.local.syntheticLocalDemand>=0&&scene.local.syntheticLocalDemand<=1);assert.ok(scene.position[0]>=last[i]-1e-8);last[i]=scene.position[0];
    assert.equal(scene.support,pair.simple.support);
   }
  }
  const end=comparisonSnapshot({...initialExperiment(),residentId:profile.id,elapsed:100,running:true});
  assert.ok(end.simple.arrived&&end.complex.arrived);assert.deepEqual(end.simple.position,[18,0]);assert.deepEqual(end.complex.position,[18,0]);
 }
});
function runtimeImports(path:string,seen=new Set<string>()):Set<string>{
 const p=resolve(path);if(seen.has(p))return seen;seen.add(p);
 const ast=ts.createSourceFile(p,readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true);
 for(const n of ast.statements)if(ts.isImportDeclaration(n)&&ts.isStringLiteral(n.moduleSpecifier)&&!n.importClause?.isTypeOnly){
  const spec=n.moduleSpecifier.text;if(!spec.startsWith('.')&&!spec.startsWith('@/'))continue;
  const base=spec.startsWith('@/')?resolve(spec.slice(2)):resolve(dirname(p),spec),next=[base+'.ts',base+'.tsx'].find(existsSync);
  if(next)runtimeImports(next,seen);
 }
 function visitDynamic(node:ts.Node):void {
  if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0])){
   const spec=node.arguments[0].text,base=spec.startsWith('@/')?resolve(spec.slice(2)):resolve(dirname(p),spec);
   const next=[base+'.ts',base+'.tsx'].find(existsSync);if(next)runtimeImports(next,seen);
  }
  ts.forEachChild(node,visitDynamic);
 }
 visitDynamic(ast);return seen;
}
test('Comparison has one timer and no official Story, triage, takeover or intervention runtime dependency',()=>{
 const imports=runtimeImports('app/environment-comparison/page.tsx');
 for(const file of imports)assert.doesNotMatch(file,/lib\/story|compatibility|interventionPolicy|triage|HumanDecision|CollaborationResult/);
 assert.equal((readFileSync('app/environment-comparison/page.tsx','utf8').match(/setInterval\(/g)||[]).length,1);
 for(const file of ['components/comparison/ComparisonWorld.tsx','components/comparison/EnvironmentCard.tsx'])assert.doesNotMatch(readFileSync(file,'utf8'),/setInterval|setTimeout|clock\.getElapsedTime|delta\s*\+/);
 assert.deepEqual(readFileSync('lib/story.ts'),execFileSync('git',['show','8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0:showcase-web/lib/story.ts']));
});
