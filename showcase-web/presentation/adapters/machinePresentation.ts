import {CHOICES,OUTCOMES,residentColor} from '../../lib/story';
import type {LegacyShowcaseSnapshot} from '../../compatibility/legacyStoryAdapter';
export function presentMachine(snapshot:LegacyShowcaseSnapshot){
  const story=snapshot.sourceStory,interaction=snapshot.system.machine.interaction;
  const awaiting=snapshot.system.machine.decision.status==='awaiting-human';
  return {story,interaction,residentCount:snapshot.system.humans.length,escalations:snapshot.ledger.escalations,
    automation:story.stage==='idle'?'READY':story.stage==='result'?'COMPLETE':story.paused||awaiting?'PAUSED':'ACTIVE',
    automationDetail:awaiting?'TAIL / HUMAN REQUIRED':story.choice?'human decision applied':'HEAD / AUTO',
    escalationDetail:snapshot.ledger.escalations?'one long-tail incident':'ordinary cases',
    report:{...snapshot.ledger,coverageLabel:snapshot.ledger.coveragePercent?.toFixed(1)??'0.0',
      choiceLabel:story.choice?CHOICES[story.choice]:null,outcome:story.choice?OUTCOMES[story.choice]:null,
      color:residentColor(story,5)}};
}
export type MachinePresentation=ReturnType<typeof presentMachine>;
