'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const dashboardForRole = {
  CITIZEN: '/citizen/dashboard',
  RANGER: '/ranger/dashboard',
  RESEARCHER: '/researcher/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, logout, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(dashboardForRole[user.role] || '/');
  }, [loading, router, user]);

  if (loading || user) return <Loading />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setBusy(true);
    try {
      const user = await login({ email: normalizedEmail, password });
      const destination = dashboardForRole[user.role];
      if (!destination) {
        logout();
        setError('This account role is not supported. Contact an administrator.');
        return;
      }
      const requested = new URLSearchParams(window.location.search).get('next');
      const intended = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      router.replace(intended || destination);
    } catch (requestError) {
      setError(requestError.message || 'Sign in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-photo">
        <span className="eyebrow">Wildlife conservation</span>
        <h2>Welcome back</h2>
        <p>Sign in to report sightings, follow conservation work, or coordinate field response.</p>
      </div>
      <div className="auth-form">
        <span className="eyebrow">Wildlife Conservation Platform</span>
        <h1>Sign in</h1>
        <p className="muted">Access is tailored to your registered role and permissions, including Citizens, Rangers, and Research Institutions.</p>
        <form className="form" onSubmit={submit}>
          <label>Email<input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label>Password
            <div className="password-field">
              <input autoComplete="current-password" type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required />
              <button type="button" className="show-password" onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          <div className="checkrow">
            <label><input type="checkbox" /> Remember me</label>
            <span className="muted">Password reset: contact an administrator</span>
          </div>
          {error && <p className="alert" role="alert">{error}</p>}
          <button className="button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="muted">New to WildLife? <Link href="/signup">Create an account</Link></p>
      </div>
    </section>
  );
}
