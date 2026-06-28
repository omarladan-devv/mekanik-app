import React, { useEffect, useState } from 'react';
import { listenToActiveJob, updateJobStatus } from '../services/db';
import MapView from '../components/MapView';

export default function CustomerActiveJob({ jobId }) {
  const [job, setJob]             = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [locError, setLocError]   = useState(false);

  // Get real GPS location
  useEffect(() => {
    if (!navigator.geolocation) { setLocError(true); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => { setLocError(true); setMyLocation({ lat: 9.0765, lng: 7.3986 }); }, // fallback: Abuja
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const unsub = listenToActiveJob(jobId, setJob);
    return () => unsub();
  }, [jobId]);

  if (!job) return null;

  const mechLocation = job.mechLocation || null;

  const markers = [];
  if (myLocation)   markers.push({ lat: myLocation.lat,   lng: myLocation.lng,   label: 'A', title: 'You' });
  if (mechLocation) markers.push({ lat: mechLocation.lat, lng: mechLocation.lng, label: 'B', title: 'Mechanic' });

  const route = (myLocation && mechLocation)
    ? { origin: mechLocation, destination: myLocation }
    : null;

  const STATUS_LABELS = {
    pending:    { title: 'Finding a mechanic nearby',          sub: `Searching for a professional for your ${job.service?.nm} issue.`, color: '#276EF1' },
    accepted:   { title: 'Mechanic is on the way',             sub: 'A verified professional is heading to your location.',             color: '#05944F' },
    diagnosing: { title: 'Mechanic has arrived',               sub: 'Your mechanic is now diagnosing your vehicle.',                    color: '#276EF1' },
    repairing:  { title: 'Repair in progress',                 sub: 'Your mechanic is actively working on your car.',                   color: '#276EF1' },
    completed:  { title: 'Repair complete — review the quote', sub: 'Your mechanic has submitted the final cost for your approval.',    color: '#05944F' },
    approved:   { title: 'Quote approved — proceed to pay',    sub: 'Complete the payment below to finalise.',                          color: '#05944F' },
  };

  const st = STATUS_LABELS[job.status] || STATUS_LABELS['pending'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      background: '#000000',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Full-screen map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView
          center={myLocation || { lat: 9.0765, lng: 7.3986 }}
          markers={markers}
          route={route}
          zoom={14}
          style={{ height: '100%' }}
        />

        {/* Service badge top-left */}
        <div style={{
          position: 'absolute', top: '16px', left: '16px',
          background: '#1C1C1E',
          borderRadius: '20px',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', fontWeight: '600', color: '#FFFFFF',
        }}>
          {job.service?.nm} Request
        </div>

        {/* GPS warning */}
        {locError && (
          <div style={{
            position: 'absolute', top: '16px', right: '16px',
            fontSize: '12px', color: '#E11900', fontWeight: '500',
          }}>
            GPS unavailable
          </div>
        )}
      </div>

      {/* ── Bottom status panel ── */}
      <div style={{
        background: '#1C1C1E',
        borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
        padding: '24px',
      }}>
        {/* Status indicator */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: st.color, flexShrink: 0,
            }} />
            <span style={{ fontWeight: '600', fontSize: '16px', color: '#FFFFFF' }}>{st.title}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#8E8E93', marginLeft: '18px' }}>{st.sub}</div>
        </div>

        {/* Animated waiting bar & Cancel (pending only) */}
        {job.status === 'pending' && (
          <div>
            <div style={{ height: '3px', background: '#2C2C2E', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ height: '100%', width: '35%', background: '#276EF1', borderRadius: '2px', animation: 'sweep 1.6s infinite ease-in-out' }} />
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this request?')) {
                  updateJobStatus(job.id, 'cancelled');
                }
              }}
              style={{
                width: '100%', padding: '14px',
                fontSize: '14px', fontWeight: '500', color: '#E11900',
                background: 'none',
                border: '1px solid #3A3A3C',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancel request
            </button>
          </div>
        )}

        {/* Mechanic card (once accepted) */}
        {(job.status !== 'pending') && job.mechanicId && (
          <div style={{
            background: '#2C2C2E',
            borderRadius: '12px', padding: '14px 16px',
            display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#3A3A3C', display: 'grid', placeItems: 'center',
              fontSize: '16px', fontWeight: '600', color: '#FFFFFF', flexShrink: 0,
            }}>M</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#FFFFFF' }}>Your Mechanic</div>
              <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '2px' }}>{job.service?.nm} Specialist</div>
            </div>
            <a href="tel:" style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#2C2C2E', border: '1px solid #3A3A3C',
              display: 'grid', placeItems: 'center',
              fontSize: '18px', textDecoration: 'none', color: '#05944F',
            }}>&#9742;</a>
          </div>
        )}

        {/* Quote approval */}
        {job.status === 'completed' && job.cost?.items?.length > 0 && (
          <QuoteApproval job={job} />
        )}

        {/* TEST MODE OVERRIDE */}
        {job.status !== 'pending' && (
          <div style={{ marginTop: '24px', padding: '16px', border: '1px dashed #3A3A3C', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#8E8E93', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Test Mode (Simulate Mechanic)
            </div>
            
            {job.status === 'accepted' && (
              <button onClick={() => updateJobStatus(job.id, 'diagnosing')} style={testBtnStyle}>Simulate: Arrived</button>
            )}
            {job.status === 'diagnosing' && (
              <button onClick={() => updateJobStatus(job.id, 'repairing')} style={testBtnStyle}>Simulate: Start repair</button>
            )}
            {job.status === 'repairing' && (
              <button onClick={async () => {
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');
                await updateDoc(doc(db, 'jobs', job.id), {
                  status: 'completed',
                  cost: { items: [{ name: 'Diagnostics & Service', price: '12000' }], total: 12000, notes: 'Test mode' }
                });
              }} style={testBtnStyle}>Simulate: Submit Quote (₦12,000)</button>
            )}
            {job.status === 'completed' && (
              <div style={{ fontSize: '13px', color: '#8E8E93' }}>Please approve the quote above.</div>
            )}
            {job.status === 'approved' && (
              <button onClick={() => updateJobStatus(job.id, 'finished')} style={testBtnStyle}>Finish & Return to Home</button>
            )}
          </div>
        )}

        <style>{`
          @keyframes sweep {
            0%   { transform: translateX(-150%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    </div>
  );
}

const testBtnStyle = {
  width: '100%', padding: '12px',
  background: '#2C2C2E', color: '#FFFFFF',
  border: '1px solid #3A3A3C', borderRadius: '6px',
  fontSize: '13px', fontWeight: '500',
  cursor: 'pointer', fontFamily: "'Inter', sans-serif"
};

function QuoteApproval({ job }) {
  const total = job.cost?.total || 0;
  const [approving, setApproving] = useState(false);

  async function approve() {
    setApproving(true);
    await updateJobStatus(job.id, 'approved');
    setApproving(false);
  }

  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8E8E93', marginBottom: '12px', fontWeight: '600' }}>
        Cost Breakdown
      </div>
      {job.cost.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2C2C2E', fontSize: '14px' }}>
          <span style={{ color: '#8E8E93' }}>{item.name}</span>
          <span style={{ color: '#FFFFFF', fontWeight: '500' }}>{'\u20A6'}{item.price?.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 20px', fontWeight: '700', fontSize: '18px' }}>
        <span style={{ color: '#FFFFFF' }}>Total</span>
        <span style={{ color: '#FFFFFF' }}>{'\u20A6'}{total.toLocaleString()}</span>
      </div>
      <button
        onClick={approve}
        disabled={approving}
        style={{
          width: '100%', padding: '16px',
          background: '#276EF1', color: '#FFFFFF',
          border: 'none', borderRadius: '8px',
          fontSize: '15px', fontWeight: '600',
          cursor: approving ? 'default' : 'pointer',
          opacity: approving ? 0.6 : 1,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {approving ? 'Approving...' : `Approve & Pay \u20A6${total.toLocaleString()}`}
      </button>
    </div>
  );
}
