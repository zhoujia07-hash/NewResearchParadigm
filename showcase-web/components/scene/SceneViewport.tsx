'use client';
import dynamic from 'next/dynamic';
import {Component,useEffect,useState,type ReactNode} from 'react';
import {blocked,frozen,type Story} from '@/lib/story';
import type {CameraMode,ViewMode} from '@/types/environment';
import SceneControls from './SceneControls';
import Schematic2D from './Schematic2D';
const Environment3D=dynamic(()=>import('./Environment3D'),{ssr:false,loading:()=> <p className="scene-loading">Preparing the spatial world…</p>});
class SceneBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onFailure();}
 render(){return this.state.failed?null:this.props.children;}
}
export default function SceneViewport({story,selected,reduced,onSelect,view,onView}:{story:Story;selected:number;reduced:boolean;onSelect:(i:number)=>void;view:ViewMode;onView:(v:ViewMode)=>void}){
 const [cameraMode,setCameraMode]=useState<CameraMode>('overview');
 const [compact,setCompact]=useState(false),[ready,setReady]=useState(false),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{const media=matchMedia('(max-width: 740px)');const update=()=>setCompact(media.matches);update();media.addEventListener('change',update);
  const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2');
  if(!context){setUnavailable(true);onView('2d');}else{context.getExtension('WEBGL_lose_context')?.loseContext();}setReady(true);
  return ()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{if(story.stage==='idle')setCameraMode('overview');},[story.stage]);
 const isBlocked=blocked(story),isFrozen=frozen(story);
 function fail(){setUnavailable(true);onView('2d');}
 return <div className="map-panel" data-view={view} data-camera={cameraMode}>
  <div className="map-top"><span><b>THE BUILDING</b> / {view==='3d'?'3D spatial world · V2.1':'V1 schematic reference'}</span><span className={`live-state ${isBlocked&&!story.choice?'danger':''}`}><span className="dot"/>{story.stage==='idle'?'Ready to explore':story.stage==='result'?'Simulation complete':isFrozen?'Simulation frozen':'Simulation active'}</span></div>
  <SceneControls unavailable={unavailable} view={view} onView={v=>{onView(v);if(v==='3d')setUnavailable(false);}} cameraMode={cameraMode} onCamera={setCameraMode} selected={selected} onSelect={onSelect} story={story}/>
  {unavailable&&<p className="scene-fallback" role="status">3D is unavailable in this browser. The 2D view uses the same story and decisions.</p>}
  {view==='3d'?<><div className="scene-3d" data-testid="scene-3d">
    {ready&&<SceneBoundary onFailure={fail}><Environment3D story={story} selected={selected} reduced={reduced} compact={compact} cameraMode={cameraMode} onSelect={onSelect}/></SceneBoundary>}
    {isBlocked&&!story.choice&&<div className="pause-overlay"><span className="pause-icon" aria-hidden><svg width="18" height="22" viewBox="0 0 18 22"><rect x="1" y="2" width="5" height="18" rx="1" fill="currentColor"/><rect x="12" y="2" width="5" height="18" rx="1" fill="currentColor"/></svg></span><div><strong>AUTOMATION PAUSED</strong><span>HUMAN-IN-THE-LOOP REQUIRED</span></div></div>}
   </div><div className="scene-legend"><span><i className="dot green"/> Ordinary / stable</span><span><i className="dot amber"/> Emerging uncertainty</span><span><i className="dot red"/> Critical / human judgment</span><span>Click an avatar or select its ID. R06 uses a walker.</span></div>
   <p className="scene-note">Cutaway architecture · Openings connect corridors · Status rings indicate risk, not skin or clothing colors{reduced?' · Reduced motion: no continuous follow camera':''}</p>
  </>:<Schematic2D story={story} selected={selected} reduced={reduced} onSelect={onSelect}/>}
 </div>;
}
