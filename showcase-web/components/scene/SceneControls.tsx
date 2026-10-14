import {RESIDENTS,residentColor,type Story} from '@/lib/story';
import type {ViewMode,CameraMode} from '@/types/environment';
export default function SceneControls({view,onView,cameraMode,onCamera,selected,onSelect,story,unavailable=false}:{view:ViewMode;onView:(v:ViewMode)=>void;cameraMode:CameraMode;onCamera:(v:CameraMode)=>void;selected:number;onSelect:(i:number)=>void;story:Story;unavailable?:boolean}){
 return <div className="scene-controls">
  <div className="scene-toolbar"><div className="view-toggle" role="group" aria-label="Scene view"><button aria-pressed={view==='3d'} disabled={unavailable} onClick={()=>onView('3d')}>3D View</button><button aria-pressed={view==='2d'} onClick={()=>onView('2d')}>2D View</button></div>
   {view==='3d'&&<div className="view-toggle" role="group" aria-label="Camera mode"><button aria-pressed={cameraMode==='overview'} onClick={()=>onCamera('overview')}>Overview</button><button aria-pressed={cameraMode==='follow'} onClick={()=>onCamera('follow')}>Follow R06</button></div>}
  </div>
  <div className="resident-picker" role="group" aria-label="Select resident">{RESIDENTS.map((r,i)=><button key={r.id} data-avatar-control={r.id} aria-label={'Select '+r.id} aria-pressed={selected===i} className={residentColor(story,i)} onClick={()=>onSelect(i)}>{r.id}{i===5?' · Walker':''}</button>)}</div>
 </div>;
}
