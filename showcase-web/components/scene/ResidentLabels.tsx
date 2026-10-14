'use client';
import {useFrame} from '@react-three/fiber';
import {Vector3,type Group} from 'three';
/** Keep screen-sized ID badges readable when scripted paths meet.
 * Only label height changes; resident positions and Story are untouched.
 */
export default function ResidentLabels(){
 useFrame(({scene,camera,size})=>{
  const residents:Group[]=[];
  scene.traverse(o=>{if(o.userData.residentId)residents.push(o as Group);});
  residents.sort((a,b)=>a.userData.residentId==='R06'?-1:b.userData.residentId==='R06'?1:a.name.localeCompare(b.name));
  const occupied:{x:number;y:number}[]=[];
  for(const resident of residents){
   const label=resident.getObjectByName('resident-id');if(!label)continue;
   const base=resident.userData.residentId==='R06'?3.35:2.15;
   for(let attempt=0;attempt<14;attempt++){
    label.position.y=base+attempt*.9;
    const p=new Vector3(resident.position.x,resident.position.y+label.position.y,resident.position.z).project(camera);
    const x=(p.x+1)*size.width/2,y=(1-p.y)*size.height/2;
    if(!occupied.some(other=>Math.abs(x-other.x)<38&&Math.abs(y-other.y)<22)||attempt===13){
     occupied.push({x,y});break;
    }
   }
  }
 });return null;
}
