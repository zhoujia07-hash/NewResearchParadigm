/** Complementary resolutions inside HUMAN, never a hierarchy of scientific validity. */
export const HUMAN_ANALYSIS_LEVELS=['macro-behavior','meso-psychometric-cognitive','micro-neural-computational'] as const;
export type HumanAnalysisLevel=typeof HUMAN_ANALYSIS_LEVELS[number];
export function validateHumanAnalysisLevels(levels:readonly HumanAnalysisLevel[]|undefined):void {
  if(levels===undefined)return; // Missing means undeclared, never all levels.
  if(!levels.length||new Set(levels).size!==levels.length||levels.some(level=>!HUMAN_ANALYSIS_LEVELS.includes(level)))
    throw new Error('Invalid Human analysis levels');
}
