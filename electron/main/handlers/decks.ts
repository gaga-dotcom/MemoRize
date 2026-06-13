import { query, queryOne, run, insert } from '../db';
import { getUserIdFromToken } from './auth';

export interface Deck {
  id: number;
  user_id: number;
  folder_id: number | null;
  name: string;
  description: string;
  color: string;
  tags: string;
  is_favorite: number; // 0 | 1 from SQLite
  card_count: number;
  created_at: string;
  updated_at: string;
}

const DECK_SELECT = `
  SELECT d.id, d.user_id, d.folder_id, d.name, d.description,
         d.color, d.tags, d.is_favorite, d.created_at, d.updated_at,
         COUNT(c.id) as card_count
  FROM decks d
  LEFT JOIN cards c ON c.deck_id = d.id`;

function fetchDeck(id: number, userId: number): Deck {
  const row = queryOne<Deck>(
    `${DECK_SELECT} WHERE d.id = ? AND d.user_id = ? GROUP BY d.id`,
    [id, userId]
  );
  if (!row) throw new Error('Deck not found.');
  return row;
}

export function createDeck(args: {
  token: string; name: string; description: string;
  folderId: number | null; color: string; tags: string;
}): Deck {
  const { token, name, description, folderId, color, tags } = args;
  if (!name.trim()) throw new Error('Deck name cannot be empty.');
  const userId = getUserIdFromToken(token);
  const id = insert(
    'INSERT INTO decks (user_id, folder_id, name, description, color, tags) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, folderId ?? null, name.trim(), description.trim(), color, tags]
  );
  return fetchDeck(id, userId);
}

export function getDecks(args: { token: string; folderId?: number | null }): Deck[] {
  const userId = getUserIdFromToken(args.token);
  const folderId = args.folderId ?? null;

  if (folderId !== null) {
    return query<Deck>(
      `${DECK_SELECT} WHERE d.user_id = ? AND d.folder_id = ?
       GROUP BY d.id ORDER BY d.is_favorite DESC, d.updated_at DESC`,
      [userId, folderId]
    );
  }
  return query<Deck>(
    `${DECK_SELECT} WHERE d.user_id = ?
     GROUP BY d.id ORDER BY d.is_favorite DESC, d.updated_at DESC`,
    [userId]
  );
}

export function getDeck(args: { token: string; id: number }): Deck {
  const userId = getUserIdFromToken(args.token);
  return fetchDeck(args.id, userId);
}

export function updateDeck(args: {
  token: string; id: number; name: string; description: string;
  folderId: number | null; color: string; tags: string;
}): Deck {
  const { token, id, name, description, folderId, color, tags } = args;
  if (!name.trim()) throw new Error('Deck name cannot be empty.');
  const userId = getUserIdFromToken(token);
  const now = new Date().toISOString();
  run(
    'UPDATE decks SET name=?, description=?, folder_id=?, color=?, tags=?, updated_at=? WHERE id=? AND user_id=?',
    [name.trim(), description.trim(), folderId ?? null, color, tags, now, id, userId]
  );
  return fetchDeck(id, userId);
}

export function deleteDeck(args: { token: string; id: number }): void {
  const userId = getUserIdFromToken(args.token);
  run('DELETE FROM decks WHERE id = ? AND user_id = ?', [args.id, userId]);
}

export function toggleDeckFavorite(args: { token: string; id: number }): Deck {
  const userId = getUserIdFromToken(args.token);
  run(
    'UPDATE decks SET is_favorite = CASE WHEN is_favorite=1 THEN 0 ELSE 1 END WHERE id=? AND user_id=?',
    [args.id, userId]
  );
  return fetchDeck(args.id, userId);
}
