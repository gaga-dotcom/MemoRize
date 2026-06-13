# MemoRize — Documentation

**Author:** Gela Lomidze  
**Version:** 4.0  
**© 2026 Gela Lomidze. All rights reserved.**

---

## What is MemoRize?

MemoRize is a fully offline, privacy-first flashcard study application built for university and school students. It runs as a native desktop application on Windows, macOS, and Linux — no internet connection, no cloud, no subscriptions, no accounts on external servers.

Everything is stored locally on your machine in a real SQLite database. Your study data belongs to you.

---

## Design Philosophy

MemoRize is built around three principles:

1. **Calm and focused** — a distraction-free interface that stays out of your way while you study
2. **Real data** — SQLite database with proper schema, relations, and data integrity; not localStorage or JSON files
3. **Keyboard-first** — study mode is designed for flow state; cards can be flipped by clicking or via keyboard shortcuts

Visual design follows a dark-only theme with soft contrast, clean typography, and minimal decoration — productive rather than flashy.

---

## Features

| Feature | Details |
|---|---|
| Local accounts | Register and log in with username + password. Multiple isolated profiles on one machine. |
| Profile editing | Change username, email, or password from within the app. |
| Folders | Color-coded containers to organise decks (e.g. "Physics", "History") |
| Decks | Flashcard collections with name, description, color, tags, and favorites |
| Cards — Standard | Classic front/back flashcard |
| Cards — Multiple Choice | Question with lettered options; correct answer highlighted after selection |
| Cards — Fill in the Blank | Prompt with blank; answer revealed on flip |
| Markdown & LaTeX | Full Markdown formatting and KaTeX math rendering in all card content |
| Study mode | Fullscreen immersive mode with 3D flip animation and complete keyboard control |
| Statistics | 30-day activity chart, daily accuracy chart, streak tracking, session history |
| Favorites filter | Star any deck or card; filter deck list to favorites only |
| Search | Real-time filtering by name, description, and tags |
| Streaks | Daily study streak with current/longest tracking |
| Responsive layout | Adapts gracefully when the window is resized or snapped to half-screen |
| User Research | Built-in feedback survey with open-ended UX research questions |

---

## Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Desktop shell | **Electron 31** | Bundles its own Chromium — zero system library dependencies on any OS |
| Build tool | **electron-vite 2** | Unified fast build pipeline for main, preload, and renderer |
| Frontend | **React 18 + TypeScript** | Component model, type safety, industry standard |
| State management | **Zustand** | Minimal, no boilerplate, fast |
| Database | **sql.js** (SQLite compiled to WebAssembly) | Pure JavaScript SQLite — no native bindings, works on all platforms identically |
| Routing | **React Router v6** (HashRouter) | SPA navigation compatible with Electron's file:// protocol |
| Charts | **Recharts** | Lightweight React-native chart library |
| Math rendering | **KaTeX** | Fast, accurate LaTeX math rendering |
| Markdown | **react-markdown** | Full Markdown support in card content |
| Icons | **Lucide React** | Clean, consistent icon set |
| Password hashing | **Node.js crypto — SHA-256 + unique salt per user** | Secure local credential storage |
| Packaging | **electron-builder** | Cross-platform native installers (NSIS, DMG, AppImage) |

---

## Project Structure

```
memorize2/
├── electron/
│   ├── main/
│   │   ├── index.ts              # App entry, window creation, IPC handler registration
│   │   ├── db.ts                 # sql.js init, schema creation, query helpers
│   │   └── handlers/
│   │       ├── auth.ts           # Register, login, logout, session management, profile update
│   │       ├── folders.ts        # Folder CRUD
│   │       ├── decks.ts          # Deck CRUD + favorites
│   │       ├── cards.ts          # Card CRUD + favorites
│   │       └── study.ts          # Study sessions, card reviews, streak tracking, statistics
│   └── preload/
│       ├── index.ts              # contextBridge: exposes window.api.invoke to renderer
│       └── index.d.ts            # TypeScript types for window.api
│
├── src/
│   ├── lib/api.ts                # Typed IPC client — all renderer→main calls go here
│   ├── store/
│   │   ├── authStore.ts          # Auth state: user, token, session persistence
│   │   └── appStore.ts           # All app state: folders, decks, cards, study, stats
│   ├── components/
│   │   ├── auth/AuthPage.tsx     # Login and Register screens
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Navigation, folders, profile, feedback — responsive
│   │   │   └── AppLayout.tsx     # Main layout wrapper with sidebar
│   │   ├── decks/
│   │   │   ├── DashboardPage.tsx # Overview: stats, streak, recent decks
│   │   │   ├── DecksPage.tsx     # Deck grid with search, tag filter, favorites filter
│   │   │   └── DeckDetailPage.tsx# Card list, expandable rows, study launcher
│   │   ├── study/StudyPage.tsx   # Full-screen study mode with keyboard shortcuts
│   │   ├── stats/StatsPage.tsx   # Statistics with area and bar charts
│   │   ├── profile/ProfileModal.tsx    # Edit username, email, password
│   │   ├── research/UserResearchModal.tsx  # UX research survey
│   │   └── ui/
│   │       ├── Button.tsx        # Primary/secondary/ghost/danger variants
│   │       ├── Modal.tsx         # Portal-based modal + confirm dialog
│   │       └── Misc.tsx          # Badge, TagChip, TagInput, ColorPicker, EmptyState, Spinner, Toast
│   ├── hooks/useKeyboard.ts      # Global keyboard shortcut hook (used in study mode)
│   ├── types/index.ts            # All shared TypeScript interfaces and constants
│   ├── utils/index.ts            # Helpers: parseTags, formatDate, pluralize, getInitials, cn
│   ├── styles/globals.css        # Design system: CSS custom properties + responsive media queries
│   ├── App.tsx                   # HashRouter with protected routes
│   └── main.tsx                  # ReactDOM entry point
│
├── index.html                    # HTML shell for the renderer
├── electron.vite.config.ts       # Build config: main + preload + renderer
├── electron-builder.yml          # Packaging: NSIS (Win), DMG (Mac), AppImage (Linux)
├── package.json
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── INSTALLATION.md               # Setup guide for all platforms
└── DOCUMENTATION.md              # This file
```

---

## Database Schema

Seven tables with cascading foreign key constraints:

| Table | Purpose |
|---|---|
| `users` | Account credentials. Passwords stored as SHA-256 hash with a unique random salt per user. Plain-text passwords are never stored. |
| `sessions` | UUID auth tokens with 30-day expiry. Validated on every IPC call. |
| `folders` | Organisational containers for decks, with color labels. |
| `decks` | Flashcard collections. Tags stored as a JSON array string. |
| `cards` | Individual cards. Options (for multiple choice) stored as a JSON array string. |
| `study_sessions` | One row per study run. Tracks cards studied and correct answers. |
| `card_reviews` | One row per card answer within a session. Result: `know` or `dont_know`. |
| `user_streaks` | Per-user current streak, longest streak, last study date, total study days. |

Deleting a user cascades through all their data automatically. Deleting a folder unlinks its decks (does not delete them). Deleting a deck cascades through all its cards and reviews.

---

## Keyboard Shortcuts

### Study Mode
| Key | Action |
|---|---|
| `Space` or click | Flip card (reveal answer) |
| `→` | Next card |
| `←` | Previous card |
| `↑` | Mark as "Got It" |
| `↓` | Mark as "Still Learning" |
| `Esc` | Exit study session |

### Global
| Key | Action |
|---|---|
| `Esc` | Close any open modal |

---

## IPC Architecture

The renderer process has no direct access to the filesystem or database. All operations go through a single secure bridge:

```
Renderer
  └─ window.api.invoke(channel, args)
       └─ contextBridge (preload/index.ts)
            └─ ipcMain.handle(channel)
                 └─ handler function (reads/writes SQLite via sql.js)
                      └─ returns { ok: true, data } or { ok: false, error: string }
```

Every handler is wrapped in try/catch. The renderer always receives a structured response — no unhandled promise rejections, no crashes from database errors.

---

## Responsive Design

The app adapts when the window is resized or snapped to half-screen:

| Width | Sidebar | Layouts |
|---|---|---|
| > 900px | Full sidebar with labels | 4-col stats, 2-col sections, auto-fill deck grid |
| 640–900px | Icon-only rail (labels hidden, tooltips on hover) | 2-col stats, 1-col sections, narrower deck cards |
| < 640px | Icon-only rail | 1-col everything |

---

*MemoRize — Built for students, by a student.*  
*© 2026 Gela Lomidze*
