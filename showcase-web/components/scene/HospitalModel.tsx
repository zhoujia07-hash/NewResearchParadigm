'use client';
import {HOSPITAL_CONNECTIONS as CONNECTIONS,HOSPITAL_LOCATIONS as LOCATIONS,MODERN_HOSPITAL as p} from '@/lib/spatialPresentation';
import type {Point3 as Vec3} from '@/types/environment';
import Label from './HospitalLabel';
export function Box({at,size,color,rotation=[0,0,0],shadow=true}:{at:Vec3;size:Vec3;color:string;rotation?:Vec3;shadow?:boolean}){
 return <mesh position={at} rotation={rotation} castShadow={shadow} receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.7}/></mesh>;
}
function Bench({x,z,accent}:{x:number;z:number;accent:string}){
 return <group position={[x,0,z]}><Box at={[0,.45,0]} size={[2,.2,.6]} color={accent}/><Box at={[0,.83,-.25]} size={[2,.7,.13]} color={accent}/>{[-.75,.75].map(a=><Box key={a} at={[a,.22,0]} size={[.09,.4,.5]} color="#718180"/>)}</group>;
}
function Planter({at}:{at:Vec3}){return <group position={at}><mesh position={[0,.28,0]} castShadow><cylinderGeometry args={[.42,.36,.55,12]}/><meshStandardMaterial color="#d8ccb8"/></mesh><mesh position={[0,.9,0]} castShadow><icosahedronGeometry args={[.6,1]}/><meshStandardMaterial color="#719276"/></mesh><mesh position={[0,.5,0]}><cylinderGeometry args={[.04,.04,.5,6]}/><meshStandardMaterial color="#827259"/></mesh></group>;}
function Door({x,z,west,blocked}:{x:number;z:number;west:boolean;blocked:boolean}){
 const status=blocked?'#cf4253':'#3c886e';
 return <group position={[x,0,z]}>
  <Box at={[0,1.3,-1.65]} size={[.3,2.6,.22]} color="#a2b8b7"/>
  <Box at={[0,1.3,1.65]} size={[.3,2.6,.22]} color="#a2b8b7"/>
  <Box at={[0,2.7,0]} size={[.32,.32,3.55]} color={status}/>
  <Label text={west?'WEST EXIT · OPEN':blocked?'EAST EXIT · BLOCKED':'EAST EXIT'} at={[0,3.15,0]} width={4} color={status}/>
  {blocked&&<group name="east-exit-barrier" position={[-.45,0,0]}>
   {[-1.25,1.25].map(z=><Box key={z} at={[0,.6,z]} size={[.23,1.2,.28]} color="#b4414d"/>)}
   <Box at={[0,1,0]} size={[.23,.75,3.2]} color="#e8bb62"/>
   {[-1.2,-.8,-.4,0,.4,.8,1.2].map(z=><Box key={z} at={[-.14,1,z]} size={[.04,.82,.16]} color="#384a4d"/>)}
   <Box at={[-.2,1.8,0]} size={[.05,.22,2.8]} rotation={[.6,0,0]} color="#d74150"/>
   <Box at={[-.2,1.8,0]} size={[.05,.22,2.8]} rotation={[-.6,0,0]} color="#d74150"/>
  </group>}
 </group>;
}
export default function HospitalModel({blocked,compact}:{blocked:boolean;compact:boolean}){
 return <group name="modern-hospital">
  <Box at={[0,-.2,.5]} size={[54,.3,26]} color="#bdccc8" shadow={false}/>
  <Box at={[0,-.025,.5]} size={[53.5,.12,25.5]} color={p.floor}/>
  {/* Rear facade and glazing read as an interior; the front is a deliberate cutaway. */}
  <Box at={[0,1.5,-12]} size={[53,3,.2]} color={p.wall}/>
  <Box at={[0,.12,-11.8]} size={[44,.16,.08]} color={p.wood}/>
  {[-19,-12,-5,5,12,19].map(x=><group key={x}>
   <mesh position={[x,1.8,-11.86]}><boxGeometry args={[4.5,1.65,.04]}/><meshStandardMaterial color="#b4d2d3" roughness={.2} transparent opacity={.55}/></mesh>
   {[-2.3,0,2.3].map(a=><Box key={a} at={[x+a,1.8,-11.79]} size={[.055,1.8,.07]} color="#809fa3"/>)}
  </group>)}
  {/* Clinical rooms: matte floors, beds, broad openings and readable wall trim. */}
  {[-15,-8,8,15].map((x,i)=><group key={x}>
   <Box at={[x,.06,-6.7]} size={[6.1,.08,6.4]} color={p.room}/>
   <Box at={[x+3.0,.9,-7]} size={[.15,1.8,5.8]} color={p.wall}/>
   <Box at={[x+3.0,.27,-7]} size={[.18,.12,5.8]} color={p.accent}/>
   <Box at={[x,1.05,-9.85]} size={[6.2,2.1,.15]} color={p.wall}/>
   <Box at={[x, .5,-7.2]} size={[1.25,.4,2.3]} color="#bec9c7"/>
   <Box at={[x,.78,-7.2]} size={[1.25,.17,2.35]} color="#f9f7ed"/>
   <Box at={[x,.9,-6.8]} size={[1.28,.12,1.45]} color={p.accent}/>
   <Box at={[x,.94,-7.94]} size={[.9,.12,.4]} color="#fffdf3"/>
   <Box at={[x-.95,.47,-8]} size={[.48,.9,.48]} color={p.wood}/>
   <Label text={`CARE ${String(i+1).padStart(2,'0')}`} at={[x,1.45,-9.6]} width={2.5}/>
   {!compact&&<Bench x={x+1.8} z={-5.3} accent={p.accent}/>}
  </group>)}
  {[-16,-8,13,19].map(x=><group key={x}>
   <Box at={[x,.06,6.6]} size={[5.3,.08,5.8]} color={'#dee6e1'}/>
   <Box at={[x,.7,9.5]} size={[5.3,1.4,.16]} color={p.wall}/>
   <Box at={[x,.3,9.4]} size={[5.3,.12,.05]} color={p.wood}/>
   <Bench x={x} z={8.5} accent={p.accent}/>
   {!compact&&<Planter at={[x-1.8,0,6.2]}/>}
  </group>)}
  {CONNECTIONS.map(([a,b])=>{const A=LOCATIONS[a],B=LOCATIONS[b],dx=B[0]-A[0],dz=B[2]-A[2],len=Math.hypot(dx,dz);
   return <group key={a+b} position={[(A[0]+B[0])/2,0,(A[2]+B[2])/2]} rotation={[0,-Math.atan2(dz,dx),0]}>
    <Box at={[0,.075,0]} size={[len+.3,.13,3.4]} color="#f5f4ee"/>
    {[-1,1].map(side=><group key={side}>
     <Box at={[0,.6,side*1.75]} size={[Math.max(.2,len-4),1.1,.13]} color={p.wall}/>
     <Box at={[0,.4,side*1.68]} size={[Math.max(.2,len-4),.1,.09]} color={p.accent}/>
     <Box at={[0,1.17,side*1.75]} size={[Math.max(.2,len-4),.09,.18]} color="#93aaa8"/>
    </group>)}
    <Box at={[0,.15,.95]} size={[len,.02,.045]} color={p.accent} shadow={false}/>
   </group>;
  })}
  {Object.entries(LOCATIONS).map(([name,at])=><group key={name}>
   <Box at={[at[0],.08,at[2]]} size={[name==='North Atrium'?6:4,.14,name==='North Atrium'?4.5:3.8]} color={name==='Refuge Point'?'#e3eee3':'#f5f4ee'}/>
   {!name.includes('Exit')&&<Label text={name} at={[at[0],.22,at[2]-1.3]} width={3}/>}
  </group>)}
  <Door z={LOCATIONS['West Exit'][2]} x={LOCATIONS['West Exit'][0]} west blocked={false}/><Door z={LOCATIONS['East Exit'][2]} x={LOCATIONS['East Exit'][0]} west={false} blocked={blocked}/>
  <group position={[0,0,11.4]}>
   <Box at={[0,.55,0]} size={[4.5,1.1,1]} color={p.wood}/>
   <Box at={[0,1.12,0]} size={[4.7,.12,1.1]} color="#edf0e8"/>
   <Box at={[0,.65,.52]} size={[3.4,.5,.025]} color={p.accent}/>
   <Label text="RECEPTION" at={[0,1.8,0]} width={3.8}/>
  </group>
  <Planter at={[-1.3,0,-8.5]}/><Planter at={[1.3,0,-8.5]}/>
  <Bench x={4.8} z={9.8} accent={p.accent}/>
  <Label text="REFUGE · STAFF ASSISTANCE" at={[6.7,1.6,9.5]} width={4} color="#477e61"/>
  <Label text="WEST WING" at={[-15,1,10.8]} width={5} color={p.accent}/>
  <Label text="EAST WING" at={[15,1,10.8]} width={5} color={p.accent}/>
 </group>;
}
