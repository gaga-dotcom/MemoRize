/**
 * Type-safe IPC client for the renderer process.
 * Every call goes through window.api.invoke and throws on error,
 * so callers can simply await and catch.
 */
async function invoke<T>(channel: string, args?: unknown): Promise<T> {
  const result = await window.api.invoke(channel, args);
  if (!result.ok) throw new Error(result.error ?? 'Unknown error');
  return result.data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register:       (args: { username: string; email: string; password: string }) =>
      invoke<{ token: string; user: any }>('auth:register', args),
    login:          (args: { usernameOrEmail: string; password: string }) =>
      invoke<{ token: string; user: any }>('auth:login', args),
    logout:         (args: { token: string }) =>
      invoke<void>('auth:logout', args),
    getCurrentUser: (args: { token: string }) =>
      invoke<any>('auth:getCurrentUser', args),
    updateUser: (args: { token: string; username?: string; email?: string; newPassword?: string; currentPassword?: string }) =>
      invoke<any>('auth:updateUser', args),
  },

  folders: {
    create: (args: { token: string; name: string; color: string }) =>
      invoke<any>('folders:create', args),
    getAll: (args: { token: string }) =>
      invoke<any[]>('folders:getAll', args),
    update: (args: { token: string; id: number; name: string; color: string }) =>
      invoke<any>('folders:update', args),
    delete: (args: { token: string; id: number }) =>
      invoke<void>('folders:delete', args),
  },

  decks: {
    create: (args: { token: string; name: string; description: string; folderId: number | null; color: string; tags: string }) =>
      invoke<any>('decks:create', args),
    getAll: (args: { token: string; folderId?: number | null }) =>
      invoke<any[]>('decks:getAll', args),
    getOne: (args: { token: string; id: number }) =>
      invoke<any>('decks:getOne', args),
    update: (args: { token: string; id: number; name: string; description: string; folderId: number | null; color: string; tags: string }) =>
      invoke<any>('decks:update', args),
    delete: (args: { token: string; id: number }) =>
      invoke<void>('decks:delete', args),
    toggleFavorite: (args: { token: string; id: number }) =>
      invoke<any>('decks:toggleFavorite', args),
  },

  cards: {
    create: (args: { token: string; deckId: number; cardType: string; front: string; back: string; options: string }) =>
      invoke<any>('cards:create', args),
    getAll: (args: { token: string; deckId: number }) =>
      invoke<any[]>('cards:getAll', args),
    update: (args: { token: string; id: number; cardType: string; front: string; back: string; options: string }) =>
      invoke<any>('cards:update', args),
    delete: (args: { token: string; id: number }) =>
      invoke<void>('cards:delete', args),
    toggleFavorite: (args: { token: string; id: number }) =>
      invoke<any>('cards:toggleFavorite', args),
  },

  study: {
    start:        (args: { token: string; deckId: number }) =>
      invoke<any>('study:start', args),
    recordReview: (args: { token: string; sessionId: number; cardId: number; result: string }) =>
      invoke<void>('study:recordReview', args),
    end:          (args: { token: string; sessionId: number }) =>
      invoke<void>('study:end', args),
    getStats:     (args: { token: string }) =>
      invoke<any>('study:getStats', args),
    getActivity:  (args: { token: string }) =>
      invoke<any[]>('study:getActivity', args),
    getStreak:    (args: { token: string }) =>
      invoke<any>('study:getStreak', args),
    getDeckStats: (args: { token: string; deckId: number }) =>
      invoke<any>('study:getDeckStats', args),
  },
};

// Extend auth API with updateUser (appended after initial export)
// Access via api.auth.updateUser
