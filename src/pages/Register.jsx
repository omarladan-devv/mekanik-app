import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('cust');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password, role, name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            Create account
          </h1>
          <p className="sub">Join Mekanik today</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="role-toggle">
          <button
            type="button"
            className={role === 'cust' ? 'active' : ''}
            onClick={() => setRole('cust')}
          >
            Customer
          </button>
          <button
            type="button"
            className={role === 'mech' ? 'active' : ''}
            onClick={() => setRole('mech')}
          >
            Mechanic
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '14px',
            color: 'var(--text2)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
