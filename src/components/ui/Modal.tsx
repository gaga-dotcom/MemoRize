import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; size?: 'sm'|'md'|'lg'; footer?: React.ReactNode;
}
const maxW = { sm:'400px', md:'520px', lg:'700px' };

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size='md', footer }) => {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portal renders at document.body — bypasses any parent transform/overflow
  return ReactDOM.createPortal(
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,.78)', backdropFilter:'blur(5px)' }}>
      <div className="animate-slide" style={{ display:'flex', flexDirection:'column', borderRadius:16, border:'1px solid var(--border)', width:'100%', maxWidth:maxW[size], maxHeight:'88vh', background:'var(--bg-elevated)', boxShadow:'var(--shadow-lg)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h3 style={{ color:'var(--text-primary)', fontSize:'1rem', fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, color:'var(--text-secondary)', transition:'background .15s' }}
            onMouseEnter={e=>((e.currentTarget as HTMLElement).style.background='var(--bg-overlay)')}
            onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
            <X size={15}/>
          </button>
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.25rem' }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, padding:'1rem 1.25rem', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export const ConfirmDialog: React.FC<{
  isOpen:boolean; onClose:()=>void; onConfirm:()=>void;
  title:string; message:string; confirmLabel?:string; isDestructive?:boolean; loading?:boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel='Confirm', isDestructive=false, loading=false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p style={{ color:'var(--text-secondary)', fontSize:'.9375rem', lineHeight:1.6 }}>{message}</p>
    <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:'1.25rem' }}>
      <button onClick={onClose} style={{ padding:'.5rem 1rem', borderRadius:10, background:'var(--bg-overlay)', color:'var(--text-secondary)', border:'1px solid var(--border)', fontSize:'.875rem', fontWeight:500, cursor:'pointer' }}>
        Cancel
      </button>
      <button onClick={onConfirm} disabled={loading} style={{ padding:'.5rem 1rem', borderRadius:10, background:isDestructive?'var(--error)':'var(--accent)', color:'white', fontSize:'.875rem', fontWeight:500, cursor:loading?'not-allowed':'pointer', opacity:loading?.6:1, border:'none' }}>
        {loading ? 'Working…' : confirmLabel}
      </button>
    </div>
  </Modal>
);
