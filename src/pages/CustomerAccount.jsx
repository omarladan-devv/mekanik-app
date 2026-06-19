import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerAccount({ onLogout }) {
  const { userData } = useAuth();

  return (
    <div>
      {/* Profile Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'30px' }}>
        <div style={{
          width:'64px', height:'64px', borderRadius:'50%',
          background:'var(--surface2)', border:'2px solid var(--amber)',
          display:'grid', placeItems:'center', fontSize:'24px', fontWeight:'800', color:'#fff'
        }}>
          {userData?.name?.[0] || 'C'}
        </div>
        <div>
          <div style={{ fontWeight:'800', fontSize:'22px' }}>{userData?.name}</div>
          <div style={{ fontSize:'13px', color:'var(--amber)', fontFamily:"'Space Mono',monospace", marginTop:'4px' }}>
            5.0 ★ Rating
          </div>
        </div>
      </div>

      {/* Stats/Quick Info */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'30px' }}>
        <div className="card" style={{ padding:'16px', textAlign:'center' }}>
          <div style={{ fontSize:'20px', marginBottom:'6px' }}>💳</div>
          <div style={{ fontWeight:'700', fontSize:'14px' }}>Wallet</div>
          <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'2px' }}>₦0.00</div>
        </div>
        <div className="card" style={{ padding:'16px', textAlign:'center' }}>
          <div style={{ fontSize:'20px', marginBottom:'6px' }}>🎁</div>
          <div style={{ fontWeight:'700', fontSize:'14px' }}>Rewards</div>
          <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'2px' }}>0 points</div>
        </div>
      </div>

      {/* Menu List */}
      <div className="menu-list">
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-item-icon">💳</span>
            Payments
          </div>
          <span style={{ color:'var(--text2)' }}>→</span>
        </div>
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-item-icon">🎧</span>
            Support
          </div>
          <span style={{ color:'var(--text2)' }}>→</span>
        </div>
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-item-icon">🛡️</span>
            Safety
          </div>
          <span style={{ color:'var(--text2)' }}>→</span>
        </div>
        <div className="menu-item">
          <div className="menu-item-left">
            <span className="menu-item-icon">⚙️</span>
            Settings
          </div>
          <span style={{ color:'var(--text2)' }}>→</span>
        </div>
        <div className="menu-item" style={{ border:'1.5px solid var(--amber-glow)', background:'rgba(255,122,26,.05)' }}>
          <div className="menu-item-left">
            <span className="menu-item-icon">🔧</span>
            Earn with Mekanik
          </div>
          <span style={{ color:'var(--amber)', fontSize:'12px', fontWeight:'700' }}>Become a Pro</span>
        </div>
      </div>

      {/* Logout */}
      <div style={{ marginTop:'30px', textAlign:'center' }}>
        <button className="btn btn-ghost" onClick={onLogout} style={{ width:'auto', display:'inline-block', padding:'12px 30px' }}>
          Log out
        </button>
      </div>
    </div>
  );
}
