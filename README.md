# New Research Paradigm

A deterministic research demo of AI throughput with selective human takeover.
The validated command-line baseline is `demo.py`; its scenario, triage score,
thresholds and decision application are imported directly by the Web Demo.
No LLM APIs, API keys, Concordia, Redis or Docker are needed.

## Run the Web Demo

From this repository, create an environment and install the single direct dependency:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
streamlit run app.py
```

In the prepared cloud machine the environment already exists:

```bash
cd /workspace/NewResearchParadigm
source /workspace/.venvs/newresearch/bin/activate
streamlit run app.py
```

Use Streamlit's reported local address in a browser on the same machine.
The cloud chat does not provide a public preview or localhost forwarding.

1. Click **Start automatic simulation** (2-second rounds), or use **Next round**.
2. Observe eight green markers moving on the schematic and the live triage table.
3. Round 3 marks East Exit blocked and R06 red. All advancement pauses.
4. Select A, B or C, set confidence, then click **Submit Human Decision**.
5. Rounds 4–5 resume. A moves R06 through West Corridor to West Exit.
6. Read the final comparison and download `hybrid_web_report.json`.
7. **Reset simulation** begins a new independent session.

A yields safe evacuation; B retains the blocked-exit hazard; C waits at refuge
with staff assistance requested and evacuation unconfirmed. These are scripted
outcomes, not empirical evidence of comparative performance. Human-alone
performance requires empirical testing.

The seven normal round-3 observations wait behind the pause barrier. After
submission they are counted as automatically processed. The final counts match
the CLI: 40 observations, 39 automatic, one escalation, 97.5% coverage.
Follow-up observations under B/C use the previously submitted human instruction
rather than opening a duplicate escalation for the same incident, as in the CLI.

## Validation

```bash
python -m unittest -v test_web.py
```

Streamlit AppTest checks real widgets, A/B/C outcomes, pause guards, automatic
progression render ticks, confidence, reset and final reports. The state engine
uses asyncio to collect eight concurrent observations per round. The SVG building
and ordinary movement paths are illustrative, not a physical evacuation model.
The Web Demo is session-local; reloads can reset it, and reports are retained only
when downloaded. It does not overwrite the CLI's `hybrid_demo_report.json`.

## Command-line baseline

```bash
python3 demo.py
```

This baseline continues to require only the Python standard library.

## Visual Demo Screenshots

![Normal simulation](screenshots/01-normal.png)

![Human-in-the-Loop takeover](screenshots/02-takeover.png)

![Final report](screenshots/03-final-report.png)
