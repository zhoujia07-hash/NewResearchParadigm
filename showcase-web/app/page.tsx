'use client';
import {useEffect,useRef,useState} from 'react';
import {initialStory,startStory,skipStory,submit,tick,frozen,type Story,type Choice} from '@/lib/story';
import {spatialLocation} from '@/lib/navigationModel';
import type {ViewMode} from '@/types/environment';
import SceneViewport from '@/components/scene/SceneViewport';
import ResidentProfile from '@/components/panels/ResidentProfile';
import SystemStatus from '@/components/panels/SystemStatus';
import StoryControls from '@/components/panels/StoryControls';
import HumanDecision from '@/components/panels/HumanDecision';
import CollaborationResult from '@/components/panels/CollaborationResult';

export default function Page(){
 const [story,setStory]=useState<Story>(initialStory),[choice,setChoice]=useState<Choice|null>(null);
 const [confidence,setConfidence]=useState(85),[selected,setSelected]=useState(5),[reduced,setReduced]=useState(false);
 const [view,setView]=useState<ViewMode>('3d');
 const last=useRef<number|null>(null);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
  return ()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{const timer=setInterval(()=>{const now=performance.now();
  const delta=last.current===null?0:(now-last.current)/1000;last.current=now;setStory(s=>tick(s,delta));},100);
  return ()=>clearInterval(timer);},[]);
 function restart(start=false,skip=false){last.current=performance.now();setStory(skip?skipStory():start?startStory():initialStory());
  setChoice(null);setConfidence(85);setSelected(5);}
 function pauseResume(){last.current=performance.now();setStory(s=>({...s,paused:!s.paused}));}
 function decide(){if(choice){last.current=performance.now();setStory(s=>submit(s,choice,confidence));}}
 return <main data-stage={story.stage} data-paused={frozen(story)} data-reduced-motion={reduced}>
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
      <StoryControls story={story} onStart={()=>restart(true)} onPause={pauseResume} onSkip={()=>restart(false,true)} onReset={()=>restart()}/>
      <div className="stage-layout">
      <div className="workspace"><SceneViewport story={story} selected={selected} reduced={reduced} onSelect={setSelected} view={view} onView={setView}/><ResidentProfile story={story} selected={selected} location={view==='3d'?spatialLocation(story,selected,reduced):undefined}/></div>
      <HumanDecision story={story} choice={choice} confidence={confidence} onChoice={setChoice} onConfidence={setConfidence} onSubmit={decide}/>
      </div>
      <SystemStatus story={story}/>
      <CollaborationResult story={story}/>
    </section>
    <p className="spatial-caution">3D avatar behavior in V2.1 is a scripted visualization of the existing prototype logic, not an empirically validated human navigation model.</p>
    <footer><p><b>Simulated demonstration.</b> No real human behavioral evidence, validated AI superiority or validated Concordia behavior is implied.</p><p>Session-only experience · No API calls, account or participant data collection</p></footer>
 </main>;
}
