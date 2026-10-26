'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AuthLayout from '@/components/AuthLayout';
import Icon from '@/components/Icon';
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try { const user = await login(username.trim(), password); router.push(`/dashboard/${user.role}`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.'); }
    finally { setLoading(false); }
  }
  function chooseDemo(role: string) {
    const accounts: Record<string,[string,string]> = { Provider:['tajhotel','pass123'], NGO:['feedindia','pass123'], Admin:['admin','admin123'] };
    setUsername(accounts[role][0]); setPassword(accounts[role][1]); setError(''); setDemo(`${role} demo details filled. Select Sign in to continue.`);
  }
  return <AuthLayout><p className="eyebrow">Your next good step</p><h1>Welcome back.</h1><p className="auth-intro">Sign in to plan, coordinate and keep food moving.</p><form onSubmit={submit} className="auth-form" aria-busy={loading}>{error && <div className="error-banner" role="alert">{error}</div>}<label className="field" htmlFor="username"><span>Username</span><input className="input-premium" id="username" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" disabled={loading} /></label><label className="field" htmlFor="password"><span>Password</span><div className="password-field"><input className="input-premium" id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" disabled={loading} /><button type="button" className="icon-button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(v => !v)}><Icon name="eye" /></button></div></label><button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? <><span className="spinner" /> Signing in…</> : <>Sign in <Icon name="arrow" width="16" /></>}</button></form><div className="auth-divider">Explore the local demo</div><div className="demo-choices">{(['Provider','NGO','Admin'] as const).map((role,i) => <button key={role} type="button" onClick={() => chooseDemo(role)} disabled={loading}><Icon name={i === 0 ? 'box' : i === 1 ? 'heart' : 'shield'} />{role}</button>)}</div><p className="demo-caption" role="status">{demo || 'Demo accounts require the seeded backend to be running.'}</p><p className="auth-switch">New to SmartSurplus? <Link href="/register">Create an account</Link></p></AuthLayout>;
}
