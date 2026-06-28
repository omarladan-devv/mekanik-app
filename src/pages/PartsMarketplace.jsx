import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToParts, createOrder } from '../services/db';

const CATEGORIES = ['All', 'Engine', 'Brakes', 'Electrical', 'Body', 'Tires', 'Filters'];

function PartCard({ part, onSelect }) {
  const outOfStock = part.stock === 0;
  return (
    <div
      onClick={() => !outOfStock && onSelect(part)}
      style={{
        background: 'var(--surface)',
        borderRadius: '12px',
        padding: '16px',
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: outOfStock ? 0.5 : 1,
        transition: 'opacity .15s',
      }}
    >
      {/* Category pill */}
      <span style={{
        display: 'inline-block', marginBottom: '10px',
        background: 'var(--surface2)', borderRadius: '20px',
        padding: '3px 10px', fontSize: '11px', fontWeight: '600', color: 'var(--text2)',
      }}>
        {part.category}
      </span>

      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px', lineHeight: 1.3 }}>
        {part.name}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
        by {part.sellerName}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', fontSize: '17px' }}>
          ₦{Number(part.price).toLocaleString()}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: '600',
          color: part.stock > 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {part.stock > 0 ? `${part.stock} in stock` : 'Out of stock'}
        </span>
      </div>
    </div>
  );
}

function PartDetail({ part, onClose, onOrder }) {
  const [qty, setQty] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  async function handleOrder() {
    setOrdering(true);
    try {
      await onOrder(part, qty);
      setOrdered(true);
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '600px', margin: '0 auto',
          background: '#1C1C1E', borderRadius: '20px 20px 0 0',
          padding: '24px', paddingBottom: '40px',
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', background: 'var(--surface2)', borderRadius: '2px', margin: '0 auto 20px' }} />

        {/* Category */}
        <span style={{
          display: 'inline-block', marginBottom: '10px',
          background: 'var(--surface2)', borderRadius: '20px',
          padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text2)',
        }}>
          {part.category}
        </span>

        <div style={{ fontWeight: '700', fontSize: '20px', marginBottom: '6px', lineHeight: 1.25 }}>
          {part.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
          Listed by {part.sellerName}
        </div>

        {part.description && (
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '20px', lineHeight: 1.6 }}>
            {part.description}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '2px' }}>Price per unit</div>
            <div style={{ fontWeight: '700', fontSize: '24px' }}>₦{Number(part.price).toLocaleString()}</div>
          </div>
          {/* Qty stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
              width: '36px', height: '36px', border: 'none', background: 'var(--surface2)',
              borderRadius: '50%', cursor: 'pointer', fontSize: '18px', color: 'var(--text)',
              fontFamily: 'Inter, sans-serif', display: 'grid', placeItems: 'center',
            }}>−</button>
            <span style={{ fontWeight: '600', fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(part.stock, q + 1))} style={{
              width: '36px', height: '36px', border: 'none', background: 'var(--surface2)',
              borderRadius: '50%', cursor: 'pointer', fontSize: '18px', color: 'var(--text)',
              fontFamily: 'Inter, sans-serif', display: 'grid', placeItems: 'center',
            }}>+</button>
          </div>
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text2)' }}>Total ({qty} {qty === 1 ? 'item' : 'items'})</span>
          <span style={{ fontWeight: '700', fontSize: '18px' }}>₦{(part.price * qty).toLocaleString()}</span>
        </div>

        {ordered ? (
          <div style={{
            textAlign: 'center', padding: '16px', background: 'rgba(5,148,79,.12)',
            borderRadius: '10px', color: 'var(--green)', fontWeight: '600',
          }}>
            Order placed! The seller will contact you shortly.
          </div>
        ) : (
          <button
            onClick={handleOrder}
            disabled={ordering}
            style={{
              width: '100%', padding: '16px', border: 'none', borderRadius: '8px',
              background: 'var(--text)', color: 'var(--bg)',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              opacity: ordering ? 0.6 : 1,
            }}
          >
            {ordering ? 'Placing order...' : `Order · ₦${(part.price * qty).toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PartsMarketplace() {
  const { currentUser } = useAuth();
  const [parts, setParts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    const unsub = listenToParts(data => {
      setParts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return parts.filter(p => {
      const matchCat = category === 'All' || p.category === category;
      const matchQ   = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
                       p.sellerName?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchQ;
    });
  }, [parts, category, search]);

  async function handleOrder(part, qty) {
    await createOrder(currentUser.uid, part, qty);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div className="h1" style={{ margin: '0 0 4px' }}>Parts</div>
        <div className="sub">Browse spare parts from verified mechanics</div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search parts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0, border: 'none', borderRadius: '20px', padding: '8px 16px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              background: category === cat ? 'var(--text)' : 'var(--surface2)',
              color: category === cat ? 'var(--bg)' : 'var(--text2)',
              transition: 'all .15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Parts grid */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin .7s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '6px' }}>No parts found</div>
          <div className="sub">{search ? 'Try a different search term.' : 'No parts listed in this category yet.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {filtered.map(p => (
            <PartCard key={p.id} part={p} onSelect={setSelected} />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selected && (
        <PartDetail
          part={selected}
          onClose={() => setSelected(null)}
          onOrder={handleOrder}
        />
      )}
    </div>
  );
}
