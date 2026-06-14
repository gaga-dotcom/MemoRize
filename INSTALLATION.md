# MemoRize — Installation Guide

> Step-by-step setup for Windows, macOS, and Linux (including Fedora).  
> **Only one requirement: Node.js.** Nothing else.

---

## How it works

MemoRize is built with Electron — it bundles its own browser engine, so there are **no system libraries to install**, no Rust, no WebKit headers, no compilation. Just Node.js and you're done.

---

## Step 1 — Install Node.js (one-time)

Go to **https://nodejs.org** and download the **LTS** version for your OS.

Verify it installed correctly — open a terminal and run:
```
node --version
```
You should see something like `v20.x.x` ✓

---

## Step 2 — Install dependencies

Open a terminal, navigate into the `MemoRize` folder, and run:
```
npm install
```
This downloads all packages (~520 packages, takes ~30–60 seconds, one time only).

---

## Step 3 — Launch MemoRize

```
npm run dev
```

The app opens as a native desktop window. Done. ✅

---

## Platform notes

### Windows
Open **Command Prompt** or **PowerShell**:
```cmd
cd C:\Users\YourName\Downloads\MemoRize
npm install
npm run dev
```

### macOS
Open **Terminal** (`⌘ Space` → Terminal):
```bash
cd ~/Downloads/MemoRize
npm install
npm run dev
```

### Linux — Fedora / Ubuntu / Debian / Arch
No extra system packages needed. Electron ships its own Chromium.
```bash
cd ~/Downloads/MemoRize
npm install
npm run dev
```

---

## Where is my data stored?

All accounts, decks, cards, and study history are saved in a local SQLite database:

| OS | Location |
|---|---|
| Windows | `%APPDATA%\memorize\memorize.db` |
| macOS | `~/Library/Application Support/memorize/memorize.db` |
| Linux | `~/.config/memorize/memorize.db` |

Each machine starts with a fresh empty database. Your data never leaves your computer.

To start completely fresh (delete all data):
```bash
# Linux / macOS
rm -rf ~/.config/memorize/

# Windows (run in PowerShell)
Remove-Item -Recurse "$env:APPDATA\memorize"
```

---

## Build a standalone installer (optional)

To produce a `.AppImage` (Linux), `.exe` (Windows), or `.dmg` (macOS) installer:
```
npm run pack
```
Output goes to the `dist/` folder.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `node: command not found` | Re-install Node.js and restart your terminal |
| `npm install` fails | Delete the `node_modules/` folder and run `npm install` again |
| App shows a blank/white screen | Wait 5–10 seconds — first launch initialises the database |
| Window doesn't appear | Check your taskbar/dock — it may have opened behind other windows |
