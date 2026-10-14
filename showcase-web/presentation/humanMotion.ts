/** Presentation only. Never advances Story or supplies diagnostic/triage values. */
import {avatarPose,spatialLocation} from '../lib/navigationModel';
import {RESIDENTS,frozen,type Story} from '../lib/story';
import type {BehaviorStyle} from '../models/human/behaviorStyle';
import type {AvatarPose} from '../types/environment';
import {humanBehaviorProvider} from './humanBehaviorProvider';
export function residentBehaviorStyle(story:Story,index:number):BehaviorStyle {
  return humanBehaviorProvider.style(RESIDENTS[index].id,{environmentId:'modern-hospital',stage:story.stage,
    mobility:index===5?{kind:'walking',assistiveDevice:'walker'}:{kind:'walking'}});
}
// Brief within-segment holds: each 3-second presentation interval keeps its endpoints.
// Mean travel time / arrival is scripted, not a human-performance prediction.
export function expressionTime(seconds:number,style:BehaviorStyle):number {
  const cycle=Math.floor(seconds/3),u=seconds/3-cycle;
  const hold=.1*style.pauseTendency+.1*style.hesitationIntensity;
  const p=u<hold?0:(u-hold)/(1-hold);
  const ease=p-(1-style.speedMultiplier)*Math.sin(Math.PI*p)/Math.PI;
  return (cycle+ease)*3;
}
export function humanMotionPose(story:Story,index:number,reduced=false,style=residentBehaviorStyle(story,index)):AvatarPose {
  // R06's entire path, two emerging reversals and A/B/C recovery remain authoritative.
  const expressed=index===5||reduced?story:{...story,elapsed:expressionTime(story.elapsed,style)};
  const pose=avatarPose(expressed,index,reduced);
  if(reduced||frozen(story))return {...pose,looking:0};
  if(index===5&&story.stage!=='normal')return pose;
  const held=index!==5&&Math.abs(expressionTime(story.elapsed+.01,style)-expressionTime(story.elapsed,style))<.00001;
  const scanning=Math.sin(story.elapsed*1.8+index)*(.04+.4*style.scanIntensity);
  return {...pose,walking:pose.walking&&!held,looking:scanning,phase:story.elapsed*(index===5?5:8)*style.speedMultiplier+index};
}
export function humanMotionLocation(story:Story,index:number,reduced=false){
  const style=residentBehaviorStyle(story,index);
  const expressed=index===5||reduced?story:{...story,elapsed:expressionTime(story.elapsed,style)};
  return spatialLocation(expressed,index,reduced);
}
