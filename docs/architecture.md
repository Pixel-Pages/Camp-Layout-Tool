# Architecture

## Product Shape
- Static single-page React application with no backend and no account model.
- Layout projects are versioned JSON documents stored on the user's device.
- The app supports site/camp projects, interior-only projects, nested interiors, annotations, cabling, reporting, and exports.

## Technical Shape
- `src/domain`: typed project model, schema parsing, command reducers, history, reporting.
- `src/catalog`: object definitions, tent constants, icon metadata, presets.
- `src/editor`: viewport math, stage wrapper, rendering, interaction helpers.
- `src/features`: UI modules for welcome flow, palette, inspector, layers, export, reporting, navigation, and backgrounds.
- `src/app`: top-level application shell and shared editor store wiring.
- `src/shared`: units, colors, formatting, browser helpers.

## Stable Invariants
- Persist geometry in inches.
- Keep screen-space transforms in editor state only.
- Scene items are addressed by ID and mutated through typed commands.
- Site objects that support interiors reference separate interior scenes by ID.
- Imported reference images are embedded into the project file as data URLs.

## Delivery Strategy
- Stabilize schema, catalog, history, and rendering contracts first.
- Add editing tools as thin UI layers on top of pure domain logic.
- Prefer isolated feature panels and reusable scene renderers over special-case branches.
