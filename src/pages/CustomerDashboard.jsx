import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createJobRequest, listenToActiveJobForCustomer, getAvailableMechanics, acceptJob } from '../services/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CustomerActiveJob from './CustomerActiveJob';

const SVCS = [
  { id: 'mech',  nm:'Mechanical',     ds:'Engine, brakes, suspension',  ic:'⚙️' },
  { id: 'elec',  nm:'Electrical',     ds:'Wiring, lights, starters',    ic:'⚡' },
  { id: 'body',  nm:'Bodywork',       ds:'Dents & panel beating',       ic:'🔨' },
  { id: 'diag',  nm:'Diagnostics',    ds:'Computer scan & report',      ic:'🩺' },
  { id: 'maint', nm:'Maintenance',    ds:'Oil, filters, servicing',     ic:'🛢️' },
  { id: 'tire',  nm:'Tyre & Battery', ds:'Swap, jump-start',            ic:'🔋' },
];

function getLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()   => resolve(null),
      { timeout: 8000 }
    );
  });
}

const MECH_COLORS = [
  'linear-gradient(150deg,#ff8a4c,#e8481f)',
  'linear-gradient(150deg,#0fb5a4,#0a8276)',
  'linear-gradient(150deg,#6366f1,#4338ca)',
  'linear-gradient(150deg,#f59e0b,#d97706)',
];

export default function CustomerDashboard() {
  const { currentUser } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [mechanics, setMechanics]             = useState([]);
  const [loadingMechs, setLoadingMechs]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [activeJob, setActiveJob]             = useState(undefined);

  useEffect(() => {
    const unsub = listenToActiveJobForCustomer(currentUser.uid, job => {
      setActiveJob(job || null);
    });
    return () => unsub();
  }, [currentUser.uid]);

  async function handleServiceSelect(svc) {
    setSelectedService(svc);
    setLoadingMechs(true);
    try {
      const available = await getAvailableMechanics();
      setMechanics(available);
    } catch (err) {
      console.error(err); alert('Failed to load mechanics.');
    } finally { setLoadingMechs(false); }
  }

  async function handleRequest(mechanicId) {
    setLoading(true);
    try {
      const loc   = await getLocation();
      const jobId = await createJobRequest(currentUser.uid, selectedService, mechanicId);
      if (loc) await updateDoc(doc(db, 'jobs', jobId), { customerLocation: loc });

      // AUTO-MATCH FOR TESTING
      setTimeout(() => {
        acceptJob(jobId, mechanicId).catch(console.error);
      }, 2000);
    } catch (err) {
      console.error(err); alert('Failed to request mechanic. Please try again.');
      setLoading(false);
    }
  }

  if (activeJob === undefined) {
    return (
      <div style={{ display:'flex', justifyContent:'center', paddingTop:'80px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2.5px solid #e8eaf0', borderTopColor:'#ff6a3d', animation:'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (activeJob) return <CustomerActiveJob jobId={activeJob.id} />;

  // Mechanic list
  if (selectedService) {
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
          <button onClick={() => setSelectedService(null)} style={{
            width:'40px', height:'40px', borderRadius:'13px',
            border:'1.5px solid var(--line)', background:'var(--surface)',
            display:'grid', placeItems:'center', cursor:'pointer', fontSize:'16px',
            transition:'.2s', flexShrink: 0,
          }}>←</button>
          <div>
            <div style={{ fontWeight:'800', fontSize:'18px', letterSpacing:'-.3px' }}>{selectedService.nm}</div>
            <div style={{ fontSize:'12px', color:'var(--slate)', marginTop:'1px' }}>Ranked by rating & distance</div>
          </div>
        </div>

        {loadingMechs ? (
          <div style={{ textAlign:'center', padding:'40px' }} className="sub">Finding nearby mechanics…</div>
        ) : mechanics.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px', background:'var(--surface)', borderRadius:'20px', border:'1.5px solid var(--line)' }}>
            <div style={{ fontSize:'36px', marginBottom:'12px', opacity:.4 }}>🔧</div>
            <div style={{ fontWeight:'700', fontSize:'16px', marginBottom:'6px' }}>No mechanics available</div>
            <div className="sub">Please try again later.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {mechanics.map((m, idx) => {
              const basePrice = m.servicePrices?.serviceCharge || 5000;
              const color = MECH_COLORS[idx % MECH_COLORS.length];
              return (
                <div key={m.uid} className="card" style={{ display:'flex', gap:'14px', alignItems:'center' }}>
                  <div className="ava" style={{ background: color }}>
                    {m.name?.[0] || 'M'}
                    <div className="vbadge">✓</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:'700', fontSize:'15.5px', letterSpacing:'-.2px' }}>{m.name}</div>
                    <div style={{ fontSize:'12px', color:'var(--slate)', marginTop:'2px' }}>{m.speciality || selectedService.nm + ' Specialist'}</div>
                    <div style={{ display:'flex', gap:'6px', marginTop:'7px', flexWrap:'wrap' }}>
                      <span className="chip star">★ {m.rating || '5.0'}</span>
                      <span className="chip">₦{Number(basePrice).toLocaleString()} est.</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width:'auto', padding:'12px 18px', fontSize:'14px', borderRadius:'14px' }}
                    onClick={() => handleRequest(m.uid)}
                    disabled={loading}
                  >
                    {loading ? '…' : 'Request'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Home screen
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div className="kicker" style={{ marginBottom:'8px' }}>What do you need?</div>
        <div className="h1" style={{ marginBottom:'8px' }}>Get a mechanic<br/>to your car</div>
        <div className="sub">Pick a service and a verified pro comes to you — tracked, rated, and paid in-app.</div>
      </div>

      {/* Service grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px' }}>
        {SVCS.map(s => (
          <div key={s.id} onClick={() => handleServiceSelect(s)} style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--line)',
            borderRadius: '20px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'transform .18s, box-shadow .2s',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseDown={e => e.currentTarget.style.transform='scale(.97)'}
          onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
          onTouchStart={e => e.currentTarget.style.transform='scale(.97)'}
          onTouchEnd={e => e.currentTarget.style.transform='scale(1)'}
          >
            <div style={{
              width:'42px', height:'42px', borderRadius:'12px',
              background:'var(--bg)', display:'grid', placeItems:'center',
              fontSize:'21px', marginBottom:'12px',
            }}>{s.ic}</div>
            <div style={{ fontWeight:'700', fontSize:'14px', letterSpacing:'-.2px', marginBottom:'3px' }}>{s.nm}</div>
            <div style={{ fontSize:'11.5px', color:'var(--slate-2)', lineHeight:1.35 }}>{s.ds}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
