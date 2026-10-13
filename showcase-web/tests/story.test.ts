import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { BASE, CRISIS, NODES, RESIDENTS, assess, currentPlace, factors, frozen,
  initialStory, position, residentState, skipStory, startStory, submit, tick, type Choice } from '../lib/story';

test('clean start, seven stages, persistent IDs and a 40-observation ledger',()=>{
  const empty=initialStory();assert.equal(empty.total,0);assert.equal(empty.choice,null);
  assert.deepEqual(RESIDENTS.map(r=>r.id),['R01','R02','R03','R04','R05','R06','R07','R08']);
  let s=startStory();assert.equal(s.stage,'intro');assert.equal(s.total,8);
  s=tick(s,3);assert.equal(s.stage,'normal');
  s=tick(s,9);assert.equal(s.stage,'emerging');assert.equal(s.total,16);
  assert.equal(assess(factors(s)).escalated,false);
  s=tick(s,6.5);assert.equal(factors(s).navigationConfidence,.72);
  assert.equal(factors(s).sensorAgreement,.68);
  s=tick(s,6.5);assert.equal(s.stage,'crisis');assert.deepEqual(factors(s),CRISIS);
  assert.equal(s.total,24);assert.equal(s.automatic,16);assert.equal(s.escalations,1);
  assert.equal(assess(factors(s)).score.toFixed(4),'0.8394');assert.ok(frozen(s));
  s=tick(s,10);assert.equal(s.stage,'human');
  assert.equal(tick(s,5000),s);
  s=submit(s,'A',85);assert.equal(s.automatic,23);assert.equal(s.stage,'recovery');
  s=tick(s,5);assert.equal(s.round,4);s=tick(s,5);assert.equal(s.stage,'result');
  assert.equal(s.total,40);assert.equal(s.automatic,39);assert.equal(s.escalations,1);
  assert.equal(s.automatic/s.total*100,97.5);assert.equal(s.observations.length,40);
  assert.equal(new Set(s.observations.map(o=>`${o.round}/${o.id}`)).size,40);
  s=tick(s,10);assert.ok(s.complete);assert.equal(tick(s,9),s);
});

test('pause, delayed clock and skip never bypass the human decision gate',()=>{
  let s=tick(startStory(),7);const paused={...s,paused:true};assert.equal(tick(paused,999),paused);
  s=tick({...paused,paused:false},999);assert.equal(s.stage,'human');assert.equal(s.elapsed,35);
  assert.equal(s.round,3);assert.equal(s.choice,null);assert.equal(tick(s,999),s);
  assert.deepEqual(skipStory(),s);assert.throws(()=>tick(s,NaN));assert.throws(()=>tick(s,-1));
});

test('A/B/C produce their actual endpoints, preserve hazard evidence and reset cleanly',()=>{
  for(const c of ['A','B','C'] as Choice[]){
    let s=submit(skipStory(),c,90);assert.equal(s.confidence,90);
    s=tick(s,20);assert.equal(s.total,40);assert.equal(s.automatic,39);
    assert.deepEqual(position(s,5),NODES[c==='A'?'West Exit':c==='B'?'East Corridor':'Refuge Point']);
    assert.equal(currentPlace(s,5),c==='A'?'West Exit':c==='B'?'East Corridor':'Refuge Point');
    assert.equal(assess(factors(s)).escalated,c!=='A');
    assert.match(residentState(s,5),c==='A'?/Resolved/:c==='B'?/Unsafe/:/awaiting staff/);
  }
  assert.equal(initialStory().observations.length,0);assert.equal(initialStory().confidence,null);
  assert.throws(()=>submit(startStory(),'A',85));assert.throws(()=>submit(skipStory(),'A',101));
  assert.throws(()=>submit(skipStory(),'A',85.5));
});

test('movement freezes and reduced motion uses discrete positions',()=>{
  const s=tick(startStory(),8),after=tick(s,1);assert.notDeepEqual(position(s,0),position(after,0));
  const gate=skipStory();assert.deepEqual(position(tick(gate,100),0),position(gate,0));
  assert.deepEqual(position(gate,5),NODES['Junction B']);
  assert.deepEqual(position(tick(startStory(),6.1),0,true),position(tick(startStory(),6.2),0,true));
});

test('TypeScript triage matches unchanged Python defaults, crisis and individual trigger boundaries',()=>{
  const variants=[BASE,CRISIS,{...BASE,safetyRisk:.85},{...BASE,safetyRisk:.849},
    {...BASE,modelDisagreement:.75,sensorAgreement:.45},{...BASE,modelDisagreement:.75,sensorAgreement:.451},
    {...BASE,behaviorAnomaly:.8},{...BASE,behaviorAnomaly:.799},
    {...BASE,navigationConfidence:0,sensorAgreement:0,modelDisagreement:.5,behaviorAnomaly:.4,safetyRisk:.4},
    {...BASE,navigationConfidence:0,sensorAgreement:0,modelDisagreement:.48,behaviorAnomaly:.4,safetyRisk:.4}];
  const keys=['navigation_confidence','sensor_agreement','model_disagreement','behavior_anomaly','safety_risk','vulnerability'];
  const camel=['navigationConfidence','sensorAgreement','modelDisagreement','behaviorAnomaly','safetyRisk','vulnerability'] as const;
  const inputs=variants.map(f=>Object.fromEntries(keys.map((k,i)=>[k,f[camel[i]]])));
  const result=JSON.parse(execFileSync('python3',['-c',
    'import sys,json;sys.path.insert(0,"..");from triage import Factors,assess;print(json.dumps([{ "score":a.score,"escalated":a.escalated,"rules":list(a.rules.values())} for a in [assess(Factors(**f)) for f in json.load(sys.stdin)]]))'],{input:JSON.stringify(inputs),encoding:'utf8'}));
  variants.forEach((f,i)=>{const a=assess(f);assert.ok(Math.abs(a.score-result[i].score)<1e-12);assert.equal(a.escalated,result[i].escalated);assert.deepEqual(a.rules,result[i].rules);});
});
