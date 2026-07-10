# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run lint      # ESLint (flat config, eslint.config.js)
npm test          # Vitest in watch mode
npx vitest run    # Run all tests once
npx vitest run src/utils/gameUtils.test.js   # Run a single test file
npx vitest run -t "calcWpm"                  # Run tests matching a name
```

Vitest config lives in the `test` block of `vite.config.js` (jsdom environment, globals enabled, `src/test-setup.js` mocks `window.matchMedia`).

## Architecture

Personal site with a typing speed test. React 19 + Vite + Tailwind CSS v4, plain JS/JSX (no TypeScript). Static build, no backend.

The game logic is deliberately layered behind a hook boundary:

- `src/hooks/useTypingGame.js` — the game engine. Owns all game state (typed text, timer, wpm/accuracy/errors, started/finished) and returns `{ state, isMobile, handleKeyDown, reset, inputRef, focus }`. It takes injectable `options`: `timeProvider` (defaults to `Date.now`, injected in tests for deterministic timing) and `onEvent` (emits `{ type: 'completed', payload }`; App wires this to Google Analytics). Keep side effects like analytics out of the hook — they belong in the caller via `onEvent`.
- `src/utils/gameUtils.js` — pure functions (`calcWpm`, `calcAccuracy`, `calcErrors`). No DOM, no state. This is where testable calculation logic goes.
- `src/App.jsx` — presentation only. Renders one of two distinct views from `isMobile` (detected once on mount via media query + user agent): mobile gets plain text with no game UI; desktop gets the full typing game.
- `src/components/` — small presentational components (`MessageDisplay`, `StatBox`, `SocialIcons`).
- `src/constants.js` — the typing message and obfuscated email parts.

Styling uses Tailwind v4's CSS-first config: design tokens (colors, font, spacing) are defined in the `@theme` block in `src/index.css`, not in a tailwind.config file. Custom classes like `text-accent`, `bg-border`, `h-progress` come from those tokens.

`vite.config.js` sets `legacy.inconsistentCjsInterop: true` — required for the `react-ga4` CJS default-export under Vite 8; don't remove it.

Interaction details worth knowing: typing input is handled via `onKeyDown` on a focusable div (not an `<input>`), and Tab is a global restart shortcut captured on `window`.
