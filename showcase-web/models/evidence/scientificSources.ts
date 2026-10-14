import type {ScientificSource,EvidenceClass} from './types';
const verification={metadata:'project-owner-supplied',content:'not-independently-accessed',checkedOn:'2026-10-14',
  note:'Nature, DOI.org and Crossref requests returned proxy 403. Bibliography and scope are supplied by the project owner; no abstract/full text independently verified in this task.'} as const;
function source(id:string,authors:string,title:string,journal:string,year:number,volume:string,pages:string,doi:string|undefined,
  evidenceClass:EvidenceClass,suppliedScope:readonly string[]):ScientificSource {
  return {id,authors,title,journal,year,volume,pages,...(doi?{doi,url:`https://doi.org/${doi}`} : {}),evidenceClass,verification,suppliedScope};
}
/** Static supplied bibliography, not a claim of independent content verification. */
export const SCIENTIFIC_SOURCES:readonly ScientificSource[]=[
  source('yavuz-spiers-2026','Yavuz, E. & Spiers, H. J.','Determinants of individual navigation ability.','Nature Reviews Psychology',2026,'5','273–289','10.1038/s44159-026-00544-3','nature-review',
    ['lifetime determinants','physical/cultural/social exposure','ageing','sleep','exercise','current environments','technology use','personal attributes']),
  source('mou-2025','Mou, W.','Representing place locations and orientations in cognitive maps.','Nature Reviews Psychology',2025,'4','347–360','10.1038/s44159-025-00442-0','nature-review',
    ['place/route/survey knowledge','cognitive maps','path integration','path complexity']),
  source('becu-2020','Bécu, M. et al.','Age-related preference for geometric spatial cues during real-world navigation.','Nature Human Behaviour',2020,'4','88–99','10.1038/s41562-019-0718-z','nature-primary',
    ['age differences','geometry versus landmark preference','reorientation','body/gaze dynamics','exploration/scanning']),
  source('bellmund-2020','Bellmund, J. L. S. et al.','Deforming the metric of cognitive maps distorts memory.','Nature Human Behaviour',2020,'4','177–188','10.1038/s41562-019-0767-3','nature-primary',
    ['boundary geometry','regular/distorted geometry','local regions','spatial memory outcomes','human–environment coupling']),
  source('seeber-2025','Seeber, M. et al.','Human neural dynamics of real-world and imagined navigation.','Nature Human Behaviour',2025,'9','781–793','10.1038/s41562-025-02119-3','nature-primary',
    ['real/imagined navigation','route segments/turn events','walking speed','body/head movement','gaze','temporal structure']),
  source('coutrot-2022','Coutrot, A. et al.','Entropy of city street networks linked to future spatial navigation ability.','Nature',2022,'604','104–110','10.1038/s41586-022-04486-7','nature-primary',
    ['childhood exposure','urban/rural upbringing','street-network entropy/topology','long-term association','learned/tested topology matching']),
  source('iggena-2026','Iggena, D. et al.','Long-term memory reorganization of navigational episodes.','Nature Human Behaviour',2026,'10','1327–1339','10.1038/s41562-026-02472-x','nature-primary',
    ['navigation history','long-term memory dynamics','episode-dependent representation','schematic spatial knowledge']),
  source('masis-obando-2026','Masís-Obando, R., Norman, K. A. & Baldassano, C.',
    'Spatial contexts with reliable neural representations support reinstatement of subsequently placed objects.','Nature Human Behaviour',2026,'10','164–181',undefined,'nature-primary',
    ['spatial context reliability','context distinctiveness','context as memory scaffold; not a visual-salience metric']),
];
