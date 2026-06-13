import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Play, Edit2, Trash2, MoreVertical, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { EmptyState, Badge, TagChip } from '../ui/Misc';
import { parseTags, pluralize, parseOptions } from '../../utils';
import type { Card, CardType } from '../../types';
import { CARD_TYPE_LABELS } from '../../types';

export const DeckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const { currentDeck, cards, loadDeck, loadCards, startStudy, toggleDeckFavorite, deleteCard, toggleCardFavorite } = useAppStore();
  const nav = useNavigate();
  const [cardModal, setCardModal] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    const n = Number(id);
    loadDeck(token, n);
    loadCards(token, n);
  }, [token, id]);

  const handleStudy = async () => {
    if (!token || !currentDeck || cards.length === 0) return;
    await startStudy(token, currentDeck.id, cards);
    nav('/study');
  };

  if (!currentDeck) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-tertiary)' }}>Loading…</div>;
  const tags = parseTags(currentDeck.tags);

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => nav('/decks')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: '1.5rem', transition: 'color .15s' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
        <ArrowLeft size={15} /> Back to Decks
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentDeck.color, flexShrink: 0 }} />
            <h1 style={{ color: 'var(--text-primary)', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentDeck.name}</h1>
            <button onClick={() => toggleDeckFavorite(token!, currentDeck.id)} style={{ display: 'flex', color: currentDeck.is_favorite ? '#f59e0b' : 'var(--text-tertiary)', transition: 'color .15s', flexShrink: 0 }}>
              <Star size={16} fill={currentDeck.is_favorite ? '#f59e0b' : 'none'} />
            </button>
          </div>
          {currentDeck.description && <p style={{ color: 'var(--text-secondary)', fontSize: '.9375rem', marginBottom: 8 }}>{currentDeck.description}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <Badge color="var(--accent)">{pluralize(currentDeck.card_count, 'card')}</Badge>
            {tags.map(t => <TagChip key={t} tag={t} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button icon={<Play size={14} fill="white" />} onClick={handleStudy} disabled={cards.length === 0}>Study</Button>
          <Button variant="secondary" icon={<Plus size={14} />} onClick={() => setCardModal(true)}>Add Card</Button>
        </div>
      </div>

      {cards.length === 0
        ? <EmptyState icon={<BookOpen size={28} />} title="No cards yet" description="Add your first flashcard to get started." action={<Button icon={<Plus size={14} />} onClick={() => setCardModal(true)}>Add Card</Button>} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            {cards.map(c => <CardRow key={c.id} card={c} onEdit={() => setEditCard(c)} onDelete={() => deleteCard(token!, c.id)} onToggleFav={() => toggleCardFavorite(token!, c.id)} />)}
          </div>
      }
      <CardFormModal isOpen={cardModal || editCard !== null} onClose={() => { setCardModal(false); setEditCard(null); }} deckId={currentDeck.id} initialValues={editCard ?? undefined} title={editCard ? 'Edit Card' : 'New Card'} />
    </div>
  );
};

const CardRow: React.FC<{ card: Card; onEdit: () => void; onDelete: () => void; onToggleFav: () => void }> = ({ card, onEdit, onDelete, onToggleFav }) => {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [del, setDel] = useState(false);
  const opts = parseOptions(card.options);
  return (
    <div className="animate-fade" style={{ borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.8125rem 1rem', cursor: 'pointer' }} onClick={() => setOpen(s => !s)}>
        <span style={{ fontSize: '.75rem', padding: '2px 8px', borderRadius: 5, background: 'var(--bg-overlay)', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>{CARD_TYPE_LABELS[card.card_type]}</span>
        <p style={{ flex: 1, color: 'var(--text-primary)', fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.front}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={onToggleFav} title={card.is_favorite?'Remove from favorites':'Add to favorites'} style={{ display: 'flex', color: card.is_favorite ? '#f59e0b' : 'var(--text-tertiary)', padding: 6, borderRadius: 6, transition: 'color .15s' }}
            onMouseEnter={e=>!card.is_favorite&&((e.currentTarget as HTMLElement).style.color='#f59e0b')}
            onMouseLeave={e=>!card.is_favorite&&((e.currentTarget as HTMLElement).style.color='var(--text-tertiary)')}><Star size={14} fill={card.is_favorite ? '#f59e0b' : 'none'} /></button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(s => !s)} title="More options" style={{ display: 'flex', color: 'var(--text-tertiary)', padding: 6, borderRadius: 6, transition: 'color .15s' }}
              onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color='var(--text-primary)')}
              onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color='var(--text-tertiary)')}><MoreVertical size={14} /></button>
            {menu && <><div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenu(false)} />
              <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, marginTop: 4, background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-md)', minWidth: 130, overflow: 'hidden' }}>
                <MBtn icon={<Edit2 size={13} />} label="Edit" onClick={() => { setMenu(false); onEdit(); }} />
                <MBtn icon={<Trash2 size={13} />} label="Delete" onClick={() => { setMenu(false); setDel(true); }} danger />
              </div></>}
          </div>
          <span style={{ display: 'flex', color: 'var(--text-tertiary)' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        </div>
      </div>
      {open && <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '.875rem' }}>
          <Side label="Front" content={card.front} />
          <div>
            <Side label="Back" content={card.back} />
            {opts.length > 0 && <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {opts.map((o, i) => <div key={i} style={{ padding: '4px 10px', borderRadius: 7, background: o === card.back ? 'var(--success-muted)' : 'var(--bg-elevated)', color: o === card.back ? 'var(--success)' : 'var(--text-secondary)', fontSize: '.8125rem', border: `1px solid ${o === card.back ? 'rgba(16,185,129,.2)' : 'transparent'}` }}>{o}</div>)}
            </div>}
          </div>
        </div>
      </div>}
      <ConfirmDialog isOpen={del} onClose={() => setDel(false)} onConfirm={onDelete} title="Delete Card" message="Delete this card permanently?" confirmLabel="Delete" isDestructive />
    </div>
  );
};

const Side: React.FC<{ label: string; content: string }> = ({ label, content }) => (
  <div>
    <p style={{ color: 'var(--text-tertiary)', fontSize: '.75rem', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
    <div className="prose selectable" style={{ fontSize: '.875rem' }}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown>
    </div>
  </div>
);

const MBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '.5rem .875rem', fontSize: '.8125rem', color: danger ? 'var(--error)' : 'var(--text-secondary)' }}
    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>{icon}{label}</button>
);

const CardFormModal: React.FC<{ isOpen: boolean; onClose: () => void; deckId: number; initialValues?: Card; title: string }> = ({ isOpen, onClose, deckId, initialValues, title }) => {
  const { token } = useAuthStore();
  const { createCard, updateCard } = useAppStore();
  const [type, setType] = useState<CardType>('standard');
  const [front, setFront] = useState(''); const [back, setBack] = useState('');
  const [opts, setOpts] = useState<string[]>([]); const [optInput, setOptInput] = useState('');
  const [loading, setLoading] = useState(false); const [err, setErr] = useState('');

  useEffect(() => {
    if (isOpen) { setType(initialValues?.card_type ?? 'standard'); setFront(initialValues?.front ?? ''); setBack(initialValues?.back ?? ''); setOpts(parseOptions(initialValues?.options ?? '[]')); setOptInput(''); setErr(''); }
  }, [isOpen]);

  const addOpt = () => { const t = optInput.trim(); if (t && !opts.includes(t)) setOpts(s => [...s, t]); setOptInput(''); };
  const handle = async () => {
    if (!front.trim() || !back.trim()) { setErr('Front and back are required.'); return; }
    setLoading(true);
    try {
      if (initialValues) await updateCard(token!, initialValues.id, { cardType: type, front, back, options: JSON.stringify(opts) });
      else await createCard(token!, { deckId, cardType: type, front, back, options: JSON.stringify(opts) });
      onClose();
    } catch (e) { setErr(String(e).replace('Error: ', '')); }
    finally { setLoading(false); }
  };

  const LBL: React.CSSProperties = { fontSize: '.875rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg"
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={handle} loading={loading}>Save Card</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {err && <div style={{ padding: '.625rem .875rem', borderRadius: 8, background: 'var(--error-muted)', color: 'var(--error)', fontSize: '.875rem' }}>{err}</div>}
        <div><label style={LBL}>Card type</label>
          <select value={type} onChange={e => setType(e.target.value as CardType)} style={{ backgroundImage: 'none' }}>
            {Object.entries(CARD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v} style={{ background: '#1e1e21' }}>{l}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Front <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Markdown & LaTeX OK)</span></label><textarea value={front} onChange={e => setFront(e.target.value)} placeholder="Question or prompt…" rows={3} style={{ resize: 'vertical' }} /></div>
        <div><label style={LBL}>Back / Answer</label><textarea value={back} onChange={e => setBack(e.target.value)} placeholder="Answer or explanation…" rows={3} style={{ resize: 'vertical' }} /></div>
        {type === 'multiple_choice' && <div>
          <label style={LBL}>Options <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(correct answer = the Back value)</span></label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={optInput} onChange={e => setOptInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOpt())} placeholder="Add option and press Enter" />
            <Button variant="secondary" size="sm" onClick={addOpt}>Add</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {opts.map((o, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, fontSize: '.875rem', color: 'var(--text-primary)' }}>{o}</span>
              {o === back && <span style={{ fontSize: '.8125rem', color: 'var(--success)', fontWeight:500 }}>✓ Correct</span>}
              <button onClick={() => setOpts(s => s.filter((_, j) => j !== i))} style={{ color: 'var(--text-tertiary)', fontSize: '1.125rem' }}>×</button>
            </div>)}
          </div>
        </div>}
      </div>
    </Modal>
  );
};
