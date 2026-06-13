import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/decks/DashboardPage';
import { DecksPage } from './components/decks/DecksPage';
import { DeckDetailPage } from './components/decks/DeckDetailPage';
import { StudyPage } from './components/study/StudyPage';
import { StatsPage } from './components/stats/StatsPage';
import { Spinner } from './components/ui/Misc';

const App: React.FC = () => {
  const { isInitialized, user, token, initialize } = useAuthStore();
  const { loadFolders, loadDecks } = useAppStore();

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    if (token && user) {
      loadFolders(token);
      loadDecks(token, null);
    }
  }, [token, user]);

  if (!isInitialized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/" element={user ? <AppLayout /> : <Navigate to="/auth" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="decks" element={<DecksPage />} />
          <Route path="decks/:id" element={<DeckDetailPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
        <Route path="/study" element={user ? <StudyPage /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/auth'} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
