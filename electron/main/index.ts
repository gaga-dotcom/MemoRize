import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { initDatabase } from './db';
import * as auth from './handlers/auth';
import * as folders from './handlers/folders';
import * as decks from './handlers/decks';
import * as cards from './handlers/cards';
import * as study from './handlers/study';

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'MemoRize',
    backgroundColor: '#0d0d0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // Frameless-style: use default frame on Linux for compatibility
    frame: true,
    show: false,
  });

  // Show only when ready to avoid white flash
  win.once('ready-to-show', () => win.show());

  // Open external links in the system browser, not inside Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL!);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// ─── IPC bridge ───────────────────────────────────────────────────────────────

/**
 * Register a typed IPC handler. All app handlers follow the same pattern:
 *   renderer calls  → window.api.invoke('channel', args)
 *   main replies    → { ok: true, data } or { ok: false, error: string }
 *
 * This wrapper catches thrown errors so the renderer always gets a structured reply.
 */
function handle(channel: string, fn: (args: any) => any): void {
  ipcMain.handle(channel, async (_event, args) => {
    try {
      const data = await fn(args);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  });
}

function registerHandlers(): void {
  // Auth
  handle('auth:register',        auth.register);
  handle('auth:login',           auth.login);
  handle('auth:logout',          auth.logout);
  handle('auth:getCurrentUser',  auth.getCurrentUser);
  handle('auth:updateUser',      auth.updateUser);

  // Folders
  handle('folders:create',       folders.createFolder);
  handle('folders:getAll',       folders.getFolders);
  handle('folders:update',       folders.updateFolder);
  handle('folders:delete',       folders.deleteFolder);

  // Decks
  handle('decks:create',         decks.createDeck);
  handle('decks:getAll',         decks.getDecks);
  handle('decks:getOne',         decks.getDeck);
  handle('decks:update',         decks.updateDeck);
  handle('decks:delete',         decks.deleteDeck);
  handle('decks:toggleFavorite', decks.toggleDeckFavorite);

  // Cards
  handle('cards:create',         cards.createCard);
  handle('cards:getAll',         cards.getCards);
  handle('cards:update',         cards.updateCard);
  handle('cards:delete',         cards.deleteCard);
  handle('cards:toggleFavorite', cards.toggleCardFavorite);

  // Study & Stats
  handle('study:start',           study.startStudySession);
  handle('study:recordReview',    study.recordCardReview);
  handle('study:end',             study.endStudySession);
  handle('study:getStats',        study.getStats);
  handle('study:getActivity',     study.getRecentActivity);
  handle('study:getStreak',       study.getStreak);
  handle('study:getDeckStats',    study.getDeckStats);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await initDatabase();
  registerHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
