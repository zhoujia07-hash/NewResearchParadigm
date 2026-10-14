'use client';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {useEffect,useRef} from 'react';
import {OrthographicCamera,type Group} from 'three';
import type {ComparisonScene} from '@/engine/comparison/experiment';
import Label from '@/components/scene/HospitalLabel';
import {nodeAt,edgeLength} from '@/models/environment/comparison/structure';
const art={floor:'#e8eeea',wall:'#f5f3e9',teal:'#77a8a1',wood:'#bd9a75'};
function Camera(){const {camera,size}=useThree();useEffect(()=>{
 const c=camera as OrthographicCamera;c.position.set(14,32,30);c.lookAt(0,0,0);c.zoom=Math.min(size.width/44,size.height/32);c.updateProjectionMatrix();
},[camera,size]);return null;}
function World({scene:s,reduced}:{scene:ComparisonScene;reduced:boolean}){
 const avatar=useRef<Group>(null),head=useRef<Group>(null),legs=useRef<Group>(null);
 const walker=s.human.id==='R06';
 useFrame(({gl})=>{
  const g=avatar.current!,h=head.current!;
  const position=s.position;
  g.position.set(position[0],.15,position[1]);g.rotation.y=s.heading;
  const scanning=!reduced&&s.clock.running&&!s.arrived?Math.sin(s.clock.elapsed*1.8)*(.04+.4*s.response.scanning):0;
  h.rotation.y=scanning;
  for(const child of legs.current!.children)child.rotation.x=!reduced&&s.moving?Math.sin(s.clock.elapsed*6)*(child.position.x<0?1:-1)*.24:0;
  const c=gl.domElement;c.dataset.network=s.network.id;c.dataset.resident=s.human.id;c.dataset.experimentTime=s.clock.elapsed.toFixed(3);
  c.dataset.position=JSON.stringify([...position]);c.dataset.scanning=String(scanning);c.dataset.moving=String(s.moving);c.dataset.avatarUuid=g.uuid;
  c.dataset.rendered=String(gl.info.render.calls>0);
 });
 const route=s.network.route.map(id=>nodeAt(s.network,id));
 return <>
  <Camera/><ambientLight intensity={.7}/><hemisphereLight args={['#ffffff','#aabcb0',.65]}/><directionalLight position={[8,20,10]} intensity={1.6}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.12,0]}><planeGeometry args={[42,24]}/><meshStandardMaterial color="#d9e2dc" roughness={1}/></mesh>
  {/* Identical cutaway room furniture in both fixtures; route topology is the manipulation. */}
  {[-15,-9,-3,3,9,15].flatMap(x=>[-4,4].map(z=><group key={x+','+z} position={[x,0,z]}>
   <mesh position={[0,.02,0]}><boxGeometry args={[3.3,.12,3.2]}/><meshStandardMaterial color="#dae6e3"/></mesh>
   <mesh position={[0,.7,-1.55]}><boxGeometry args={[3.3,1.35,.12]}/><meshStandardMaterial color={art.wall}/></mesh>
   <mesh position={[-1.58,.7,0]}><boxGeometry args={[.12,1.35,3.2]}/><meshStandardMaterial color={art.wall}/></mesh>
   <mesh position={[0,.2,-1.46]}><boxGeometry args={[3.2,.15,.08]}/><meshStandardMaterial color={art.wood}/></mesh>
   <mesh position={[.8,.38,0]}><boxGeometry args={[.9,.65,1.45]}/><meshStandardMaterial color="#c3d5cf"/></mesh>
   <mesh position={[.8,.74,-.35]}><boxGeometry args={[.8,.1,.55]}/><meshStandardMaterial color="#f7f4e9"/></mesh>
  </group>))}
  <Label text="ENTRANCE" at={[-18,.4,2]} width={4}/><Label text="DESTINATION" at={[18,.4,2]} width={5} color="#886b33"/>
  {s.network.edges.map(([a,b])=>{const p=nodeAt(s.network,a),q=nodeAt(s.network,b),length=edgeLength(p,q),rotation=-Math.atan2(q.z-p.z,q.x-p.x);return <group key={a+b} position={[(p.x+q.x)/2,0,(p.z+q.z)/2]} rotation={[0,rotation,0]}>
   <mesh><boxGeometry args={[length+.3,.16,2.5]}/><meshStandardMaterial color={art.floor}/></mesh>
   {[-1,1].map(side=><group key={side} position={[0,0,side*1.34]}>
    <mesh position={[0,.63,0]}><boxGeometry args={[Math.max(.1,length-2.6),1.2,.14]}/><meshStandardMaterial color={art.wall}/></mesh>
    <mesh position={[0,.18,0]}><boxGeometry args={[Math.max(.1,length-2.6),.16,.16]}/><meshStandardMaterial color={art.wood}/></mesh>
   </group>)}
  </group>;})}
  {s.network.nodes.map(n=><group key={n.id} position={[n.x,0,n.z]}>
   <mesh><boxGeometry args={[2.7,.18,2.7]}/><meshStandardMaterial color={art.floor}/></mesh>
   <mesh position={[0,.14,0]}><boxGeometry args={[.65,.1,.65]}/><meshStandardMaterial color={n.id===s.network.goal?'#c8a45e':art.teal}/></mesh>
   <mesh position={[.95,1.1,.9]}><boxGeometry args={[.55,.3,.12]}/><meshStandardMaterial color={art.teal}/></mesh>
  </group>)}
  {route.slice(1).map((q,i)=>{const p=route[i];return <mesh key={i} position={[(p.x+q.x)/2,.16,(p.z+q.z)/2]} rotation={[0,-Math.atan2(q.z-p.z,q.x-p.x),0]}><boxGeometry args={[edgeLength(p,q),.04,.16]}/><meshStandardMaterial color="#6b9e91"/></mesh>;})}
  <group ref={avatar} scale={1.25}>
   <Label text={s.human.id} at={[0,2.7,0]} width={2}/>
   <mesh position={[0,1.15,0]}><capsuleGeometry args={[.2,.36,4,10]}/><meshStandardMaterial color="#486b76"/></mesh>
   <group ref={head} position={[0,1.75,0]}><mesh><sphereGeometry args={[.19,12,10]}/><meshStandardMaterial color="#d0ac8c"/></mesh><mesh position={[0,.1,-.02]}><sphereGeometry args={[.18,12,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={walker?'#c9cdca':'#48524c'}/></mesh><mesh position={[0,0,.19]}><sphereGeometry args={[.04,8,6]}/><meshStandardMaterial color="#bd9276"/></mesh></group>
   <group ref={legs}>{[-1,1].map(side=><group key={side} position={[side*.12,.9,0]}><mesh position={[0,-.35,0]}><boxGeometry args={[.15,.7,.18]}/><meshStandardMaterial color="#485a63"/></mesh></group>)}</group>
   {[-1,1].map(side=><mesh key={side} position={[side*.28,1.07,walker?.15:0]} rotation={[walker?-.4:0,0,0]}><boxGeometry args={[.13,.65,.14]}/><meshStandardMaterial color="#486b76"/></mesh>)}
   {walker&&<group position={[0,0,.55]}>{[-.3,.3].flatMap(x=>[-.2,.2].map(z=><mesh key={x+','+z} position={[x,.5,z]}><cylinderGeometry args={[.025,.025,.9,8]}/><meshStandardMaterial color="#8a9eaa"/></mesh>))}<mesh position={[0,.85,.2]}><boxGeometry args={[.65,.05,.05]}/><meshStandardMaterial color="#8a9eaa"/></mesh></group>}
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.12,0]}><ringGeometry args={[.45,.57,24]}/><meshBasicMaterial color="#245c65"/></mesh>
  </group>
 </>;
}
export default function ComparisonWorld({scene,reduced}:{scene:ComparisonScene;reduced:boolean}){
 return <Canvas orthographic dpr={[1,1.25]} camera={{position:[14,32,30],zoom:8,near:.1,far:150}} gl={{antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.setClearColor('#edf2ed');gl.domElement.setAttribute('aria-label',scene.network.label+' 3D route network');}}><World scene={scene} reduced={reduced}/></Canvas>;
}
