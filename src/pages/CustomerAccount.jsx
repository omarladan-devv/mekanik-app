import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const MENU_ITEMS = [
  { label: 'Payments',          icon: '💳', sub: 'Cards, wallets & history' },
  { label: 'Support',           icon: '💬', sub: 'Get help from our team' },
  { label: 'Safety',            icon: '🛡️', sub: 'Safety features & policies' },
  { label: 'Settings',          icon: '⚙️', sub: 'Notifications, account' },
  { label: 'Earn with Mekanik', icon: '🔧', sub: 'Refer mechanics, earn cash' },
];

export default function CustomerAccount({ onLogout }) {
  const { userData } = useAuth();

  return (
    <div>
      {/* Profile header */}
      <div style={{
        background: 'linear-gradient(150deg,rgba(255,138,76,.12),rgba(232,72,31,.06))',
        border: '1.5px solid rgba(255,106,61,.15)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'linear-gradient(150deg,#ff8a4c,#e8481f)',
          display: 'grid', placeItems: 'center',
          fontSize: '26px', fontWeight: '800', color: '#fff', flexShrink: 0,
          boxShadow: '0 8px 20px -8px #ff6a3d',
        }}>
          {userData?.name?.[0]?.toUpperCase() || 'C'}
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-.3px', color: 'var(--ink)' }}>
            {userData?.name}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '3px' }}>
            {userData?.email}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Wallet balance', value: '₦0.00' },
          { label: 'Reward points', value: '0 pts' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: '11.5px', color: 'var(--slate-2)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-.4px', color: 'var(--ink)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', borderRadius: '20px', padding: '0 16px' }}>
        {MENU_ITEMS.map((item, i) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '15px 0',
            borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid var(--line-2)' : 'none',
            cursor: 'pointer', transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity='.7'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{
                width: '36px', height: '36px', borderRadius: '11px',
                background: 'var(--bg)',
                border: '1.5px solid var(--line)',
                display: 'grid', placeItems: 'center',
                fontSize: '17px',
              }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-2)', marginTop: '1px' }}>{item.sub}</div>
              </div>
            </div>
            <span style={{ color: 'var(--slate-2)', fontSize: '18px' }}>›</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={onLogout} style={{
        width: '100%', marginTop: '20px', padding: '16px',
        background: 'rgba(232,72,31,.06)', border: '1.5px solid rgba(232,72,31,.15)',
        color: '#e8481f', fontSize: '15px', fontWeight: '700',
        fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: 'pointer',
        borderRadius: '16px', transition: '.15s',
      }}>
        Sign out
      </button>

      <div style={{ height: '12px' }} />
    </div>
  );
}
