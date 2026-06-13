export interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

export interface Folder {
  id: number;
  user_id: number;
  name: string;
  color: string;
  deck_count: number;
  created_at: string;
}

export type CardType = 'standard' | 'multiple_choice' | 'fill_blank';

export interface Card {
  id: number;
  deck_id: number;
  card_type: CardType;
  front: string;
  back: string;
  options: string;      // JSON array string
  is_favorite: number;  // 0 | 1
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: number;
  user_id: number;
  folder_id: number | null;
  name: string;
  description: string;
  color: string;
  tags: string;         // JSON array string
  is_favorite: number;  // 0 | 1
  card_count: number;
  created_at: string;
  updated_at: string;
}

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

export type StudyResult = 'know' | 'dont_know';

export const DECK_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#14b8a6',
  '#f59e0b','#10b981','#3b82f6','#ef4444',
  '#f97316','#84cc16',
] as const;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  standard:        'Standard',
  multiple_choice: 'Multiple Choice',
  fill_blank:      'Fill in the Blank',
};
