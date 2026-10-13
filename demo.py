"""Standard-library-only, five-round Human-AI navigation demonstration.

Run: python3 demo.py
The crisis is defined in inject_crisis(); no external services are used.
"""

import asyncio
import json
from dataclasses import dataclass, field
from pathlib import Path

from triage import requires_takeover, triage_score


@dataclass
class Occupant:
    id: str
    age_group: str
    mobility_type: str
    current_location: str
    route: list[str]
    navigation_confidence: float = 0.95
    sensor_agreement: float = 0.94
    model_disagreement: float = 0.06
    behavior_anomaly: float = 0.04
    safety_risk: float = 0.05
    vulnerability: float = 0.20
    backtracks: int = 0
    sensor_evidence: dict[str, str] = field(default_factory=dict)


def create_occupants():
    locations = ["South Lobby", "West Wing", "Library", "Stair Lobby",
                 "North Atrium", "East Corridor", "Junction A", "Junction B"]
    occupants = []
    for index, location in enumerate(locations, 1):
        older = index == 6
        occupants.append(Occupant(
            id=f"R{index:02d}",
            age_group="older adult" if older else "adult",
            mobility_type="walker" if older else "walking",
            current_location=location,
            route=[location, "Junction B", "East Exit"],
            vulnerability=0.90 if older else 0.20,
        ))
    return occupants


def inject_crisis(occupant):
    """Round 3: R06's East Exit is blocked and its map is stale."""
    occupant.current_location = "Junction B"
    occupant.route = ["Junction B", "East Corridor", "East Exit"]
    occupant.navigation_confidence = 0.39
    occupant.sensor_agreement = 0.22
    occupant.model_disagreement = 0.88
    occupant.behavior_anomaly = 0.92
    occupant.safety_risk = 0.96
    occupant.backtracks = 2
    occupant.sensor_evidence = {
        "UWB": "North Atrium", "Camera": "Junction B", "BLE": "East Corridor",
    }


async def observe(occupant, round_number):
    # All eight observation tasks overlap. They collect evidence only;
    # automatic navigation actions wait for the round's triage barrier.
    await asyncio.sleep(0.02)
    if round_number == 3 and occupant.id == "R06":
        inject_crisis(occupant)
    return occupant


async def ask_human():
    print("\nHUMAN-IN-THE-LOOP TAKEOVER\nAutomated batch is PAUSED.")
    print("\nRouteAgent:\nContinue to East Exit\n(shortest route; stale map)")
    print("\nSafetyAgent:\nReroute to West Exit\n(+18 m; clear and accessible)")
    print("\nSensor evidence:\nUWB: North Atrium\nCamera: Junction B\nBLE: East Corridor")
    print("\nResident:\nOlder adult\nWalker\nBacktracked twice")
    print("\nA = Reroute to West Exit\nB = Continue to East Exit"
          "\nC = Stop at refuge point and call staff")
    while True:
        decision = (await asyncio.to_thread(input, "Your judgment: ")).strip().upper()
        if decision in {"A", "B", "C"}:
            break
        print("Please enter A, B, or C.")
    while True:
        value = (await asyncio.to_thread(input, "Confidence (0-100): ")).strip()
        try:
            confidence = int(value)
        except ValueError:
            print("Please enter an integer from 0 to 100.")
            continue
        if 0 <= confidence <= 100:
            return decision, confidence
        print("Please enter an integer from 0 to 100.")


def apply_decision(occupant, decision):
    destinations = {"A": ["Junction B", "West Corridor", "West Exit"],
                    "B": ["Junction B", "East Corridor", "East Exit"],
                    "C": ["Junction B", "Refuge Point"]}
    occupant.route = destinations[decision]
    # A resolves this incident. B retains the hazard; C waits for staff.
    if decision == "A":
        occupant.navigation_confidence = 0.95
        occupant.sensor_agreement = 0.94
        occupant.model_disagreement = 0.06
        occupant.behavior_anomaly = 0.04
        occupant.safety_risk = 0.05


async def main():
    occupants = create_occupants()
    batch_running = asyncio.Event()
    batch_running.set()
    total = automatic = escalations = 0
    decision = confidence = None
    observations_log = []
    print("8 virtual occupants | 5 rounds | AI simulation + human takeover")
    for round_number in range(1, 6):
        print(f"\nROUND {round_number}")
        observations = await asyncio.gather(
            *(observe(occupant, round_number) for occupant in occupants))
        total += len(observations)
        # Inspect the complete concurrent batch before allowing any actions.
        # An acknowledged incident stays under its human decision; it is not
        # presented as a new crisis on each subsequent monitoring round.
        for occupant in observations:
            score = triage_score(occupant)
            trigger = requires_takeover(occupant)
            observations_log.append({
                "round": round_number, "occupant_id": occupant.id,
                "triage_score": round(score, 4), "trigger": trigger,
            })
            if trigger and decision is None:
                batch_running.clear()
                print(f"{occupant.id} TAIL / ESCALATE | triage={score:.4f}")
                escalations += 1
                decision, confidence = await ask_human()
                apply_decision(occupant, decision)
                batch_running.set()
                print(f"R06 route: {' -> '.join(occupant.route)}")
                print("Automated batch is RESUMED.")

        await batch_running.wait()
        for occupant in observations:
            if round_number == 3 and occupant.id == "R06":
                continue
            automatic += 1
            if occupant.id == "R06" and decision is not None and round_number >= 4:
                if decision == "B":
                    occupant.current_location = "East Corridor (East Exit blocked)"
                else:
                    occupant.current_location = occupant.route[min(round_number - 3,
                                                                   len(occupant.route) - 1)]
                label = "TAIL / HUMAN-FOLLOWUP" if decision != "A" else "HEAD / AUTO"
            else:
                label = "HEAD / AUTO"
            print(f"{occupant.id} {label} | {occupant.current_location}"
                  f" | triage={triage_score(occupant):.4f}")

    recommendation = {"A": "Reroute to West Exit",
                      "B": "Continue to East Exit",
                      "C": "Stop at refuge point and call staff"}[decision]
    outcome = {"A": "SAFE: R06 reached the clear, accessible West Exit.",
               "B": "UNSAFE: R06 remains at the blocked East Exit approach.",
               "C": "PENDING: R06 is at the refuge point; staff assistance requested; evacuation unconfirmed."}[decision]
    report = {
        "total_observations": total,
        "automatically_handled_observations": automatic,
        "human_escalations": escalations,
        "automation_coverage_percent": round(100 * automatic / total, 2),
        "human_decision": decision,
        "human_confidence": confidence,
        "ai_only_recommendation": "Continue to East Exit (shortest route; stale map)",
        "hybrid_recommendation": recommendation,
        "human_intervention_corrected_ai_only_failure": decision == "A",
        "final_safety_outcome": outcome,
        "r06_final_route": occupants[5].route,
        "observations": observations_log,
    }
    report_path = Path(__file__).resolve().with_name("hybrid_demo_report.json")
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                           encoding="utf-8")
    print("\nHUMAN-AI COLLABORATION REPORT")
    for key, value in report.items():
        if key not in {"observations", "r06_final_route"}:
            print(f"{key.replace('_', ' ')}: {value}")
    print(f"Report saved: {report_path.name}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (EOFError, KeyboardInterrupt):
        raise SystemExit("Simulation interrupted: human input is required to complete the report.")
