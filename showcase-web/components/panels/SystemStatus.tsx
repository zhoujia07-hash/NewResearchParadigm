import type {MachinePresentation} from '@/presentation/adapters/machinePresentation';
export default function SystemStatus({presentation:p}:{presentation:MachinePresentation}){
 return <div className="metrics"><div><span>Virtual occupants</span><strong>{p.residentCount} <small>persistent individuals</small></strong></div><div><span>AI automation</span><strong>{p.automation} <small>{p.automationDetail}</small></strong></div><div><span>Human escalations</span><strong>{p.escalations} <small>{p.escalationDetail}</small></strong></div></div>;
}
