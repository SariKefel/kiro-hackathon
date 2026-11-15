# Issue tracker: Local Markdown

Issues and specs live under `scratch/` at the repo root.
Git ignores this directory, so these files stay local.

## Conventions

- One feature per directory: `scratch/<feature-slug>/`.
- Specs live at `scratch/<feature-slug>/spec.md`.
- Implementation tickets live at `scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, with one file per ticket.
- Record triage state in a `Status:` line near the top, using the roles in [triage-labels.md](triage-labels.md).
- Append comments and conversation history under a `## Comments` heading.

## When a skill says "publish to the issue tracker"

Write the spec or ticket at its conventional path, creating directories as needed.

## When a skill says "fetch the relevant ticket"

Read the referenced Markdown file.
Resolve a ticket number within its feature directory.

## Wayfinding operations

Used by `/wayfinder`.
Each effort has a map and one child file per ticket.

- Map: `scratch/<effort>/map.md`, containing Notes, Decisions-so-far, and Fog.
- Child ticket: `scratch/<effort>/issues/<NN>-<slug>.md`, numbered from `01`, with the question in its body.
- Type: record `research`, `prototype`, `grilling`, or `task` in a `Type:` line.
- Workflow state: wayfinding tickets use `Status: open`, `Status: claimed`, or `Status: resolved`.
- Blocking: record dependencies in a `Blocked by: NN, NN` line.
  A ticket is unblocked when every listed ticket is resolved.
- Frontier: select the first numbered ticket that is open, unblocked, and unclaimed.
- Claim: save `Status: claimed` before starting work.
- Resolve: append the answer under `## Answer`, set `Status: resolved`, and add a short finding with a relative link to the map's Decisions-so-far.
