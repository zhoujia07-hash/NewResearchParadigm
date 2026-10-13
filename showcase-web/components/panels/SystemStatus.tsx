import { blocked,type Story } from '@/lib/story';
export default function SystemStatus({story}:{story:Story}){
 const isBlocked=blocked(story);return <div className="metrics"><div><span>Virtual occupants</span><strong>8 <small>persistent individuals</small></strong></div><div><span>AI automation</span><strong>{story.stage==='idle'?'READY':story.stage==='result'?'COMPLETE':story.paused||isBlocked&&!story.choice?'PAUSED':'ACTIVE'} <small>{isBlocked&&!story.choice?'TAIL / HUMAN REQUIRED':story.choice?'human decision applied':'HEAD / AUTO'}</small></strong></div><div><span>Human escalations</span><strong>{story.escalations} <small>{story.escalations?'one long-tail incident':'ordinary cases'}</small></strong></div></div>;
}
