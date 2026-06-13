import { createHash, randomUUID } from 'crypto';
import { query, queryOne, run, insert } from '../db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

export interface SessionData {
  token: string;
  user: User;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(password + salt).digest('hex');
}

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981'];

function pickColor(name: string): string {
  const idx = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[idx];
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export function register(args: { username: string; email: string; password: string }): SessionData {
  const { username, email, password } = args;

  if (!username.trim() || !email.trim()) throw new Error('Username and email are required.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  const conflict = queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM users WHERE username = ? OR email = ?',
    [username.trim(), email.trim()]
  );
  if ((conflict?.cnt ?? 0) > 0) throw new Error('Username or email is already taken.');

  const salt = randomUUID();
  const password_hash = hashPassword(password, salt);
  const avatar_color = pickColor(username);

  const userId = insert(
    'INSERT INTO users (username, email, password_hash, salt, avatar_color) VALUES (?, ?, ?, ?, ?)',
    [username.trim(), email.trim(), password_hash, salt, avatar_color]
  );

  run('INSERT INTO user_streaks (user_id) VALUES (?)', [userId]);

  const token = randomUUID();
  run('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, token, expiresAt()]);

  const user = queryOne<User>(
    'SELECT id, username, email, avatar_color, created_at FROM users WHERE id = ?',
    [userId]
  )!;

  return { token, user };
}

export function login(args: { usernameOrEmail: string; password: string }): SessionData {
  const { usernameOrEmail, password } = args;

  const row = queryOne<{
    id: number; username: string; email: string;
    password_hash: string; salt: string; avatar_color: string; created_at: string;
  }>(
    'SELECT id, username, email, password_hash, salt, avatar_color, created_at FROM users WHERE username = ? OR email = ?',
    [usernameOrEmail.trim(), usernameOrEmail.trim()]
  );

  if (!row || hashPassword(password, row.salt) !== row.password_hash) {
    throw new Error('Invalid username/email or password.');
  }

  // Rotate old sessions
  run('DELETE FROM sessions WHERE user_id = ?', [row.id]);

  const token = randomUUID();
  run('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [row.id, token, expiresAt()]);

  const user: User = {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar_color: row.avatar_color,
    created_at: row.created_at,
  };

  return { token, user };
}

export function logout(args: { token: string }): void {
  run('DELETE FROM sessions WHERE token = ?', [args.token]);
}

export function getCurrentUser(args: { token: string }): User {
  const now = new Date().toISOString();
  const user = queryOne<User>(
    `SELECT u.id, u.username, u.email, u.avatar_color, u.created_at
     FROM users u JOIN sessions s ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > ?`,
    [args.token, now]
  );
  if (!user) throw new Error('Session expired. Please log in again.');
  return user;
}

export function getUserIdFromToken(token: string): number {
  const now = new Date().toISOString();
  const row = queryOne<{ user_id: number }>(
    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?',
    [token, now]
  );
  if (!row) throw new Error('Invalid or expired session. Please log in again.');
  return row.user_id;
}

export function updateUser(args: { token: string; username?: string; email?: string; newPassword?: string; currentPassword?: string }): User {
  const { token, username, email, newPassword, currentPassword } = args;
  const userId = getUserIdFromToken(token);

  // If changing password, verify current one first
  if (newPassword) {
    if (!currentPassword) throw new Error('Current password is required to set a new password.');
    const row = queryOne<{ password_hash: string; salt: string }>(
      'SELECT password_hash, salt FROM users WHERE id = ?', [userId]
    );
    if (!row || hashPassword(currentPassword, row.salt) !== row.password_hash) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
    const newSalt = randomUUID();
    const newHash = hashPassword(newPassword, newSalt);
    run('UPDATE users SET password_hash=?, salt=? WHERE id=?', [newHash, newSalt, userId]);
  }

  if (username?.trim()) {
    const conflict = queryOne<{cnt:number}>('SELECT COUNT(*) as cnt FROM users WHERE username=? AND id!=?', [username.trim(), userId]);
    if ((conflict?.cnt??0) > 0) throw new Error('Username is already taken.');
    run('UPDATE users SET username=? WHERE id=?', [username.trim(), userId]);
  }

  if (email?.trim()) {
    const conflict = queryOne<{cnt:number}>('SELECT COUNT(*) as cnt FROM users WHERE email=? AND id!=?', [email.trim(), userId]);
    if ((conflict?.cnt??0) > 0) throw new Error('Email is already in use.');
    run('UPDATE users SET email=? WHERE id=?', [email.trim(), userId]);
  }

  return queryOne<User>('SELECT id, username, email, avatar_color, created_at FROM users WHERE id=?', [userId])!;
}
