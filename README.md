# MemoRize

> A fully offline, privacy-first flashcard study app for university and school students.

Built with Electron + React 18 + TypeScript + SQLite. No internet. No cloud. No accounts on external servers. Everything stays on your machine.

---

## Features

- **Local accounts** — multiple isolated profiles on one machine
- **Folders & Decks** — color-coded organisation with tags and favorites
- **3 card types** — Standard, Multiple Choice, Fill in the Blank
- **Markdown & LaTeX** — full KaTeX math rendering in all card content
- **Study mode** — fullscreen immersive mode with 3D flip animation and keyboard shortcuts
- **Statistics** — 30-day activity chart, accuracy tracking, streaks, session history
- **100% offline** — no network requests, no telemetry, no subscriptions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 31 |
| Frontend | React 18 + TypeScript |
| State | Zustand |
| Database | sql.js (SQLite → WebAssembly) |
| Build | electron-vite 2 |
| Charts | Recharts |
| Math | KaTeX |

---

## Quick Start

```bash
git clone https://github.com/<username>/MemoRize.git
cd MemoRize
npm install
npm run dev
```

See [INSTALLATION.md](INSTALLATION.md) for platform-specific instructions and [DOCUMENTATION.md](DOCUMENTATION.md) for full project details.

---

*© 2026 Gela Lomidze*
