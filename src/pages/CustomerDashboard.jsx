import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createJobRequest, listenToActiveJobForCustomer, getAvailableMechanics } from '../services/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CustomerActiveJob from './CustomerActiveJob';

const SVCS = [
  { id: 'mech',  nm:'Mechanical',    ds:'Engine, brakes, transmission' },
  { id: 'elec',  nm:'Electrical',    ds:'Wiring, battery, lights' },
  { id: 'body',  nm:'Bodywork',      ds:'Panel, dents, paint' },
  { id: 'diag',  nm:'Diagnostics',   ds:'OBD scan & report' },
  { id: 'maint', nm:'Maintenance',   ds:'Oil, filter, fluids' },
  { id: 'tire',  nm:'Tire & Battery', ds:'Swap, jump-start' },
];

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()   => resolve(null),
      { timeout: 8000 }
    );
  });
}

export default function CustomerDashboard() {
  const { currentUser } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [loadingMechs, setLoadingMechs] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [activeJob, setActiveJob] = useState(undefined); // undefined = still checking

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
      console.error(err);
      alert('Failed to load mechanics.');
    } finally {
      setLoadingMechs(false);
    }
  }

  async function handleRequest(mechanicId) {
    setLoading(true);
    try {
      const loc   = await getLocation();
      const jobId = await createJobRequest(currentUser.uid, selectedService, mechanicId);
      if (loc) await updateDoc(doc(db, 'jobs', jobId), { customerLocation: loc });
    } catch (err) {
      console.error(err);
      alert('Failed to request mechanic. Please try again.');
      setLoading(false);
    }
  }

  // Still checking for active job
  if (activeJob === undefined) {
    return (
      <div style={{ display:'flex', justifyContent:'center', paddingTop:'80px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2px solid var(--border)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Active job — full screen map view
  if (activeJob) {
    return <CustomerActiveJob jobId={activeJob.id} />;
  }

  // Step 2: Show Available Mechanics
  if (selectedService) {
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
          <button onClick={() => setSelectedService(null)} style={{
            padding:'0', border:'none', background:'none', cursor:'pointer',
            color:'var(--text2)', fontSize:'15px', fontFamily:'Inter,sans-serif', fontWeight:'500',
          }}>
            &larr; Back
          </button>
        </div>
        <div className="h2" style={{ margin:'0 0 20px' }}>{selectedService.nm}</div>

        {loadingMechs ? (
          <div style={{ textAlign:'center', padding:'40px' }} className="sub">Finding nearby mechanics...</div>
        ) : mechanics.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px', background:'var(--surface)', borderRadius:'12px' }}>
            <div style={{ fontWeight:'600', fontSize:'16px', marginBottom:'6px' }}>No mechanics available</div>
            <div className="sub">Please try again later.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {mechanics.map(m => {
              const basePrice = m.servicePrices?.serviceCharge || 5000;
              return (
                <div key={m.uid} style={{
                  background:'var(--surface)',
                  borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                     <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--surface2)', display:'grid', placeItems:'center', fontWeight:'600', fontSize:'15px', color:'var(--text)' }}>
                       {m.name?.[0] || 'M'}
                     </div>
                     <div>
                       <div style={{ fontWeight:'600', fontSize:'15px' }}>{m.name}</div>
                       <div style={{ fontSize:'13px', color:'var(--text2)', marginTop:'2px' }}>{m.rating || '5.0'} stars  ·  N{Number(basePrice).toLocaleString()} est.</div>
                     </div>
                  </div>
                  <button className="btn btn-primary" style={{ width:'auto', padding:'10px 20px', fontSize:'14px' }} onClick={() => handleRequest(m.uid)} disabled={loading}>
                    Request
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
      {/* Header text */}
      <div style={{ marginBottom:'28px' }}>
        <div className="h1" style={{ margin:'0 0 6px' }}>Get a mechanic</div>
        <div className="sub">Choose a service to get started</div>
      </div>

      {/* Service grid — 2 columns */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
        {SVCS.map(s => (
          <div key={s.id} onClick={() => handleServiceSelect(s)} style={{
            background: 'var(--surface)',
            borderRadius:'12px', padding:'20px 16px', cursor:'pointer',
            transition:'background .15s',
          }}>
            <div style={{ fontWeight:'600', fontSize:'15px', marginBottom:'4px' }}>{s.nm}</div>
            <div style={{ fontSize:'13px', color:'var(--text2)', lineHeight:1.4 }}>{s.ds}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
