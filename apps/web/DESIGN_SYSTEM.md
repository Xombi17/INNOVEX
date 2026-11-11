# ScopeBomb web design system

The shared tokens and component styles live in `src/app/globals.css`. Extend those styles before adding one-off colors or interaction states.

## Foundations

- **Type:** IBM Plex Sans for interface text; IBM Plex Mono for code and technical identifiers.
- **Color:** `--ground` frames the workbench, `--surface` holds content, `--raised` marks secondary context, and `--border` separates sections. Use `--accent` and `--accent-ink` for the active workflow step, keyboard focus, and the current walkthrough target. Status colors describe outcomes, not decoration.
- **Shape:** use `--radius-control` for controls, `--radius-card` for grouped content, and `--radius-sheet` for the app surface and modal.
- **Control size:** interactive controls use `--control-height` (44px) as their minimum height.
- **Motion:** keep feedback short, use `--ease-out`, and disable movement when the user requests reduced motion.

## Shared components

- `.workbench`, `.workbench__surface`, `.workbench__header`, and `.analysis-context` form the app shell.
- `.control` is the standard action; `.control-primary` marks the main action. `.field` is for editable input.
- `.workflow-stepper` and `.workflow-step` show the current stage. Keep the labels short enough to scan on a phone; the stage heading supplies the full task name.
- `.walkthrough-guide` explains the current sample step. Keep its explanation beside the real evidence or action, and let the reveal control focus that content.

## Interaction rules

- Preserve the global `:focus-visible` outline. Do not use color or motion as the only state cue.
- Put hover styling inside a hover-capable pointer query; provide pressed, disabled, selected, and focus states separately.
- Keep keyboard and touch controls at least 44px tall. Do not make a tour block the underlying workflow.
- Keep examples, observed evidence, possible consequences, and user-reported verification distinct in both copy and styling.
