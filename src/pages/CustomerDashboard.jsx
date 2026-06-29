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
  const [issueDesc, setIssueDesc]             = useState('');
  const [mechanics, setMechanics]             = useState([]);
  const [loadingMechs, setLoadingMechs]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [activeJob, setActiveJob]             = useState(undefined);
  const [step, setStep]                       = useState('select'); // 'select', 'location', 'mechanics'
  const [selectedMechanicId, setSelectedMechanicId] = useState(null);

  useEffect(() => {
    const unsub = listenToActiveJobForCustomer(currentUser.uid, job => {
      setActiveJob(job || null);
    });
    return () => unsub();
  }, [currentUser.uid]);

  async function handleServiceSelect(svc) {
    setSelectedService(svc);
  }

  async function handleContinue() {
    if (!selectedService) return;
    setStep('location');
  }

  async function handleFindMechanics() {
    setStep('mechanics');
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

  if (step === 'location' && selectedService) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
          <button onClick={() => setStep('select')} style={{
            width:'40px', height:'40px', borderRadius:'13px',
            border:'1.5px solid var(--line)', background:'var(--surface)',
            display:'grid', placeItems:'center', cursor:'pointer', fontSize:'16px',
            transition:'.2s', flexShrink: 0,
          }}>←</button>
          <div style={{ fontWeight:'700', fontSize:'17px', letterSpacing:'-.3px' }}>Confirm your location</div>
        </div>

        <div style={{
          height: '240px', background: '#e9edf2', borderRadius: '22px', position: 'relative', overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg,#dde3ea 0 1px,transparent 1px 40px), repeating-linear-gradient(90deg,#dde3ea 0 1px,transparent 1px 40px)'
          }} />
          <div style={{ position: 'absolute', top: '84px', left: 0, right: 0, height: '18px', background: '#fff', boxShadow: '0 0 0 1px #e3e8ee' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '18px', marginLeft: '-9px', background: '#fff', boxShadow: '0 0 0 1px #e3e8ee' }} />
          
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,var(--bg) 1%,transparent 28%)' }} />
          
          <div style={{ position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50% 50% 50% 2px', rotate: '45deg',
              background: 'var(--ink)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)'
            }}>
              <span style={{ rotate: '-45deg', fontSize: '15px' }}>📍</span>
            </div>
            <div style={{
              background: '#fff', fontSize: '9.5px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
              marginTop: '8px', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.5px'
            }}>YOU ARE HERE</div>
          </div>
          <div style={{
            position: 'absolute', left: '50%', top: '55%', width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(255,106,61,.35)', transform: 'translate(-50%,-50%)',
            animation: 'pulse 2s infinite'
          }} />
        </div>

        <div className="card" style={{ display: 'flex', gap: '13px', alignItems: 'center', marginBottom: '14px' }}>
          <div className="ava" style={{ background: 'var(--ink)' }}>📍</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>Wuse 2, Abuja</div>
            <div className="sub" style={{ fontSize: '12.5px' }}>15 Adetokunbo Ademola Crescent</div>
          </div>
        </div>

        <div className="sub" style={{ fontSize: '13px' }}>
          Drag the pin or edit the address if this isn't exactly right.
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ marginTop: '24px' }}>
          <button className="btn" onClick={handleFindMechanics}>
            Find mechanics nearby <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'mechanics' && selectedService) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <button onClick={() => setStep('location')} style={{
            width:'40px', height:'40px', borderRadius:'13px',
            border:'1.5px solid var(--line)', background:'var(--surface)',
            display:'grid', placeItems:'center', cursor:'pointer', fontSize:'16px',
            transition:'.2s', flexShrink: 0,
          }}>←</button>
          <div>
            <div style={{ fontWeight:'800', fontSize:'18px', letterSpacing:'-.3px' }}>
              {loadingMechs ? 'Searching…' : mechanics.length > 0 ? `${mechanics.length} mechanics nearby` : 'No mechanics'}
            </div>
            <div style={{ fontSize:'12px', color:'var(--slate)', marginTop:'1px' }}>Ranked by rating & distance</div>
          </div>
        </div>

        <div style={{
          height: '160px', background: '#e9edf2', borderRadius: '22px', position: 'relative', overflow: 'hidden',
          marginBottom: '20px', flexShrink: 0
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg,#dde3ea 0 1px,transparent 1px 40px), repeating-linear-gradient(90deg,#dde3ea 0 1px,transparent 1px 40px)'
          }} />
          <div style={{ position: 'absolute', top: '84px', left: 0, right: 0, height: '18px', background: '#fff', boxShadow: '0 0 0 1px #e3e8ee' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '18px', marginLeft: '-9px', background: '#fff', boxShadow: '0 0 0 1px #e3e8ee' }} />
          
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,var(--bg) 1%,transparent 28%)' }} />
          
          <div style={{ position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50% 50% 50% 2px', rotate: '45deg',
              background: 'var(--ink)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)'
            }}>
              <span style={{ rotate: '-45deg', fontSize: '15px' }}>📍</span>
            </div>
          </div>

          <div style={{ position: 'absolute', left: '20%', top: '25%', transform: 'translate(-50%,-50%) rotate(45deg)', width: '30px', height: '30px', borderRadius: '50% 50% 50% 2px', background: 'rgba(255,106,61,.9)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)' }}><span style={{ rotate: '-45deg', fontSize: '12px' }}>🔧</span></div>
          <div style={{ position: 'absolute', right: '15%', top: '35%', transform: 'translate(-50%,-50%) rotate(45deg)', width: '30px', height: '30px', borderRadius: '50% 50% 50% 2px', background: 'rgba(255,106,61,.9)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)' }}><span style={{ rotate: '-45deg', fontSize: '12px' }}>🔧</span></div>
          <div style={{ position: 'absolute', left: '40%', bottom: '15%', transform: 'translate(-50%,-50%) rotate(45deg)', width: '30px', height: '30px', borderRadius: '50% 50% 50% 2px', background: 'rgba(255,106,61,.9)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)' }}><span style={{ rotate: '-45deg', fontSize: '12px' }}>🔧</span></div>
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
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', flex:1 }}>
            {mechanics.map((m, idx) => {
              const basePrice = m.servicePrices?.serviceCharge || 5000;
              const color = MECH_COLORS[idx % MECH_COLORS.length];
              const isSelected = selectedMechanicId === m.uid;
              return (
                <div key={m.uid} onClick={() => setSelectedMechanicId(m.uid)} style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: '20px', padding: '16px',
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  cursor: 'pointer', transition: 'box-shadow .2s, border-color .2s',
                  boxShadow: isSelected ? '0 0 0 4px rgba(255,106,61,.1)' : 'var(--shadow-sm)',
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: color, display: 'grid', placeItems: 'center',
                    fontSize: '24px', fontWeight: '800', color: '#fff', position: 'relative'
                  }}>
                    {m.name?.[0] || 'M'}
                    <div style={{
                      position: 'absolute', bottom: '-4px', right: '-4px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#16a34a', border: '2px solid var(--surface)',
                      display: 'grid', placeItems: 'center', color: '#fff', fontSize: '12px'
                    }}>✓</div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight:'800', fontSize:'17px', letterSpacing:'-.3px', color: 'var(--ink)' }}>{m.name}</div>
                        <div style={{ fontSize:'13px', color:'var(--slate)', marginTop:'2px' }}>{m.speciality || selectedService.nm + ' Specialist'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight:'800', fontSize:'18px', color: 'var(--ink)', letterSpacing: '-.5px' }}>₦{Math.round(basePrice/1000)}k</div>
                        <div style={{ fontSize:'11px', color:'var(--slate-2)', fontFamily: "'JetBrains Mono', monospace" }}>est.</div>
                      </div>
                    </div>
                    
                    <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
                      <span style={{ background: '#fcf6df', color: '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>★ {m.rating || '4.9'}</span>
                      <span style={{ background: '#f1f3f6', color: 'var(--slate)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>📍 {2 + (idx%3)}.{idx} km</span>
                      <span style={{ background: '#f1f3f6', color: 'var(--slate)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>⏱ {8 + (idx*2)} min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <button className="btn" disabled={!selectedMechanicId || loading} onClick={() => handleRequest(selectedMechanicId)} style={{
            opacity: selectedMechanicId ? 1 : 0.4,
            pointerEvents: selectedMechanicId ? 'auto' : 'none',
          }}>
            {loading ? 'Requesting…' : 'Request mechanic'} {!loading && <span>→</span>}
          </button>
        </div>
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
        {SVCS.map(s => {
          const isSelected = selectedService?.id === s.id;
          return (
            <div key={s.id} onClick={() => handleServiceSelect(s)} style={{
              background: 'var(--surface)',
              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: '20px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'transform .18s, box-shadow .2s, border-color .2s',
              boxShadow: isSelected ? '0 0 0 4px rgba(255,106,61,.1)' : 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseDown={e => e.currentTarget.style.transform='scale(.97)'}
            onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform='scale(.97)'}
            onTouchEnd={e => e.currentTarget.style.transform='scale(1)'}
            >
              <div style={{
                width:'42px', height:'42px', borderRadius:'12px',
                background: isSelected ? 'linear-gradient(150deg,var(--accent-2),var(--accent-deep))' : 'var(--bg)',
                display:'grid', placeItems:'center',
                fontSize:'21px', marginBottom:'12px',
                transition: '.2s',
                color: isSelected ? '#fff' : 'inherit',
              }}>{s.ic}</div>
              <div style={{ fontWeight:'700', fontSize:'14px', letterSpacing:'-.2px', marginBottom:'3px' }}>{s.nm}</div>
              <div style={{ fontSize:'11.5px', color:'var(--slate-2)', lineHeight:1.35 }}>{s.ds}</div>
              {isSelected && (
                <div style={{
                  position: 'absolute', top: '14px', right: '14px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  display: 'grid', placeItems: 'center', fontSize: '12px'
                }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      <span className="label" style={{ marginTop: '22px' }}>Describe the issue</span>
      <textarea
        className="field"
        rows="2"
        placeholder="e.g. Car won't start, hearing a clicking sound…"
        value={issueDesc}
        onChange={e => setIssueDesc(e.target.value)}
      />
      
      <div style={{
        marginTop:'11px', border:'1.5px dashed var(--line)', borderRadius:'15px',
        padding:'16px', textAlign:'center', color:'var(--slate)', fontSize:'13px',
        cursor:'pointer', background:'var(--surface)', display:'flex',
        alignItems:'center', justifyContent:'center', gap:'8px',
      }}>
        📷 Add a photo or video <span style={{ color:'var(--slate-2)' }}>(optional)</span>
      </div>

      <div style={{ height: '32px' }} />

      <button
        className="btn"
        disabled={!selectedService}
        onClick={handleContinue}
        style={{
          opacity: selectedService ? 1 : 0.4,
          pointerEvents: selectedService ? 'auto' : 'none',
        }}
      >
        Continue <span>→</span>
      </button>
    </div>
  );
}
