# Stable version checkpoints

## V1 — permanent stable baseline

| Field | Value |
| --- | --- |
| Repository | `zhoujia07-hash/NewResearchParadigm` |
| Checkpoint | Annotated Git tag **V1** |
| Exact commit | `8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0` |
| Commit title | Add Vercel client showcase |
| Deployment | Successfully deployed to Vercel, confirmed by the project owner |
| Scope | Standalone public Next.js Showcase plus preserved Python/Streamlit Milestones 1–6 |

[V1 source](https://github.com/zhoujia07-hash/NewResearchParadigm/tree/V1) ·
[Exact commit](https://github.com/zhoujia07-hash/NewResearchParadigm/commit/8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0)

V1 denotes this exact source commit forever. It is not an alias for the latest
`main`, and must never be moved, overwritten, force-pushed or deleted. The
checkpoint documentation is committed after V1; it does not redefine V1.
The tag preserves source, dependencies and configuration, not a promise that
external deployment services or future toolchains remain unchanged.

## Future development

- Begin from current `main`, which descends from V1. Feature branches may branch
  from current `main`; keep V1 reachable in project history.
- Preserve the existing Python/Streamlit platform. Scientific triage changes
  require explicit project-owner authorization; do not silently change weights,
  thresholds, crisis values, outcome definitions or evidence boundaries.
- Before promoting a change, run the relevant build, tests and browser checks.
  Use a new checkpoint name for each later approved stable version. Never reuse V1.
- Keep fixes and rollback in new commits. Do not reset or force-push shared `main`
  to erase later work, and do not start Milestone 7 without authorization.

## Inspect or test V1 safely

Commit or stash any current work first. From the repository root:

```bash
git fetch origin --tags
git rev-parse 'V1^{commit}'
# Must print: 8ebddca5ec84b3fc29e789febc800fc5bdc2bdc0
git switch --detach V1
cd showcase-web
npm ci
npm run build
npm start
```

This checks out V1 locally without changing remote `main`. Return to development
with `git switch main` from the repository root. Detached HEAD is for inspection;
create a branch from V1 if a rollback-specific fix needs commits.

## Restore main to V1 with a new rollback commit

Use this only when a rollback has been requested. Preserve current work first;
the working tree must be clean. From the repository root:

```bash
git switch main
git pull --ff-only origin main
git fetch origin --tags
git rev-parse 'V1^{commit}'
# Verify the exact V1 SHA above before restoring.
git restore --source=V1 --staged --worktree -- .
git diff --cached --stat
```

This restores the tracked source tree, including removing files added after V1.
It does not remove untracked/ignored files such as study data. In particular,
checkpoint documentation added after V1 disappears from the restored tree but
remains recoverable in Git history; the remote V1 tag remains intact.
Review the staged changes and validate the restored version:

```bash
cd showcase-web
npm ci
npm run test
npm run build
cd ..
python -m unittest discover -v
# Start the production frontend, then run its actual browser verification.
# The browser script regenerates screenshots; discard those generated changes
# or inspect them separately before the rollback commit.
git commit -m "Restore V1 stable checkpoint"
git push origin main
```

The parity test needs Python 3; the existing platform test suite needs its
Streamlit dependencies. Application deployment itself does not need Python.
Re-deploy the rollback commit through the existing Vercel project and verify the
live site. A Git rollback does not by itself confirm a successful deployment.
Later commits remain in history, so subsequent work can be recovered.

## GitHub enforcement

An annotated tag records the checkpoint; Git alone cannot prevent a repository
administrator from deleting or moving it. For server-enforced protection, create
an **active tag ruleset** in GitHub Settings → Rules → Rulesets targeting the
exact tag **V1**, restricting updates and deletions. Review bypass permissions;
any actor allowed to bypass can still alter a protected tag. Availability depends
on the repository's GitHub plan and permissions.
