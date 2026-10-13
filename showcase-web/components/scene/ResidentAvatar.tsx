'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,MathUtils} from 'three';
import {avatarPose} from '@/lib/navigationModel';
import {RESIDENTS,frozen,residentColor} from '@/lib/story';
import {OUTFITS,STATUS_COLORS} from '@/lib/environmentModel';
import TextLabel from './TextLabel';
import type {SceneProps} from '@/types/environment';
function Limb({side,kind}:{side:number;kind:'leg'|'arm'}){
 return <group name={kind+side} position={[side*(kind==='leg'?.12:.25),kind==='leg'?.87:1.27,0]}>
  <mesh position={[0,kind==='leg'?-.34:-.27,0]} castShadow><boxGeometry args={kind==='leg'?[.13,.63,.15]:[.11,.5,.13]}/><meshStandardMaterial color={kind==='leg'?'#354954':'#d2a990'}/></mesh>
  {kind==='leg'&&<mesh position={[0,-.68,.045]} castShadow><boxGeometry args={[.17,.12,.29]}/><meshStandardMaterial color="#303d45"/></mesh>}
 </group>;
}
function Walker(){return <group position={[0,0,.4]}>
 {[-.28,.28].flatMap(x=>[-.15,.3].map(z=><mesh key={x+','+z} position={[x,.44,z]}><cylinderGeometry args={[.022,.022,.83,6]}/><meshStandardMaterial color="#a4afb5" metalness={.55} roughness={.4}/></mesh>))}
 {[-.28,.28].map(x=><group key={x}><mesh position={[x,.82,.075]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.03,.03,.46,6]}/><meshStandardMaterial color="#475b60"/></mesh></group>)}
 <mesh position={[0,.57,.3]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.025,.025,.56,6]}/><meshStandardMaterial color="#a4afb5"/></mesh>
 {[-.28,.28].map(x=><mesh key={x} position={[x,.055,.3]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.065,.065,.04,8]}/><meshStandardMaterial color="#344147"/></mesh>)}
 </group>;}
export default function ResidentAvatar({index,story,selected,reduced,onSelect}:Pick<SceneProps,'story'|'selected'|'reduced'|'onSelect'>&{index:number}){
 const root=useRef<Group>(null);const lastHeading=useRef(0);
 const color=STATUS_COLORS[residentColor(story,index)],r=RESIDENTS[index];
 useFrame((_,delta)=>{const group=root.current;if(!group)return;
  const pose=avatarPose(story,index,reduced);group.position.set(...pose.position);
  // Camera/view changes never advance the scripted clock or animate a paused body.
  if(!frozen(story)&&pose.walking)lastHeading.current=pose.heading;
  const body=group.getObjectByName('body')!;
  if(reduced)body.rotation.y=lastHeading.current;
  else if(!frozen(story))body.rotation.y+=(MathUtils.euclideanModulo(lastHeading.current-body.rotation.y+Math.PI,Math.PI*2)-Math.PI)*(1-Math.exp(-delta*8));
  const amplitude=reduced||!pose.walking?0:index===5?.17:.32;
  const gait=Math.sin(pose.phase)*amplitude;
  for(const side of [-1,1]){const leg=body.getObjectByName('leg'+side),arm=body.getObjectByName('arm'+side);
   if(leg)leg.rotation.x=gait*side;if(arm)arm.rotation.x=index===5?-.45:-gait*side;}
  body.position.y=pose.walking&&!reduced?Math.abs(Math.sin(pose.phase))*.025:0;
  group.userData.pose=[...pose.position];group.userData.color=residentColor(story,index);group.userData.walking=pose.walking;
 });
 return <group ref={root} name={'avatar-'+r.id} userData={{residentId:r.id}} onClick={e=>{e.stopPropagation();onSelect(index);}}>
  <group name="body" scale={index===5?[.96,.96,.96]:[1,1,1]}>
   <mesh position={[0,1.16,0]} castShadow><boxGeometry args={[.42,.53,.25]}/><meshStandardMaterial color={OUTFITS[index]}/></mesh>
   <mesh position={[0,.85,0]} castShadow><boxGeometry args={[.34,.18,.23]}/><meshStandardMaterial color="#354954"/></mesh>
   <mesh position={[0,1.62,.015]} castShadow><sphereGeometry args={[.19,12,10]}/><meshStandardMaterial color={index%2?'#c59475':'#ddb395'}/></mesh>
   <mesh position={[0,1.73,-.015]}><sphereGeometry args={[.173,10,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={index===5?'#d4d4ce':index%2?'#493b33':'#5a5048'}/></mesh>
   <Limb side={-1} kind="leg"/><Limb side={1} kind="leg"/>
   <Limb side={-1} kind="arm"/><Limb side={1} kind="arm"/>
   {index===5&&<Walker/>}
  </group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.15,0]}><ringGeometry args={[selected===index?.48:.36,selected===index?.59:.44,24]}/><meshBasicMaterial color={color} transparent opacity={.85}/></mesh>
  <TextLabel text={r.id} position={[0,2.18,0]} width={1.55} color={color} fixed/>
 </group>;
}
