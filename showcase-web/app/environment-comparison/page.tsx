'use client';
import {useEffect,useRef,useState} from 'react';
import {initialExperiment,advanceExperiment,resetExperiment,selectExperimentResident,comparisonSnapshot,BASELINE_SUPPORT} from '@/engine/comparison/experiment';
import {SYNTHETIC_PROFILES,syntheticProfile} from '@/models/human/syntheticProfiles';
const PROFILE_VARIABLES=[['senseOfDirection','Sense of Direction'],['spatialAnxiety','Spatial Anxiety'],['spatialMemory','Spatial Memory'],['navigationExperience','Navigation Experience'],['technologyFamiliarity','Technology Familiarity'],['vulnerability','Vulnerability']] as const;
const qualitative=(v:number)=>v<.4?'Low':v>=.7?'High':'Moderate';
import EnvironmentCard from '@/components/comparison/EnvironmentCard';
import './comparison.css';
export default function EnvironmentComparison(){
 const [experiment,setExperiment]=useState(initialExperiment),[reduced,setReduced]=useState(false),[webgl,setWebgl]=useState(false);
 const last=useRef<number|null>(null),snapshot=comparisonSnapshot(experiment),human=syntheticProfile(experiment.residentId);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
  const c=document.createElement('canvas'),gl=c.getContext('webgl2');setWebgl(!!gl);gl?.getExtension('WEBGL_lose_context')?.loseContext();
  // One state-owned clock. Neither scene owns a timer or advances navigation.
  const timer=setInterval(()=>{const now=performance.now(),delta=last.current===null?0:(now-last.current)/1000;last.current=now;setExperiment(s=>advanceExperiment(s,delta));},100);
  return ()=>{clearInterval(timer);media.removeEventListener('change',update);};
 },[]);
 function start(){last.current=performance.now();setExperiment(s=>({...s,running:true}));}
 function pause(){last.current=performance.now();setExperiment(s=>({...s,running:false}));}
 function reset(){last.current=performance.now();setExperiment(resetExperiment);}
 const finished=snapshot.simple.arrived&&snapshot.complex.arrived;
 useEffect(()=>{if(finished)setExperiment(s=>s.running?{...s,running:false}:s);},[finished]);
 return <main className="environment-comparison" data-experiment-running={experiment.running} data-shared-time={experiment.elapsed.toFixed(3)} data-reduced-motion={reduced}>
  <header className="comparison-header"><a href="/">NRP <span>/ Original Showcase</span></a><span className="research-chip">RESEARCH DEMO · V2.2-C</span></header>
  <div className="comparison-title"><div><span className="eyebrow">ENVIRONMENT COMPARISON</span><h1>Same Human × Different Environment</h1><p>Two synthetic route structures. One resident, one task, one shared clock.</p></div><div className="shared-time"><strong>{experiment.elapsed.toFixed(1)}<small> s</small></strong><span>{finished?'Both routes complete':experiment.running?'Shared experiment clock':'Shared clock paused'}</span></div></div>
  <div className="experiment-controls"><div className="comparison-buttons"><button className="primary" onClick={start} disabled={experiment.running||finished}>{finished?'Complete':experiment.running?'Running':experiment.elapsed>0?'Resume':'Start'}</button><button onClick={pause} disabled={!experiment.running}>Pause</button><button onClick={reset}>Reset</button></div>
   <label htmlFor="comparison-human">Shared Human <select id="comparison-human" value={human.id} onChange={e=>{last.current=performance.now();setExperiment(s=>selectExperimentResident(s,e.target.value));}}>{SYNTHETIC_PROFILES.map(p=><option key={p.id}>{p.id}</option>)}</select></label>
   <p>Task: Entrance → Destination / target room</p>
  </div>
  <p className="experiment-control-note">Human profile, task, and baseline support are held constant. Only the synthetic environmental structure differs.</p>
  <div className="comparison-pair"><EnvironmentCard scene={snapshot.simple} reduced={reduced} webgl={webgl}/><EnvironmentCard scene={snapshot.complex} reduced={reduced} webgl={webgl}/></div>
  <section className="shared-human" aria-label="Shared Human profile"><div><span className="eyebrow">SHARED HUMAN PROFILE / MESO</span><h2>{human.id} <span>{human.id==='R06'?'Older adult · Walker':'Adult · Walking'}</span></h2><p>Synthetic demonstration profile — not a participant measurement.</p></div><dl>{PROFILE_VARIABLES.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{qualitative(human.parameters[key])} · {human.parameters[key].toFixed(2)}</dd></div>)}</dl></section>
  <footer className="comparison-science"><p><b>Research boundary.</b> “Simple” and “Complex” are experimental labels for synthetic route structures. Node count alone is not a validated measure of spatial complexity. Local demand and H×E behavior mappings are illustrative, replaceable assumptions; these results are not empirical evidence.</p><p><b>Same baseline support:</b> {BASELINE_SUPPORT.description}. Signage and landmark descriptors are constant; the visibility proxy is computed from route geometry. No additional intervention is delivered.</p></footer>
 </main>;
}
