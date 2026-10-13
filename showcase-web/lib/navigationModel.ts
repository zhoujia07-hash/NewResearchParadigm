/** Scripted spatial choreography, not a behavioral / lostness model.
 * This module never mutates the V1 story, observations, factors or outcomes.
 */
import { NODES, blocked, frozen, position, type Place, type Story } from './story';
import { toWorld } from './environmentModel';
import type { AvatarPose, Point3 } from '@/types/environment';
// Two explicit reversals, with holds, illustrate the existing 'backtracked twice'.
// Coordinates stay on the Junction B–East Corridor connection.
const R06_KEYFRAMES: readonly (readonly [number,number])[] = [
  [0,650],[3,650],[7,520],[12,620],[14,650],[14.8,650],
  [17,572],[19,636],[20,636],[23,520],[25,520],
];
export function r06Choreography(seconds:number,reduced=false):[number,number] {
  const time=Math.max(0,Math.min(seconds,25));
  for(let i=1;i<R06_KEYFRAMES.length;i++){
    const [end,x]=R06_KEYFRAMES[i], [start,previous]=R06_KEYFRAMES[i-1];
    if(time<=end){const p=reduced?0:(time-start)/(end-start);return [previous+(x-previous)*p,200];}
  }
  return [520,200];
}
function spatialPoint(story:Story,index:number,reduced:boolean):Point3 {
  let p = index===5&&!blocked(story) ? r06Choreography(story.elapsed,reduced) : position(story,index,reduced);
  // Keep a modest, stable walking lane offset so co-located residents are inspectable.
  // R06 stays exactly on the main route. This has no effect on recorded locations.
  p=[p[0],p[1]+(index===5?0:(index%3-1)*12)];
  return toWorld(p);
}
export function avatarPose(story:Story,index:number,reduced=false):AvatarPose {
  const current=spatialPoint(story,index,reduced);
  const moving=!frozen(story);
  const next=spatialPoint({...story,elapsed:Math.min(55,story.elapsed+.05)},index,false);
  const before=spatialPoint({...story,elapsed:Math.max(0,story.elapsed-.05)},index,false);
  const dx=(moving?next[0]:current[0])-before[0],dz=(moving?next[2]:current[2])-before[2];
  const walking=moving&&Math.hypot(next[0]-spatialPoint(story,index,false)[0],next[2]-spatialPoint(story,index,false)[2])>.001;
  return {position:current,heading:Math.atan2(dx,dz),walking,phase:story.elapsed*(index===5?5:8)+index};
}

export function spatialLocation(story:Story,index:number,reduced=false):Place {
 const p=spatialPoint(story,index,reduced);
 return (Object.keys(NODES) as Place[]).reduce((best,n)=>{
  const distance=(name:Place)=>{const q=toWorld(NODES[name]);return (q[0]-p[0])**2+(q[2]-p[2])**2;};
  return distance(n)<distance(best)?n:best;
 },'Entrance');
}
