import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomerDashboard from './CustomerDashboard';
import MechanicDashboard from './MechanicDashboard';
import CustomerAccount from './CustomerAccount';

export default function Dashboard() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  async function handleLogout() {
    try { await logout(); navigate('/login'); }
    catch { console.error('Failed to log out'); }
  }

  if (!userData) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', flexDirection:'column', gap:'16px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2px solid var(--border)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }} />
        <div className="sub">Loading your account...</div>
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  const isMech = userData.role === 'mech';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>

      {/* Header */}
      <header style={{
        height: '56px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: '#000',
        borderBottom: '1px solid var(--border)',
        zIndex: 50,
      }}>
        {/* Brand */}
        <div>
          <div style={{ fontSize:'18px', fontWeight:'700', letterSpacing:'-.3px', lineHeight:1 }}>Mekanik</div>
          <div style={{ fontSize:'11px', color:'var(--text2)', marginTop:'2px', fontWeight:'400' }}>
            {isMech ? 'mechanic' : 'customer'}
          </div>
        </div>

        {/* Sign out (mechanic only) */}
        {isMech && (
          <button onClick={handleLogout} style={{
            border:'none', background:'none',
            cursor:'pointer', color:'var(--text2)',
            fontSize:'14px', fontFamily:'Inter,sans-serif', fontWeight:'500',
            padding:'8px 0',
          }}>Sign out</button>
        )}
      </header>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', paddingBottom: isMech ? '0' : '64px' }}>
        <div style={{ maxWidth:'600px', margin:'0 auto', padding:'20px' }}>
          {isMech ? (
             <MechanicDashboard />
          ) : (
             activeTab === 'home' ? <CustomerDashboard /> : <CustomerAccount onLogout={handleLogout} />
          )}
        </div>
      </div>

      {/* Bottom Navigation (Customer Only) */}
      {!isMech && (
        <div className="bottom-nav">
          <div className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <span className="bottom-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span>Home</span>
          </div>
          <div className={`bottom-nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <span className="bottom-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span>Account</span>
          </div>
        </div>
      )}
    </div>
  );
}
