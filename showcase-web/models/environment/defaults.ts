import {unknownValue} from '../shared';
import type {EnvironmentState,PhysicalContext} from './types';
/** Does not derive complexity, salience, accessibility or hazard from geometry. */
export function unspecifiedEnvironment(id:string,setting:PhysicalContext['setting']='unspecified',venue='Unspecified'):EnvironmentState {
  return {id,physical:{kind:'physical',setting,venue,familiarity:unknownValue()},
    spatial:{kind:'spatial',coordinateSystem:'unspecified',nodes:[],edges:[],globalComplexity:unknownValue(),
      localDynamicComplexity:unknownValue(),turnCount:unknownValue(),turnAngles:unknownValue(),branching:unknownValue(),
      connectivity:unknownValue(),visibility:unknownValue(),routeLength:unknownValue(),accessibilityConstraints:[]},
    information:{kind:'information',signage:unknownValue(),wayfindingSystem:unknownValue(),landmarkSalience:unknownValue(),
      landmarkDistinctiveness:unknownValue(),featureSimilarity:unknownValue(),visualSalience:unknownValue(),
      visualClutter:unknownValue(),informationDensity:unknownValue()},
    situational:{kind:'situational',timePressure:unknownValue(),emergency:unknownValue(),crowdDensity:unknownValue(),
      noise:unknownValue(),lighting:unknownValue(),weather:unknownValue(),blockages:[],hazards:[]},extensions:{}};
}
