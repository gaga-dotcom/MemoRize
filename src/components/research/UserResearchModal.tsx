import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }

const QUESTIONS = [
  {
    id: 'q1',
    label: 'Overall experience',
    prompt: 'How would you describe your overall experience using MemoRize so far?',
    type: 'textarea',
  },
  {
    id: 'q2',
    label: 'Design experience',
    prompt: 'How would you describe your experience with the design and visual layout of the app?',
    type: 'textarea',
  },
  {
    id: 'q3',
    label: 'Feature usage',
    prompt: 'Can you tell us how you have used the study mode or deck features, if at all?',
    type: 'textarea',
  },
  {
    id: 'q4',
    label: 'Usage patterns',
    prompt: 'In what situations do you use or not use this app during your study sessions?',
    type: 'textarea',
  },
  {
    id: 'q5',
    label: 'Ease of use',
    prompt: 'How easy or difficult was it to complete common tasks like creating a deck or studying cards?',
    type: 'scale',
    scaleLabels: ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy'],
  },
  {
    id: 'q6',
    label: 'Comparison',
    prompt: 'How does MemoRize compare to other study tools or flashcard apps you have used before?',
    type: 'textarea',
  },
  {
    id: 'q7',
    label: 'Most useful parts',
    prompt: 'Which parts of the app were most useful or enjoyable for you to use?',
    type: 'textarea',
  },
  {
    id: 'q8',
    label: 'Improvement ideas',
    prompt: 'What features or changes would help improve your experience or make the app more useful for you?',
    type: 'textarea',
  },
  {
    id: 'q9',
    label: 'Confusing parts',
    prompt: 'Which parts of the app were unclear or confusing for you, if any?',
    type: 'textarea',
  },
  {
    id: 'q10',
    label: 'Recommendation',
    prompt: 'How likely are you to recommend MemoRize to a fellow student, and why?',
    type: 'scale',
    scaleLabels: ['Not at all', 'Unlikely', 'Maybe', 'Likely', 'Definitely'],
  },
];

export const UserResearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = (id: string, val: string) =>
    setAnswers(prev => ({ ...prev, [id]: val }));

  const answered = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const total = QUESTIONS.length;

  const handleSubmit = () => {
    // In a real app, this could be exported to a file or displayed to researcher
    setSubmitted(true);
  };

  const reset = () => { setAnswers({}); setSubmitted(false); };

  const LBL: React.CSSProperties = {
    fontSize: '.8125rem', fontWeight: 600, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6, display: 'block',
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="User Research" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={reset}>Fill Again</Button><Button size="sm" onClick={onClose}>Done</Button></>}>
        <div style={{ textAlign:'center', padding:'2rem 0' }}>
          <CheckCircle2 size={48} style={{ color:'var(--success)', margin:'0 auto 1rem', display:'block' }}/>
          <h3 style={{ color:'var(--text-primary)', fontWeight:600, marginBottom:8 }}>Thank you for your feedback!</h3>
          <p style={{ color:'var(--text-secondary)', fontSize:'.9375rem', lineHeight:1.6 }}>
            Your responses help us understand how to make MemoRize better for every student.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📋 User Research Survey" size="lg"
      footer={
        <>
          <span style={{ fontSize:'.8125rem', color:'var(--text-tertiary)', marginRight:'auto' }}>
            {answered}/{total} answered
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>Skip</Button>
          <Button size="sm" onClick={handleSubmit} disabled={answered === 0}>Submit Feedback</Button>
        </>
      }>

      <p style={{ color:'var(--text-secondary)', fontSize:'.9375rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
        Your honest feedback helps us improve MemoRize. All questions are optional — answer as many as you like. There are no right or wrong answers.
      </p>

      {/* Progress bar */}
      <div style={{ height:3, borderRadius:3, background:'var(--bg-overlay)', marginBottom:'1.5rem', overflow:'hidden' }}>
        <div style={{ height:'100%', background:'var(--accent)', borderRadius:3, width:`${(answered/total)*100}%`, transition:'width .3s ease' }}/>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
        {QUESTIONS.map((q, i) => (
          <div key={q.id}>
            <label style={LBL}>Q{i+1} — {q.label}</label>
            <p style={{ color:'var(--text-primary)', fontSize:'.9375rem', marginBottom:10, lineHeight:1.6 }}>
              {q.prompt}
            </p>

            {q.type === 'textarea' && (
              <textarea
                rows={3}
                value={answers[q.id] ?? ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                placeholder="Share your thoughts…"
                style={{ resize:'vertical', fontSize:'.875rem' }}
              />
            )}

            {q.type === 'scale' && (
              <div style={{ display:'flex', gap:8 }}>
                {q.scaleLabels!.map((label, idx) => {
                  const val = String(idx + 1);
                  const selected = answers[q.id] === val;
                  return (
                    <button key={idx} onClick={() => setAnswer(q.id, val)}
                      style={{
                        flex:1, padding:'.5rem .25rem', borderRadius:9, fontSize:'.75rem', textAlign:'center',
                        background: selected ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                        color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        fontWeight: selected ? 600 : 400, transition:'all .15s', lineHeight:1.3,
                      }}>
                      <div style={{ fontSize:'1.125rem', marginBottom:2 }}>{idx + 1}</div>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};
