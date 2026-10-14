import {SCIENTIFIC_SOURCES} from './scientificSources';
import type {NavigationFactorDefinition,FactorLayer,Observability} from './types';
import type {TemporalScale,SpatialScale} from '../navigation/scales';
interface Group {
  layer:FactorLayer;category:string;names:string;observability:Observability;
  temporal:readonly TemporalScale[];spatial:readonly SpatialScale[];
  links?:Readonly<Record<string,readonly string[]>>;legacy?:readonly string[];
}
const Y=['yavuz-spiers-2026'],M=['mou-2025'],B=['becu-2020'],D=['bellmund-2020'],S=['seeber-2025'],C=['coutrot-2022'],I=['iggena-2026'],R=['masis-obando-2026'];
/** Declarative ontology. Source links use the supplied conceptual scope, not a
 * claimed validated predictor, operationalization, effect, or implemented model.
 */
const GROUPS:readonly Group[]=[
  {layer:'human',category:'distal',names:'genetics|ageing|lifetime-physical-exposure|lifetime-cultural-exposure|lifetime-social-exposure|developmental-navigation-exposure|urban-suburban-rural-upbringing|long-term-navigation-experience',
    observability:'historical',temporal:['developmental','years','decades','lifetime'],spatial:['global'],
    links:{genetics:Y,ageing:Y,'lifetime-physical-exposure':Y,'lifetime-cultural-exposure':Y,'lifetime-social-exposure':Y,
      'developmental-navigation-exposure':C,'urban-suburban-rural-upbringing':C,'long-term-navigation-experience':Y}},
  {layer:'human',category:'lifestyle',names:'sleep|exercise|current-environment-exposure|technology-use|navigation-frequency|current-mobility-habits',
    observability:'historical',temporal:['days','months','years'],spatial:['not-applicable'],
    links:{sleep:Y,exercise:Y,'current-environment-exposure':Y,'technology-use':Y}},
  {layer:'human',category:'personal',names:'age-group|physical-capability|mobility-capability|sensory-capability|cognitive-capability|social-attributes|vulnerability',
    observability:'context',temporal:['years','decades'],spatial:['not-applicable'],
    links:{'age-group':[...Y,...B],'physical-capability':Y,'social-attributes':Y},legacy:['age-group','mobility-capability','vulnerability']},
  {layer:'human',category:'navigation-trait',names:'sense-of-direction|spatial-memory-ability|spatial-anxiety-trait|navigation-experience|technology-familiarity',
    observability:'latent',temporal:['days','years'],spatial:['not-applicable']},
  {layer:'human',category:'representation',names:'place-knowledge|route-knowledge|survey-knowledge|egocentric-representation|allocentric-representation|schematic-spatial-knowledge',
    observability:'latent',temporal:['minutes','days','years'],spatial:['global','local'],
    links:{'place-knowledge':M,'route-knowledge':M,'survey-knowledge':M,'schematic-spatial-knowledge':I}},
  {layer:'human',category:'strategy',names:'path-integration|landmark-based|geometry-based|route-based|map-survey|cue-preference',
    observability:'latent',temporal:['seconds','minutes'],spatial:['global','local','immediate'],
    links:{'path-integration':M,'landmark-based':B,'geometry-based':B,'route-based':M,'map-survey':M,'cue-preference':B}},
  {layer:'human',category:'state',names:'navigation-uncertainty|lostness|spatial-anxiety|cognitive-workload|attention|fatigue|confidence|trust|orientation-state',
    observability:'latent',temporal:['seconds','minutes'],spatial:['not-applicable']},
  {layer:'human',category:'behavior',names:'walking|walking-speed|acceleration|deceleration|stopping|pause-duration|hesitation|body-rotation|head-rotation|gaze-scanning|reorientation|turn-execution|wrong-turn|route-deviation|backtracking|detour|path-tortuosity|checking-phone|asking-for-help|route-choice',
    observability:'observed',temporal:['seconds','minutes'],spatial:['local','immediate'],
    links:{walking:S,'walking-speed':S,'body-rotation':[...B,...S],'head-rotation':S,'gaze-scanning':[...B,...S],reorientation:B,'turn-execution':S},legacy:['walking','stopping','gaze-scanning']},
  {layer:'human',category:'outcome',names:'destination-accuracy|pointing-accuracy|route-efficiency|travel-time|path-length|navigation-error|memory-accuracy|cognitive-map-fidelity|safety|intervention-requirement|subjective-experience',
    observability:'observed',temporal:['minutes','days','years'],spatial:['global','local'],links:{'memory-accuracy':[...D,...I,...R]},legacy:['safety','intervention-requirement']},
  {layer:'environment',category:'historical-exposure',names:'childhood-urbanicity|upbringing|historical-street-network|environmental-diversity|cultural-geographical-exposure|learned-tested-topology-similarity',
    observability:'historical',temporal:['developmental','years','decades','lifetime'],spatial:['global'],
    links:{'childhood-urbanicity':C,upbringing:C,'historical-street-network':C,'environmental-diversity':Y,'cultural-geographical-exposure':Y,'learned-tested-topology-similarity':C}},
  {layer:'environment',category:'global',names:'setting|venue|topology|street-network-entropy|structural-complexity|route-complexity|connectivity|network-regularity|visibility|route-length|familiarity',
    observability:'context',temporal:['minutes','years'],spatial:['global'],links:{topology:C,'street-network-entropy':C,'route-complexity':M},legacy:['setting','venue','topology']},
  {layer:'environment',category:'local',names:'upcoming-junction|structural-complexity|branching|available-choices|turn-count|turn-geometry|corridor-geometry|visibility|decision-points|accessibility-constraints|route-segment',
    observability:'context',temporal:['seconds','minutes'],spatial:['local'],links:{'turn-geometry':S,'route-segment':S}},
  {layer:'environment',category:'immediate',names:'visible-sign|visible-landmark|occlusion|blockage|crowd-ahead|illumination|visible-hazard|doorway-boundary|visual-ambiguity',
    observability:'context',temporal:['seconds'],spatial:['immediate'],legacy:['blockage','visible-hazard']},
  {layer:'environment',category:'geometry',names:'boundary-geometry|enclosure-geometry|regular-distorted-geometry|corridor-width|region-breadth|turn-angle|symmetry|irregularity',
    observability:'context',temporal:['seconds','minutes'],spatial:['global','local','immediate'],
    links:{'boundary-geometry':D,'enclosure-geometry':D,'regular-distorted-geometry':D}},
  {layer:'environment',category:'geometric-cue',names:'boundaries|shape|orientation|intersections',
    observability:'context',temporal:['seconds','minutes'],spatial:['local','immediate'],links:{boundaries:D,shape:B,orientation:M}},
  {layer:'environment',category:'landmark-cue',names:'availability|distinctiveness|stability|visibility|salience',
    observability:'context',temporal:['seconds','minutes'],spatial:['local','immediate']},
  {layer:'environment',category:'wayfinding-information',names:'wayfinding-system|signage|maps|directional-arrows|information-density|cue-consistency',
    observability:'context',temporal:['seconds','minutes'],spatial:['global','local','immediate']},
  {layer:'environment',category:'visual-context',names:'feature-similarity|visual-salience|visual-clutter|distinctiveness|visibility',
    observability:'context',temporal:['seconds','minutes'],spatial:['local','immediate']},
  {layer:'environment',category:'memory-context',names:'spatial-context-reliability|context-distinctiveness',
    observability:'context',temporal:['minutes','days'],spatial:['local','immediate'],links:{'spatial-context-reliability':R,'context-distinctiveness':R}},
  {layer:'environment',category:'situation',names:'time-pressure|emergency|crowd-density|noise|lighting|weather|blockage|hazards|task-urgency|destination-importance|instability',
    observability:'context',temporal:['seconds','minutes','hours'],spatial:['global','local','immediate'],legacy:['blockage','hazards']},
  {layer:'machine',category:'exposure',names:'navigation-technology-exposure|navigation-aid-use-frequency|active-passive-engagement|historical-technology-use',
    observability:'historical',temporal:['days','years','decades'],spatial:['not-applicable'],links:{'navigation-technology-exposure':Y,'historical-technology-use':Y}},
  {layer:'machine',category:'platform',names:'smartphone|smartwatch|vehicle-system|ar-glasses|robot|kiosk|ambient-building-system',
    observability:'context',temporal:['minutes','days'],spatial:['not-applicable'],legacy:['ambient-building-system']},
  {layer:'machine',category:'sensing',names:'gps|imu|camera|ble|uwb|gaze|physiological|vehicle-sensors',
    observability:'observed',temporal:['seconds'],spatial:['global','local','immediate'],legacy:['camera','ble','uwb']},
  {layer:'machine',category:'human-estimation',names:'hesitation|backtracking|uncertainty|lostness|anxiety|workload',
    observability:'latent',temporal:['seconds','minutes'],spatial:['not-applicable']},
  {layer:'machine',category:'environment-estimation',names:'local-complexity|blockage|sign-landmark-visibility|crowding|hazard',
    observability:'context',temporal:['seconds','minutes'],spatial:['local','immediate'],legacy:['blockage']},
  {layer:'machine',category:'policy',names:'whether-to-intervene|timing|threshold|modality-selection|intensity|frequency|escalation',
    observability:'context',temporal:['seconds','minutes'],spatial:['not-applicable'],legacy:['whether-to-intervene','threshold','escalation']},
  {layer:'machine',category:'intervention',names:'map|arrow|text|voice|vibration|landmark-cue|ar|dialogue|confirmation|feedback|human-operator',
    observability:'observed',temporal:['seconds','minutes'],spatial:['not-applicable'],legacy:['human-operator']},
  {layer:'machine',category:'adaptation',names:'continue|modify-cue|increase-intervention|decrease-intervention|switch-modality|escalate-human|stop-intervention',
    observability:'context',temporal:['seconds','minutes'],spatial:['not-applicable']},
  {layer:'machine',category:'legacy-diagnostic',names:'navigation-confidence|sensor-agreement|model-disagreement|behavior-anomaly|safety-risk|triage-score',
    observability:'context',temporal:['seconds'],spatial:['not-applicable'],legacy:['navigation-confidence','sensor-agreement','model-disagreement','behavior-anomaly','safety-risk','triage-score']},
  {layer:'task',category:'mobility',names:'walking|driving|cycling|wheelchair|public-transit|imagined-navigation|stationary-route-planning',
    observability:'context',temporal:['seconds','minutes'],spatial:['not-applicable'],links:{'imagined-navigation':S},legacy:['walking']},
  {layer:'task',category:'navigation-task',names:'route-following|free-wayfinding|search|pointing|map-learning|route-learning|return-navigation|imagined-navigation|memory-retrieval',
    observability:'context',temporal:['seconds','minutes','days'],spatial:['not-applicable'],links:{'imagined-navigation':S,'memory-retrieval':I}},
];
const sourceById=new Map(SCIENTIFIC_SOURCES.map(s=>[s.id,s]));
export const NAVIGATION_FACTORS:readonly NavigationFactorDefinition[]=GROUPS.flatMap(group=>group.names.split('|').map(name=>{
  const sources=(group.links?.[name]??[]).map(id=>{const s=sourceById.get(id);if(!s)throw new Error(`Missing source ${id}`);return s;});
  const legacy=group.legacy?.includes(name)??false;
  return {id:`${group.layer}.${group.category}.${name}`,version:'1.0.0',layer:group.layer,category:group.category,
    // Construct classification only; never inherited by its cited sources.
    ...(group.layer==='human'&&group.category==='behavior'?{humanAnalysisLevels:['macro-behavior'] as const}:{}),
    ...(group.layer==='human'&&['navigation-trait','state','representation','strategy'].includes(group.category)?{humanAnalysisLevels:['meso-psychometric-cognitive'] as const}:{}),
    temporalScale:group.temporal,spatialScale:group.spatial,
    observability:group.category==='outcome'&&name==='cognitive-map-fidelity'?'latent':group.observability,
    sources,evidenceClass:sources[0]?.evidenceClass??(legacy?'synthetic':'framework-hypothesis'),
    evidenceStatus:sources.length?'source-linked-concept':legacy?'synthetic':'framework-placeholder',
    implementationStatus:legacy?'legacy':'interface-only',
    implementation:legacy?{kind:'legacy',reference:'V1/V2.1 scripted compatibility only; no literature-derived algorithm',version:'V1',validated:false}:{kind:'none'},
    populationApplicability:[],taskApplicability:[],mobilityApplicability:[],
    applicabilityNote:'Unestablished: empty applicability sets do not mean universal applicability.',
    claimScope:sources.length?'Conceptual link from owner-supplied source scope; independent content verification pending. Exact operationalization not validated.':
      legacy?'Existing script only; no empirical validation.':'Framework placeholder, not a demonstrated navigation predictor.',
    exclusions:['No effect size, coefficient, detector, causal effect or intervention benefit established here.',
      'No automatic cross-population/task/mobility transfer.',
      ...(name==='spatial-context-reliability'?['Neural reliability must not be converted into a visual-salience score.']:[]),
      ...(group.category==='historical-exposure'?['Association is not deterministic causation.']:[])],causalStatus:'not-established'};
}));
/** Audit map for every major pre-refinement field (aliases, not duplicate factors). */
export const LEGACY_FACTOR_BINDINGS:Readonly<Record<string,string>>={
  'human.traits.ageGroup':'human.personal.age-group','human.traits.senseOfDirection':'human.navigation-trait.sense-of-direction',
  'human.traits.spatialMemory':'human.navigation-trait.spatial-memory-ability','human.traits.spatialAnxietyTrait':'human.navigation-trait.spatial-anxiety-trait',
  'human.traits.cognitiveCapability':'human.personal.cognitive-capability','human.traits.mobilityCapability':'human.personal.mobility-capability',
  'human.traits.technologyFamiliarity':'human.navigation-trait.technology-familiarity','human.traits.navigationExperience':'human.navigation-trait.navigation-experience',
  'human.traits.vulnerability':'human.personal.vulnerability',
  ...Object.fromEntries(['lostness','navigationUncertainty','spatialAnxiety','cognitiveWorkload','fatigue','attention','confidence','trust','orientationState'].map(n=>[
    `human.states.${n}`,`human.state.${n.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}`])),
  'environment.physical.setting':'environment.global.setting','environment.physical.venue':'environment.global.venue','environment.physical.familiarity':'environment.global.familiarity',
  'environment.spatial.nodes':'environment.global.topology','environment.spatial.edges':'environment.global.topology',
  'environment.spatial.globalComplexity':'environment.global.structural-complexity','environment.spatial.localDynamicComplexity':'environment.local.structural-complexity',
  'environment.spatial.turnCount':'environment.local.turn-count','environment.spatial.turnAngles':'environment.geometry.turn-angle',
  'environment.spatial.branching':'environment.local.branching','environment.spatial.connectivity':'environment.global.connectivity',
  'environment.spatial.visibility':'environment.global.visibility','environment.spatial.routeLength':'environment.global.route-length',
  'environment.spatial.accessibilityConstraints':'environment.local.accessibility-constraints',
  'environment.information.signage':'environment.wayfinding-information.signage','environment.information.wayfindingSystem':'environment.wayfinding-information.wayfinding-system',
  'environment.information.landmarkSalience':'environment.landmark-cue.salience','environment.information.landmarkDistinctiveness':'environment.landmark-cue.distinctiveness',
  'environment.information.featureSimilarity':'environment.visual-context.feature-similarity','environment.information.visualSalience':'environment.visual-context.visual-salience',
  'environment.information.visualClutter':'environment.visual-context.visual-clutter','environment.information.informationDensity':'environment.wayfinding-information.information-density',
  ...Object.fromEntries(['timePressure','emergency','crowdDensity','noise','lighting','weather','blockages','hazards'].map(n=>[
    `environment.situational.${n}`,`environment.situation.${n==='blockages'?'blockage':n.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}`])),
  'machine.platforms':'machine.platform.ambient-building-system','machine.capabilities':'machine.intervention.human-operator',
  'machine.decision':'machine.policy.whether-to-intervene','machine.interaction':'machine.intervention.human-operator',
  'machine.sensing':'machine.sensing.uwb','machine.detection':'machine.legacy-diagnostic.triage-score',
};
export const LEGACY_DIAGNOSTIC_BINDINGS:Readonly<Record<string,string>>={
  navigationConfidence:'machine.legacy-diagnostic.navigation-confidence',sensorAgreement:'machine.legacy-diagnostic.sensor-agreement',
  modelDisagreement:'machine.legacy-diagnostic.model-disagreement',behaviorAnomaly:'machine.legacy-diagnostic.behavior-anomaly',
  safetyRisk:'machine.legacy-diagnostic.safety-risk',vulnerability:'human.personal.vulnerability',triageScore:'machine.legacy-diagnostic.triage-score',
};
