# Project version checkpoints

Read VERSION_CHECKPOINTS.md before changing this project or handling rollback.

- Permanent checkpoint V1 is the annotated tag at exactly
  8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0. Never move, replace, delete or force-push it.
- Continue development from current main, retaining V1 in history. Later approved
  stable versions get new checkpoint names.
- Preserve the Python/Streamlit research platform and scientific triage logic.
  Change scientific definitions only with explicit project-owner authorization.
- Validate relevant builds, tests and UI before promoting a change.
- A requested rollback should create a new commit or restore a deployment; do not
  erase shared history with a reset or force-push. Preserve current work and data.
- Do not begin Milestone 7 without authorization.
