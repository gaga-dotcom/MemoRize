import { query, queryOne, run, insert } from '../db';
import { getUserIdFromToken } from './auth';

export interface StudySession {
  id: number;
  deck_id: number;
  started_at: string;
}

export interface Stats {
  total_sessions: number;
  total_cards_studied: number;
  total_correct: number;
  accuracy: number;
  total_decks: number;
  total_cards: number;
}

export interface ActivityDay {
  date: string;
  sessions: number;
  cards_studied: number;
  correct: number;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_study_days: number;
}

export interface DeckStats {
  deck_id: number;
  total_sessions: number;
  total_cards_studied: number;
  total_correct: number;
  accuracy: number;
  last_studied: string | null;
}

function updateStreak(userId: number): void {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const row = queryOne<{
    current_streak: number; longest_streak: number; last_study_date: string | null;
  }>(
    'SELECT current_streak, longest_streak, last_study_date FROM user_streaks WHERE user_id = ?',
    [userId]
  );
  if (!row) return;

  const { current_streak, longest_streak, last_study_date } = row;

  if (last_study_date === today) return; // Already studied today

  let newCurrent = 1;
  if (last_study_date === yesterday) {
    newCurrent = current_streak + 1;
  }
  const newLongest = Math.max(longest_streak, newCurrent);

  run(
    `UPDATE user_streaks SET
       current_streak=?, longest_streak=?,
       last_study_date=?, total_study_days=total_study_days+1
     WHERE user_id=?`,
    [newCurrent, newLongest, today, userId]
  );
}

export function startStudySession(args: { token: string; deckId: number }): StudySession {
  const userId = getUserIdFromToken(args.token);
  const row = queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM decks WHERE id=? AND user_id=?',
    [args.deckId, userId]
  );
  if (!row || row.cnt === 0) throw new Error('Deck not found.');

  const now = new Date().toISOString();
  const id = insert(
    'INSERT INTO study_sessions (user_id, deck_id, started_at) VALUES (?, ?, ?)',
    [userId, args.deckId, now]
  );
  return { id, deck_id: args.deckId, started_at: now };
}

export function recordCardReview(args: {
  token: string; sessionId: number; cardId: number; result: string;
}): void {
  const { token, sessionId, cardId, result } = args;
  if (result !== 'know' && result !== 'dont_know') throw new Error('Invalid result value.');
  const userId = getUserIdFromToken(token);
  const now = new Date().toISOString();

  run(
    'INSERT INTO card_reviews (user_id, card_id, session_id, result, reviewed_at) VALUES (?, ?, ?, ?, ?)',
    [userId, cardId, sessionId, result, now]
  );

  const correct = result === 'know' ? 1 : 0;
  run(
    'UPDATE study_sessions SET cards_studied=cards_studied+1, cards_correct=cards_correct+? WHERE id=? AND user_id=?',
    [correct, sessionId, userId]
  );
}

export function endStudySession(args: { token: string; sessionId: number }): void {
  const userId = getUserIdFromToken(args.token);
  const now = new Date().toISOString();
  run(
    'UPDATE study_sessions SET ended_at=? WHERE id=? AND user_id=?',
    [now, args.sessionId, userId]
  );
  updateStreak(userId);
}

export function getStats(args: { token: string }): Stats {
  const userId = getUserIdFromToken(args.token);

  const sessRow = queryOne<{ total: number; studied: number; correct: number }>(
    `SELECT COUNT(*) as total,
            COALESCE(SUM(cards_studied),0) as studied,
            COALESCE(SUM(cards_correct),0) as correct
     FROM study_sessions WHERE user_id=? AND ended_at IS NOT NULL`,
    [userId]
  ) ?? { total: 0, studied: 0, correct: 0 };

  const deckCount = queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM decks WHERE user_id=?', [userId]
  )?.cnt ?? 0;

  const cardCount = queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM cards c JOIN decks d ON c.deck_id=d.id WHERE d.user_id=?', [userId]
  )?.cnt ?? 0;

  return {
    total_sessions: sessRow.total,
    total_cards_studied: sessRow.studied,
    total_correct: sessRow.correct,
    accuracy: sessRow.studied > 0 ? (sessRow.correct / sessRow.studied) * 100 : 0,
    total_decks: deckCount,
    total_cards: cardCount,
  };
}

export function getRecentActivity(args: { token: string }): ActivityDay[] {
  const userId = getUserIdFromToken(args.token);
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();

  return query<ActivityDay>(
    `SELECT date(started_at) as date,
            COUNT(*) as sessions,
            COALESCE(SUM(cards_studied),0) as cards_studied,
            COALESCE(SUM(cards_correct),0) as correct
     FROM study_sessions
     WHERE user_id=? AND started_at>=? AND ended_at IS NOT NULL
     GROUP BY date(started_at)
     ORDER BY date ASC`,
    [userId, cutoff]
  );
}

export function getStreak(args: { token: string }): StreakData {
  const userId = getUserIdFromToken(args.token);
  const row = queryOne<StreakData>(
    'SELECT current_streak, longest_streak, last_study_date, total_study_days FROM user_streaks WHERE user_id=?',
    [userId]
  );
  if (!row) throw new Error('Streak data not found.');
  return row;
}

export function getDeckStats(args: { token: string; deckId: number }): DeckStats {
  const userId = getUserIdFromToken(args.token);
  const row = queryOne<{
    total: number; studied: number; correct: number; last: string | null;
  }>(
    `SELECT COUNT(*) as total,
            COALESCE(SUM(cards_studied),0) as studied,
            COALESCE(SUM(cards_correct),0) as correct,
            MAX(ended_at) as last
     FROM study_sessions WHERE user_id=? AND deck_id=? AND ended_at IS NOT NULL`,
    [userId, args.deckId]
  ) ?? { total: 0, studied: 0, correct: 0, last: null };

  return {
    deck_id: args.deckId,
    total_sessions: row.total,
    total_cards_studied: row.studied,
    total_correct: row.correct,
    accuracy: row.studied > 0 ? (row.correct / row.studied) * 100 : 0,
    last_studied: row.last,
  };
}
