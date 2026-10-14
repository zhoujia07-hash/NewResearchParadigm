'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,Mesh,Color,MathUtils} from 'three';
import {RESIDENTS,frozen,residentColor} from '@/lib/story';
import {avatarPose} from '@/lib/navigationModel';
import {STATUS_COLORS as STATUS,OUTFITS} from '@/lib/environmentModel';
import type {SceneProps,Point3 as Vec3} from '@/types/environment';
import Label from './HospitalLabel';
function Segment({at,size,color}:{at:Vec3;size:Vec3;color:string}){return <mesh position={at} castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.8}/></mesh>;}
function Leg({side}:{side:number}){return <group name={'leg'+side} position={[side*.12,.91,0]}>
 <Segment at={[0,-.19,0]} size={[.135,.38,.16]} color="#485a63"/>
 <group name={'knee'+side} position={[0,-.39,0]}><Segment at={[0,-.17,0]} size={[.12,.34,.14]} color="#485a63"/><Segment at={[0,-.37,.055]} size={[.17,.12,.3]} color="#37454b"/></group>
 </group>;}
function Walker(){return <group name="walker" position={[0,0,.48]}>
 {[-.3,.3].flatMap(x=>[-.19,.3].map(z=><mesh key={x+','+z} position={[x,.49,z]}><cylinderGeometry args={[.023,.023,.84,8]}/><meshStandardMaterial color="#a6b4bc" metalness={.55} roughness={.3}/></mesh>))}
 {[-.3,.3].map(x=><group key={x}><mesh position={[x,.9,.045]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,.48,8]}/><meshStandardMaterial color="#405a62"/></mesh><mesh position={[x,.09,.3]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.085,.085,.055,10]}/><meshStandardMaterial color="#35474f"/></mesh></group>)}
 {[.5,.7].map(y=><mesh key={y} position={[0,y,.3]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.024,.024,.6,8]}/><meshStandardMaterial color="#a6b4bc" metalness={.4}/></mesh>)}
 </group>;}
export default function ResidentAvatar({index,story,reduced,selected,onSelect}:Pick<SceneProps,'story'|'selected'|'reduced'|'onSelect'>&{index:number}){
 const root=useRef<Group>(null),body=useRef<Group>(null),halo=useRef<Mesh>(null),heading=useRef(0);
 const r={...RESIDENTS[index],outfit:OUTFITS[index],skin:index%2?'#c59475':'#ddb395'};
 const old=index===5,status=residentColor(story,index),statusColor=STATUS[status];
 useFrame((_,delta)=>{const pose=avatarPose(story,index,reduced);const g=root.current!,b=body.current!;
  g.position.set(...pose.position);
  if(story.stage==='idle'){heading.current=0;b.rotation.y=0;}
  if(pose.walking)heading.current=pose.heading;
  if(!frozen(story)){
   const difference=MathUtils.euclideanModulo(heading.current-b.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   b.rotation.y+=difference*(reduced?1:1-Math.exp(-delta*8));
  }
  const gait=!pose.walking||reduced?0:Math.sin(pose.phase)*(old?.16:.34);
  for(const side of [-1,1]){const leg=b.getObjectByName('leg'+side)!,knee=b.getObjectByName('knee'+side)!,arm=b.getObjectByName('arm'+side)!;
   leg.rotation.x=gait*side;knee.rotation.x=Math.max(0,-gait*side)*.65;arm.rotation.x=old?-.55:-gait*side;}
  b.getObjectByName('head')!.rotation.y=pose.looking;
  b.position.y=.06+(pose.walking&&!reduced?Math.abs(Math.sin(pose.phase))*.018:0);
  const material=halo.current!.material as import('three').MeshBasicMaterial;
  if(frozen(story))material.color.set(statusColor);else material.color.lerp(new Color(statusColor),reduced?1:1-Math.exp(-delta*3));
  g.userData.color=status;g.userData.walking=pose.walking;g.userData.pose=[...pose.position];g.userData.looking=pose.looking;
 });
 return <group ref={root} name={'avatar-'+r.id} userData={{residentId:r.id}} onClick={e=>{e.stopPropagation();onSelect(index);}}>
  <group ref={body} name="body">
   <mesh position={[0,1.18,old?.055:0]} rotation={[old?.09:0,0,0]} castShadow><capsuleGeometry args={[.19,.25,4,10]}/><meshStandardMaterial color={r.outfit} roughness={.85}/></mesh>
   <Segment at={[0,.91,0]} size={[.32,.18,.22]} color="#485a63"/>
   <group name="head" position={[0,1.62,old?.07:0]}>
    <mesh castShadow><sphereGeometry args={[.18,12,10]}/><meshStandardMaterial color={r.skin}/></mesh>
    <mesh position={[0,.08,-.015]}><sphereGeometry args={[.17,12,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={old?'#c9cdca':index%2?'#5f5149':'#444749'}/></mesh>
    <mesh position={[0,0,.174]}><sphereGeometry args={[.028,8,6]}/><meshStandardMaterial color={r.skin}/></mesh>
    {old&&[-.063,.063].map(x=><mesh key={x} position={[x,.025,.162]}><torusGeometry args={[.044,.008,4,10]}/><meshStandardMaterial color="#596769"/></mesh>)}
   </group>
   <Leg side={-1}/><Leg side={1}/>
   {[-1,1].map(side=><group key={side} name={'arm'+side} position={[side*.235,1.35,old?.03:0]}>
    <Segment at={[0,-.14,0]} size={[.12,.28,.13]} color={r.outfit}/>
    <Segment at={[0,-.36,.035]} size={[.1,.2,.1]} color={r.skin}/>
    <mesh position={[0,-.48,.04]}><sphereGeometry args={[.055,8,6]}/><meshStandardMaterial color={r.skin}/></mesh>
   </group>)}
   {old&&<Walker/>}
  </group>
  <mesh ref={halo} rotation={[-Math.PI/2,0,0]} position={[0,.17,0]}><ringGeometry args={[selected===index?.51:.37,selected===index?.61:.44,32]}/><meshBasicMaterial color={STATUS.green} transparent opacity={.85} toneMapped={false}/></mesh>
  {old&&<mesh position={[0,2.65,0]}><cylinderGeometry args={[.012,.012,1.15,4]}/><meshBasicMaterial color={statusColor} transparent opacity={.5}/></mesh>}
  <Label name="resident-id" text={r.id} at={[0,old?3.35:2.15,0]} fixed color={statusColor}/>
 </group>;
}
