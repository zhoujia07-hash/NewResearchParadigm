'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Vector3} from 'three';
import {avatarPose} from '@/lib/navigationModel';
import type {SceneProps} from '@/types/environment';
export default function CameraController({story,selected,reduced,compact,cameraMode}:SceneProps){
 const target=useRef(new Vector3());
 useFrame(({camera},delta)=>{
  const pose=avatarPose(story,selected,reduced),p=pose.position;
  const overview=compact?new Vector3(25,39,40):new Vector3(29,34,37);
  const desired=cameraMode==='overview'?overview:new Vector3(p[0]+5.5,5.8,p[2]+8.2);
  const focus=cameraMode==='overview'?new Vector3(0,0,2.5):new Vector3(p[0],1,p[2]);
  // Reduced motion uses an immediate user-requested view change, then a fixed
  // wider view; no automatic continuous follow-camera movement.
  if(reduced&&cameraMode==='follow'){
   desired.set(20,25,30);focus.set(8,0,0);
  }
  const blend=reduced?1:1-Math.exp(-delta*4);
  camera.position.lerp(desired,blend);target.current.lerp(focus,blend);camera.lookAt(target.current);
  const canvas=(camera.userData.canvas as HTMLCanvasElement|undefined);
  if(canvas)canvas.dataset.cameraPosition=camera.position.toArray().map(v=>v.toFixed(3)).join(',');
 });return null;
}
