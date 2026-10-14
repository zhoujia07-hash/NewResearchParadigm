import {useEffect,useRef,useState,Component,type ReactNode} from 'react';
import PrototypeScene,{type VisualClock} from './PrototypeScene';
import {DURATION,STAGES,PALETTES,RESIDENTS,stageAt,visualState,type CameraMode,type Style} from './visualTimeline';
class SceneBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onError();}render(){return this.state.failed?null:this.props.children;}}
export default function PrototypeApp(){
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[mode,setMode]=useState<CameraMode>('overview');
 const [style,setStyle]=useState<Style>('modern'),[selected,setSelected]=useState(5),[reduced,setReduced]=useState(false),[compact,setCompact]=useState(false),[supported,setSupported]=useState<boolean|null>(null);
 const clock=useRef<VisualClock>({time:0,playing:false});
 useEffect(()=>{const motion=matchMedia('(prefers-reduced-motion: reduce)'),size=matchMedia('(max-width: 760px)');
  const sync=()=>{setReduced(motion.matches);setCompact(size.matches);};sync();motion.addEventListener('change',sync);size.addEventListener('change',sync);
  const c=document.createElement('canvas'),gl=c.getContext('webgl2');setSupported(!!gl);gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return ()=>{motion.removeEventListener('change',sync);size.removeEventListener('change',sync);};},[]);
 function seek(n:number){clock.current.time=n;clock.current.playing=false;setTime(n);setPlaying(false);}
 function togglePlay(){if(time===DURATION)seek(0);const next=!clock.current.playing;clock.current.playing=next;setPlaying(next);}
 function updateTime(n:number){setTime(n);if(n===DURATION)setPlaying(false);}
 const stage=stageAt(time),person=RESIDENTS[selected],state=visualState(time,selected);
 return <main className="vp-app" data-stage={stage.letter} data-reduced-motion={reduced}>
  <header className="vp-header"><div className="vp-brand"><span className="vp-logo">N<span aria-hidden><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 10 10 2M3 2h7v7" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></span></span><div><p>NEW RESEARCH PARADIGM</p><span>V2.1-A / Spatial design study</span></div></div><span className="vp-pill">VISUAL PROTOTYPE ONLY</span></header>
  <div className="vp-title"><div><span className="vp-eyebrow">A HOSPITAL-LIKE NAVIGATION WORLD</span><h1>One building. Eight people.<br/>One journey that becomes difficult.</h1></div><p>An architectural and motion study of the long tail.<br/>Procedural geometry · persistent identities · scripted behavior</p></div>
  <section className="vp-workspace">
   <div className="vp-stage">
    <div className="vp-scene-toolbar"><div className="vp-camera" role="group" aria-label="Camera view"><button aria-pressed={mode==='overview'} onClick={()=>setMode('overview')}>Overview</button><button aria-pressed={mode==='follow'} onClick={()=>{setSelected(5);setMode('follow');}}>Follow R06</button></div>
     <label className="vp-palette">Environment <select aria-label="Environment variant" value={style} onChange={e=>setStyle(e.target.value as Style)}>{Object.entries(PALETTES).map(([key,p])=><option key={key} value={key}>{p.name}</option>)}</select></label>
    </div>
    <div className="vp-canvas">{supported===true?<SceneBoundary onError={()=>setSupported(false)}><PrototypeScene clock={clock} time={time} mode={mode} style={style} reduced={reduced} compact={compact} selected={selected} onSelect={setSelected} onTime={updateTime}/></SceneBoundary>:supported===false?<div className="vp-no-webgl"><img src="previews/01-overview.png" alt="Overview of the prototype hospital"/><p>WebGL is unavailable. These are the captured preview visuals.</p></div>:<p className="vp-loading">Preparing the architectural scene…</p>}</div>
    <div className={`vp-story-overlay ${stage.color}`}><span>STAGE {stage.letter}</span><h2>{stage.title}</h2><p>{stage.caption}</p></div>
    {time>=34&&<div className="vp-exit-alert"><span aria-hidden>×</span><div><strong>EAST EXIT BLOCKED</strong><small>West Exit remains open</small></div></div>}
    <div className="vp-orientation"><span>WEST ←</span><span>CUTAWAY INTERIOR / EIGHT PERSISTENT RESIDENTS</span><span>→ EAST</span></div>
   </div>
   <aside className="vp-profile"><span className="vp-eyebrow">RESIDENT SPOTLIGHT</span><div className="vp-person-top"><strong>{person.id}</strong><span className={`vp-status ${state}`}>{state==='green'?'Stable':state==='amber'?'Uncertainty':'Critical case'}</span></div><h3>{person.role}</h3><p className="vp-role">{person.mobility}</p>
    <p className="vp-description">{selected===5?'Grey hair, a warm neutral cardigan and a clearly visible walker distinguish R06. The posture, pauses and backtracking are hand-authored visual cues.':'A stylized adult figure with a persistent identity, neutral clothing and an articulated walking cycle. This resident follows a hand-authored route.'}</p>
    <div className="vp-ids" role="group" aria-label="Inspect resident">{RESIDENTS.map((r,i)=><button key={r.id} aria-label={'Inspect '+r.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{r.id}</button>)}</div>
    <div className="vp-key"><span className="vp-eyebrow">READING THE SCENE</span><p><i className="green"/> Green · ordinary / stable</p><p><i className="amber"/> Amber · emerging uncertainty</p><p><i className="red"/> Red · critical long-tail case</p><p><span className="vp-small-cross">×</span> Barricade · unavailable exit</p></div>
    <div className="vp-route-note"><span className="vp-eyebrow">SPATIAL ANCHORS</span><p>Entrance → Junction A → Junction B</p><p>West Exit: accessible<br/>East Exit: dynamically blocked<br/>Refuge Point: waiting destination</p></div>
   </aside>
  </section>
  <section className="vp-playback" aria-label="Visual timeline"><div className="vp-playback-top"><div className="vp-play-buttons"><button className="vp-play" onClick={togglePlay} disabled={supported!==true}>{playing?'Pause visual sequence':'Play visual sequence'}</button><button onClick={()=>{seek(0);setMode('overview');setSelected(5);}}>Reset</button></div><span><b>{time.toFixed(1)}</b> / 48s · presentation pacing</span></div>
   <label className="vp-scrub-label" htmlFor="visual-time">Scrub the visual storyboard</label><input id="visual-time" aria-label="Visual time" type="range" min="0" max="48" step=".1" value={time} onChange={e=>seek(Number(e.target.value))}/>
   <div className="vp-stages">{STAGES.map(s=><button key={s.letter} aria-label={'Stage '+s.letter+': '+s.title} aria-pressed={stage.letter===s.letter} onClick={()=>seek(s.start+(s.letter==='A'?0:1))}><span>{s.letter}</span><strong>{s.title}</strong><small>{s.start}–{s.end}s</small></button>)}</div>
  </section>
  <footer className="vp-footer"><p><strong>Visual prototype only — scientific logic integration will be completed later.</strong><br/>Scripted visual behavior, not an empirically validated human navigation model, lostness prediction or human-performance estimate.</p><span>{reduced?'Reduced motion enabled':'No external assets, API, login or data collection'}</span></footer>
 </main>;
}
