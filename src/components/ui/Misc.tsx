import React, { useState, useEffect } from 'react';
import { DECK_COLORS } from '../../types';

export const Badge: React.FC<{children:React.ReactNode;color?:string}> = ({children,color='#6366f1'}) => (
  <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:999,fontSize:'.75rem',fontWeight:500,background:`${color}20`,color}}>{children}</span>
);

export const TagChip: React.FC<{tag:string;onRemove?:()=>void}> = ({tag,onRemove}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,fontSize:'.75rem',background:'var(--accent-muted)',color:'var(--accent)',border:'1px solid var(--accent-subtle)'}}>
    {tag}
    {onRemove && <button onClick={onRemove} style={{opacity:.6,cursor:'pointer',fontSize:'1rem',lineHeight:1,color:'inherit'}} onMouseEnter={e=>((e.currentTarget as HTMLElement).style.opacity='1')} onMouseLeave={e=>((e.currentTarget as HTMLElement).style.opacity='.6')}>×</button>}
  </span>
);

export const TagInput: React.FC<{tags:string[];onChange:(t:string[])=>void;placeholder?:string}> = ({tags,onChange,placeholder='Add tag, press Enter…'}) => {
  const [val,setVal]=useState('');
  const add=()=>{const t=val.trim().toLowerCase();if(t&&!tags.includes(t))onChange([...tags,t]);setVal('');};
  return(
    <div>
      {tags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>{tags.map(t=><TagChip key={t} tag={t} onRemove={()=>onChange(tags.filter(x=>x!==t))}/>)}</div>}
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder}
        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}if(e.key==='Backspace'&&!val&&tags.length)onChange(tags.slice(0,-1));}}/>
    </div>
  );
};

export const ColorPicker: React.FC<{value:string;onChange:(c:string)=>void}> = ({value,onChange}) => (
  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
    {DECK_COLORS.map(c=>(
      <button key={c} onClick={()=>onChange(c)} title={c} style={{width:28,height:28,borderRadius:'50%',background:c,border:'none',cursor:'pointer',outline:value===c?`3px solid ${c}`:'none',outlineOffset:2,transform:value===c?'scale(1.15)':'scale(1)',transition:'transform .15s'}}/>
    ))}
  </div>
);

export const EmptyState: React.FC<{icon:React.ReactNode;title:string;description:string;action?:React.ReactNode}> = ({icon,title,description,action}) => (
  <div className="animate-fade" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'4rem 1.5rem'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:64,height:64,borderRadius:16,marginBottom:'1rem',background:'var(--bg-elevated)',color:'var(--text-tertiary)'}}>{icon}</div>
    <h3 style={{color:'var(--text-primary)',fontSize:'1rem',fontWeight:600,marginBottom:6}}>{title}</h3>
    <p style={{color:'var(--text-secondary)',fontSize:'.875rem',maxWidth:280,marginBottom:'1.25rem'}}>{description}</p>
    {action}
  </div>
);

export const Spinner: React.FC<{size?:number}> = ({size=20}) => (
  <span style={{display:'inline-block',width:size,height:size,borderRadius:'50%',border:'2px solid currentColor',borderTopColor:'transparent',animation:'spin .7s linear infinite',opacity:.6}}/>
);

export const Toast: React.FC<{message:string;type?:'success'|'error'|'info';onDismiss:()=>void}> = ({message,type='info',onDismiss}) => {
  useEffect(()=>{const t=setTimeout(onDismiss,3200);return()=>clearTimeout(t);},[onDismiss]);
  const c={success:{bg:'var(--success-muted)',text:'var(--success)'},error:{bg:'var(--error-muted)',text:'var(--error)'},info:{bg:'var(--accent-muted)',text:'var(--accent)'}};
  return(
    <div className="animate-slide" style={{position:'fixed',bottom:20,right:20,zIndex:99,display:'flex',alignItems:'center',gap:12,padding:'.75rem 1rem',borderRadius:12,fontSize:'.875rem',fontWeight:500,minWidth:220,boxShadow:'var(--shadow-lg)',background:c[type].bg,color:c[type].text,border:`1px solid ${c[type].text}30`}}>
      {message}
      <button onClick={onDismiss} style={{marginLeft:'auto',opacity:.6,cursor:'pointer',fontSize:'1.25rem',color:'inherit'}} onMouseEnter={e=>((e.currentTarget as HTMLElement).style.opacity='1')} onMouseLeave={e=>((e.currentTarget as HTMLElement).style.opacity='.6')}>×</button>
    </div>
  );
};
