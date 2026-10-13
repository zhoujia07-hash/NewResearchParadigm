"""Web state and presentation movement; scientific rules come from demo.py."""
import asyncio
from dataclasses import dataclass, field

from demo import Occupant, apply_decision, create_occupants, observe
from triage import requires_takeover, triage_score

CHOICES = {
    'A': 'Reroute to West Exit',
    'B': 'Continue to East Exit',
    'C': 'Stop at Refuge Point and call staff',
}
OUTCOMES = {
    'A': 'SAFE: R06 reached the clear, accessible West Exit.',
    'B': 'UNSAFE: R06 remains at the blocked East Exit approach.',
    'C': 'PENDING: R06 is at the refuge point; staff assistance requested; evacuation unconfirmed.',
}
# Schematic positions illustrate movement, not a new route-planning model.
PATHS = [
    ['Entrance', 'Junction A', 'North Atrium', 'West Corridor', 'West Exit'],
    ['West Corridor', 'Junction A', 'North Atrium', 'West Corridor', 'West Exit'],
    ['North Atrium', 'Junction A', 'Refuge Point', 'Refuge Point', 'Refuge Point'],
    ['Entrance', 'Junction A', 'North Atrium', 'West Corridor', 'West Exit'],
    ['North Atrium', 'Junction B', 'North Atrium', 'West Corridor', 'West Exit'],
    ['East Corridor', 'Junction B', 'Junction B', 'West Corridor', 'West Exit'],
    ['Junction A', 'North Atrium', 'Junction B', 'Refuge Point', 'Refuge Point'],
    ['Junction B', 'North Atrium', 'Junction A', 'West Corridor', 'West Exit'],
]


@dataclass
class Simulation:
    occupants: list[Occupant] = field(default_factory=create_occupants)
    round: int = 0
    paused: bool = False
    total: int = 0
    automatic: int = 0
    escalations: int = 0
    decision: str | None = None
    confidence: int | None = None
    observations: list[dict] = field(default_factory=list)

    @property
    def coverage(self):
        return 100 * self.automatic / self.total if self.total else 0.0

    @property
    def finished(self):
        return self.round == 5 and not self.paused

    async def _observe_batch(self):
        return await asyncio.gather(*(observe(o, self.round) for o in self.occupants))

    def advance(self):
        if self.paused or self.finished:
            return False
        self.round += 1
        for index, occupant in enumerate(self.occupants):
            if occupant.id == 'R06' and self.round >= 4:
                occupant.current_location = (
                    'East Corridor' if self.decision == 'B'
                    else occupant.route[min(self.round - 3, len(occupant.route) - 1)])
            else:
                occupant.current_location = PATHS[index][self.round - 1]
        batch = asyncio.run(self._observe_batch())
        self.total += len(batch)
        for occupant in batch:
            trigger = requires_takeover(occupant)
            self.observations.append({
                'round': self.round, 'occupant_id': occupant.id,
                'triage_score': round(triage_score(occupant), 4), 'trigger': trigger,
            })
            if trigger and self.decision is None:
                self.paused = True
        if self.paused:
            self.escalations += 1
            # The seven ordinary observations await batch resumption, just
            # as in the CLI. Counting them now would hide the pause barrier.
        else:
            self.automatic += len(batch)
        return True

    def submit(self, choice, confidence):
        if not self.paused:
            raise ValueError('No pending takeover.')
        if choice not in CHOICES or type(confidence) is not int or not 0 <= confidence <= 100:
            raise ValueError('Choose A/B/C and an integer confidence from 0 to 100.')
        apply_decision(self.occupants[5], choice)
        self.decision, self.confidence = choice, confidence
        self.automatic += 7
        self.paused = False

    def status(self, occupant):
        if occupant.id == 'R06' and self.round >= 3:
            if self.paused:
                return 'TAIL / ESCALATE'
            if self.decision != 'A':
                return 'TAIL / HUMAN-FOLLOWUP'
        return 'HEAD / AUTO'

    def report(self):
        if not self.finished:
            raise ValueError('The report is available after round 5.')
        return {
            'total_observations': self.total,
            'automatically_handled_observations': self.automatic,
            'human_escalations': self.escalations,
            'automation_coverage_percent': round(self.coverage, 2),
            'human_decision': self.decision,
            'human_confidence': self.confidence,
            'ai_only_recommendation': 'Continue to East Exit (shortest route; stale map)',
            'hybrid_recommendation': CHOICES[self.decision],
            'human_intervention_corrected_ai_only_failure': self.decision == 'A',
            'final_safety_outcome': OUTCOMES[self.decision],
            'r06_final_route': self.occupants[5].route,
            'observations': self.observations,
        }
