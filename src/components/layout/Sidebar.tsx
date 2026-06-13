import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, Folder, Plus, LogOut, Star, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Modal } from '../ui/Modal';
import { ColorPicker } from '../ui/Misc';
import { Button } from '../ui/Button';
import { ProfileModal } from '../profile/ProfileModal';
import { UserResearchModal } from '../research/UserResearchModal';
import { getInitials } from '../../utils';

const NAV = [
  { path:'/dashboard', label:'Dashboard', icon:<LayoutDashboard size={18}/> },
  { path:'/decks',     label:'My Decks',  icon:<BookOpen size={18}/> },
  { path:'/stats',     label:'Statistics', icon:<BarChart2 size={18}/> },
];

export const Sidebar: React.FC = () => {
  const nav=useNavigate(); const loc=useLocation();
  const {user,token,logout}=useAuthStore();
  const {folders,selectedFolderId,setSelectedFolder,createFolder,loadDecks}=useAppStore();
  const [folderModal,setFolderModal]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [researchOpen,setResearchOpen]=useState(false);
  const [name,setName]=useState(''); const [color,setColor]=useState('#6366f1'); const [busy,setBusy]=useState(false);

  const isActive=(p:string)=>loc.pathname.startsWith(p);
  const doCreate=async()=>{
    if(!token||!name.trim())return; setBusy(true);
    try{await createFolder(token,name,color);setFolderModal(false);setName('');setColor('#6366f1');}
    finally{setBusy(false);}
  };
  const openFolder=(id:number)=>{setSelectedFolder(id);if(token)loadDecks(token,id);nav('/decks');};
  const openAll=()=>{setSelectedFolder(null);if(token)loadDecks(token,null);nav('/decks');};

  return(
    <aside style={{width:'var(--sidebar-width)',minWidth:'var(--sidebar-width)',background:'var(--bg-surface)',borderRight:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',height:'100vh',flexShrink:0,transition:'width .2s ease, min-width .2s ease',overflow:'hidden'}}>

      {/* Logo */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 13px',height:'var(--header-height)',borderBottom:'1px solid var(--border-subtle)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:30,height:30,borderRadius:10,background:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',color:'white',fontWeight:800,fontSize:'.875rem',flexShrink:0,boxShadow:'0 0 12px rgba(99,102,241,.35)'}}>M</div>
        <span className="sidebar-logo-text" style={{color:'var(--text-primary)',fontWeight:700,fontSize:'1rem',letterSpacing:'-.025em',whiteSpace:'nowrap'}}>
          Memo<span style={{color:'var(--accent)'}}>Rize</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{padding:'.75rem .5rem 0',display:'flex',flexDirection:'column',gap:2}}>
        {NAV.map(item=>(
          <NavBtn key={item.path} icon={item.icon} label={item.label} active={isActive(item.path)} onClick={()=>nav(item.path)}/>
        ))}
      </nav>

      {/* Folders */}
      <div style={{flex:1,overflowY:'auto',padding:'1.25rem .5rem 0'}}>
        <div className="sidebar-section" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 8px',marginBottom:4}}>
          <span style={{fontSize:'.75rem',fontWeight:600,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'.06em'}}>Folders</span>
          <button onClick={()=>setFolderModal(true)} title="New folder"
            style={{display:'flex',alignItems:'center',justifyContent:'center',width:22,height:22,borderRadius:5,color:'var(--text-tertiary)',transition:'color .15s'}}
            onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color='var(--text-primary)')}
            onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color='var(--text-tertiary)')}>
            <Plus size={14}/>
          </button>
        </div>
        <NavBtn icon={<Star size={15}/>} label="All Decks" active={loc.pathname==='/decks'&&selectedFolderId===null} onClick={openAll} small/>
        {folders.map(f=>(
          <NavBtn key={f.id} icon={<Folder size={15}/>} label={f.name} active={selectedFolderId===f.id}
            onClick={()=>openFolder(f.id)} accent={f.color} count={f.deck_count} small/>
        ))}
      </div>

      {/* Research */}
      <div style={{padding:'0 .5rem .5rem'}}>
        <button onClick={()=>setResearchOpen(true)} title="Share Feedback"
          className="sidebar-research"
          style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:9,color:'var(--text-tertiary)',fontSize:'.8125rem',transition:'all .12s',textAlign:'left',cursor:'pointer'}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--bg-elevated)';(e.currentTarget as HTMLElement).style.color='var(--text-primary)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='var(--text-tertiary)';}}>
          <ClipboardList size={15} style={{flexShrink:0}}/>
          <span className="sidebar-label">Share Feedback</span>
        </button>
      </div>

      {/* User */}
      <div style={{padding:'.625rem .5rem',borderTop:'1px solid var(--border-subtle)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 6px',borderRadius:10,cursor:'pointer',transition:'background .15s'}}
          onClick={()=>setProfileOpen(true)} title="Edit profile"
          onMouseEnter={e=>((e.currentTarget as HTMLElement).style.background='var(--bg-elevated)')}
          onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:30,height:30,borderRadius:'50%',background:user?.avatar_color??'var(--accent)',color:'white',fontSize:'.8125rem',fontWeight:600,flexShrink:0}}>
            {getInitials(user?.username??'U')}
          </div>
          <div className="sidebar-user-text" style={{flex:1,minWidth:0}}>
            <p style={{fontSize:'.875rem',fontWeight:500,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.username}</p>
            <p style={{fontSize:'.75rem',color:'var(--text-tertiary)'}}>Edit profile</p>
          </div>
          <button onClick={e=>{e.stopPropagation();logout();}} title="Sign out"
            style={{display:'flex',alignItems:'center',justifyContent:'center',padding:4,borderRadius:6,color:'var(--text-tertiary)',transition:'color .15s',flexShrink:0}}
            onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color='var(--error)')}
            onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color='var(--text-tertiary)')}>
            <LogOut size={15}/>
          </button>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={folderModal} onClose={()=>setFolderModal(false)} title="New Folder" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={()=>setFolderModal(false)}>Cancel</Button><Button size="sm" onClick={doCreate} loading={busy} disabled={!name.trim()}>Create</Button></>}>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <label style={{fontSize:'.875rem',fontWeight:500,color:'var(--text-secondary)'}}>Folder name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mathematics" autoFocus onKeyDown={e=>e.key==='Enter'&&doCreate()}/>
          </div>
          <div><label style={{display:'block',fontSize:'.875rem',fontWeight:500,color:'var(--text-secondary)',marginBottom:8}}>Color</label><ColorPicker value={color} onChange={setColor}/></div>
        </div>
      </Modal>
      <ProfileModal isOpen={profileOpen} onClose={()=>setProfileOpen(false)}/>
      <UserResearchModal isOpen={researchOpen} onClose={()=>setResearchOpen(false)}/>
    </aside>
  );
};

const NavBtn: React.FC<{icon:React.ReactNode;label:string;active?:boolean;onClick:()=>void;accent?:string;count?:number;small?:boolean}> = ({icon,label,active,onClick,accent,count,small}) => (
  <button onClick={onClick} title={label}
    style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:small?'6px 8px':'8px 8px',borderRadius:9,background:active?'var(--accent-muted)':'transparent',color:active?'var(--accent)':'var(--text-secondary)',fontWeight:active?600:400,fontSize:small?'.8125rem':'.875rem',transition:'all .12s',textAlign:'left',boxShadow:active?'inset 2px 0 0 var(--accent)':'none'}}
    onMouseEnter={e=>{if(!active){(e.currentTarget as HTMLElement).style.background='var(--bg-elevated)';(e.currentTarget as HTMLElement).style.color='var(--text-primary)';}}}
    onMouseLeave={e=>{if(!active){(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='var(--text-secondary)';}}}
  >
    <span style={{color:active?'var(--accent)':(accent??'currentColor'),display:'flex',flexShrink:0}}>{icon}</span>
    <span className="sidebar-label" style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    {count!==undefined&&count>0&&<span className="sidebar-count" style={{fontSize:'.75rem',padding:'1px 6px',borderRadius:999,background:'var(--bg-overlay)',color:'var(--text-tertiary)'}}>{count}</span>}
  </button>
);
