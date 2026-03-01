# nathanstaines.com

Personal website and typing speed test built with React, Vite, and Tailwind CSS.

Live at [nathanstaines.com](https://nathanstaines.com)

## About

A minimal, fast-loading personal site featuring a typing speed test game. The project is intentionally lightweight, focused on clean component architecture, pure utility functions, and a smooth user experience.

## Tech Stack

- React
- Vite
- Tailwind CSS
- ESLint
- Vitest

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Testing

Tests cover the core game utility functions: WPM calculation, accuracy scoring, and related logic. These are pure functions with no side effects, making them straightforward to test in isolation.

```bash
npm test
```

Tests live in `src/utils/gameUtils.test.js`.

## Deployment

The site builds to a static `dist/` folder via Vite and can be deployed to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

```bash
npm run build
```
