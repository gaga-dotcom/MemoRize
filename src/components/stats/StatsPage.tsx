import React, { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Flame, Target, BookOpen, Brain, Trophy, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export const StatsPage: React.FC = () => {
  const { token } = useAuthStore();
  const { stats, streak, activity, loadStats } = useAppStore();
  useEffect(() => { if (token) loadStats(token); }, [token]);

  const data = buildData(activity);
  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-.02em' }}>Statistics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.9375rem', marginTop: 4 }}>Your learning progress at a glance.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <SC icon={<Flame size={18}/>} label="Current Streak" value={`${streak?.current_streak??0}d`} sub={`Best: ${streak?.longest_streak??0}d`} color="#f59e0b"/>
        <SC icon={<Brain size={18}/>} label="Cards Studied" value={(stats?.total_cards_studied??0).toLocaleString()} sub={`${stats?.total_sessions??0} sessions`} color="#6366f1"/>
        <SC icon={<Target size={18}/>} label="Accuracy" value={`${Math.round(stats?.accuracy??0)}%`} sub={`${stats?.total_correct??0} correct`} color="#10b981"/>
        <SC icon={<BookOpen size={18}/>} label="Total Decks" value={String(stats?.total_decks??0)} sub={`${stats?.total_cards??0} cards`} color="#ec4899"/>
        <SC icon={<Trophy size={18}/>} label="Longest Streak" value={`${streak?.longest_streak??0}d`} sub="Personal best" color="#8b5cf6"/>
        <SC icon={<Calendar size={18}/>} label="Study Days" value={String(streak?.total_study_days??0)} sub="Total active days" color="#14b8a6"/>
      </div>
      <Chart title="Cards Studied — Last 30 Days" empty={data.every(d=>d.cards===0)} msg="Start studying to see your activity here.">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{top:5,right:5,left:-20,bottom:0}}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="var(--border-subtle)"/>
            <XAxis dataKey="label" tick={{fill:'var(--text-tertiary)',fontSize:11}} axisLine={false} tickLine={false} interval={4}/>
            <YAxis tick={{fill:'var(--text-tertiary)',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:'var(--bg-overlay)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12}} cursor={{stroke:'var(--border)'}}/>
            <Area type="monotone" dataKey="cards" stroke="#6366f1" strokeWidth={2} fill="url(#g1)" name="Cards"/>
          </AreaChart>
        </ResponsiveContainer>
      </Chart>
      <div style={{marginTop:'1.5rem'}}>
        <Chart title="Daily Accuracy — Last 30 Days" empty={data.every(d=>d.accuracy===0)} msg="Accuracy will appear after studying.">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{top:5,right:5,left:-20,bottom:0}}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)"/>
              <XAxis dataKey="label" tick={{fill:'var(--text-tertiary)',fontSize:11}} axisLine={false} tickLine={false} interval={4}/>
              <YAxis domain={[0,100]} tick={{fill:'var(--text-tertiary)',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'var(--bg-overlay)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12}} formatter={(v:any)=>[`${v}%`,'Accuracy']} cursor={{fill:'rgba(99,102,241,.06)'}}/>
              <Bar dataKey="accuracy" fill="#10b981" radius={[4,4,0,0]} name="Accuracy %" maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      </div>
    </div>
  );
};
function buildData(activity:{date:string;cards_studied:number;correct:number}[]) {
  const m:Record<string,{cards:number;accuracy:number}> = {};
  activity.forEach(a=>{m[a.date]={cards:a.cards_studied,accuracy:a.cards_studied>0?Math.round((a.correct/a.cards_studied)*100):0};});
  return Array.from({length:30},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(29-i));
    const k=d.toISOString().split('T')[0];
    return {date:k,label:`${d.getMonth()+1}/${d.getDate()}`,cards:m[k]?.cards??0,accuracy:m[k]?.accuracy??0};
  });
}
const SC: React.FC<{icon:React.ReactNode;label:string;value:string;sub:string;color:string}> = ({icon,label,value,sub,color}) => (
  <div className="animate-fade" style={{padding:'1.25rem',borderRadius:14,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)'}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><span style={{color}}>{icon}</span><span style={{color:'var(--text-tertiary)',fontSize:'.8125rem'}}>{label}</span></div>
    <p style={{color:'var(--text-primary)',fontSize:'1.625rem',fontWeight:700,letterSpacing:'-.025em',lineHeight:1}}>{value}</p>
    <p style={{color:'var(--text-tertiary)',fontSize:'.8125rem',marginTop:6}}>{sub}</p>
  </div>
);
const Chart: React.FC<{title:string;empty:boolean;msg:string;children:React.ReactNode}> = ({title,empty,msg,children}) => (
  <div style={{padding:'1.5rem',borderRadius:16,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)'}}>
    <h3 style={{color:'var(--text-primary)',fontSize:'.9375rem',fontWeight:600,marginBottom:'1.25rem'}}>{title}</h3>
    {empty?<div style={{height:140,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--text-tertiary)',fontSize:'.875rem'}}>{msg}</p></div>:children}
  </div>
);
