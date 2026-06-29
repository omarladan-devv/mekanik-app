import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomerDashboard from './CustomerDashboard';
import MechanicDashboard from './MechanicDashboard';
import CustomerAccount from './CustomerAccount';
import PartsMarketplace from './PartsMarketplace';

const LogoMark = () => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '9px',
    background: 'linear-gradient(150deg, #ff8a4c, #e8481f)',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 6px 16px -6px #ff6a3d', flexShrink: 0,
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.2-2.4Z" fill="#fff"/>
    </svg>
  </div>
);

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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', flexDirection:'column', gap:'12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'linear-gradient(150deg, #ff8a4c, #e8481f)',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 8px 20px -8px #ff6a3d',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.2-2.4Z" fill="#fff"/>
          </svg>
        </div>
        <div className="sub">Loading your account…</div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
      </div>
    );
  }

  const isMech = userData.role === 'mech';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        height: '58px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        zIndex: 50,
        boxShadow: '0 2px 12px -4px rgba(14,19,32,.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoMark />
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.3px', lineHeight: 1, color: 'var(--ink)' }}>Mekanik</div>
            <div style={{ fontSize: '10px', color: 'var(--slate-2)', marginTop: '1px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', textTransform: 'uppercase' }}>
              {isMech ? 'Mechanic' : 'Customer'}
            </div>
          </div>
        </div>

        {isMech && (
          <button onClick={handleLogout} style={{
            border: 'none', background: 'none',
            cursor: 'pointer', color: 'var(--slate)',
            fontSize: '14px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: '600',
          }}>Sign out</button>
        )}
      </header>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', paddingBottom: isMech ? '0' : '68px' }}>
        <div style={{ maxWidth:'600px', margin:'0 auto', padding:'20px' }}>
          {isMech ? (
             <MechanicDashboard />
          ) : (
             activeTab === 'home'    ? <CustomerDashboard /> :
             activeTab === 'parts'   ? <PartsMarketplace /> :
                                       <CustomerAccount onLogout={handleLogout} />
          )}
        </div>
      </div>

      {/* Bottom Navigation (Customer Only) */}
      {!isMech && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            )},
            { id: 'parts', label: 'Parts', icon: (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            )},
            { id: 'account', label: 'Account', icon: (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )},
          ].map(tab => (
            <div key={tab.id}
              className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="bottom-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
