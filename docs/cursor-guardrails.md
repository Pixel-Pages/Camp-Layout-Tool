# Cursor Guardrails

## Purpose
- Keep the project stable while implementation is delegated in small prompts.
- Preserve the project file schema, command pipeline, and canvas foundation unless a prompt explicitly authorizes a targeted change.

## Non-Negotiable Boundaries
- Do not replace `react-konva` or the state store architecture.
- Do not move persisted project fields into UI-only state.
- Do not store viewport pixels or screen transforms in the project document.
- Do not introduce backend dependencies, auth, or network persistence.
- Do not autosave layouts to durable browser storage.
- Do not refactor unrelated files while working on a focused prompt.

## Prompt Structure
Every implementation prompt should state:
1. The feature to build or refine.
2. Files allowed to change.
3. Files or modules that must remain untouched.
4. The schema and command assumptions that must remain compatible.
5. Verification steps before handing work back.

## Verification Expectations
- Add or update reducer/selector/unit tests when changing domain logic.
- Preserve backward compatibility for the `.layoutplanner.json` format.
- Keep keyboard shortcuts and interaction handlers centralized instead of scattering listeners.
- Prefer additive feature modules over broad refactors.
