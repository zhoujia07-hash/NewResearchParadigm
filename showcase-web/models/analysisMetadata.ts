import {validateHumanAnalysisLevels,type HumanAnalysisLevel} from './human/analysisLevels';
export const MODEL_DOMAINS=['human','environment','machine','coupling'] as const;
export type ModelDomain=typeof MODEL_DOMAINS[number];
export const MODEL_ANALYSIS_LEVELS=['behavioral','psychometric-cognitive','neural-computational',
  'environmental-global','environmental-local','environmental-immediate',
  'machine-sensing','machine-estimation','machine-policy','machine-intervention'] as const;
export type ModelAnalysisLevel=typeof MODEL_ANALYSIS_LEVELS[number];
export interface ModelAnalysisMetadata {
  readonly domain:ModelDomain;
  readonly analysisLevels:readonly ModelAnalysisLevel[];
  readonly humanAnalysisLevels?:readonly HumanAnalysisLevel[];
}
const humanMapping:Readonly<Record<HumanAnalysisLevel,ModelAnalysisLevel>>={
  'macro-behavior':'behavioral','meso-psychometric-cognitive':'psychometric-cognitive','micro-neural-computational':'neural-computational',
};
/** Organization only: no module selection, execution, causal inference or evidence promotion. */
export function validateModelAnalysis(metadata:ModelAnalysisMetadata|undefined,layer:string):void {
  if(!metadata)return;
  const {domain,analysisLevels,humanAnalysisLevels}=metadata;
  if(!MODEL_DOMAINS.includes(domain)||(domain!=='coupling'&&domain!==(layer==='estimator'?'machine':layer)))
    throw new Error('Model scientific domain does not match runtime layer');
  if(!analysisLevels.length||new Set(analysisLevels).size!==analysisLevels.length||analysisLevels.some(l=>!MODEL_ANALYSIS_LEVELS.includes(l)))
    throw new Error('Invalid model analysis levels');
  const allowed=(l:ModelAnalysisLevel)=>domain==='coupling'||(domain==='human'?Object.values(humanMapping).includes(l):l.startsWith(domain==='environment'?'environmental-':'machine-'));
  if(analysisLevels.some(l=>!allowed(l)))throw new Error('Analysis level does not match scientific domain');
  validateHumanAnalysisLevels(humanAnalysisLevels);
  if(humanAnalysisLevels?.some(l=>!analysisLevels.includes(humanMapping[l])))throw new Error('Inconsistent Human analysis level declaration');
}
