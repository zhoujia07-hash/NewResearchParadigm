import {useMemo,useEffect} from 'react';
import {CanvasTexture,SRGBColorSpace} from 'three';
import type {Vec3} from './visualTimeline';
export default function Label({text,at,width=3,color='#254650',fixed=false}:{text:string;at:Vec3;width?:number;color?:string;fixed?:boolean}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=fixed?256:100;
 const g=c.getContext('2d')!;g.fillStyle='#fffffff2';g.beginPath();g.roundRect(0,0,c.width,c.height,18);g.fill();
 g.fillStyle=color;g.font=`600 ${fixed?225:Math.min(80,470/(text.length*.58))}px Arial`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,c.height/2,488);
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;},[text,color,fixed]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <sprite position={at} scale={fixed?[.048,.024,1]:[width,width*100/512,1]}><spriteMaterial map={texture} sizeAttenuation={!fixed} toneMapped={false} transparent depthTest={!fixed} depthWrite={false}/></sprite>;
}
