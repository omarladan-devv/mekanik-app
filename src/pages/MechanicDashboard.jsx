import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToPendingJobs, listenToActiveJobForMechanic, acceptJob, updateMechanicStatus, updateJobStatus } from '../services/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MechanicActiveJob from './MechanicActiveJob';
import MyListings from './MyListings';

export default function MechanicDashboard() {
  const { currentUser, userData } = useAuth();
  const [pendingJobs, setPendingJobs]   = useState([]);
  const [activeJob,   setActiveJob]     = useState(undefined);
  const [avail, setAvail]               = useState(userData?.status || 'offline');
  const [accepting, setAccepting]       = useState(null);
  const [showListings, setShowListings] = useState(false);

  useEffect(() => {
    const unsub = listenToActiveJobForMechanic(currentUser.uid, job => {
      setActiveJob(job || null);
    });
    return () => unsub();
  }, [currentUser.uid]);

  useEffect(() => {
    const unsub = listenToPendingJobs(currentUser.uid, setPendingJobs);
    return () => unsub();
  }, [currentUser.uid]);

  // Track and update live location
  useEffect(() => {
    if (!navigator.geolocation || avail !== 'online') return;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateDoc(doc(db, 'users', currentUser.uid), { location: loc }).catch(console.error);
      },
      err => console.error("Location error", err),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [avail, currentUser.uid]);

  async function handleAccept(jobId) {
    setAccepting(jobId);
    try { await acceptJob(jobId, currentUser.uid, userData?.name || 'Mechanic'); }
    catch { alert('Failed to accept job.'); setAccepting(null); }
  }

  async function handleSetAvail(s) {
    setAvail(s);
    await updateMechanicStatus(currentUser.uid, s);
  }

  if (activeJob === undefined) {
    return (
      <div style={{ display:'flex', justifyContent:'center', paddingTop:'80px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2.5px solid #e8eaf0', borderTopColor:'#ff6a3d', animation:'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (activeJob) return <MechanicActiveJob jobId={activeJob.id} />;
  if (showListings) return <MyListings onBack={() => setShowListings(false)} />;

  const AVAIL = [
    { k:'online', lbl:'ONLINE',  cls:'on'   },
    { k:'busy',   lbl:'BUSY',    cls:'busy'  },
    { k:'offline',lbl:'OFFLINE', cls:'off'   },
  ];
  const availColors = { online:'#16a34a', busy:'#ff6a3d', offline:'#6b7384' };

  return (
    <div>
      {/* Profile card */}
      <div className="card" style={{ marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
          <div className="ava" style={{ background:'linear-gradient(150deg,#22c55e,#16a34a)', width:'54px', height:'54px' }}>
            {userData?.name?.[0] || 'M'}
            <div className="vbadge">✓</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:'800', fontSize:'17px', letterSpacing:'-.3px' }}>{userData?.name}</div>
            <div style={{ fontSize:'12.5px', color:'var(--slate)', marginTop:'2px' }}>
              ⭐ {userData?.rating || '5.0'} · {userData?.jobsDone || 0} jobs ·{' '}
              <span style={{ color:'var(--teal)', fontWeight:'600' }}>Verified</span>
            </div>
          </div>
          <button onClick={() => setShowListings(true)} style={{
            border:'1.5px solid var(--line)', background:'var(--bg)', borderRadius:'12px',
            padding:'8px 12px', cursor:'pointer', color:'var(--slate)',
            fontSize:'13px', fontWeight:'600', fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0,
          }}>
            My Parts
          </button>
        </div>

        {/* Availability toggle */}
        <div style={{
          display:'flex', background:'var(--bg)',
          borderRadius:'14px', padding:'5px',
          border:'1px solid var(--line)', gap:'2px',
        }}>
          {AVAIL.map(a => (
            <button key={a.k} onClick={() => handleSetAvail(a.k)} style={{
              flex:1, border:'none', padding:'10px 4px', borderRadius:'10px', cursor:'pointer',
              fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', letterSpacing:'.5px',
              transition:'.25s',
              background: avail === a.k ? availColors[a.k] : 'none',
              color: avail === a.k ? '#fff' : 'var(--slate-2)',
              boxShadow: avail === a.k ? `0 6px 14px -6px ${availColors[a.k]}` : 'none',
            }}>{a.lbl}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:'20px' }}>
        <div className="stat">
          <div className="v"><span className="cur">₦</span>{((userData?.earnings || 0)/1000).toFixed(0)}k</div>
          <div className="l">Earnings</div>
          <div className="trend">↑ 12% vs last week</div>
        </div>
        <div className="stat">
          <div className="v">{userData?.jobsDone || 0}</div>
          <div className="l">Jobs done</div>
          <div className="trend">Total completed</div>
        </div>
        <div className="stat">
          <div className="v">{userData?.rating || '5.0'}★</div>
          <div className="l">Rating</div>
          <div className="trend">Top 5% in area</div>
        </div>
        <div className="stat">
          <div className="v">{userData?.acceptRate || 96}%</div>
          <div className="l">Accept rate</div>
          <div className="trend">Excellent</div>
        </div>
      </div>

      {/* Incoming requests */}
      <span className="label">Incoming requests</span>

      {avail !== 'online' ? (
        <div style={{ textAlign:'center', padding:'44px 20px', color:'var(--slate-2)', fontSize:'13.5px', lineHeight:1.5 }}>
          <div style={{ fontSize:'44px', marginBottom:'12px', opacity:.4 }}>
            {avail === 'busy' ? '🔧' : '😴'}
          </div>
          You're {avail}.<br/>Switch to Online to receive new job requests.
        </div>
      ) : pendingJobs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'44px 20px', color:'var(--slate-2)', fontSize:'13.5px', lineHeight:1.5 }}>
          <div style={{ fontSize:'44px', marginBottom:'12px', opacity:.4 }}>📭</div>
          No new requests right now.<br/>You'll be notified when one comes in.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {pendingJobs.map(job => (
            <div key={job.id} style={{
              background:'var(--surface)',
              border:'1.5px solid var(--accent)',
              borderRadius:'20px', padding:'17px',
              boxShadow:'0 0 0 4px rgba(255,106,61,.09), var(--shadow)',
              animation:'slideIn .4s',
            }}>
              <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                <div style={{ fontWeight:'800', fontSize:'16px', letterSpacing:'-.3px' }}>
                  {job.service?.nm || 'Service request'}
                </div>
                <span style={{
                  background:'var(--accent)', color:'#fff',
                  fontSize:'9.5px', fontWeight:'700', padding:'4px 10px',
                  borderRadius:'20px', fontFamily:"'JetBrains Mono',monospace",
                  letterSpacing:'.5px', animation:'beat 1.5s infinite', flexShrink:0,
                }}>● NEW</span>
                <style>{`@keyframes beat{0%,100%{box-shadow:0 0 0 0 rgba(255,106,61,.45)}50%{box-shadow:0 0 0 8px rgba(255,106,61,0)}}`}</style>
              </div>
              <div style={{ fontSize:'13px', color:'var(--slate)', marginBottom:'6px' }}>
                📍 {job.service?.ds || 'Customer needs assistance'}
              </div>
              <div style={{ fontSize:'13px', color:'var(--slate)', marginBottom:'14px' }}>
                💰 Est. ₦{((job.service?.basePrice || 8000)).toLocaleString()}
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button className="btn btn-ghost" style={{ margin:0, padding:'13px', fontSize:'14px', borderRadius:'14px' }}
                  onClick={() => updateJobStatus(job.id, 'declined')}>Decline</button>
                <button
                  className="btn btn-primary"
                  style={{ margin:0, padding:'13px', fontSize:'14px', borderRadius:'14px', opacity: accepting === job.id ? .6 : 1 }}
                  onClick={() => handleAccept(job.id)}
                  disabled={accepting === job.id}
                >
                  {accepting === job.id ? 'Accepting…' : 'Accept job →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
