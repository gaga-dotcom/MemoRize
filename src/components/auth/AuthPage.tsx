import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';

type Tab = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('login');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-base)', position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 70%)',
      }} />

      <div className="animate-slide" style={{ width: '100%', maxWidth: 420, padding: '0 1rem', position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 16, background: 'var(--accent)',
            boxShadow: 'var(--shadow-glow)', color: 'white', fontWeight: 700,
            fontSize: '1.25rem', marginBottom: '.75rem',
          }}>M</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-.03em', display: 'block' }}>
            MemoRize
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '.875rem', marginTop: 4 }}>
            Your private study companion
          </p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 20, padding: '1.75rem',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 12, padding: 4, marginBottom: '1.5rem' }}>
            {([['login','Sign In'],['register','Register']] as [Tab,string][]).map(([t,label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '.4rem', borderRadius: 9,
                background: tab === t ? 'var(--bg-surface)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '.875rem', fontWeight: tab === t ? 600 : 400,
                boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
};

/* ── Shared field wrapper ── */
const Field: React.FC<{ label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }> = ({ label, icon, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: '.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex' }}>{icon}</span>
      {children}
    </div>
    {error && <p style={{ fontSize: '.75rem', color: 'var(--error)' }}>{error}</p>}
  </div>
);

const ErrBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{ padding: '.625rem .875rem', borderRadius: 8, background: 'var(--error-muted)', color: 'var(--error)', fontSize: '.875rem' }}>{msg}</div>
);

/* ── Login ── */
const LoginForm: React.FC = () => {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [show, setShow] = useState(false); const [err, setErr] = useState('');
  const { login, isLoading } = useAuthStore();
  const { loadFolders, loadDecks } = useAppStore();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      await login(u, p);
      const token = useAuthStore.getState().token!;
      await Promise.all([loadFolders(token), loadDecks(token, null)]);
      nav('/dashboard');
    } catch (er) { setErr(String(er).replace('Error: ', '')); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {err && <ErrBox msg={err} />}
      <Field label="Username or Email" icon={<User size={15} />}>
        <input value={u} onChange={e => setU(e.target.value)} placeholder="Username or email"
          autoComplete="username" required style={{ paddingLeft: '2.25rem' }} />
      </Field>
      <Field label="Password" icon={<Lock size={15} />}>
        <input type={show ? 'text' : 'password'} value={p} onChange={e => setP(e.target.value)}
          placeholder="Your password" autoComplete="current-password" required
          style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </Field>
      <Button type="submit" fullWidth loading={isLoading} size="lg" style={{ marginTop: 4 }}>Sign In</Button>
    </form>
  );
};

/* ── Register ── */
const RegisterForm: React.FC = () => {
  const [u, setU] = useState(''); const [em, setEm] = useState('');
  const [p, setP] = useState(''); const [show, setShow] = useState(false); const [err, setErr] = useState('');
  const { register, isLoading } = useAuthStore();
  const { loadFolders, loadDecks } = useAppStore();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (p.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    try {
      await register(u, em, p);
      const token = useAuthStore.getState().token!;
      await Promise.all([loadFolders(token), loadDecks(token, null)]);
      nav('/dashboard');
    } catch (er) { setErr(String(er).replace('Error: ', '')); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {err && <ErrBox msg={err} />}
      <Field label="Username" icon={<User size={15} />}>
        <input value={u} onChange={e => setU(e.target.value)} placeholder="Choose a username"
          autoComplete="username" required style={{ paddingLeft: '2.25rem' }} />
      </Field>
      <Field label="Email" icon={<Mail size={15} />}>
        <input type="email" value={em} onChange={e => setEm(e.target.value)} placeholder="your@email.com"
          autoComplete="email" required style={{ paddingLeft: '2.25rem' }} />
      </Field>
      <Field label="Password" icon={<Lock size={15} />}>
        <input type={show ? 'text' : 'password'} value={p} onChange={e => setP(e.target.value)}
          placeholder="Min. 6 characters" autoComplete="new-password" required
          style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </Field>
      <Button type="submit" fullWidth loading={isLoading} size="lg" style={{ marginTop: 4 }}>Create Account</Button>
    </form>
  );
};
