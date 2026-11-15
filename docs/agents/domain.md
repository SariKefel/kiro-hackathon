# Domain docs

This repo uses a single-context layout.

## Before exploring

Read `CONTEXT.md` at the repo root.
Read relevant architectural decisions in `docs/adr/`.

If either is absent, continue silently.
The `/domain-modeling` skill creates domain documentation when terminology or decisions are resolved.

## File layout

- `CONTEXT.md`: shared domain terminology.
- `docs/adr/`: architectural decision records.

## Use the glossary

Use the terms defined in `CONTEXT.md` when naming domain concepts in issues, proposals, hypotheses, and tests.
Follow its guidance about synonyms to avoid.

If a needed concept is missing, reconsider the wording or record the gap for `/domain-modeling`.

## Surface decision conflicts

When proposing something that contradicts an ADR, identify the ADR and explain why the decision should be reopened.
