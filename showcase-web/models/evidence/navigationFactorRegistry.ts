import {validateHumanAnalysisLevels} from '../human/analysisLevels';
import {EVIDENCE_CLASSES,FACTOR_LAYERS,OBSERVABILITIES,type ScientificSource,type NavigationFactorDefinition} from './types';
import {TEMPORAL_SCALES,SPATIAL_SCALES} from '../navigation/scales';
import {NAVIGATION_TASKS} from '../navigation/task';
import {SCIENTIFIC_SOURCES} from './scientificSources';
import {NAVIGATION_FACTORS} from './navigationEvidence';
const IMPLEMENTATIONS=['interface-only','synthetic','empirical','legacy'];
const STATUSES=['source-linked-concept','direct-source-support','project-empirical','framework-placeholder','synthetic','unknown'];
const MOBILITIES=['walking','driving','cycling','wheelchair','public-transit','imagined-navigation','stationary-route-planning','other'];
const inSet=(v:unknown,list:readonly unknown[])=>list.includes(v);
const nonblank=(s:unknown)=>typeof s==='string'&&s.trim().length>0;
function canonicalize(value:unknown):unknown {
  if(Array.isArray(value))return value.map(canonicalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonicalize(v)]));
  return value;
}
function freeze<T>(value:T):T {
  if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))if(!Object.isFrozen(child))freeze(child);}
  return value;
}
export function validateScientificSource(s:ScientificSource):void {
  validateHumanAnalysisLevels(s.humanAnalysisLevels);
  if(!nonblank(s.id)||!nonblank(s.title)||!nonblank(s.authors)||!nonblank(s.journal)||!Number.isInteger(s.year)||s.year<1600||s.year>2200)
    throw new Error('Invalid source bibliographic metadata');
  if(!inSet(s.evidenceClass,EVIDENCE_CLASSES))throw new Error('Invalid evidence class');
  if(s.doi&&!/^10\.\d{4,9}\/[^\s]+$/i.test(s.doi))throw new Error('Invalid DOI format');
  if(!inSet(s.verification.metadata,['project-owner-supplied','publisher-verified','crossref-verified'])||
    !inSet(s.verification.content,['not-independently-accessed','abstract-reviewed','full-text-reviewed'])||
    !/^\d{4}-\d{2}-\d{2}$/.test(s.verification.checkedOn)||!nonblank(s.verification.note))throw new Error('Invalid verification metadata');
}
/** Metadata validation is not paper verification or a test of causal validity. */
export class NavigationFactorRegistry {
  private readonly sources=new Map<string,ScientificSource>();
  private readonly factors=new Map<string,NavigationFactorDefinition>();
  constructor(sources:readonly ScientificSource[]=[]){
    for(const source of sources){validateScientificSource(source);if(this.sources.has(source.id))throw new Error('Duplicate source ID');
      this.sources.set(source.id,freeze(structuredClone(source)));}
  }
  register(factor:NavigationFactorDefinition):void {
    validateHumanAnalysisLevels(factor.humanAnalysisLevels);
    if(factor.layer!=='human'&&factor.humanAnalysisLevels)throw new Error('Human levels belong on Human factors');
    if(!/^[a-z][a-z0-9.-]*$/.test(factor.id)||!/^\d+\.\d+\.\d+$/.test(factor.version)||!nonblank(factor.category))throw new Error('Invalid factor ID/version/category');
    if(!factor.id.startsWith(`${factor.layer}.${factor.category}.`))throw new Error('Factor ID must match its layer and category');
    if(!inSet(factor.layer,FACTOR_LAYERS)||!inSet(factor.observability,OBSERVABILITIES)||!inSet(factor.evidenceClass,EVIDENCE_CLASSES)||
      !inSet(factor.evidenceStatus,STATUSES)||!inSet(factor.implementationStatus,IMPLEMENTATIONS))throw new Error('Invalid factor classification');
    if(!factor.temporalScale.length||!factor.spatialScale.length||factor.temporalScale.some(s=>!inSet(s,TEMPORAL_SCALES))||factor.spatialScale.some(s=>!inSet(s,SPATIAL_SCALES)))
      throw new Error('Invalid temporal/spatial scale');
    if(factor.taskApplicability.some(s=>!inSet(s,NAVIGATION_TASKS))||factor.mobilityApplicability.some(s=>!inSet(s,MOBILITIES))||
      !nonblank(factor.applicabilityNote)||!nonblank(factor.claimScope)||factor.causalStatus!=='not-established')throw new Error('Invalid scope/applicability');
    for(const source of factor.sources){
      validateScientificSource(source);const canonical=this.sources.get(source.id);
      if(!canonical||JSON.stringify(canonicalize(canonical))!==JSON.stringify(canonicalize(source)))
        throw new Error('Unknown or inconsistent source reference');
    }
    if((factor.evidenceStatus==='source-linked-concept'||factor.evidenceStatus==='direct-source-support')&&!factor.sources.length)throw new Error('Source support requires sources');
    if(factor.evidenceClass.startsWith('nature-')&&!factor.sources.length)throw new Error('Nature classification requires an explicit source');
    if(factor.evidenceStatus==='direct-source-support'&&factor.sources.some(s=>s.verification.content==='not-independently-accessed'))
      throw new Error('Unaccessed sources cannot be labelled direct verified support');
    if(factor.implementationStatus==='interface-only'&&factor.implementation.kind!=='none')throw new Error('Interface-only factor cannot imply an implemented model');
    if(factor.implementationStatus==='empirical'&&(factor.implementation.kind!=='model'||!factor.sources.length))throw new Error('Empirical implementation requires explicit model/source binding');
    const key=JSON.stringify([factor.id,factor.version]);if(this.factors.has(key))throw new Error('Duplicate factor ID/version');
    this.factors.set(key,freeze(structuredClone(factor)));
  }
  get(id:string,version:string):NavigationFactorDefinition|undefined {return this.factors.get(JSON.stringify([id,version]));}
  list(filter:Partial<Pick<NavigationFactorDefinition,'layer'|'category'|'observability'|'evidenceStatus'>>={}):readonly NavigationFactorDefinition[]{
    return [...this.factors.values()].filter(f=>Object.entries(filter).every(([key,value])=>f[key as keyof typeof filter]===value));
  }
}
export function createNavigationFactorRegistry():NavigationFactorRegistry {
  const registry=new NavigationFactorRegistry(SCIENTIFIC_SOURCES);for(const factor of NAVIGATION_FACTORS)registry.register(factor);return registry;
}
