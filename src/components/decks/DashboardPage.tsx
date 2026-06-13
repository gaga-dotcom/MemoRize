import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, Flame, Target, ArrowRight, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { pluralize, formatRelativeDate } from '../../utils';

export const DashboardPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const { stats, streak, activity, decks, loadStats, loadDecks } = useAppStore();
  const nav = useNavigate();
  useEffect(() => { if (token) { loadStats(token); loadDecks(token, null); } }, [token]);

  const today = activity[activity.length - 1];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="animate-fade" style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-.02em' }}>
          {greeting}, <span style={{ color: 'var(--accent)' }}>{user?.username}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '.9375rem' }}>
          {streak?.current_streak ? `You're on a ${streak.current_streak}-day streak. Keep it up!` : 'Ready to study? Pick a deck and get started.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <SC icon={<Flame size={18}/>} label="Day Streak" value={streak?.current_streak ?? 0} suffix="d" color="#f59e0b"/>
        <SC icon={<BookOpen size={18}/>} label="Total Decks" value={stats?.total_decks ?? 0} color="#6366f1"/>
        <SC icon={<Brain size={18}/>} label="Cards Studied" value={stats?.total_cards_studied ?? 0} color="#10b981"/>
        <SC icon={<Target size={18}/>} label="Accuracy" value={Math.round(stats?.accuracy ?? 0)} suffix="%" color="#ec4899"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Section title="Today's Progress">
          {today ? <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <Bar label="Sessions" value={today.sessions} max={5} color="var(--accent)"/>
            <Bar label="Cards Studied" value={today.cards_studied} max={100} color="var(--success)"/>
            <Bar label="Accuracy" value={today.cards_studied>0?Math.round((today.correct/today.cards_studied)*100):0} max={100} color="#ec4899" suffix="%"/>
          </div> : <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Clock size={32} style={{ color: 'var(--text-tertiary)', display: 'block', margin: '0 auto .75rem' }}/>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem' }}>No activity yet today.</p>
          </div>}
        </Section>

        <Section title="Recent Decks" action={<button onClick={() => nav('/decks')} style={{ color: 'var(--accent)', fontSize: '.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>All <ArrowRight size={12}/></button>}>
          {decks.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <BookOpen size={32} style={{ color: 'var(--text-tertiary)', display: 'block', margin: '0 auto .75rem' }}/>
            <button onClick={() => nav('/decks')} style={{ color: 'var(--accent)', fontSize: '.875rem' }}>Create your first deck →</button>
          </div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {decks.slice(0, 4).map(d => <button key={d.id} onClick={() => nav(`/decks/${d.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.625rem .75rem', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '.8125rem' }}>{pluralize(d.card_count, 'card')} · {formatRelativeDate(d.updated_at)}</p>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}/>
            </button>)}
          </div>}
        </Section>
      </div>

      {streak && <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '2rem' }}>
        <Stat label="Current Streak" value={`${streak.current_streak}d`}/>
        <Stat label="Longest Streak" value={`${streak.longest_streak}d`}/>
        <Stat label="Study Days" value={`${streak.total_study_days}`}/>
        <Stat label="Sessions" value={`${stats?.total_sessions ?? 0}`}/>
      </div>}
    </div>
  );
};

const SC: React.FC<{icon:React.ReactNode;label:string;value:number;color:string;suffix?:string}> = ({icon,label,value,color,suffix}) => (
  <div className="animate-fade" style={{padding:'1.25rem',borderRadius:14,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)'}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><span style={{color}}>{icon}</span><span style={{color:'var(--text-tertiary)',fontSize:'.8125rem'}}>{label}</span></div>
    <p style={{color:'var(--text-primary)',fontSize:'1.75rem',fontWeight:700,letterSpacing:'-.03em',lineHeight:1}}>{value.toLocaleString()}{suffix}</p>
  </div>
);
const Section: React.FC<{title:string;children:React.ReactNode;action?:React.ReactNode}> = ({title,children,action}) => (
  <div style={{padding:'1.25rem',borderRadius:14,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
      <h3 style={{color:'var(--text-primary)',fontSize:'.9375rem',fontWeight:600}}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);
const Bar: React.FC<{label:string;value:number;max:number;color:string;suffix?:string}> = ({label,value,max,color,suffix}) => (
  <div>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
      <span style={{color:'var(--text-secondary)',fontSize:'.875rem'}}>{label}</span>
      <span style={{color:'var(--text-primary)',fontSize:'.875rem',fontWeight:600}}>{value}{suffix}</span>
    </div>
    <div style={{height:5,borderRadius:4,background:'var(--bg-overlay)',overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:4,background:color,width:`${Math.min((value/max)*100,100)}%`,transition:'width .6s ease'}}/>
    </div>
  </div>
);
const Stat: React.FC<{label:string;value:string}> = ({label,value}) => (
  <div><p style={{color:'var(--text-tertiary)',fontSize:'.8125rem',marginBottom:2}}>{label}</p><p style={{color:'var(--text-primary)',fontSize:'1rem',fontWeight:600}}>{value}</p></div>
);
