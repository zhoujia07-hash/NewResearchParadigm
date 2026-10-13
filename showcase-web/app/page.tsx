'use client';
import { useEffect, useRef, useState } from 'react';
import { BASE, CHOICES, EDGES, NODES, OUTCOMES, RESIDENTS, assess, blocked, currentPlace, factors,
  frozen, initialStory, position, residentColor, residentState, routeFor, skipStory, startStory,
  submit, tick, type Choice, type Stage, type Story } from '@/lib/story';

const STAGES: Stage[]=['intro','normal','emerging','crisis','human','recovery','result'];
const TITLES:Record<Stage,string>={idle:'One rare case changes the story.',intro:'A building. Eight people. One shared journey.',
 normal:'AI handles the ordinary.',emerging:'One case begins to diverge.',crisis:'The safest action is to pause.',
 human:'This is where your judgment matters.',recovery:'The hybrid system resumes.',result:'Throughput meets human judgment.'};
const CAPTIONS:Record<Stage,string>={idle:'Explore a guided, fictional navigation story. You make one decision where automation reaches its limit.',
 intro:'Grey connections form walkable corridors. The same eight virtual occupants remain throughout the story.',
 normal:'Most routine navigation cases are handled automatically. R01–R08 move through the building.',
 emerging:'R06 loses navigation confidence as evidence begins to conflict. The case is still monitored automatically.',
 crisis:'AI agents disagree. Low confidence, conflicting evidence and safety risk cross the escalation boundary.',
 human:'The story clock is stopped. Compare the evidence and decide what R06 should do next.',
 recovery:'Human intervention accepted. Simulation resumed under your selected decision.',
 result:'A single selective intervention completes the five-round scripted demonstration.'};
const factorRows=[['Navigation confidence','navigationConfidence'],['Sensor agreement','sensorAgreement'],
 ['Model disagreement','modelDisagreement'],['Behavior anomaly','behaviorAnomaly'],['Safety risk','safetyRisk']] as const;

export default function Page() {
  const [story,setStory]=useState<Story>(initialStory);
  const [choice,setChoice]=useState<Choice|null>(null);
  const [confidence,setConfidence]=useState(85);
  const [selected,setSelected]=useState(5);
  const [reduced,setReduced]=useState(false);
  const last=useRef<number|null>(null);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const timer=setInterval(()=>{
      const now=performance.now(); const delta=last.current===null?0:(now-last.current)/1000;last.current=now;
      setStory(s=>tick(s,delta));
    },100);
    return ()=>clearInterval(timer);
  },[]);
  function restart(start=false,skip=false){
    last.current=performance.now();setStory(skip?skipStory():start?startStory():initialStory());
    setChoice(null);setConfidence(85);setSelected(5);
  }
  function pauseResume(){last.current=performance.now();setStory(s=>({...s,paused:!s.paused}));}
  function decide(){if(choice){last.current=performance.now();setStory(s=>submit(s,choice,confidence));}}
  const isFrozen=frozen(story),isBlocked=blocked(story), f=factors(story);
  // Reduced motion snaps to nodes; spread occupants sharing a node without
  // changing their logical location, and tether every displaced marker to it.
  const logicalPoints=RESIDENTS.map((_,i)=>position(story,i,reduced));
  const displayPoints=logicalPoints.map((p,i)=>[p[0]+(i%3-1)*8,p[1]+Math.floor(i/3)*7]);
  const tethered=new Set<number>();
  if(reduced){
    const groups=new Map<string,number[]>();
    logicalPoints.forEach((p,i)=>{const key=p.join(',');groups.set(key,[...(groups.get(key)||[]),i]);});
    groups.forEach(indices=>{if(indices.length<2)return;
      const ordered=[...indices].sort((a,b)=>a===5?-1:b===5?1:a-b);
      ordered.forEach((i,k)=>{const p=logicalPoints[i];
        displayPoints[i]=[p[0]+(k%2-.5)*70,p[1]+30+Math.floor(k/2)*62];tethered.add(i);
      });
    });
  }
  const profile=RESIDENTS[selected];const profileFactors=selected===5?f:BASE;
  const stageIndex=STAGES.indexOf(story.stage);
  return <main data-stage={story.stage} data-paused={isFrozen} data-reduced-motion={reduced}>
    <header className="site-header"><a className="brand" href="#"><img src="/icon.svg" width="32" height="32" alt=""/> NRP <span>/ Public Showcase</span></a>
      <span className="simulation-label"><span className="dot"/> Simulated demonstration</span></header>
    <section className="hero">
      <div className="eyebrow">AI THROUGHPUT × HUMAN JUDGMENT</div>
      <h1>New Research Paradigm</h1>
      <p className="subtitle">AI High-Throughput Simulation <span>+</span> Human Long-Tail Intervention</p>
      <p className="intro-text">This is a simplified indoor navigation environment representing a large public building such as a hospital.</p>
      <div className="pipeline" aria-label="Collaboration pipeline"><span>01 <b>AI Sandbox</b></span><i>→</i><span>02 <b>Triage</b></span><i>→</i><span>03 <b>Human Takeover</b></span><i>→</i><span>04 <b>Hybrid Decision</b></span></div>
    </section>
    <section className="experience" aria-label="Guided simulation">
      <div className="story-heading"><div><p className="eyebrow">{story.stage==='idle'?'THE 60-SECOND EXPERIENCE':`STAGE ${stageIndex+1} / 7`}</p><h2>{TITLES[story.stage]}</h2><p className="caption" role="status">{CAPTIONS[story.stage]}</p></div>
        <div className="clock"><strong>{Math.floor(story.elapsed).toString().padStart(2,'0')}<small> / 55s</small></strong><span>{story.stage==='human'?'Waiting for your decision':story.paused?'Manually paused':story.complete?'Story complete':'Active story time'}</span></div></div>
      <div className="progress" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={55} aria-valuenow={Math.floor(story.elapsed)}><span style={{width:`${story.elapsed/55*100}%`}}/></div>
      <div className="controls">
        <button className="primary" onClick={()=>restart(true)} disabled={story.stage!=='idle'}>Start 60-second Demo <span aria-hidden>→</span></button>
        <button onClick={pauseResume} disabled={['idle','human','result'].includes(story.stage)}>{story.paused?'Resume':'Pause'}</button>
        <button onClick={()=>restart(false,true)} disabled={story.stage==='human'||story.choice!==null}>Skip to Human Takeover</button>
        <button className="reset" onClick={()=>restart()}>Reset <span aria-hidden>↺</span></button>
        <span className="timing-note">About 60 seconds + your decision time</span>
      </div>
      <div className="workspace">
        <div className="map-panel">
          <div className="map-top"><span><b>THE BUILDING</b> / Schematic floor plan</span><span className={`live-state ${isBlocked&&!story.choice?'danger':''}`}><span className="dot"/>{story.stage==='idle'?'Ready to explore':story.stage==='result'?'Simulation complete':isFrozen?'Simulation frozen':'Simulation active'}</span></div>
          <div className="map-wrap">
            <svg viewBox="-20 0 825 420" className="building-map" aria-label="Building map with eight persistent virtual occupants">
              <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#dce5e3"/></pattern></defs>
              <rect x="-20" width="825" height="420" fill="url(#grid)"/>
              <text x="18" y="32" className="map-zone">WEST WING</text><text x="646" y="32" className="map-zone">EAST WING</text>
              {EDGES.map(([a,b])=><line key={a+b} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} className="corridor"/>)}
              {story.choice&&<polyline data-testid="chosen-route" points={routeFor(story).map(n=>NODES[n].join(',')).join(' ')} className={`route-trace ${residentColor(story,5)} ${isFrozen?'frozen':''}`}/>}
              {Object.entries(NODES).map(([name,p])=><g key={name} className={`node ${name==='East Exit'&&isBlocked?'blocked':''}`} data-node={name}>
                <rect x={p[0]-25} y={p[1]-15} width="50" height="30" rx="7"/><text x={p[0]} y={p[1]-25} textAnchor="middle">{name}</text>
                {name==='East Exit'&&isBlocked&&<text x={p[0]} y={p[1]+4} className="blocked-text" textAnchor="middle">BLOCKED</text>}
              </g>)}
              {[...tethered].map(i=><line key={'tether'+i} x1={logicalPoints[i][0]} y1={logicalPoints[i][1]} x2={displayPoints[i][0]} y2={displayPoints[i][1]} className="resident-tether"/>)}
              {RESIDENTS.map((r,i)=>{const p=displayPoints[i];
                return <g key={r.id} data-resident={r.id} data-color={residentColor(story,i)} data-location={currentPlace(story,i)}
                  transform={`translate(${p[0]} ${p[1]})`} className={`resident ${residentColor(story,i)} ${selected===i?'selected':''} ${isFrozen?'frozen':''}`}
                  role="button" tabIndex={0} aria-label={`View ${r.id} profile`} aria-pressed={selected===i}
                  onClick={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onFocus={()=>setSelected(i)}
                  onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i);}}}>
                  <title>{`${r.id}: ${r.age}, ${r.mobility} · ${residentState(story,i)}`}</title>
                  <circle className="selection-ring" r="24"/><circle r="18"/><text textAnchor="middle" y="4">{r.id}</text>
                </g>;
              })}
            </svg>
            {isBlocked&&!story.choice&&<div className="pause-overlay"><span className="pause-icon" aria-hidden><svg width="18" height="22" viewBox="0 0 18 22"><rect x="1" y="2" width="5" height="18" rx="1" fill="currentColor"/><rect x="12" y="2" width="5" height="18" rx="1" fill="currentColor"/></svg></span><div><strong>AUTOMATION PAUSED</strong><span>HUMAN-IN-THE-LOOP REQUIRED</span></div></div>}
          </div>
          <div className="legend" aria-label="Map legend"><span><i className="legend-corridor"/> Grey lines: walkable corridors / route connections</span><span><i className="legend-node"/> Named nodes: entrances, junctions, corridors and exits</span><span><i className="dot green"/> Green R01–R08: eight persistent virtual occupants</span><span><i className="dot amber"/> Amber: emerging navigation uncertainty</span><span><i className="dot red"/> Red: critical case requiring human judgment</span><span><i className="legend-blocked">×</i> Red blocked marker: unavailable route or exit</span></div>
        </div>
        <aside className="profile" aria-label="Resident profile">
          <div className="profile-heading"><span className="eyebrow">RESIDENT PROFILE</span><span className={`profile-id ${residentColor(story,selected)}`}>{profile.id}</span></div>
          <h3>{profile.age}</h3><p className="profile-meta">{profile.mobility} · {selected===5?'Higher vulnerability':'Typical vulnerability'}</p>
          <div className={`resident-status ${residentColor(story,selected)}`} role="status">{residentState(story,selected)}</div>
          <dl className="profile-facts"><div><dt>Current location</dt><dd>{currentPlace(story,selected)} <small>(schematic)</small></dd></div><div><dt>Route</dt><dd>{selected===5&&story.choice?routeFor(story).join(' →'):selected===5&&isBlocked?'Junction B → East Corridor → East Exit':profile.route.join(' →')}</dd></div></dl>
          <div className="factor-list">{factorRows.map(([label,key])=><div key={key}><div><span>{label}</span><b data-factor={key}>{profileFactors[key].toFixed(2)}</b></div><div className="factor-bar"><i style={{width:`${profileFactors[key]*100}%`}}/></div></div>)}</div>
          {selected===5&&isBlocked&&!story.choice&&<p className="profile-alert">Backtracked twice · Conflicting sensors<br/>Triage score: {assess(f).score.toFixed(4)}</p>}
          <p className="profile-hint">Hover, tap or focus a marker to inspect the same resident throughout the story. Tethered markers share a node.</p>
        </aside>
      </div>
      <div className="metrics"><div><span>Virtual occupants</span><strong>8 <small>persistent individuals</small></strong></div><div><span>AI automation</span><strong>{story.stage==='idle'?'READY':story.stage==='result'?'COMPLETE':story.paused||isBlocked&&!story.choice?'PAUSED':'ACTIVE'} <small>{isBlocked&&!story.choice?'TAIL / HUMAN REQUIRED':story.choice?'human decision applied':'HEAD / AUTO'}</small></strong></div><div><span>Human escalations</span><strong>{story.escalations} <small>{story.escalations?'one long-tail incident':'ordinary cases'}</small></strong></div></div>
      {story.stage==='human'&&<section className="takeover" aria-labelledby="decision-title">
        <div className="decision-heading"><span className="eyebrow">YOUR TURN · NO TIME LIMIT</span><h2 id="decision-title">Choose the next step for R06.</h2><p>Older adult · Walker · Backtracked twice. East Exit is blocked.</p></div>
        <div className="evidence"><div><span className="eyebrow">ROUTEAGENT</span><h3>Continue to East Exit</h3><p>Shortest route; stale map</p></div><div><span className="eyebrow">SAFETYAGENT</span><h3>Reroute to West Exit</h3><p>+18 m; clear and accessible</p></div><div><span className="eyebrow">SENSOR CONFLICT</span><p>UWB: North Atrium<br/>Camera: Junction B<br/>BLE: East Corridor</p></div></div>
        <fieldset className="choices"><legend>Your judgment</legend>{(['A','B','C'] as Choice[]).map(c=><label key={c} className={choice===c?'chosen':''}><input type="radio" name="decision" value={c} checked={choice===c} onChange={()=>setChoice(c)}/><b>{c}</b><span>{CHOICES[c]}</span></label>)}</fieldset>
        <div className="submit-row"><div className="confidence"><label htmlFor="confidence">Confidence <strong><output htmlFor="confidence">{confidence}</output> / 100</strong></label><input id="confidence" aria-label="Confidence" type="range" min="0" max="100" value={confidence} onChange={e=>setConfidence(Number(e.target.value))}/></div><button className="primary" disabled={!choice} onClick={decide}>Submit Human Decision <span aria-hidden>→</span></button></div>
      </section>}
      {story.stage==='recovery'&&story.choice&&<section className={`recovery ${residentColor(story,5)}`} role="status"><span className="eyebrow">HYBRID RECOVERY</span><h3>Human intervention accepted · Simulation resumed</h3><p>{story.choice==='A'?'R06 is moving through West Corridor toward the clear, accessible West Exit.':story.choice==='B'?'R06 approaches East Corridor. The blocked exit remains unsafe; your decision has not resolved the hazard.':'R06 moves to Refuge Point. Staff assistance is requested; evacuation remains unconfirmed.'}</p></section>}
      {story.stage==='result'&&story.choice&&<section className="report" aria-labelledby="report-title"><span className="eyebrow">HUMAN-AI COLLABORATION REPORT</span><h2 id="report-title">One intervention. A complete loop.</h2><div className="report-numbers"><div><strong>{story.total}</strong><span>Total observations</span></div><div><strong>{story.automatic}</strong><span>Automatically handled</span></div><div><strong>{story.escalations}</strong><span>Human escalations</span></div><div><strong>{(story.automatic/story.total*100).toFixed(1)}%</strong><span>Scripted prototype coverage</span></div></div>
        <div className="comparison"><div><span className="eyebrow">AI-ONLY</span><h3>East Exit</h3><p>Shortest route on a stale map. Blocked and unsafe.</p></div><div><span className="eyebrow">HUMAN JUDGMENT</span><h3>{story.choice} — {CHOICES[story.choice]}</h3><p>Viewer-selected decision · Confidence {story.confidence}/100</p></div><div><span className="eyebrow">HYBRID PROCESS</span><h3>{story.choice==='A'?'West Exit · safe arrival':story.choice==='B'?'Blocked approach · unsafe':'Refuge Point · pending'}</h3><p>AI-only failure corrected: {story.choice==='A'?'Yes':'No confirmed safe evacuation'}</p></div></div>
        <p className={`outcome ${residentColor(story,5)}`}>{OUTCOMES[story.choice]}</p>
        <p className="caution">97.5% is a scripted prototype result, not a real-world automation estimate.</p><p className="caution">Human-alone and Hybrid performance require empirical validation.</p>
      </section>}
    </section>
    <footer><p><b>Simulated demonstration.</b> No real human behavioral evidence, validated AI superiority or validated Concordia behavior is implied.</p><p>Session-only experience · No API calls, account or participant data collection</p></footer>
  </main>;
}
