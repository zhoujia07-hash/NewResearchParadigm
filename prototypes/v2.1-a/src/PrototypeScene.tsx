import {useRef} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {Color,Vector3,ACESFilmicToneMapping,SRGBColorSpace} from 'three';
import type {MutableRefObject} from 'react';
import Hospital from './Hospital';
import HumanAvatar from './HumanAvatar';
import {DURATION,PALETTES,RESIDENTS,samplePose,type CameraMode,type Style} from './visualTimeline';
export interface VisualClock {time:number;playing:boolean}
function FrameClock({clock,onTime}:{clock:MutableRefObject<VisualClock>;onTime:(n:number)=>void}){
 const report=useRef(0);
 useFrame((_,delta)=>{if(clock.current.playing){clock.current.time=Math.min(DURATION,clock.current.time+Math.min(delta,.1));if(clock.current.time===DURATION)clock.current.playing=false;}
  report.current+=delta;if(report.current>.1){onTime(clock.current.time);report.current=0;}
 });return null;
}
function Camera({mode,clock,reduced,compact}:{mode:CameraMode;clock:MutableRefObject<VisualClock>;reduced:boolean;compact:boolean}){
 const focus=useRef(new Vector3(0,0,0)),fixed=useRef(new Vector3(0,0,0)),last=useRef(mode);
 useFrame(({camera},delta)=>{const p=samplePose(clock.current.time,5,reduced).position;
  if(last.current!==mode){fixed.current.set(...p);last.current=mode;}
  const anchor=reduced?fixed.current:new Vector3(...p);
  const target=mode==='overview'?new Vector3(0,0,0):new Vector3(anchor.x+1.1,1.1,anchor.z);
  const desired=mode==='overview'?(compact?new Vector3(45,57,59):new Vector3(25,29,31)):new Vector3(anchor.x-5.4,4.7,anchor.z+6.5);
  const blend=reduced?1:1-Math.exp(-delta*3.2);camera.position.lerp(desired,blend);focus.current.lerp(target,blend);camera.lookAt(focus.current);
 });return null;
}
function RenderEvidence({clock,mode}:{clock:MutableRefObject<VisualClock>;mode:CameraMode}){
 useFrame(({scene,gl,camera})=>{const people:import('three').Object3D[]=[];scene.traverse(o=>{if(o.userData.residentId)people.push(o);});
  gl.domElement.dataset.people=JSON.stringify(people.map(a=>({id:a.userData.residentId,uuid:a.uuid,position:a.position.toArray().map(v=>Number(v.toFixed(3))),state:a.userData.state,walking:a.userData.walking})));
  gl.domElement.dataset.time=clock.current.time.toFixed(2);gl.domElement.dataset.blocked=String(!!scene.getObjectByName('visual-east-barrier'));
  gl.domElement.dataset.camera=mode;gl.domElement.dataset.rendered=String(gl.info.render.calls>0);gl.domElement.dataset.cameraPosition=camera.position.toArray().map(v=>v.toFixed(3)).join(',');
 });return null;
}
export default function PrototypeScene({clock,time,mode,style,reduced,compact,selected,onSelect,onTime}:{clock:MutableRefObject<VisualClock>;time:number;mode:CameraMode;style:Style;reduced:boolean;compact:boolean;selected:number;onSelect:(i:number)=>void;onTime:(n:number)=>void}){
 return <Canvas shadows={!compact} dpr={compact?1:[1,1.5]} camera={{position:compact?[45,57,59]:[25,29,31],fov:43,near:.1,far:120}}
  gl={{antialias:!compact,powerPreference:'low-power',preserveDrawingBuffer:true}}
  onCreated={({gl})=>{gl.outputColorSpace=SRGBColorSpace;gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.setClearColor(new Color(PALETTES[style].backdrop));gl.domElement.setAttribute('aria-label','Hospital-like visual prototype with eight persistent people');}}>
  <color attach="background" args={[PALETTES[style].backdrop]}/>
  <ambientLight intensity={.7}/><hemisphereLight args={['#f6fbff','#b9c5b6',.75]}/>
  <directionalLight position={[-10,25,13]} intensity={1.8} castShadow={!compact} shadow-mapSize={[2048,2048]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={.07}/>
  <FrameClock clock={clock} onTime={onTime}/>
  <Hospital style={style} time={time} compact={compact}/>
  {RESIDENTS.map((r,i)=><HumanAvatar key={r.id} index={i} time={time} clock={clock} playing={clock.current.playing} reduced={reduced} selected={selected} onSelect={onSelect}/>)}
  <Camera mode={mode} clock={clock} reduced={reduced} compact={compact}/><RenderEvidence clock={clock} mode={mode}/>
 </Canvas>;
}
