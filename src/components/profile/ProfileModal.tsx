import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { getInitials, formatRelativeDate } from '../../utils';

interface Props { isOpen: boolean; onClose: () => void; }

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<'info'|'password'>('info');

  // Info tab
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail]       = useState(user?.email ?? '');

  // Password tab
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [ok, setOk]           = useState('');

  const resetState = () => { setErr(''); setOk(''); };

  const saveInfo = async () => {
    resetState();
    if (!username.trim() || !email.trim()) { setErr('Username and email cannot be empty.'); return; }
    setLoading(true);
    try {
      await updateUser({ username: username.trim(), email: email.trim() });
      setOk('Profile updated successfully.');
    } catch (e) { setErr(String(e).replace('Error: ', '')); }
    finally { setLoading(false); }
  };

  const savePassword = async () => {
    resetState();
    if (!currentPw) { setErr('Please enter your current password.'); return; }
    if (newPw.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setErr('New passwords do not match.'); return; }
    setLoading(true);
    try {
      await updateUser({ currentPassword: currentPw, newPassword: newPw });
      setOk('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) { setErr(String(e).replace('Error: ', '')); }
    finally { setLoading(false); }
  };

  const TAB_BTN = (id: 'info'|'password', label: string) => (
    <button onClick={() => { setTab(id); resetState(); }}
      style={{ flex:1, padding:'.4rem', borderRadius:9, background:tab===id?'var(--bg-surface)':'transparent', color:tab===id?'var(--text-primary)':'var(--text-tertiary)', fontSize:'.875rem', fontWeight:tab===id?500:400, boxShadow:tab===id?'var(--shadow-sm)':'none', transition:'all .15s' }}>
      {label}
    </button>
  );

  const LBL: React.CSSProperties = { fontSize:'.875rem', fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile" size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={tab==='info' ? saveInfo : savePassword} loading={loading}>
            {tab==='info' ? 'Save Changes' : 'Change Password'}
          </Button>
        </>
      }>
      {/* Avatar */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:user?.avatar_color??'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.5rem', fontWeight:700, marginBottom:10 }}>
          {getInitials(user?.username ?? 'U')}
        </div>
        <p style={{ color:'var(--text-primary)', fontWeight:600, fontSize:'1rem' }}>{user?.username}</p>
        <p style={{ color:'var(--text-tertiary)', fontSize:'.8125rem' }}>Member since {formatRelativeDate(user?.created_at ?? '')}</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'var(--bg-elevated)', borderRadius:12, padding:4, marginBottom:'1.25rem' }}>
        {TAB_BTN('info', '👤 Profile')}
        {TAB_BTN('password', '🔒 Password')}
      </div>

      {/* Feedback */}
      {err && <div style={{ padding:'.5rem .875rem', borderRadius:8, background:'var(--error-muted)', color:'var(--error)', fontSize:'.875rem', marginBottom:'1rem' }}>{err}</div>}
      {ok  && <div style={{ padding:'.5rem .875rem', borderRadius:8, background:'var(--success-muted)', color:'var(--success)', fontSize:'.875rem', marginBottom:'1rem' }}>{ok}</div>}

      {tab === 'info' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={LBL}><User size={13} style={{ display:'inline', marginRight:5 }}/>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username"/>
          </div>
          <div>
            <label style={LBL}><Mail size={13} style={{ display:'inline', marginRight:5 }}/>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={LBL}><Shield size={13} style={{ display:'inline', marginRight:5 }}/>Current Password</label>
            <div style={{ position:'relative' }}>
              <input type={showCur?'text':'password'} value={currentPw} onChange={e=>setCurrentPw(e.target.value)} placeholder="Enter current password" style={{ paddingRight:'2.5rem' }}/>
              <button type="button" onClick={()=>setShowCur(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', display:'flex' }}>
                {showCur?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>
          <div>
            <label style={LBL}><Lock size={13} style={{ display:'inline', marginRight:5 }}/>New Password</label>
            <div style={{ position:'relative' }}>
              <input type={showNew?'text':'password'} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 6 characters" style={{ paddingRight:'2.5rem' }}/>
              <button type="button" onClick={()=>setShowNew(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', display:'flex' }}>
                {showNew?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>
          <div>
            <label style={LBL}><Lock size={13} style={{ display:'inline', marginRight:5 }}/>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Repeat new password"/>
          </div>
        </div>
      )}
    </Modal>
  );
};
