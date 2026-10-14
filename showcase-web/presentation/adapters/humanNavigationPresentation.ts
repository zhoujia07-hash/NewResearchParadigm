import {SYNTHETIC_PROFILES,syntheticProfile} from '../../models/human/syntheticProfiles';
import {illustrativeStyleLabel} from '../../models/human/behaviorStyle';
import {humanMotionPose,residentBehaviorStyle} from '../humanMotion';
import {frozen,type Story} from '../../lib/story';
export const PROFILE_VARIABLES=[['senseOfDirection','Sense of Direction'],['spatialAnxiety','Spatial Anxiety'],
  ['spatialMemory','Spatial Memory'],['navigationExperience','Navigation Experience'],['technologyFamiliarity','Technology Familiarity'],['vulnerability','Vulnerability']] as const;
export const qualitative=(value:number)=>value<.4?'Low':value>=.7?'High':'Moderate';
export function presentNavigationProfile(id:string){
  const profile=syntheticProfile(id);
  return {id,traits:PROFILE_VARIABLES.map(([key,label])=>({key,label,value:profile.parameters[key],qualitative:qualitative(profile.parameters[key])}))};
}
export function presentHumanNavigation(story:Story,index:number,reduced=false){
  const profile=SYNTHETIC_PROFILES[index],style=residentBehaviorStyle(story,index),pose=humanMotionPose(story,index,reduced,style);
  const actions=frozen(story)?['Paused by scripted story']:[pose.walking?'Walking':'Pausing',...(Math.abs(pose.looking)>.08?['Scanning']:[])];
  return {...presentNavigationProfile(profile.id),style,styleLabel:illustrativeStyleLabel(style),actions};
}
export type HumanNavigationPresentation=ReturnType<typeof presentHumanNavigation>;
