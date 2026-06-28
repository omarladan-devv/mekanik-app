import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToMyListings, addPart, deletePart } from '../services/db';

const CATEGORIES = ['Engine', 'Brakes', 'Electrical', 'Body', 'Tires', 'Filters'];

const EMPTY_FORM = { name: '', category: 'Engine', price: '', stock: '1', description: '' };

export default function MyListings({ onBack }) {
  const { currentUser, userData } = useAuth();
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const unsub = listenToMyListings(currentUser.uid, setListings);
    return () => unsub();
  }, [currentUser.uid]);

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      await addPart(currentUser.uid, userData?.name || 'Mechanic', form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      alert('Failed to add part. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(partId) {
    if (!window.confirm('Remove this listing?')) return;
    setDeleting(partId);
    try {
      await deletePart(partId);
    } catch (err) {
      alert('Failed to delete listing.');
    } finally {
      setDeleting(null);
    }
  }

  const inputStyle = {
    background: 'var(--surface2)', border: 'none', borderRadius: '8px',
    padding: '13px 14px', fontFamily: 'Inter, sans-serif', fontSize: '15px',
    color: 'var(--text)', outline: 'none', width: '100%',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        height: '56px', flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onBack} style={{
          border: 'none', background: 'none', cursor: 'pointer',
          color: 'var(--text2)', fontSize: '15px', fontFamily: 'Inter, sans-serif', fontWeight: '500',
        }}>
          ← Back
        </button>
        <div style={{ fontWeight: '700', fontSize: '16px' }}>My Parts</div>
        <button onClick={() => setShowForm(true)} style={{
          border: 'none', background: 'none', cursor: 'pointer',
          color: 'var(--accent)', fontSize: '15px', fontFamily: 'Inter, sans-serif', fontWeight: '600',
        }}>
          + Add
        </button>
      </header>

      {/* Listings */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>No listings yet</div>
            <div className="sub" style={{ marginBottom: '24px' }}>Add your first spare part to the marketplace.</div>
            <button onClick={() => setShowForm(true)} style={{
              border: 'none', background: 'var(--text)', color: 'var(--bg)',
              borderRadius: '8px', padding: '14px 28px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>
              Add a part
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {listings.map(part => (
              <div key={part.id} style={{
                background: 'var(--surface)', borderRadius: '12px', padding: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{part.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                    {part.category} · ₦{Number(part.price).toLocaleString()} · {part.stock} in stock
                  </div>
                  {part.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', lineHeight: 1.4 }}>
                      {part.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(part.id)}
                  disabled={deleting === part.id}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--red)', fontSize: '13px', fontWeight: '500',
                    fontFamily: 'Inter, sans-serif', padding: '4px 0 4px 16px', flexShrink: 0,
                  }}
                >
                  {deleting === part.id ? '...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Part Sheet */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowForm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '600px', margin: '0 auto',
              background: '#1C1C1E', borderRadius: '20px 20px 0 0',
              padding: '24px', paddingBottom: '40px', maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{ width: '36px', height: '4px', background: 'var(--surface2)', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '20px' }}>Add a part</div>

            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Part name *</label>
                <input type="text" required placeholder="e.g. Brake Pad — Toyota Camry 2018"
                  value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e => setField('category', e.target.value)}
                  style={{ ...inputStyle }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Price (₦) *</label>
                  <input type="number" required min="0" placeholder="5000"
                    value={form.price} onChange={e => setField('price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Stock (qty)</label>
                  <input type="number" min="1" placeholder="1"
                    value={form.stock} onChange={e => setField('stock', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Condition, compatibility, any notes..."
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <button type="submit" disabled={saving} style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: '8px',
                background: 'var(--text)', color: 'var(--bg)',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving...' : 'Add to marketplace'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
