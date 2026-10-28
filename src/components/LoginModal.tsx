import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import './LoginModal.css';

type Tab = 'login' | 'signup';
type RolePick = 'buyer' | 'admin' | 'seller';

const ROLE_MAP: Record<RolePick, Role> = { buyer: 'customer', admin: 'admin', seller: 'seller' };

export const LoginModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useApp();
  const [tab, setTab] = useState<Tab>('login');
  const [rolePick, setRolePick] = useState<RolePick>('buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [storeName, setStoreName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isAuthModalOpen) return null;

  const close = () => {
    setIsAuthModalOpen(false);
    setError(null);
    setOfflineMode(false);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setOfflineMode(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOfflineMode(false);
    setBusy(true);
    try {
      const res = await login(email, password);
      if (res.ok) {
        if (!res.offline) close(); // online: straight in
        else setOfflineMode(true); // offline: stay here, user decides (see notice below)
      } else {
        setError(res.error || 'Sign in failed. Check email and password.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOfflineMode(false);
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await register({
        name,
        email,
        password,
        role: ROLE_MAP[rolePick],
        storeName: rolePick === 'seller' ? storeName : undefined,
      });
      if (res.ok) {
        if (!res.offline) close();
        else setOfflineMode(true);
      } else {
        setError(res.error || 'Could not create account.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pg-login-overlay" onClick={close}>
      <div className="pg-login-orb pg-login-orb1" />
      <div className="pg-login-orb pg-login-orb2" />

      <div className="pg-login-card-wrap" onClick={e => e.stopPropagation()}>
        <div className="pg-login-card">
          <button className="pg-login-close" onClick={close} aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          <div className="pg-login-tabs">
            <button
              type="button"
              className={`pg-login-tab-btn ${tab === 'login' ? 'pg-login-active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`pg-login-tab-btn ${tab === 'signup' ? 'pg-login-active' : ''}`}
              onClick={() => switchTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <div className="pg-login-role-selector" role="group" aria-label="Select account type">
            {(['buyer', 'admin', 'seller'] as RolePick[]).map(r => (
              <button
                key={r}
                type="button"
                className={`pg-login-role-btn ${rolePick === r ? 'pg-login-active' : ''}`}
                onClick={() => setRolePick(r)}
              >
                {r === 'buyer' ? 'Buyer' : r === 'admin' ? 'Admin' : 'Seller'}
              </button>
            ))}
          </div>

          {error && <div className="pg-login-error">{error}</div>}
          {offlineMode && (
            <div className="pg-login-offline">
              Backend unreachable — you are signed in <strong>locally only</strong>. Nothing
              will reach Neon/Cloudinary until the API server is back.
              <button type="button" onClick={close} className="pg-login-btn-submit">
                <span>CONTINUE OFFLINE</span>
              </button>
            </div>
          )}

          {tab === 'login' ? (
            <div>
              <h2>WELCOME BACK</h2>
              <form onSubmit={handleLogin}>
                <div className="pg-login-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="pg-login-field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="pg-login-forgot">
                  <span>Forgot password?</span>
                </div>
                <button className="pg-login-btn-submit" disabled={busy}>
                  <span>{busy ? 'SIGNING IN...' : 'SIGN IN'}</span>
                </button>
              </form>
              <p className="pg-login-footer-note">
                New here?{' '}
                <button type="button" onClick={() => switchTab('signup')}>
                  Create an account →
                </button>
              </p>
            </div>
          ) : (
            <div>
              <h2>CREATE ACCOUNT</h2>
              <form onSubmit={handleSignup}>
                <div className="pg-login-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                {rolePick === 'seller' && (
                  <div className="pg-login-field">
                    <label>Store Name</label>
                    <input
                      type="text"
                      placeholder="My Boutique House"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                    />
                  </div>
                )}
                <div className="pg-login-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="pg-login-field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="pg-login-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                </div>
                <div className="pg-login-terms">
                  <input
                    type="checkbox"
                    id="pg-terms-check"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                  />
                  <label htmlFor="pg-terms-check">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                <button className="pg-login-btn-submit" disabled={busy}>
                  <span>{busy ? 'CREATING...' : 'CREATE ACCOUNT'}</span>
                </button>
              </form>
              <p className="pg-login-footer-note">
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('login')}>
                  Sign in →
                </button>
              </p>
            </div>
          )}

          <div className="pg-login-demo">
            Backend demo — password: demo1234
            <br />
            rosy@rosyglow.com · namaste@himalayanglow.com · elena.rostova@boutique.com
          </div>
        </div>
      </div>
    </div>
  );
};
