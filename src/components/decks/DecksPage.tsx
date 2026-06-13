import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Star, BookOpen, Folder, MoreVertical, Trash2, Edit2, Play } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmptyState, ColorPicker, TagInput, TagChip } from '../ui/Misc';
import { parseTags, pluralize, formatRelativeDate } from '../../utils';
import type { Deck } from '../../types';

export const DecksPage: React.FC = () => {
  const { token } = useAuthStore();
  const { decks, folders, selectedFolderId, searchQuery, setSearchQuery, loadDecks, createDeck, deleteDeck, toggleDeckFavorite, updateDeck } = useAppStore();
  const nav = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => { if (token) loadDecks(token, selectedFolderId ?? null); }, [token, selectedFolderId]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return decks.filter(d => {
      // Favorites filter
      if (favOnly && !d.is_favorite) return false;
      if (!q) return true;
      // Search name, description, AND tags
      const tags = parseTags(d.tags);
      return (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [decks, searchQuery, favOnly]);

  const folderName = selectedFolderId != null ? folders.find(f => f.id === selectedFolderId)?.name : null;
  const favCount = decks.filter(d => d.is_favorite).length;

  return (
    <div className="page-pad" style={{ padding:'2rem 2.5rem', maxWidth:1100, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'1.375rem', letterSpacing:'-.02em', display:'flex', alignItems:'center', gap:8 }}>
            {folderName ? <><Folder size={20} style={{opacity:.6}}/>{folderName}</> : 'My Decks'}
          </h1>
          <p style={{ color:'var(--text-tertiary)', fontSize:'.8125rem', marginTop:2 }}>{pluralize(filtered.length,'deck')}</p>
        </div>
        <Button icon={<Plus size={15}/>} onClick={()=>setCreateOpen(true)}>New Deck</Button>
      </div>

      {/* Search + filter bar */}
      <div style={{ display:'flex', gap:8, marginBottom:'1.5rem' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', pointerEvents:'none' }}/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            placeholder="Search by name, description, or #tag…"
            style={{ paddingLeft:'2.25rem' }}/>
        </div>
        {/* Favorites toggle */}
        <button onClick={()=>setFavOnly(s=>!s)} title="Show favorites only"
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'.625rem 1rem',
            borderRadius:10, border:`1px solid ${favOnly?'#f59e0b':'var(--border)'}`,
            background: favOnly ? 'rgba(245,158,11,.12)' : 'var(--bg-elevated)',
            color: favOnly ? '#f59e0b' : 'var(--text-secondary)',
            fontSize:'.875rem', fontWeight:500, transition:'all .15s', flexShrink:0,
            cursor:'pointer',
          }}>
          <Star size={14} fill={favOnly?'#f59e0b':'none'}/>
          Favorites {favCount>0 && <span style={{fontSize:'.8125rem', opacity:.8}}>({favCount})</span>}
        </button>
      </div>

      {filtered.length===0
        ? <EmptyState icon={<BookOpen size={28}/>}
            title={searchQuery||favOnly ? 'No matches found' : 'No decks yet'}
            description={searchQuery ? 'Try different keywords or check tag spelling.' : favOnly ? 'Star a deck to see it here.' : 'Create your first deck to start studying.'}
            action={!searchQuery&&!favOnly ? <Button icon={<Plus size={14}/>} onClick={()=>setCreateOpen(true)}>Create Deck</Button> : undefined}/>
        : <div className="decks-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
            {filtered.map(d=>(
              <DeckCard key={d.id} deck={d}
                onOpen={()=>nav(`/decks/${d.id}`)}
                onToggleFav={()=>toggleDeckFavorite(token!,d.id)}
                onDelete={()=>deleteDeck(token!,d.id)}
                onUpdate={async p=>updateDeck(token!,d.id,p)}/>
            ))}
          </div>
      }

      <DeckFormModal isOpen={createOpen} onClose={()=>setCreateOpen(false)}
        onSubmit={async p=>{await createDeck(token!,p);setCreateOpen(false);}}
        folders={folders.map(f=>({id:f.id,name:f.name}))} defaultFolderId={selectedFolderId??null}/>
    </div>
  );
};

// ─── DeckCard ─────────────────────────────────────────────────────────────────
const DeckCard: React.FC<{deck:Deck;onOpen:()=>void;onToggleFav:()=>void;onDelete:()=>void;onUpdate:(p:any)=>Promise<void>}> = ({deck,onOpen,onToggleFav,onDelete,onUpdate}) => {
  const tags = parseTags(deck.tags);
  const [menu,setMenu]=useState(false);
  const [edit,setEdit]=useState(false);
  const [del,setDel]=useState(false);
  const { folders } = useAppStore();

  return(
    <div className="animate-fade"
      style={{borderRadius:14,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',overflow:'visible',display:'flex',flexDirection:'column',transition:'border-color .15s, box-shadow .15s',cursor:'pointer',position:'relative'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.3)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.boxShadow='none';}}>
      {/* Color bar */}
      <div style={{height:4,background:deck.color,borderRadius:'14px 14px 0 0'}}/>
      {/* Body */}
      <div style={{padding:'1rem 1.125rem',flex:1,display:'flex',flexDirection:'column'}} onClick={onOpen}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:6}}>
          <h3 style={{color:'var(--text-primary)',fontSize:'.9375rem',fontWeight:600,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{deck.name}</h3>
          <div style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            <button onClick={onToggleFav} title={deck.is_favorite?'Remove from favorites':'Add to favorites'}
              style={{display:'flex',color:deck.is_favorite?'#f59e0b':'var(--text-tertiary)',padding:6,borderRadius:6,transition:'color .15s'}}
              onMouseEnter={e=>!deck.is_favorite&&((e.currentTarget as HTMLElement).style.color='#f59e0b')}
              onMouseLeave={e=>!deck.is_favorite&&((e.currentTarget as HTMLElement).style.color='var(--text-tertiary)')}>
              <Star size={15} fill={deck.is_favorite?'#f59e0b':'none'}/>
            </button>
            <div style={{position:'relative'}}>
              <button onClick={()=>setMenu(s=>!s)} title="More options"
                style={{display:'flex',color:'var(--text-tertiary)',padding:6,borderRadius:6,transition:'color .15s'}}
                onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color='var(--text-primary)')}
                onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color='var(--text-tertiary)')}>
                <MoreVertical size={15}/>
              </button>
              {menu&&(
                <>
                  <div style={{position:'fixed',inset:0,zIndex:100}} onClick={()=>setMenu(false)}/>
                  <div style={{position:'absolute',right:0,top:'calc(100% + 4px)',zIndex:101,background:'var(--bg-overlay)',border:'1px solid var(--border)',borderRadius:10,boxShadow:'var(--shadow-md)',minWidth:150,overflow:'hidden'}}>
                    <MBtn icon={<Edit2 size={13}/>} label="Edit deck" onClick={()=>{setMenu(false);setEdit(true);}}/>
                    <div style={{height:1,background:'var(--border-subtle)',margin:'2px 0'}}/>
                    <MBtn icon={<Trash2 size={13}/>} label="Delete deck" onClick={()=>{setMenu(false);setDel(true);}} danger/>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {deck.description&&<p style={{color:'var(--text-secondary)',fontSize:'.8125rem',lineHeight:1.5,marginBottom:8,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{deck.description}</p>}
        {tags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>{tags.slice(0,3).map(t=><TagChip key={t} tag={t}/>)}{tags.length>3&&<span style={{color:'var(--text-tertiary)',fontSize:'.8125rem',alignSelf:'center'}}>+{tags.length-3}</span>}</div>}
        <div style={{marginTop:'auto'}}><span style={{color:'var(--text-tertiary)',fontSize:'.8125rem'}}>{pluralize(deck.card_count,'card')} · {formatRelativeDate(deck.updated_at)}</span></div>
      </div>
      {/* Open button */}
      <div style={{padding:'.625rem 1.125rem',borderTop:'1px solid var(--border-subtle)'}} onClick={e=>e.stopPropagation()}>
        <button onClick={onOpen} style={{width:'100%',padding:'.5rem',borderRadius:8,background:`${deck.color}18`,color:deck.color,fontSize:'.8125rem',fontWeight:500,display:'flex',alignItems:'center',justifyContent:'center',gap:6,border:`1px solid ${deck.color}28`,transition:'background .15s'}}
          onMouseEnter={e=>(e.currentTarget.style.background=`${deck.color}30`)}
          onMouseLeave={e=>(e.currentTarget.style.background=`${deck.color}18`)}>
          <Play size={13} fill="currentColor"/> Open Deck
        </button>
      </div>

      <DeckFormModal isOpen={edit} onClose={()=>setEdit(false)} onSubmit={async p=>{await onUpdate(p);setEdit(false);}} folders={folders.map(f=>({id:f.id,name:f.name}))} defaultFolderId={deck.folder_id} initialValues={deck} title="Edit Deck"/>
      <ConfirmDialog isOpen={del} onClose={()=>setDel(false)} onConfirm={onDelete} title="Delete Deck" message={`Delete "${deck.name}"? All cards and study history will be removed permanently.`} confirmLabel="Delete" isDestructive/>
    </div>
  );
};

const MBtn: React.FC<{icon:React.ReactNode;label:string;onClick:()=>void;danger?:boolean}> = ({icon,label,onClick,danger}) => (
  <button onClick={onClick}
    style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'.5rem .875rem',fontSize:'.8125rem',color:danger?'var(--error)':'var(--text-secondary)',transition:'background .1s'}}
    onMouseEnter={e=>((e.currentTarget as HTMLElement).style.background='var(--bg-hover)')}
    onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
    {icon}{label}
  </button>
);

// ─── DeckFormModal ────────────────────────────────────────────────────────────
export const DeckFormModal: React.FC<{
  isOpen:boolean; onClose:()=>void;
  onSubmit:(p:any)=>Promise<void>;
  folders:{id:number;name:string}[]; defaultFolderId:number|null;
  initialValues?:Deck; title?:string;
}> = ({isOpen,onClose,onSubmit,folders,defaultFolderId,initialValues,title='New Deck'}) => {
  const [name,setName]=useState(''); const [desc,setDesc]=useState('');
  const [fId,setFId]=useState<number|null>(null); const [color,setColor]=useState('#6366f1');
  const [tags,setTags]=useState<string[]>([]); const [loading,setLoading]=useState(false); const [err,setErr]=useState('');

  useEffect(()=>{
    if(isOpen){
      setName(initialValues?.name??''); setDesc(initialValues?.description??'');
      setFId(initialValues?.folder_id??defaultFolderId); setColor(initialValues?.color??'#6366f1');
      setTags(parseTags(initialValues?.tags??'[]')); setErr('');
    }
  },[isOpen]);

  const handle=async()=>{
    if(!name.trim()){setErr('Deck name is required.');return;}
    setLoading(true);
    try{await onSubmit({name:name.trim(),description:desc.trim(),folderId:fId,color,tags:JSON.stringify(tags)});}
    catch(e){setErr(String(e).replace('Error: ',''));}
    finally{setLoading(false);}
  };

  const LBL:React.CSSProperties={fontSize:'.875rem',fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:6};
  return(
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md"
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={handle} loading={loading} disabled={!name.trim()}>Save Deck</Button></>}>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {err&&<div style={{padding:'.625rem .875rem',borderRadius:8,background:'var(--error-muted)',color:'var(--error)',fontSize:'.875rem'}}>{err}</div>}
        <div><label style={LBL}>Deck name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Calculus — Chapter 3" autoFocus/></div>
        <div><label style={LBL}>Description</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What is this deck about?" rows={2} style={{resize:'none'}}/></div>
        <div><label style={LBL}>Folder</label>
          <select value={fId??''} onChange={e=>setFId(e.target.value?Number(e.target.value):null)} style={{backgroundImage:'none'}}>
            <option value="">No folder</option>
            {folders.map(f=><option key={f.id} value={f.id} style={{background:'#1e1e21'}}>{f.name}</option>)}
          </select>
        </div>
        <div><label style={LBL}>Color</label><ColorPicker value={color} onChange={setColor}/></div>
        <div><label style={LBL}>Tags <span style={{color:'var(--text-tertiary)',fontWeight:400}}>(press Enter to add)</span></label><TagInput tags={tags} onChange={setTags}/></div>
      </div>
    </Modal>
  );
};
