import { create } from 'zustand';
import { api } from '../lib/api';
import type { Folder, Deck, Card, Stats, ActivityDay, StreakData, StudySession, StudyResult } from '../types';

interface AppState {
  folders: Folder[];
  decks: Deck[];
  cards: Card[];
  currentDeck: Deck | null;
  stats: Stats | null;
  activity: ActivityDay[];
  streak: StreakData | null;
  studySession: StudySession | null;
  studyCards: Card[];
  studyIndex: number;
  studyFlipped: boolean;
  studyResults: Record<number, StudyResult>;
  selectedFolderId: number | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Folders
  loadFolders: (token: string) => Promise<void>;
  createFolder: (token: string, name: string, color: string) => Promise<void>;
  updateFolder: (token: string, id: number, name: string, color: string) => Promise<void>;
  deleteFolder: (token: string, id: number) => Promise<void>;
  setSelectedFolder: (id: number | null) => void;

  // Decks
  loadDecks: (token: string, folderId?: number | null) => Promise<void>;
  createDeck: (token: string, p: { name: string; description: string; folderId: number | null; color: string; tags: string }) => Promise<Deck>;
  updateDeck: (token: string, id: number, p: { name: string; description: string; folderId: number | null; color: string; tags: string }) => Promise<void>;
  deleteDeck: (token: string, id: number) => Promise<void>;
  toggleDeckFavorite: (token: string, id: number) => Promise<void>;
  loadDeck: (token: string, id: number) => Promise<void>;

  // Cards
  loadCards: (token: string, deckId: number) => Promise<void>;
  createCard: (token: string, p: { deckId: number; cardType: string; front: string; back: string; options: string }) => Promise<void>;
  updateCard: (token: string, id: number, p: { cardType: string; front: string; back: string; options: string }) => Promise<void>;
  deleteCard: (token: string, id: number) => Promise<void>;
  toggleCardFavorite: (token: string, id: number) => Promise<void>;

  // Study
  startStudy: (token: string, deckId: number, cards: Card[]) => Promise<void>;
  flipStudyCard: () => void;
  nextStudyCard: () => void;
  prevStudyCard: () => void;
  recordReview: (token: string, result: StudyResult) => Promise<boolean>;
  endStudy: (token: string) => Promise<void>;

  // Stats
  loadStats: (token: string) => Promise<void>;

  setSearchQuery: (q: string) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  folders: [], decks: [], cards: [], currentDeck: null,
  stats: null, activity: [], streak: null,
  studySession: null, studyCards: [], studyIndex: 0,
  studyFlipped: false, studyResults: {},
  selectedFolderId: null, searchQuery: '',
  isLoading: false, error: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  clearError: () => set({ error: null }),

  // ── Folders ───────────────────────────────────────────────────────────────
  loadFolders: async (token) => {
    const folders = await api.folders.getAll({ token });
    set({ folders });
  },
  createFolder: async (token, name, color) => {
    const f = await api.folders.create({ token, name, color });
    set((s) => ({ folders: [...s.folders, f] }));
  },
  updateFolder: async (token, id, name, color) => {
    const f = await api.folders.update({ token, id, name, color });
    set((s) => ({ folders: s.folders.map((x) => (x.id === id ? f : x)) }));
  },
  deleteFolder: async (token, id) => {
    await api.folders.delete({ token, id });
    set((s) => ({
      folders: s.folders.filter((x) => x.id !== id),
      selectedFolderId: s.selectedFolderId === id ? null : s.selectedFolderId,
    }));
  },
  setSelectedFolder: (id) => set({ selectedFolderId: id, searchQuery: '' }),

  // ── Decks ─────────────────────────────────────────────────────────────────
  loadDecks: async (token, folderId = null) => {
    set({ isLoading: true });
    try {
      const decks = await api.decks.getAll({ token, folderId });
      set({ decks, isLoading: false });
    } catch (err) { set({ error: String(err), isLoading: false }); }
  },
  createDeck: async (token, p) => {
    const d = await api.decks.create({ token, ...p });
    set((s) => ({ decks: [d, ...s.decks] }));
    return d;
  },
  updateDeck: async (token, id, p) => {
    const d = await api.decks.update({ token, id, ...p });
    set((s) => ({
      decks: s.decks.map((x) => (x.id === id ? d : x)),
      currentDeck: s.currentDeck?.id === id ? d : s.currentDeck,
    }));
  },
  deleteDeck: async (token, id) => {
    await api.decks.delete({ token, id });
    set((s) => ({ decks: s.decks.filter((x) => x.id !== id) }));
  },
  toggleDeckFavorite: async (token, id) => {
    const d = await api.decks.toggleFavorite({ token, id });
    set((s) => ({
      decks: s.decks.map((x) => (x.id === id ? d : x)),
      currentDeck: s.currentDeck?.id === id ? d : s.currentDeck,
    }));
  },
  loadDeck: async (token, id) => {
    const d = await api.decks.getOne({ token, id });
    set({ currentDeck: d });
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  loadCards: async (token, deckId) => {
    const cards = await api.cards.getAll({ token, deckId });
    set({ cards });
  },
  createCard: async (token, p) => {
    const c = await api.cards.create({ token, ...p });
    set((s) => ({ cards: [...s.cards, c] }));
  },
  updateCard: async (token, id, p) => {
    const c = await api.cards.update({ token, id, ...p });
    set((s) => ({ cards: s.cards.map((x) => (x.id === id ? c : x)) }));
  },
  deleteCard: async (token, id) => {
    await api.cards.delete({ token, id });
    set((s) => ({ cards: s.cards.filter((x) => x.id !== id) }));
  },
  toggleCardFavorite: async (token, id) => {
    const c = await api.cards.toggleFavorite({ token, id });
    set((s) => ({ cards: s.cards.map((x) => (x.id === id ? c : x)) }));
  },

  // ── Study ─────────────────────────────────────────────────────────────────
  startStudy: async (token, deckId, cards) => {
    const session = await api.study.start({ token, deckId });
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    set({ studySession: session, studyCards: shuffled, studyIndex: 0, studyFlipped: false, studyResults: {} });
  },
  flipStudyCard: () => set((s) => ({ studyFlipped: !s.studyFlipped })),
  nextStudyCard: () => set((s) => ({ studyIndex: Math.min(s.studyIndex + 1, s.studyCards.length - 1), studyFlipped: false })),
  prevStudyCard: () => set((s) => ({ studyIndex: Math.max(s.studyIndex - 1, 0), studyFlipped: false })),

  recordReview: async (token, result) => {
    const { studySession, studyCards, studyIndex } = get();
    if (!studySession) return false;
    const card = studyCards[studyIndex];
    if (!card) return false;
    await api.study.recordReview({ token, sessionId: studySession.id, cardId: card.id, result });
    const isLast = studyIndex >= studyCards.length - 1;
    set((s) => ({
      studyResults: { ...s.studyResults, [card.id]: result },
      studyIndex: isLast ? s.studyIndex : s.studyIndex + 1,
      studyFlipped: false,
    }));
    return isLast;
  },

  endStudy: async (token) => {
    const { studySession } = get();
    if (!studySession) return;
    await api.study.end({ token, sessionId: studySession.id });
    set({ studySession: null });
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  loadStats: async (token) => {
    const [stats, activity, streak] = await Promise.all([
      api.study.getStats({ token }),
      api.study.getActivity({ token }),
      api.study.getStreak({ token }),
    ]);
    set({ stats, activity, streak });
  },
}));
