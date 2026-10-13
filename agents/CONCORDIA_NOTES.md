# Concordia integration contract

Inspected the current official Google DeepMind repository before implementation:
commit `70aa01cca819bbfad43face568010891a0cd90aa`, package version 2.4.0.
Sources: [README](https://github.com/google-deepmind/concordia/blob/70aa01cca819bbfad43face568010891a0cd90aa/README.md),
[Cheat Sheet](https://github.com/google-deepmind/concordia/blob/70aa01cca819bbfad43face568010891a0cd90aa/CHEATSHEET.md),
[EntityAgent](https://github.com/google-deepmind/concordia/blob/70aa01cca819bbfad43face568010891a0cd90aa/concordia/agents/entity_agent.py),
[components](https://github.com/google-deepmind/concordia/blob/70aa01cca819bbfad43face568010891a0cd90aa/concordia/typing/entity_component.py),
[puppet prefab example](https://github.com/google-deepmind/concordia/blob/70aa01cca819bbfad43face568010891a0cd90aa/concordia/prefabs/entity/puppet.py).

`EntityAgent(agent_name, act_component, context_components)` owns components;
`observe` and `act(free_action_spec(...))` run the supported entity lifecycle.
Our acting component returns a JSON proposal; Constant provides the scenario
context. This is a deliberately thin single-turn integration, not the upstream
full-memory prefab/engine simulation or an empirically valid social model.

Optional installation: `python -m pip install -r requirements-agents.txt` (Python
3.12+). Without it, the explicit Python mock adapter keeps the complete no-key
pipeline available. The installed Concordia 2.4.0 EntityAgent lifecycle was tested
for all five roles. Default simulation engine remains Deterministic.

`LLM_MODE=mock` returns labeled synthetic proposals. `LLM_MODE=real` requires
`LLM_API_KEY`, `LLM_MODEL`, optionally `LLM_API_BASE` (HTTPS OpenAI-compatible
base, default `https://api.openai.com/v1`). Supply credentials securely through
environment settings, never source files or chat. The application only makes
requests after selecting Concordia/LLM and clicking Run Agent Comparison. The
provider must support `/chat/completions` with JSON-object response format.
Missing credentials use an explicit mock fallback. Real network calls were not
validated; no paid LLM requests were made in this setup.

Exactly five fields are accepted: intended_action, route_choice, confidence,
reason, uncertainty. Route/action enums and bounded reasons are validated;
numeric fields must be finite and are clamped to [0,1]. Parse/provider errors
produce deterministic proposals, sanitized error types and baseline triage
inputs. No free text controls experiment variables or physical actions.

Only successful advisor route recommendations change model disagreement:
pairwise mismatches divided by the three Route/Safety/Accessibility pairs.
Other sensor, hazard, navigation and vulnerability inputs remain controlled.
GameMaster proposals do not overwrite the deterministic environment controller's
topology, obstacles, exits or emergencies. The interface flags inadmissible
recommendations. All outputs remain SIMULATED EVIDENCE.
