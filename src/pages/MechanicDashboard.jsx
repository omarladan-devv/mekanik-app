import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToPendingJobs, listenToActiveJobForMechanic, acceptJob, updateMechanicStatus } from '../services/db';
import MechanicActiveJob from './MechanicActiveJob';

export default function MechanicDashboard() {
  const { currentUser, userData } = useAuth();
  const [pendingJobs, setPendingJobs] = useState([]);
  const [activeJob,   setActiveJob]   = useState(undefined); // undefined = checking
  const [avail, setAvail]             = useState(userData?.status || 'offline');
  const [accepting, setAccepting]     = useState(null);

  // Watch for active job assigned to this mechanic
  useEffect(() => {
    const unsub = listenToActiveJobForMechanic(currentUser.uid, job => {
      setActiveJob(job || null);
    });
    return () => unsub();
  }, [currentUser.uid]);

  // Watch pending jobs only when online & no active job
  useEffect(() => {
    if (avail !== 'online' || activeJob) { setPendingJobs([]); return; }
    const unsub = listenToPendingJobs(currentUser.uid, jobs => setPendingJobs(jobs));
    return () => unsub();
  }, [avail, activeJob, currentUser.uid]);

  async function setStatus(s) {
    setAvail(s);
    await updateMechanicStatus(currentUser.uid, s);
  }

  async function handleAccept(jobId) {
    setAccepting(jobId);
    try { await acceptJob(jobId, currentUser.uid); }
    catch (err) { console.error(err); alert('Failed to accept job.'); }
    finally { setAccepting(null); }
  }

  // Still checking
  if (activeJob === undefined) {
    return (
      <div style={{ display:'flex', justifyContent:'center', paddingTop:'80px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2px solid var(--border)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Active job view
  if (activeJob) return <MechanicActiveJob jobId={activeJob.id} />;

  // ─── Main dashboard ───
  const AVAIL = [
    { k:'online',  lbl:'Online' },
    { k:'busy',    lbl:'Busy' },
    { k:'offline', lbl:'Offline' },
  ];

  function getSegmentStyle(key) {
    const isActive = avail === key;
    if (!isActive) {
      return {
        flex:1, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:'500', fontSize:'13px',
        borderRadius:'6px', padding:'8px',
        background: 'transparent',
        color: 'var(--text3)',
        transition:'all .15s',
      };
    }
    let bg = 'var(--surface2)';
    let color = 'var(--text)';
    if (key === 'online') { bg = 'var(--green)'; color = '#fff'; }
    if (key === 'busy') { bg = '#FFC043'; color = '#000'; }
    return {
      flex:1, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:'600', fontSize:'13px',
      borderRadius:'6px', padding:'8px',
      background: bg,
      color: color,
      transition:'all .15s',
    };
  }

  return (
    <div>
      {/* Profile card */}
      <div style={{
        background:'var(--surface)',
        borderRadius:'12px',
        padding:'20px', marginBottom:'16px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
          <div style={{
            width:'48px', height:'48px', borderRadius:'50%', flexShrink:0,
            background:'var(--surface2)',
            display:'grid', placeItems:'center', fontSize:'18px', fontWeight:'700', color:'var(--text)'
          }}>
            {userData?.name?.[0] || 'M'}
          </div>
          <div>
            <div style={{ fontWeight:'600', fontSize:'17px' }}>{userData?.name}</div>
            <div style={{ fontSize:'13px', color:'var(--text2)', marginTop:'2px' }}>
              {userData?.rating || '5.0'} stars  ·  {userData?.jobsDone || 0} jobs completed
            </div>
          </div>
        </div>

        {/* Availability toggle */}
        <div style={{ display:'flex', background:'var(--bg)', borderRadius:'8px', padding:'3px', gap:'3px' }}>
          {AVAIL.map(a => (
            <button key={a.k} onClick={() => setStatus(a.k)} style={getSegmentStyle(a.k)}>
              {a.lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'24px' }}>
        {[
          { v:`N${(userData?.earnings||0).toLocaleString()}`, l:'Total earnings' },
          { v:`${userData?.jobsDone||0}`,    l:'Jobs done' },
          { v:`${userData?.rating||'5.0'}`,  l:'Rating' },
          { v:`${userData?.acceptRate||'\u2014'}%`, l:'Accept rate' },
        ].map(s => (
          <div key={s.l} style={{ background:'var(--surface)', borderRadius:'12px', padding:'16px' }}>
            <div style={{ fontSize:'22px', fontWeight:'700', letterSpacing:'-.3px' }}>{s.v}</div>
            <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'4px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Requests */}
      <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text2)', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:'12px' }}>Incoming requests</div>

      {avail !== 'online' ? (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--text2)' }}>
          <div style={{ fontWeight:'600', fontSize:'16px', color:'var(--text)', marginBottom:'6px' }}>You are {avail}</div>
          <div style={{ fontSize:'14px' }}>Switch to Online to start receiving job requests.</div>
        </div>
      ) : pendingJobs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--text2)' }}>
          <div style={{ fontWeight:'600', fontSize:'16px', color:'var(--text)', marginBottom:'6px' }}>No requests yet</div>
          <div style={{ fontSize:'14px' }}>Customers in your area will appear here.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {pendingJobs.map(job => (
            <div key={job.id} style={{
              background:'var(--surface)',
              borderRadius:'12px', padding:'18px',
            }}>
              <div style={{ fontWeight:'600', fontSize:'16px', marginBottom:'4px' }}>{job.service?.nm}</div>
              <div style={{ fontSize:'13px', color:'var(--text2)', display:'flex', flexDirection:'column', gap:'4px', marginBottom:'16px' }}>
                <span>Customer nearby</span>
                <span>Requested just now</span>
                <span>{job.service?.ds}</span>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="btn btn-ghost" style={{ flex:1, padding:'12px' }}
                  onClick={() => setPendingJobs(p => p.filter(j => j.id !== job.id))}>
                  Decline
                </button>
                <button className="btn btn-primary" style={{ flex:2, padding:'12px' }}
                  disabled={accepting === job.id}
                  onClick={() => handleAccept(job.id)}>
                  {accepting === job.id ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
