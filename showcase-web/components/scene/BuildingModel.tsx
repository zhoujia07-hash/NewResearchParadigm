'use client';
import {CONNECTIONS,SPATIAL_NODES,toWorld} from '@/lib/environmentModel';
import TextLabel from './TextLabel';
import type {Point3} from '@/types/environment';
function Block({at,size,color='#e2e6e0',shadow=true}:{at:Point3;size:Point3;color?:string;shadow?:boolean}){
 return <mesh position={at} castShadow={shadow} receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.85}/></mesh>;
}
function Door({x,exit,label}:{x:number;exit:boolean;label:string}){
 return <group position={[x,0,-.625]}>
  <Block at={[0,1.15,-1.6]} size={[.28,2.3,.25]} color="#46666c"/>
  <Block at={[0,1.15,1.6]} size={[.28,2.3,.25]} color="#46666c"/>
  <Block at={[0,2.35,0]} size={[.3,.3,3.45]} color={exit?'#266e54':'#46666c'}/>
  <TextLabel text={label} position={[0,2.95,0]} width={3.5} color={exit?'#196343':'#173b43'}/>
 </group>;
}
export default function BuildingModel({blocked,compact}:{blocked:boolean;compact:boolean}){
 const east=toWorld([755,200])[0],west=toWorld([40,200])[0];
 return <group name="hospital-building">
  <Block at={[0,-.28,0]} size={[51,.35,29]} color="#c5d0cf" shadow={false}/>
  <Block at={[0,-.07,0]} size={[49,.08,27]} color="#e5e9e3" shadow={false}/>
  {/* Rooms, furnishings and partial walls make a cutaway architectural model. */}
  {[-17,-9,8,17].map((x,i)=><group key={x}>
    <Block at={[x,.015,-6.5]} size={[6.5,.12,4.5]} color={i%2?'#dbe6e1':'#dce6ed'}/>
    <Block at={[x,.7,-8.75]} size={[6.5,1.4,.16]} color="#f5f5ee"/>
    <Block at={[x-3.2,.5,-6.5]} size={[.14,1,4.5]} color="#edf0eb"/>
    <Block at={[x, .35,-6.5]} size={[2,.65,.8]} color="#f5f8f2"/>
    <Block at={[x,.74,-6.5]} size={[2.1,.15,.85]} color="#91aebc"/>
    {!compact&&<><Block at={[x-1.8,.3,-5.5]} size={[.7,.6,.65]} color="#698e8d"/>
     <Block at={[x-1.8,.75,-5.75]} size={[.7,.55,.15]} color="#698e8d"/></>}
  </group>)}
  {[-18,-8,8,18].map((x,i)=><group key={x}>
    <Block at={[x,.025,7]} size={[6,.13,4.6]} color="#e3e9dc"/>
    <Block at={[x,.65,9.3]} size={[6,1.3,.16]} color="#f5f5ee"/>
    <Block at={[x+2.9,.5,7]} size={[.16,1,4.5]} color="#eef0e8"/>
    <Block at={[x,.5,8]} size={[2,.7,.8]} color={i%2?'#a4b6a1':'#809faa'}/>
  </group>)}
  {CONNECTIONS.map(({a,b,start,end})=>{const dx=end[0]-start[0],dz=end[2]-start[2];const length=Math.hypot(dx,dz);
   return <group key={a+b} position={[(start[0]+end[0])/2,0,(start[2]+end[2])/2]} rotation={[0,-Math.atan2(dz,dx),0]}>
    <Block at={[0,.035,0]} size={[length+.4,.12,3.25]} color="#f7f6ed"/>
    {[-1,1].map(side=><group key={side}>
     <Block at={[0,.44,side*1.65]} size={[Math.max(.1,length-3.8),.8,.13]} color="#fafbf5"/>
     <Block at={[0,.86,side*1.65]} size={[Math.max(.1,length-3.8),.06,.15]} color="#a2b3b0"/>
    </group>)}
   </group>;
  })}
  {SPATIAL_NODES.map(({name,position:p})=><group key={name}>
    <Block at={[p[0],.055,p[2]]} size={[name==='North Atrium'?6:4,.13,name==='North Atrium'?5:3.8]} color={name.includes('Exit')?'#dfede1':'#f6f6ef'}/>
    {!name.includes('Exit')&&<TextLabel text={name} position={[p[0],.16,p[2]-1.4]} width={name==='North Atrium'?4:3.1}/>}
  </group>)}
  <Door x={east} exit label="EAST EXIT"/><Door x={west} exit label="WEST EXIT"/>
  <TextLabel text="WEST WING" position={[-16,.5,11.3]} width={5.5} background="#dfece5"/>
  <TextLabel text="EAST WING" position={[16,.5,11.3]} width={5.5} background="#dfece5"/>
  {/* Reception desk and an atrium planter provide stable architectural landmarks. */}
  <Block at={[-1,.45,10]} size={[3.5,.9,1.1]} color="#547b7c"/>
  <TextLabel text="RECEPTION / ENTRANCE" position={[0,1.35,10]} width={5}/>
  <mesh position={[0,.25,-8.9]}><cylinderGeometry args={[.9,1,.5,12]}/><meshStandardMaterial color="#e6cfaa"/></mesh>
  <mesh position={[0,1,-8.9]}><sphereGeometry args={[.85,10,8]}/><meshStandardMaterial color="#668965"/></mesh>
  <Block at={[9.8,.5,8.3]} size={[1.5,1,.9]} color="#829da1"/>
  {blocked&&<group name="east-exit-barrier" userData={{blocked:true}} position={[east-.65,0,-.625]}>
    <Block at={[0,.55,-1.3]} size={[.3,1.1,.28]} color="#a3383f"/>
    <Block at={[0,.55,1.3]} size={[.3,1.1,.28]} color="#a3383f"/>
    <Block at={[0,.85,0]} size={[.25,.85,3]} color="#ebbd62"/>
    {[-1,-.5,0,.5,1].map(z=><Block key={z} at={[-.14,.85,z]} size={[.06,.9,.16]} color="#343d3e"/>)}
    <TextLabel text="BLOCKED · DO NOT ENTER" position={[0,3.6,0]} width={5} color="#b42737" background="#fff0ed"/>
  </group>}
 </group>;
}
