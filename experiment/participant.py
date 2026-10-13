import math,time
from dataclasses import dataclass,field

from experiment.study_builder import CONDITIONS

DATA_SOURCES=['prototype_pilot','synthetic_pilot','automated_browser_pilot']


@dataclass
class StudySession:
    protocol:dict
    session_id:str
    participant_id:str
    data_source:str='prototype_pilot'
    index:int=0
    stage:str='consent'
    started:float|None=None
    records:list=field(default_factory=list)

    @property
    def finished(self):return self.index>=len(self.protocol['trials'])
    @property
    def trial(self):return self.protocol['trials'][self.index]
    @property
    def needs_human(self):
        return self.trial['condition']==CONDITIONS[1] or (
            self.trial['condition']==CONDITIONS[2] and self.trial['escalated'])
    def begin_trial(self,now=None):
        if self.stage!='trials' or self.finished:raise ValueError('No active trial.')
        if self.started is None:self.started=time.perf_counter() if now is None else now
    def submit(self,store,choice=None,confidence=None,post_measures=None,now=None,expected_index=None):
        if self.stage!='trials' or self.finished or self.started is None:
            raise ValueError('Trial is not active.')
        if expected_index is not None and expected_index!=self.index:raise ValueError('Stale submission.')
        if self.data_source not in DATA_SOURCES:raise ValueError('Invalid data source.')
        t=self.trial
        rt=None
        if self.needs_human:
            if choice not in ('A','B','C') or type(confidence) is not int or not 0<=confidence<=100:
                raise ValueError('Choose a route and confidence 0–100.')
            rt=(time.perf_counter() if now is None else now)-self.started
            if not math.isfinite(rt) or rt<0:raise ValueError('Invalid reaction time.')
            final=choice
        else:
            choice=confidence=None;final=t['AI_recommendation']
        measures=post_measures or {}
        if set(measures)-set(self.protocol['measures']) or any(type(v) is not int or not 0<=v<=100 for v in measures.values()):
            raise ValueError('Invalid post-trial measures.')
        record=dict(participant_id=self.participant_id,session_id=self.session_id,data_source=self.data_source,
                    condition=t['condition'],case_id=t['case_id'],condition_id=t['condition_id'],trial_number=t['trial_number'],
                    AI_recommendation=t['AI_recommendation'],AI_confidence=t['AI_confidence'],
                    human_choice=choice,human_confidence=confidence,reaction_time=rt,final_choice=final,
                    ground_truth=t['ground_truth'],correct=final==t['ground_truth'],
                    accepted_AI=(choice==t['AI_recommendation'] if choice is not None and t['condition']==CONDITIONS[2] else None),
                    triage_score=t['triage_score'],explanation_condition=t['explanation_condition'],
                    random_seed=self.protocol['seed'],long_tail_category=t['long_tail_category'],
                    synthetic_critical=t['synthetic_critical'],human_intervention=self.needs_human,
                    post_measures=measures)
        store.append(self.session_id,record)
        self.records.append(record);self.index+=1;self.started=None
        if self.finished:self.stage='complete'
        return record
