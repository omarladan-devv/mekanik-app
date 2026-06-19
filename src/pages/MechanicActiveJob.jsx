import React, { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { listenToActiveJob } from '../services/db';
import MapView from '../components/MapView';

export default function MechanicActiveJob({ jobId }) {
  const [job, setJob]                 = useState(null);
  const [myLocation, setMyLocation]   = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [showCost, setShowCost]       = useState(false);
  const [costItems, setCostItems]     = useState([
    { name: 'Service charge', price: '' },
  ]);
  const [notes, setNotes]             = useState('');
  const watchRef                      = useRef(null);

  // Watch real GPS continuously to broadcast mechanic location
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        // Broadcast location to Firestore so customer map updates
        if (jobId) {
          updateDoc(doc(db, 'jobs', jobId), { mechLocation: loc }).catch(() => {});
        }
      },
      () => setMyLocation({ lat: 9.0820, lng: 7.4200 }), // fallback near Abuja
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [jobId]);

  useEffect(() => {
    const unsub = listenToActiveJob(jobId, setJob);
    return () => unsub();
  }, [jobId]);

  async function advanceStatus(next) {
    await updateDoc(doc(db, 'jobs', jobId), { status: next });
  }

  async function sendQuote() {
    const items = costItems.filter(i => i.name.trim() && i.price);
    if (!items.length) return alert('Add at least one cost item.');
    const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
    setSubmitting(true);
    await updateDoc(doc(db, 'jobs', jobId), {
      status: 'completed',
      cost: { items, notes, total }
    });
    setSubmitting(false);
    setShowCost(false);
  }

  if (!job) return null;

  const customerLoc = job.customerLocation || null;
  const markers = [];
  if (myLocation)   markers.push({ lat: myLocation.lat, lng: myLocation.lng, label: 'A', title: 'You' });
  if (customerLoc)  markers.push({ lat: customerLoc.lat, lng: customerLoc.lng, label: 'B', title: 'Customer' });

  const route = (myLocation && customerLoc && job.status === 'accepted')
    ? { origin: myLocation, destination: customerLoc }
    : null;

  const mapCenter = myLocation || { lat: 9.0765, lng: 7.3986 };

  const statusColor = (() => {
    switch (job.status) {
      case 'accepted': return '#05944F';
      case 'approved': return '#05944F';
      case 'completed': return '#276EF1';
      default: return '#276EF1';
    }
  })();

  const statusLabel = (() => {
    switch (job.status) {
      case 'accepted': return 'En route';
      case 'diagnosing': return 'Diagnosing';
      case 'repairing': return 'Repairing';
      case 'completed': return 'Awaiting approval';
      case 'approved': return 'Approved';
      default: return job.status;
    }
  })();

  const inputStyle = {
    background: '#2C2C2E',
    border: '1px solid #3A3A3C',
    borderRadius: '8px',
    padding: '12px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
  };

  const primaryBtnStyle = {
    width: '100%', padding: '16px',
    background: '#276EF1', color: '#FFFFFF',
    border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#000000',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Full-screen map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView center={mapCenter} markers={markers} route={route} zoom={14} style={{ height: '100%' }} />

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: '16px', left: '16px',
          background: '#1C1C1E',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '13px', fontWeight: '600', color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: statusColor, flexShrink: 0,
          }} />
          {statusLabel}
        </div>
      </div>

      {/* ── Bottom panel ── */}
      <div style={{
        background: '#1C1C1E',
        borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
        padding: '24px',
        maxHeight: '65vh', overflowY: 'auto',
      }}>

        {/* Customer info */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#2C2C2E', display: 'grid', placeItems: 'center',
            fontSize: '16px', fontWeight: '600', color: '#FFFFFF', flexShrink: 0,
          }}>C</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#FFFFFF' }}>{job.service?.nm} Job</div>
            <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '2px' }}>Customer is waiting for you</div>
          </div>
          <a href="tel:" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#2C2C2E', border: '1px solid #3A3A3C',
            display: 'grid', placeItems: 'center',
            fontSize: '18px', textDecoration: 'none', color: '#05944F',
          }}>&#9742;</a>
        </div>

        {/* Action buttons by status */}
        {job.status === 'accepted' && (
          <button style={primaryBtnStyle} onClick={() => advanceStatus('diagnosing')}>
            Arrived · Start diagnosis
          </button>
        )}

        {job.status === 'diagnosing' && (
          <button style={primaryBtnStyle} onClick={() => advanceStatus('repairing')}>
            Start repair
          </button>
        )}

        {job.status === 'repairing' && !showCost && (
          <button style={primaryBtnStyle} onClick={() => setShowCost(true)}>
            Submit cost
          </button>
        )}

        {/* Cost entry */}
        {showCost && job.status !== 'completed' && (
          <div style={{ marginTop: '4px' }}>
            <div style={{
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px',
              color: '#8E8E93', marginBottom: '14px', fontWeight: '600',
            }}>
              Submit Final Cost to Customer
            </div>
            {costItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.name}
                  onChange={e => {
                    const a = [...costItems]; a[i].name = e.target.value; setCostItems(a);
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="number"
                  placeholder={'\u20A6'}
                  value={item.price}
                  onChange={e => {
                    const a = [...costItems]; a[i].price = e.target.value; setCostItems(a);
                  }}
                  style={{ ...inputStyle, width: '100px' }}
                />
                {costItems.length > 1 && (
                  <button onClick={() => setCostItems(costItems.filter((_, j) => j !== i))}
                    style={{
                      width: '36px', height: '36px',
                      border: '1px solid #3A3A3C', background: 'none',
                      color: '#8E8E93', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                    &#10005;
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setCostItems([...costItems, { name: '', price: '' }])}
              style={{
                width: '100%',
                border: '1.5px dashed #3A3A3C', background: 'none',
                color: '#8E8E93', padding: '12px',
                borderRadius: '8px', cursor: 'pointer',
                marginBottom: '12px', fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}>
              + Add item
            </button>
            <textarea
              rows={2}
              placeholder="Notes for customer (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%', resize: 'none', marginBottom: '12px',
              }}
            />
            {/* Preview total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '14px 16px', background: '#2C2C2E',
              borderRadius: '8px', marginBottom: '14px',
              alignItems: 'center',
            }}>
              <span style={{ color: '#8E8E93', fontSize: '14px' }}>Customer Total</span>
              <span style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '18px' }}>
                {'\u20A6'}{costItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0).toLocaleString()}
              </span>
            </div>
            <button
              style={{ ...primaryBtnStyle, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'default' : 'pointer' }}
              disabled={submitting}
              onClick={sendQuote}
            >
              {submitting ? 'Sending...' : 'Send quote to customer'}
            </button>
          </div>
        )}

        {job.status === 'completed' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#FFFFFF', marginBottom: '6px' }}>Waiting for approval</div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              Quote of {'\u20A6'}{job.cost?.total?.toLocaleString()} sent. Customer will review shortly.
            </div>
          </div>
        )}

        {job.status === 'approved' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#05944F', marginBottom: '6px' }}>Payment received</div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              {'\u20A6'}{job.cost?.total?.toLocaleString()} approved and paid.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
