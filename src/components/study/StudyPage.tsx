import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useKeyboard } from '../../hooks/useKeyboard';
import { parseOptions } from '../../utils';
import type { StudyResult } from '../../types';

export const StudyPage: React.FC = () => {
  const { token } = useAuthStore();
  const { studySession,studyCards,studyIndex,studyFlipped,studyResults,flipStudyCard,nextStudyCard,prevStudyCard,recordReview,endStudy,currentDeck } = useAppStore();
  const nav = useNavigate();
  const [finished, setFinished] = useState(false);
  const [selOpt, setSelOpt] = useState<string|null>(null);

  useEffect(() => { if (!studySession && !finished) nav('/decks'); }, [studySession]);
  useEffect(() => { setSelOpt(null); }, [studyIndex]);

  const handleResult = async (r: StudyResult) => {
    if (!token) return;
    const isLast = await recordReview(token, r);
    if (isLast) { await endStudy(token); setFinished(true); }
  };
  const handleExit = async () => { if (token && studySession) await endStudy(token); nav('/decks'); };

  useKeyboard({ ' ':()=>!finished&&flipStudyCard(), ArrowRight:()=>!finished&&nextStudyCard(), ArrowLeft:()=>!finished&&prevStudyCard(), ArrowUp:()=>!finished&&studyFlipped&&handleResult('know'), ArrowDown:()=>!finished&&studyFlipped&&handleResult('dont_know'), Escape:()=>handleExit() });

  if (finished) return <Results cards={studyCards} results={studyResults} onClose={() => nav('/decks')} />;
  if (!studyCards.length) return null;

  const card = studyCards[studyIndex];
  const progress = (studyIndex / studyCards.length) * 100;
  const isMC = card.card_type === 'multiple_choice';
  const opts = parseOptions(card.options);
  const know = Object.values(studyResults).filter(r => r === 'know').length;
  const dont = Object.values(studyResults).filter(r => r === 'dont_know').length;

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg-base)',overflow:'hidden' }}>
      {/* Topbar */}
      <div style={{ display:'flex',alignItems:'center',padding:'1rem 1.5rem',gap:'1rem',borderBottom:'1px solid var(--border-subtle)',flexShrink:0 }}>
        <button onClick={handleExit} style={{ display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)',fontSize:'.875rem',transition:'all .15s',padding:'.375rem .625rem',borderRadius:8,border:'1px solid transparent' }}
          onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.color='var(--text-primary)';el.style.background='var(--bg-elevated)';el.style.borderColor='var(--border)';}}
          onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.color='var(--text-secondary)';el.style.background='transparent';el.style.borderColor='transparent';}}>
          <ChevronLeft size={16}/> Exit
        </button>
        <div style={{ flex:1,display:'flex',flexDirection:'column',gap:4 }}>
          <div style={{ display:'flex',justifyContent:'space-between' }}>
            <span style={{ color:'var(--text-tertiary)',fontSize:'.875rem' }}>{currentDeck?.name}</span>
            <span style={{ color:'var(--text-secondary)',fontSize:'.875rem',fontWeight:500 }}>{studyIndex+1} / {studyCards.length}</span>
          </div>
          <div style={{ height:3,borderRadius:3,background:'var(--bg-overlay)',overflow:'hidden' }}>
            <div style={{ height:'100%',background:'var(--accent)',borderRadius:3,width:`${progress}%`,transition:'width .3s ease' }}/>
          </div>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'.875rem',color:'var(--success)' }}><CheckCircle2 size={15}/>{know}</span>
          <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'.875rem',color:'var(--error)' }}><XCircle size={15}/>{dont}</span>
        </div>
      </div>

      {/* Card */}
      <div className="study-card-wrap" style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',gap:'1.5rem' }}>
        {isMC ? <MCCard card={card} opts={opts} sel={selOpt} onSel={setSelOpt} onResult={handleResult}/>
          : <div className="card-scene" onClick={()=>!studyFlipped&&flipStudyCard()} style={{ width:'100%',maxWidth:680,height:320,cursor:studyFlipped?'default':'pointer' }}>
              <div className={`card-inner${studyFlipped?' flipped':''}`} style={{ width:'100%',height:'100%' }}>
                <div className="card-face" style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:20,padding:'2.5rem',boxShadow:'var(--shadow-md)' }}>
                  <p style={{ color:'var(--text-tertiary)',fontSize:'.8125rem',textTransform:'uppercase',letterSpacing:'.08em',position:'absolute',top:'1.25rem' }}>Question</p>
                  <div className="prose selectable" style={{ textAlign:'center',fontSize:'1.125rem',maxHeight:220,overflowY:'auto' }}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{card.front}</ReactMarkdown>
                  </div>
                  {!studyFlipped&&<p style={{ position:'absolute',bottom:'1.25rem',color:'var(--text-secondary)',fontSize:'.8125rem',display:'flex',alignItems:'center',gap:6 }}>Click card or press <Kbd>Space</Kbd> to reveal answer</p>}
                </div>
                <div className="card-face back" style={{ background:'var(--bg-surface)',border:'1px solid var(--accent)',borderRadius:20,padding:'2.5rem',boxShadow:'var(--shadow-md)' }}>
                  <p style={{ color:'var(--accent)',fontSize:'.8125rem',textTransform:'uppercase',letterSpacing:'.08em',position:'absolute',top:'1.25rem' }}>Answer</p>
                  <div className="prose selectable" style={{ textAlign:'center',fontSize:'1.125rem',maxHeight:220,overflowY:'auto' }}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{card.back}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
        }

        {studyFlipped&&!isMC&&<div className="animate-fade" style={{ display:'flex',gap:'1rem' }}>
          <AB label="Still Learning" color="var(--error)" bg="var(--error-muted)" border="rgba(239,68,68,.2)" icon={<XCircle size={16}/>} onClick={()=>handleResult('dont_know')}/>
          <AB label="Got It" color="var(--success)" bg="var(--success-muted)" border="rgba(16,185,129,.2)" icon={<CheckCircle2 size={16}/>} onClick={()=>handleResult('know')}/>
        </div>}

        <div style={{ display:'flex',gap:'1.5rem',flexWrap:'wrap',justifyContent:'center' }}>
          {!studyFlipped&&!isMC&&<Hint keys={['Space']} label="Flip card"/>}
          {studyFlipped&&!isMC&&<><Hint keys={['↑']} label="Got it" c="var(--success)"/><Hint keys={['↓']} label="Still learning" c="var(--error)"/></>}
          <Hint keys={['←','→']} label="Navigate cards"/>
          <Hint keys={['Esc']} label="Exit"/>
        </div>
      </div>

      <NavArrow dir="left" onClick={prevStudyCard} disabled={studyIndex===0}/>
      <NavArrow dir="right" onClick={nextStudyCard} disabled={studyIndex>=studyCards.length-1}/>
    </div>
  );
};

const MCCard: React.FC<{card:any;opts:string[];sel:string|null;onSel:(s:string)=>void;onResult:(r:StudyResult)=>void}> = ({card,opts,sel,onSel,onResult}) => {
  const done = sel!==null;
  return (
    <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:20,padding:'2rem',boxShadow:'var(--shadow-md)',width:'100%',maxWidth:680 }}>
      <p style={{ color:'var(--text-tertiary)',fontSize:'.8125rem',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'1rem' }}>Multiple Choice</p>
      <div className="prose" style={{ fontSize:'1.0625rem',marginBottom:'1.5rem' }}>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{card.front}</ReactMarkdown>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:'.5rem' }}>
        {opts.map((o,i)=>{
          const correct=o===card.back,selected=o===sel;
          let bg='var(--bg-elevated)',border='transparent',color='var(--text-primary)';
          if(done){if(correct){bg='var(--success-muted)';border='rgba(16,185,129,.3)';color='var(--success)';}else if(selected){bg='var(--error-muted)';border='rgba(239,68,68,.3)';color='var(--error)';}}
          else if(selected){bg='var(--accent-muted)';border='var(--accent)';color='var(--accent)';}
          return(
            <button key={i} disabled={done} onClick={()=>{onSel(o);setTimeout(()=>onResult(correct?'know':'dont_know'),900);}}
              style={{ display:'flex',alignItems:'center',gap:'.75rem',padding:'.75rem 1rem',borderRadius:10,background:bg,border:`1px solid ${border}`,color,textAlign:'left',cursor:done?'default':'pointer',transition:'all .2s',fontSize:'.9375rem' }}>
              <span style={{ width:24,height:24,borderRadius:'50%',border:`1px solid ${color}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8125rem',flexShrink:0,fontWeight:600 }}>{String.fromCharCode(65+i)}</span>
              <span style={{ flex:1 }}>{o}</span>
              {done&&correct&&<CheckCircle2 size={14}/>}
              {done&&selected&&!correct&&<XCircle size={14}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Results: React.FC<{cards:any[];results:Record<number,StudyResult>;onClose:()=>void}> = ({cards,results,onClose}) => {
  const know=Object.values(results).filter(r=>r==='know').length;
  const total=Object.values(results).length;
  const pct=total>0?Math.round((know/total)*100):0;
  return(
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg-base)',gap:'1.5rem' }}>
      <div className="animate-slide" style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3.5rem',marginBottom:'.5rem' }}>{pct>=80?'🎉':pct>=50?'💪':'📚'}</div>
        <h1 style={{ color:'var(--text-primary)',fontSize:'1.75rem',fontWeight:700,letterSpacing:'-.02em' }}>Session Complete!</h1>
        <p style={{ color:'var(--text-secondary)',marginTop:6 }}>{cards.length} cards reviewed</p>
      </div>
      <div className="results-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',width:'100%',maxWidth:480 }}>
        {[['Accuracy',`${pct}%`,'var(--accent)'],['Got It',String(know),'var(--success)'],['Still Learning',String(total-know),'var(--error)']].map(([l,v,c])=>(
          <div key={l} style={{ padding:'1rem',borderRadius:12,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',textAlign:'center' }}>
            <p style={{ color:c as string,fontSize:'1.5rem',fontWeight:700 }}>{v}</p>
            <p style={{ color:'var(--text-tertiary)',fontSize:'.8125rem',marginTop:2 }}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{ width:'100%',maxWidth:480,height:8,borderRadius:8,background:'var(--bg-overlay)',overflow:'hidden' }}>
        <div style={{ height:'100%',background:pct>=70?'var(--success)':pct>=40?'var(--warning)':'var(--error)',width:`${pct}%`,transition:'width .8s ease',borderRadius:8 }}/>
      </div>
      <button onClick={onClose} style={{ display:'flex',alignItems:'center',gap:8,padding:'.75rem 1.75rem',borderRadius:12,background:'var(--bg-elevated)',color:'var(--text-primary)',border:'1px solid var(--border)',fontSize:'.9375rem',fontWeight:500,cursor:'pointer',transition:'background .15s' }}
        onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-overlay)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-elevated)')}>
        <ArrowLeft size={16}/>Back to Decks
      </button>
    </div>
  );
};

const AB: React.FC<{label:string;color:string;bg:string;border:string;icon:React.ReactNode;onClick:()=>void}> = ({label,color,bg,border,icon,onClick}) => (
  <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:8,padding:'.75rem 1.75rem',borderRadius:12,background:bg,color,border:`1px solid ${border}`,fontSize:'.9375rem',fontWeight:500,cursor:'pointer',transition:'opacity .15s' }}
    onMouseEnter={e=>(e.currentTarget.style.opacity='.8')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
    {icon}{label}
  </button>
);
const Kbd: React.FC<{children:React.ReactNode}> = ({children}) => (
  <kbd style={{ padding:'2px 7px',borderRadius:4,background:'var(--bg-overlay)',border:'1px solid var(--border)',fontSize:'.8125rem',fontFamily:'var(--font-mono)' }}>{children}</kbd>
);
const Hint: React.FC<{keys:string[];label:string;c?:string}> = ({keys,label,c}) => (
  <span style={{ display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)',fontSize:'.8125rem' }}>
    {keys.map(k=><Kbd key={k}>{k}</Kbd>)}
    <span style={{ color:c??'inherit' }}>{label}</span>
  </span>
);
const NavArrow: React.FC<{dir:'left'|'right';onClick:()=>void;disabled:boolean}> = ({dir,onClick,disabled}) => (
  <button onClick={onClick} disabled={disabled}
    style={{ position:'fixed',[dir==='left'?'left':'right']:'1.5rem',top:'50%',transform:'translateY(-50%)',width:40,height:40,borderRadius:'50%',background:'var(--bg-surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.3:1,transition:'all .15s' }}
    onMouseEnter={e=>!disabled&&((e.currentTarget as HTMLElement).style.background='var(--bg-elevated)')}
    onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='var(--bg-surface)')}>
    {dir==='left'?<ArrowLeft size={16}/>:<ArrowRight size={16}/>}
  </button>
);
