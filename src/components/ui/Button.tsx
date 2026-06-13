import React from 'react';

type Variant = 'primary'|'secondary'|'ghost'|'danger';
type Size = 'sm'|'md'|'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean;
  icon?: React.ReactNode; fullWidth?: boolean;
}

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary:   { background:'var(--accent)', color:'white' },
  secondary: { background:'var(--bg-elevated)', color:'var(--text-primary)', border:'1px solid var(--border)' },
  ghost:     { background:'transparent', color:'var(--text-secondary)' },
  danger:    { background:'var(--error-muted)', color:'var(--error)', border:'1px solid rgba(239,68,68,.2)' },
};
const sizeStyle: Record<Size, React.CSSProperties> = {
  sm: { padding:'.375rem .75rem', fontSize:'.75rem', gap:6, borderRadius:8 },
  md: { padding:'.5rem 1rem',    fontSize:'.875rem', gap:8, borderRadius:10 },
  lg: { padding:'.625rem 1.25rem', fontSize:'.9375rem', gap:8, borderRadius:10 },
};

export const Button: React.FC<Props> = ({
  variant='primary', size='md', loading=false, icon, fullWidth=false,
  children, style, disabled, ...props
}) => (
  <button
    disabled={disabled || loading}
    style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--font-sans)', fontWeight:500, cursor: disabled||loading ? 'not-allowed' : 'pointer',
      whiteSpace:'nowrap', transition:'all .15s', border:'none', outline:'none',
      opacity: disabled||loading ? .45 : 1,
      width: fullWidth ? '100%' : undefined,
      ...variantStyle[variant], ...sizeStyle[size], ...style,
    }}
    onMouseEnter={e => {
      if (disabled||loading) return;
      const el = e.currentTarget;
      if (variant==='primary') el.style.background='var(--accent-hover)';
      if (variant==='secondary') el.style.background='var(--bg-overlay)';
      if (variant==='ghost') { el.style.background='var(--bg-elevated)'; el.style.color='var(--text-primary)'; }
    }}
    onMouseLeave={e => {
      if (disabled||loading) return;
      const el = e.currentTarget;
      if (variant==='primary') el.style.background='var(--accent)';
      if (variant==='secondary') el.style.background='var(--bg-elevated)';
      if (variant==='ghost') { el.style.background='transparent'; el.style.color='var(--text-secondary)'; }
    }}
    {...props}
  >
    {loading
      ? <span style={{width:15,height:15,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>
      : icon && <span style={{display:'flex',flexShrink:0}}>{icon}</span>
    }
    {children && <span>{children}</span>}
  </button>
);
