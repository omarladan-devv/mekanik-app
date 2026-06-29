import React, { useEffect, useState } from 'react';
import { listenToActiveJob, updateJobStatus } from '../services/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MapView from '../components/MapView';

const STATUS_LABELS = {
  pending:    { title: 'Finding a mechanic nearby',          sub: 'Searching for a professional near you.',                         color: '#ff6a3d' },
  accepted:   { title: 'Mechanic is on the way',             sub: 'A verified professional is heading to your location.',           color: '#16a34a' },
  diagnosing: { title: 'Mechanic has arrived',               sub: 'Your mechanic is now diagnosing your vehicle.',                  color: '#0fb5a4' },
  repairing:  { title: 'Repair in progress',                 sub: 'Your mechanic is actively working on your car.',                 color: '#ff6a3d' },
  completed:  { title: 'Repair complete — review the quote', sub: 'Your mechanic has submitted the final cost for your approval.',  color: '#16a34a' },
  approved:   { title: 'Quote approved — payment complete',  sub: 'Your payment has been processed successfully.',                  color: '#16a34a' },
};

export default function CustomerActiveJob({ jobId }) {
  const [job, setJob]               = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [locError, setLocError]     = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setLocError(true); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => { setLocError(true); setMyLocation({ lat: 9.0765, lng: 7.3986 }); },
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
  const route = (myLocation && mechLocation) ? { origin: mechLocation, destination: myLocation } : null;
  const st = STATUS_LABELS[job.status] || STATUS_LABELS['pending'];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column', background:'var(--bg)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* Full-screen map */}
      <div style={{ flex:1, position:'relative' }}>
        <MapView
          center={myLocation || { lat:9.0765, lng:7.3986 }}
          markers={markers} route={route} zoom={14}
          style={{ height:'100%' }}
        />

        {/* Service badge */}
        <div style={{
          position:'absolute', top:'16px', left:'16px',
          background:'rgba(14,19,32,.85)', backdropFilter:'blur(8px)',
          borderRadius:'20px', padding:'8px 16px',
          fontSize:'13px', fontWeight:'700', color:'#fff',
        }}>
          {job.service?.nm} Request
        </div>

        {locError && (
          <div style={{ position:'absolute', top:'16px', right:'16px', fontSize:'12px', color:'#e8481f', fontWeight:'600', background:'rgba(255,255,255,.9)', padding:'4px 10px', borderRadius:'20px' }}>
            GPS unavailable
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div style={{
        background:'var(--surface)',
        borderTopLeftRadius:'24px', borderTopRightRadius:'24px',
        padding:'24px',
        boxShadow:'0 -8px 32px -8px rgba(14,19,32,.15)',
        maxHeight:'55vh', overflowY:'auto',
      }}>
        {/* Status */}
        <div style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:st.color, flexShrink:0, boxShadow:`0 0 0 3px ${st.color}30` }} />
            <span style={{ fontWeight:'800', fontSize:'16px', color:'var(--ink)', letterSpacing:'-.2px' }}>{st.title}</span>
          </div>
          <div style={{ fontSize:'13px', color:'var(--slate)', marginLeft:'20px' }}>{st.sub}</div>
        </div>

        {/* Pending — progress bar + cancel */}
        {job.status === 'pending' && (
          <div>
            <div style={{ height:'4px', background:'var(--line)', borderRadius:'4px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ height:'100%', width:'40%', background:'linear-gradient(90deg,#ff8a4c,#e8481f)', borderRadius:'4px', animation:'sweep 1.6s infinite ease-in-out' }} />
            </div>
            <style>{`@keyframes sweep{0%{transform:translateX(-150%)}100%{transform:translateX(350%)}}`}</style>
            <button onClick={() => { if(window.confirm('Cancel this request?')) updateJobStatus(job.id,'cancelled'); }} style={{
              width:'100%', padding:'14px', fontSize:'14px', fontWeight:'600', color:'#e8481f',
              background:'rgba(255,106,61,.06)', border:'1.5px solid rgba(255,106,61,.2)',
              borderRadius:'14px', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif",
            }}>Cancel request</button>
          </div>
        )}

        {/* Mechanic card (accepted+) */}
        {job.status !== 'pending' && job.mechanicId && (
          <div style={{
            background:'var(--bg)', border:'1.5px solid var(--line)',
            borderRadius:'16px', padding:'14px 16px',
            display:'flex', gap:'12px', alignItems:'center', marginBottom:'16px',
          }}>
            <div style={{
              width:'44px', height:'44px', borderRadius:'13px',
              background:'linear-gradient(150deg,#ff8a4c,#e8481f)',
              display:'grid', placeItems:'center',
              fontSize:'16px', fontWeight:'800', color:'#fff', flexShrink:0,
            }}>M</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'700', fontSize:'15px', color:'var(--ink)' }}>Your Mechanic</div>
              <div style={{ fontSize:'12px', color:'var(--slate)', marginTop:'2px' }}>{job.service?.nm} Specialist · En route</div>
            </div>
            <a href="tel:" style={{
              width:'40px', height:'40px', borderRadius:'50%',
              background:'rgba(22,163,74,.1)', border:'1.5px solid rgba(22,163,74,.2)',
              display:'grid', placeItems:'center', fontSize:'18px', textDecoration:'none', color:'#16a34a',
            }}>☎</a>
          </div>
        )}

        {/* Quote approval */}
        {job.status === 'completed' && job.cost?.items?.length > 0 && (
          <QuoteApproval job={job} />
        )}

        {/* TEST MODE */}
        {job.status !== 'pending' && (
          <div style={{ marginTop:'20px', padding:'14px', border:'1.5px dashed var(--line)', borderRadius:'14px' }}>
            <div className="label" style={{ marginBottom:'10px' }}>Test Mode — Simulate Mechanic</div>
            {job.status === 'accepted' && (
              <button onClick={() => updateJobStatus(job.id,'diagnosing')} style={testBtn}>Simulate: Arrived & diagnosing</button>
            )}
            {job.status === 'diagnosing' && (
              <button onClick={() => updateJobStatus(job.id,'repairing')} style={testBtn}>Simulate: Start repair</button>
            )}
            {job.status === 'repairing' && (
              <button onClick={async () => {
                await updateDoc(doc(db,'jobs',job.id), {
                  status:'completed',
                  cost:{ items:[{ name:'Service charge', price:'8000' },{ name:'Parts replacement', price:'32000' }], total:40000, notes:'Test mode' }
                });
              }} style={testBtn}>Simulate: Submit quote (₦40,000)</button>
            )}
            {job.status === 'completed' && <div style={{ fontSize:'13px', color:'var(--slate)' }}>Approve the quote above to pay.</div>}
            {job.status === 'approved' && (
              <button onClick={() => updateJobStatus(job.id,'finished')} style={testBtn}>Finish & return home</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const testBtn = {
  width:'100%', padding:'12px',
  background:'var(--bg)', color:'var(--ink)',
  border:'1.5px solid var(--line)', borderRadius:'12px',
  fontSize:'13px', fontWeight:'600',
  cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif",
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
    <div style={{ marginBottom:'16px' }}>
      <div className="label" style={{ marginBottom:'12px' }}>Cost Breakdown</div>
      <div style={{ background:'var(--bg)', border:'1.5px solid var(--line)', borderRadius:'16px', padding:'14px', marginBottom:'14px' }}>
        {job.cost.items.map((item, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom: i < job.cost.items.length-1 ? '1px solid var(--line)' : 'none', fontSize:'14.5px' }}>
            <span style={{ color:'var(--slate)' }}>{item.name}</span>
            <span style={{ fontWeight:'600', color:'var(--ink)' }}>₦{Number(item.price).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'12px', fontWeight:'800', fontSize:'19px' }}>
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>
      <button onClick={approve} disabled={approving} className="btn btn-primary" style={{ opacity: approving ? .6 : 1 }}>
        {approving ? 'Processing…' : `Approve & Pay ₦${total.toLocaleString()}`} {!approving && <span>→</span>}
      </button>
    </div>
  );
}
