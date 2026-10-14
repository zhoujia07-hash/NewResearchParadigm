import type {InteractionHypothesis,NavigationChallenge} from './navigationResearch';
/** Research questions only. No predicted answers, numerical effects or policies. */
export const NAVIGATION_INTERACTION_QUESTIONS:readonly InteractionHypothesis[]=[
  {kind:'interaction-hypothesis',id:'sod-by-local-complexity',participants:['human','environment'],
    factorIds:['human.navigation-trait.sense-of-direction','environment.local.structural-complexity'],contextFactorIds:[],
    question:'Does the relationship between SoD and navigation depend on local complexity?',factorVersion:'1.0.0',evidenceClass:'framework-hypothesis'},
  {kind:'interaction-hypothesis',id:'sod-by-cue',participants:['human','machine'],
    factorIds:['human.navigation-trait.sense-of-direction','machine.intervention.landmark-cue'],contextFactorIds:[],
    question:'Do users with different SoD show different responses to a cue?',factorVersion:'1.0.0',evidenceClass:'framework-hypothesis'},
  {kind:'interaction-hypothesis',id:'clutter-by-modality',participants:['environment','machine'],
    factorIds:['environment.visual-context.visual-clutter','machine.intervention.vibration'],contextFactorIds:[],
    question:'Does visual clutter moderate the response to vibration?',factorVersion:'1.0.0',evidenceClass:'framework-hypothesis'},
  {kind:'interaction-hypothesis',id:'human-junction-intervention',participants:['human','environment','machine'],
    factorIds:['human.navigation-trait.sense-of-direction','human.state.spatial-anxiety','environment.local.structural-complexity','machine.policy.timing'],
    contextFactorIds:['task.mobility.walking','task.navigation-task.free-wayfinding'],
    question:'For a given person/state at a junction, should an intervention occur, and when?',factorVersion:'1.0.0',evidenceClass:'framework-hypothesis'},
];
export const EXAMPLE_NAVIGATION_CHALLENGE:NavigationChallenge={
  kind:'person-environment-challenge',humanId:'hypothetical-participant',scope:{scale:'local',regionId:'hypothetical-junction'},
  capabilityFactorIds:['human.navigation-trait.sense-of-direction'],stateFactorIds:['human.state.spatial-anxiety'],
  demandFactorIds:['environment.local.structural-complexity'],machineSupportFactorIds:['machine.intervention.landmark-cue'],
  assessment:'unassessed',factorVersion:'1.0.0',evidenceClass:'framework-hypothesis',
};
