"""Current Concordia 2.4 entity lifecycle, bounded proposals, deterministic guard.

No API/network operation occurs on import. Optional Concordia is lazy-loaded.
Mock mode is explicitly synthetic and does not validate agent behavioral realism.
"""
from dataclasses import asdict, replace
import json
import math
import os
import urllib.request
import urllib.parse

from synthetic_cases import factors_from_case
from triage import assess

ROLES=('GameMaster','ResidentAgent','RouteAgent','SafetyAgent','AccessibilityAgent')
ADVISORS=ROLES[2:]
ROUTES=('East Exit','West Exit','Refuge Point')
FIELDS={'intended_action','route_choice','confidence','reason','uncertainty'}
TOPOLOGY=[['Entrance','Junction A'],['Entrance','Junction B'],['Junction A','North Atrium'],
          ['Junction B','North Atrium'],['Junction B','East Corridor'],['East Corridor','East Exit'],
          ['Junction A','West Corridor'],['West Corridor','West Exit'],['Junction B','Refuge Point']]


def validate_proposal(raw):
    if isinstance(raw,str):
        raw=raw.strip()
        if raw.startswith('```') and raw.endswith('```'):
            raw='\n'.join(raw.splitlines()[1:-1])
        raw=json.loads(raw)
    if not isinstance(raw,dict) or set(raw)!=FIELDS:
        raise ValueError('A proposal must contain exactly five supported fields.')
    if raw['route_choice'] not in ROUTES or raw['intended_action'] not in ('navigate','wait','request_staff','describe_environment'):
        raise ValueError('Unsupported route/action.')
    if not isinstance(raw['reason'],str) or not raw['reason'].strip() or len(raw['reason'])>2000:
        raise ValueError('A bounded reason is required.')
    output=dict(raw)
    for key in ('confidence','uncertainty'):
        value=raw[key]
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value):
            raise ValueError('Finite numeric confidence/uncertainty required.')
        output[key]=max(0.0,min(1.0,float(value)))
    return output


def disagreement(recommendations):
    choices=[recommendations[r]['route_choice'] for r in ADVISORS]
    return sum(choices[i]!=choices[j] for i in range(3) for j in range(i+1,3))/3


class EnvironmentController:
    def __init__(self,scenario):
        self.scenario=scenario
    def context(self):
        return {'topology':TOPOLOGY,'blocked_path':self.scenario.get('blocked_path',False),
                'east_exit_blocked':self.scenario['exit_blocked'],
                'emergency':self.scenario['emergency'],'west_exit':'clear and accessible',
                'refuge_point':'available'}
    def admissible(self,route):
        return route in ROUTES and not (route=='East Exit' and (self.scenario['exit_blocked'] or self.scenario.get('blocked_path',False)))


def mock_proposal(role,scenario):
    blocked=scenario['exit_blocked'] or scenario.get('blocked_path',False)
    route='East Exit'
    reason='Clear shortest route in a synthetic scenario.'
    if role=='RouteAgent' and blocked:
        reason='Shortest route using a deliberately stale map.'
    elif blocked:
        route='Refuge Point' if role=='AccessibilityAgent' and scenario['mobility'] in ('walker','wheelchair') else 'West Exit'
        reason='Blocked East approach; prefer a clear accessible exit or staff assistance.'
    if role=='ResidentAgent':
        reason=f"Synthetic resident: {scenario['age_group']}, {scenario['mobility']}, familiarity {scenario['familiarity']:.2f}, direction {scenario['sense_of_direction']:.2f}, vulnerability {scenario['vulnerability']:.2f}."
    return dict(intended_action='describe_environment' if role=='GameMaster' else 'navigate',
                route_choice=route,confidence=scenario['navigation_confidence'] if role=='ResidentAgent' else .90,
                reason=reason,uncertainty=1-scenario['navigation_confidence'] if role=='ResidentAgent' else .10)


def provider_sample(prompt):
    key=os.environ.get('LLM_API_KEY')
    model=os.environ.get('LLM_MODEL')
    base=os.environ.get('LLM_API_BASE','https://api.openai.com/v1')
    parsed=urllib.parse.urlsplit(base)
    if not key or not model or parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError('Real mode needs secure provider settings.')
    request=urllib.request.Request(base.rstrip('/')+'/chat/completions',method='POST',
        headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        data=json.dumps({'model':model,'messages':[{'role':'user','content':prompt}],
                         'temperature':0,'response_format':{'type':'json_object'}}).encode())
    with urllib.request.urlopen(request,timeout=30) as response:
        return json.load(response)['choices'][0]['message']['content']


def concordia_act(role,context,sample):
    from concordia.agents.entity_agent import EntityAgent
    from concordia.components.agent.constant import Constant
    from concordia.typing.entity_component import ActingComponent
    from concordia.typing.entity import free_action_spec
    class ProposalComponent(ActingComponent):
        def get_action_attempt(self,contexts,action_spec):
            return sample('\n'.join(contexts.values())+'\n'+action_spec.call_to_action)
        def get_state(self): return {}
        def set_state(self,state): pass
    entity=EntityAgent(agent_name=role,act_component=ProposalComponent(),
                       context_components={'Situation':Constant(context)})
    entity.observe(context)
    return entity.act(free_action_spec(call_to_action='Return only the requested JSON proposal.'))


def run_agents(scenario,mode=None,sampler=None,use_concordia=True):
    mode=mode or os.environ.get('LLM_MODE','mock')
    if mode not in ('mock','real'):
        raise ValueError('LLM_MODE must be mock or real.')
    effective_mode=mode
    notice=''
    if mode=='real' and sampler is None and not (os.environ.get('LLM_API_KEY') and os.environ.get('LLM_MODEL')):
        effective_mode='mock';notice='Real credentials/model absent; explicitly using mock.'
    environment=EnvironmentController(scenario)
    recommendations={};failures=[];backend='Concordia EntityAgent'
    for role in ROLES:
        prompt=json.dumps({'role':role,'resident_and_scenario':scenario,'environment':environment.context(),
                           'output_schema':dict(intended_action='navigate | wait | request_staff | describe_environment',
                                                route_choice='East Exit | West Exit | Refuge Point',confidence='number 0–1',
                                                reason='bounded explanation',uncertainty='number 0–1')},sort_keys=True)
        sample=(sampler if sampler else provider_sample if effective_mode=='real' else
                lambda text,role=role:json.dumps(mock_proposal(role,scenario)))
        try:
            if use_concordia:
                try:
                    raw=concordia_act(role,prompt,sample)
                except ImportError:
                    backend='Python mock adapter (optional Concordia unavailable)'
                    if effective_mode=='real': raise RuntimeError('Concordia required for real mode')
                    raw=sample(prompt)
            else:
                backend='Python adapter';raw=sample(prompt)
            recommendations[role]=validate_proposal(raw)
        except Exception as exc:
            # Do not echo provider payloads, prompts or credentials into logs.
            failures.append(role+': '+type(exc).__name__)
            recommendations[role]=validate_proposal(mock_proposal(role,scenario))
    measured=disagreement(recommendations)
    factors=factors_from_case(scenario)
    # One failed role makes the entire triage input fall back to the baseline.
    # Generated prose cannot overwrite hazard, sensor or vulnerability factors.
    inputs=factors if failures else replace(factors,model_disagreement=measured)
    a=assess(inputs)
    return dict(mode=effective_mode,backend=backend,notice=notice,recommendations=recommendations,
                disagreement=measured,triage_inputs=asdict(inputs),triage_score=a.score,state=a.state,
                fallback=bool(failures),failures=failures,environment=environment.context(),
                admissible={r:environment.admissible(p['route_choice']) for r,p in recommendations.items()})
