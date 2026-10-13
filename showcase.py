"""Session-local guided story. Scientific rules/observations remain in the core.

The narrative clock runs for 55 seconds, excluding viewer judgment and manual
pauses. An ordinary response makes this approximately a 60-second experience.
There is no filesystem, database, provider or participant-data operation here.
"""
from dataclasses import dataclass,field,replace
import math
import time

from triage import Factors,assess
from web_simulation import Simulation

NORMAL_END=12.0
EMERGING_END=25.0
CRISIS_END=35.0
RECOVERY_END=45.0
RESULT_END=55.0
STAGES=['idle','normal','emerging','crisis','human','recovery','result']


@dataclass
class ShowcaseStory:
    simulation:Simulation=field(default_factory=Simulation)
    stage:str='idle'
    elapsed:float=0.0
    last_wall:float|None=None
    manual_paused:bool=False
    complete:bool=False
    choice:str|None=None

    def reset(self):
        self.simulation=Simulation();self.stage='idle';self.elapsed=0.0
        self.last_wall=None;self.manual_paused=False;self.complete=False;self.choice=None

    def start(self,now=None):
        self.reset();self.stage='normal';self.last_wall=time.perf_counter() if now is None else now
        self.simulation.advance()

    def _through_round(self,number):
        while self.simulation.round<number:
            if not self.simulation.advance():break

    def tick(self,now=None):
        now=time.perf_counter() if now is None else now
        if not math.isfinite(now):raise ValueError('Finite monotonic clock required.')
        if self.last_wall is None:self.last_wall=now
        delta=max(0.0,now-self.last_wall);self.last_wall=now
        if self.stage=='idle' or self.stage=='human' or self.manual_paused or self.complete:return
        self.elapsed+=delta
        if self.simulation.decision is None:
            # Even an arbitrarily delayed render can never skip the human gate.
            self.elapsed=min(self.elapsed,CRISIS_END)
            if self.elapsed>=6:self._through_round(2)
            if self.elapsed>=EMERGING_END:self._through_round(3)
            self.stage=('human' if self.elapsed>=CRISIS_END else 'crisis' if self.elapsed>=EMERGING_END
                        else 'emerging' if self.elapsed>=NORMAL_END else 'normal')
        else:
            if self.elapsed>=40:self._through_round(4)
            if self.elapsed>=RECOVERY_END:self._through_round(5)
            self.stage='result' if self.elapsed>=RECOVERY_END else 'recovery'
            self.elapsed=min(self.elapsed,RESULT_END)
            self.complete=self.elapsed>=RESULT_END

    def pause(self,now=None):
        self.tick(now);self.manual_paused=True
    def resume(self,now=None):
        self.manual_paused=False;self.last_wall=time.perf_counter() if now is None else now
    def skip_to_takeover(self,now=None):
        self.start(now);self._through_round(3)
        self.elapsed=CRISIS_END;self.stage='human'
    def submit(self,choice,confidence,now=None):
        if self.stage!='human':raise ValueError('Human judgment is not yet requested.')
        self.simulation.submit(choice,confidence)
        self.choice=choice;self.stage='recovery';self.manual_paused=False
        self.last_wall=time.perf_counter() if now is None else now

    @property
    def frozen(self):return self.stage in ('idle','crisis','human','result') or self.manual_paused
    @property
    def factors(self):
        o=self.simulation.occupants[5]
        base=Factors(**{k:getattr(o,k) for k in Factors.__dataclass_fields__})
        if self.stage=='emerging':
            progress=max(0,min(1,(self.elapsed-NORMAL_END)/(EMERGING_END-NORMAL_END)))
            frames=[(.88,.90,.10,.12,.14),(.72,.68,.30,.38,.25),(.55,.45,.58,.61,.35)]
            segment=min(int(progress*2),1);fraction=min(1,progress*2-segment)
            values=[a+(b-a)*fraction for a,b in zip(frames[segment],frames[segment+1])]
            return replace(base,navigation_confidence=values[0],sensor_agreement=values[1],
                           model_disagreement=values[2],behavior_anomaly=values[3],safety_risk=values[4])
        return base
    @property
    def assessment(self):return assess(self.factors)
    def report(self):return self.simulation.report()
