import { query, queryOne, run, insert } from '../db';
import { getUserIdFromToken } from './auth';

export interface Card {
  id: number;
  deck_id: number;
  card_type: string;
  front: string;
  back: string;
  options: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

function verifyDeckOwnership(deckId: number, userId: number): void {
  const row = queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM decks WHERE id = ? AND user_id = ?',
    [deckId, userId]
  );
  if (!row || row.cnt === 0) throw new Error('Deck not found or access denied.');
}

function fetchCard(id: number): Card {
  const card = queryOne<Card>(
    'SELECT id, deck_id, card_type, front, back, options, is_favorite, created_at, updated_at FROM cards WHERE id = ?',
    [id]
  );
  if (!card) throw new Error('Card not found.');
  return card;
}

export function createCard(args: {
  token: string; deckId: number; cardType: string;
  front: string; back: string; options: string;
}): Card {
  const { token, deckId, cardType, front, back, options } = args;
  if (!front.trim()) throw new Error('Card front cannot be empty.');
  if (!back.trim()) throw new Error('Card back cannot be empty.');
  const userId = getUserIdFromToken(token);
  verifyDeckOwnership(deckId, userId);

  const id = insert(
    'INSERT INTO cards (deck_id, card_type, front, back, options) VALUES (?, ?, ?, ?, ?)',
    [deckId, cardType, front.trim(), back.trim(), options]
  );

  // Touch the deck's updated_at
  run('UPDATE decks SET updated_at = ? WHERE id = ?', [new Date().toISOString(), deckId]);

  return fetchCard(id);
}

export function getCards(args: { token: string; deckId: number }): Card[] {
  const userId = getUserIdFromToken(args.token);
  verifyDeckOwnership(args.deckId, userId);
  return query<Card>(
    'SELECT id, deck_id, card_type, front, back, options, is_favorite, created_at, updated_at FROM cards WHERE deck_id = ? ORDER BY is_favorite DESC, created_at ASC',
    [args.deckId]
  );
}

export function updateCard(args: {
  token: string; id: number; cardType: string;
  front: string; back: string; options: string;
}): Card {
  const { token, id, cardType, front, back, options } = args;
  if (!front.trim() || !back.trim()) throw new Error('Front and back cannot be empty.');
  const userId = getUserIdFromToken(token);

  const card = fetchCard(id);
  verifyDeckOwnership(card.deck_id, userId);

  const now = new Date().toISOString();
  run(
    'UPDATE cards SET card_type=?, front=?, back=?, options=?, updated_at=? WHERE id=?',
    [cardType, front.trim(), back.trim(), options, now, id]
  );
  return fetchCard(id);
}

export function deleteCard(args: { token: string; id: number }): void {
  const userId = getUserIdFromToken(args.token);
  const card = fetchCard(args.id);
  verifyDeckOwnership(card.deck_id, userId);
  run('DELETE FROM cards WHERE id = ?', [args.id]);
}

export function toggleCardFavorite(args: { token: string; id: number }): Card {
  const userId = getUserIdFromToken(args.token);
  const card = fetchCard(args.id);
  verifyDeckOwnership(card.deck_id, userId);
  run('UPDATE cards SET is_favorite = CASE WHEN is_favorite=1 THEN 0 ELSE 1 END WHERE id=?', [args.id]);
  return fetchCard(args.id);
}
