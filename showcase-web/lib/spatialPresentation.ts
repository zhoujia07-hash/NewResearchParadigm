/** Approved Modern Hospital art adapter. No independent clock or scientific decisions. */
import {EDGES,NODES,type Place} from './story';
import {toWorld} from './environmentModel';
export const HOSPITAL_LOCATIONS=Object.fromEntries(Object.entries(NODES).map(([name,p])=>[name,toWorld(p)])) as Record<Place,[number,number,number]>;
export const HOSPITAL_CONNECTIONS=EDGES;
export const MODERN_HOSPITAL={floor:'#e8eeea',wall:'#f5f3e9',accent:'#77a8a1',wood:'#bd9a75',room:'#dae6e3'};
