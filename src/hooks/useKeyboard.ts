import { useEffect, useCallback } from 'react';

type KeyMap = Record<string, (e: KeyboardEvent) => void>;

export function useKeyboard(keyMap: KeyMap, active = true) {
  const handler = useCallback((e: KeyboardEvent) => {
    if (!active) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const action = keyMap[e.key];
    if (action) { e.preventDefault(); action(e); }
  }, [keyMap, active]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
