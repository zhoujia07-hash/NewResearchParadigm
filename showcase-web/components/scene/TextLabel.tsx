'use client';
import {useEffect,useMemo} from 'react';
import {CanvasTexture,SRGBColorSpace} from 'three';
import type {Point3} from '@/types/environment';
/** All labels are locally generated textures: no downloaded font or asset. */
export default function TextLabel({text,position,width=3,color='#173b43',background='#fffffff0',fixed=false}:{text:string;position:Point3;width?:number;color?:string;background?:string;fixed?:boolean}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=fixed?280:96;
  const ctx=c.getContext('2d')!;ctx.fillStyle=background;ctx.beginPath();ctx.roundRect(0,0,512,c.height,18);ctx.fill();
  ctx.fillStyle=color;ctx.font=`600 ${fixed?230:Math.min(72,Math.floor(470/(text.length*.6)))}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,c.height/2,488);
  const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;},[text,color,background,fixed]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <sprite position={position} scale={fixed?[width*.03,width*.03*280/512,1]:[width,width*96/512,1]}><spriteMaterial map={texture} transparent depthTest={!fixed} depthWrite={false} sizeAttenuation={!fixed} toneMapped={false}/></sprite>;
}
