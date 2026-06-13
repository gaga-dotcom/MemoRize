import { query, queryOne, run, insert } from '../db';
import { getUserIdFromToken } from './auth';

export interface Folder {
  id: number;
  user_id: number;
  name: string;
  color: string;
  deck_count: number;
  created_at: string;
}

function fetchFolder(id: number, userId: number): Folder {
  const row = queryOne<Folder>(
    `SELECT f.id, f.user_id, f.name, f.color, f.created_at,
            COUNT(d.id) as deck_count
     FROM folders f
     LEFT JOIN decks d ON d.folder_id = f.id AND d.user_id = f.user_id
     WHERE f.id = ? AND f.user_id = ?
     GROUP BY f.id`,
    [id, userId]
  );
  if (!row) throw new Error('Folder not found.');
  return row;
}

export function createFolder(args: { token: string; name: string; color: string }): Folder {
  const { token, name, color } = args;
  if (!name.trim()) throw new Error('Folder name cannot be empty.');
  const userId = getUserIdFromToken(token);
  const id = insert('INSERT INTO folders (user_id, name, color) VALUES (?, ?, ?)', [userId, name.trim(), color]);
  return fetchFolder(id, userId);
}

export function getFolders(args: { token: string }): Folder[] {
  const userId = getUserIdFromToken(args.token);
  return query<Folder>(
    `SELECT f.id, f.user_id, f.name, f.color, f.created_at,
            COUNT(d.id) as deck_count
     FROM folders f
     LEFT JOIN decks d ON d.folder_id = f.id AND d.user_id = f.user_id
     WHERE f.user_id = ?
     GROUP BY f.id ORDER BY f.name ASC`,
    [userId]
  );
}

export function updateFolder(args: { token: string; id: number; name: string; color: string }): Folder {
  const { token, id, name, color } = args;
  if (!name.trim()) throw new Error('Folder name cannot be empty.');
  const userId = getUserIdFromToken(token);
  run('UPDATE folders SET name = ?, color = ? WHERE id = ? AND user_id = ?', [name.trim(), color, id, userId]);
  return fetchFolder(id, userId);
}

export function deleteFolder(args: { token: string; id: number }): void {
  const userId = getUserIdFromToken(args.token);
  run('UPDATE decks SET folder_id = NULL WHERE folder_id = ? AND user_id = ?', [args.id, userId]);
  run('DELETE FROM folders WHERE id = ? AND user_id = ?', [args.id, userId]);
}
