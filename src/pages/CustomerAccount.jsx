import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Icon({ children }) {
  return (
    <span className="menu-item-icon" style={{ fontSize: '14px' }}>
      {children}
    </span>
  );
}

export default function CustomerAccount({ onLogout }) {
  const { userData } = useAuth();

  return (
    <div>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--surface2)',
          display: 'grid', placeItems: 'center',
          fontSize: '24px', fontWeight: '700', color: 'var(--text)',
          flexShrink: 0,
        }}>
          {userData?.name?.[0]?.toUpperCase() || 'C'}
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '20px', lineHeight: 1 }}>{userData?.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            {userData?.email}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Wallet</div>
          <div style={{ fontWeight: '700', fontSize: '18px' }}>₦0.00</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Rewards</div>
          <div style={{ fontWeight: '700', fontSize: '18px' }}>0 pts</div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '0 16px' }}>
        {[
          { label: 'Payments',          icon: '$' },
          { label: 'Support',           icon: '?' },
          { label: 'Safety',            icon: '\u25A1' },
          { label: 'Settings',          icon: '\u2699' },
          { label: 'Earn with Mekanik', icon: '+' },
        ].map((item, i, arr) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 0',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--surface2)',
                display: 'grid', placeItems: 'center',
                fontSize: '14px', fontWeight: '700', color: 'var(--text2)',
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '500' }}>{item.label}</span>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: '18px', lineHeight: 1 }}>›</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={onLogout}
        style={{
          width: '100%', marginTop: '24px', padding: '14px',
          background: 'none', border: 'none',
          color: 'var(--red)', fontSize: '15px', fontWeight: '500',
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
