import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const LogoMark = () => (
  <div style={{
    width: '54px', height: '54px', borderRadius: '16px',
    background: 'linear-gradient(150deg, #ff8a4c, #e8481f)',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 12px 28px -8px #ff6a3d', marginBottom: '20px',
  }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.2-2.4Z" fill="#fff"/>
    </svg>
  </div>
);

export default function Register() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState('cust');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { signup } = useAuth();
  const navigate   = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError(''); setLoading(true);
      await signup(email, password, role, name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: 'radial-gradient(900px 500px at 110% 0%, rgba(255,106,61,.13), transparent 55%), #f5f6f9',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <LogoMark />

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-.5px', marginBottom: '6px', color: '#0e1320' }}>
            Create account
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7384' }}>Join Mekanik today</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {/* Role toggle */}
        <div className="role-toggle" style={{ marginBottom: '24px' }}>
          <button type="button" className={role === 'cust' ? 'active' : ''} onClick={() => setRole('cust')}>
            Customer
          </button>
          <button type="button" className={role === 'mech' ? 'active' : ''} onClick={() => setRole('mech')}>
            Mechanic
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" required value={name}
              onChange={e => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label>Password</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Create a password" />
          </div>
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? 'Creating account…' : 'Sign up'} {!loading && <span>→</span>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7384' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#e8481f', fontWeight: 700 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
