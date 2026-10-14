'use client';
import {Canvas,useFrame} from '@react-three/fiber';
import {useRef} from 'react';
import {Color,Group,Vector3,SRGBColorSpace,ACESFilmicToneMapping} from 'three';
import {RESIDENTS,blocked,routeFor,residentColor} from '@/lib/story';
import {toWorld,STATUS_COLORS} from '@/lib/environmentModel';
import {NODES} from '@/lib/story';
import HospitalModel from './HospitalModel';
import ResidentAvatar from './ResidentAvatar';
import CameraController from './CameraController';
import ResidentLabels from './ResidentLabels';
import type {SceneProps} from '@/types/environment';
function SceneEvidence({story,cameraMode}:Pick<SceneProps,'story'|'cameraMode'>){
 const frames=useRef(0);
 useFrame(({scene,gl,camera})=>{
  frames.current++;const avatars:Group[]=[];
  scene.traverse(o=>{if(o.userData.residentId)avatars.push(o as Group);});
  const canvas=gl.domElement;camera.userData.canvas=canvas;
  canvas.dataset.residentCount=String(avatars.length);canvas.dataset.cameraMode=cameraMode;
  canvas.dataset.avatars=JSON.stringify(avatars.map(a=>({id:a.userData.residentId,uuid:a.uuid,bodyHeading:a.getObjectByName('body')?.rotation.y,looking:a.userData.looking,position:a.position.toArray().map(v=>Number(v.toFixed(4))),color:a.userData.color,walking:a.userData.walking,screen:(new Vector3(a.position.x,1.1,a.position.z).project(camera)).toArray().slice(0,2)})));
  canvas.dataset.hospital=String(!!scene.getObjectByName('modern-hospital'));
  canvas.dataset.blocked=String(!!scene.getObjectByName('east-exit-barrier'));
  canvas.dataset.frames=String(frames.current);
  // The flag reflects an actual WebGL render, not just a React DOM placeholder.
  gl.domElement.dataset.rendered=String(gl.info.render.calls>0);
 });return null;
}
function Route({story}:Pick<SceneProps,'story'>){
 if(!story.choice)return null;
 const points=routeFor(story).map(n=>toWorld(NODES[n]));
 return <group name="submitted-route">{points.slice(1).map((p,i)=>{
  const a=points[i],dx=p[0]-a[0],dz=p[2]-a[2];return <mesh key={i} position={[(p[0]+a[0])/2,.14,(p[2]+a[2])/2]} rotation={[0,-Math.atan2(dz,dx),0]}><boxGeometry args={[Math.hypot(dx,dz),.025,.14]}/><meshBasicMaterial color={STATUS_COLORS[residentColor(story,5)]}/></mesh>;
 })}</group>;
}
export default function Environment3D(props:SceneProps){
 return <Canvas shadows={!props.compact} dpr={props.compact?1:[1,1.5]} camera={{position:[29,34,37],fov:44,near:.1,far:150}}
  gl={{antialias:!props.compact,powerPreference:'low-power',preserveDrawingBuffer:true}}
  onCreated={({gl,scene})=>{gl.outputColorSpace=SRGBColorSpace;gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=.9;
   gl.setClearColor(new Color('#eef3ef'));gl.domElement.setAttribute('aria-label','3D hospital with eight human avatars');}}>
  <ambientLight intensity={.6}/><hemisphereLight args={['#ffffff','#bdc9bb',.8]}/>
  <directionalLight position={[10,28,15]} intensity={1.8} castShadow={!props.compact} shadow-mapSize={[1024,1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-normalBias={.08}/>
  <HospitalModel blocked={blocked(props.story)} compact={props.compact}/><Route story={props.story}/>
  {RESIDENTS.map((r,i)=><ResidentAvatar key={r.id} index={i} {...props}/>)}
  <CameraController {...props}/><ResidentLabels/><SceneEvidence story={props.story} cameraMode={props.cameraMode}/>
 </Canvas>;
}
