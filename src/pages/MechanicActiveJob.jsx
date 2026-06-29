import React, { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { listenToActiveJob } from '../services/db';
import MapView from '../components/MapView';

export default function MechanicActiveJob({ jobId }) {
  const [job, setJob]               = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCost, setShowCost]     = useState(false);
  const [costItems, setCostItems]   = useState([{ name:'Service charge', price:'' }]);
  const [notes, setNotes]           = useState('');
  const watchRef                    = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        if (jobId) updateDoc(doc(db,'jobs',jobId), { mechLocation: loc }).catch(() => {});
      },
      () => setMyLocation({ lat:9.0820, lng:7.4200 }),
      { enableHighAccuracy:true, timeout:10000 }
    );
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [jobId]);

  useEffect(() => {
    const unsub = listenToActiveJob(jobId, setJob);
    return () => unsub();
  }, [jobId]);

  async function advanceStatus(next) {
    await updateDoc(doc(db,'jobs',jobId), { status: next });
  }

  async function sendQuote() {
    const items = costItems.filter(i => i.name.trim() && i.price);
    if (!items.length) return alert('Add at least one cost item.');
    const total = items.reduce((s,i) => s + (parseFloat(i.price)||0), 0);
    setSubmitting(true);
    await updateDoc(doc(db,'jobs',jobId), { status:'completed', cost:{ items, notes, total } });
    setSubmitting(false); setShowCost(false);
  }

  if (!job) return null;

  const customerLoc = job.customerLocation || null;
  const markers = [];
  if (myLocation)   markers.push({ lat:myLocation.lat,   lng:myLocation.lng,   label:'A', title:'You' });
  if (customerLoc)  markers.push({ lat:customerLoc.lat,  lng:customerLoc.lng,  label:'B', title:'Customer' });
  const route = (myLocation && customerLoc && job.status === 'accepted') ? { origin:myLocation, destination:customerLoc } : null;

  const statusColor = { accepted:'#16a34a', completed:'#ff6a3d', approved:'#16a34a' }[job.status] || '#ff6a3d';
  const statusLabel = { accepted:'En route', diagnosing:'Diagnosing', repairing:'Repairing', completed:'Awaiting approval', approved:'Payment received' }[job.status] || job.status;

  const input = {
    background:'var(--bg)', border:'1.5px solid var(--line)', borderRadius:'12px',
    padding:'12px', color:'var(--ink)', fontSize:'14px', outline:'none',
    fontFamily:"'Plus Jakarta Sans',sans-serif", width:'100%',
  };

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', background:'var(--bg)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* Map */}
      <div style={{ flex:1, position:'relative' }}>
        <MapView center={myLocation||{lat:9.0765,lng:7.3986}} markers={markers} route={route} zoom={14} style={{ height:'100%' }} />
        <div style={{
          position:'absolute', top:'16px', left:'16px',
          background:'rgba(14,19,32,.85)', backdropFilter:'blur(8px)',
          borderRadius:'20px', padding:'8px 14px',
          fontSize:'13px', fontWeight:'700', color:'#fff',
          display:'flex', alignItems:'center', gap:'8px',
        }}>
          <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:statusColor, flexShrink:0 }} />
          {statusLabel}
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{
        background:'var(--surface)', borderTopLeftRadius:'24px', borderTopRightRadius:'24px',
        padding:'24px', maxHeight:'60vh', overflowY:'auto',
        boxShadow:'0 -8px 32px -8px rgba(14,19,32,.15)',
      }}>
        {/* Customer info */}
        <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'20px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'13px', background:'var(--ink)', display:'grid', placeItems:'center', fontSize:'16px', fontWeight:'800', color:'#fff', flexShrink:0 }}>C</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:'700', fontSize:'15px', color:'var(--ink)' }}>{job.service?.nm} Job</div>
            <div style={{ fontSize:'12.5px', color:'var(--slate)', marginTop:'2px' }}>Customer is waiting for you</div>
          </div>
          <a href="tel:" style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(22,163,74,.1)', border:'1.5px solid rgba(22,163,74,.2)', display:'grid', placeItems:'center', fontSize:'18px', textDecoration:'none', color:'#16a34a' }}>☎</a>
        </div>

        {/* Action buttons */}
        {job.status === 'accepted' && (
          <button className="btn btn-primary" onClick={() => advanceStatus('diagnosing')}>
            Arrived · Start diagnosis <span>→</span>
          </button>
        )}
        {job.status === 'diagnosing' && (
          <button className="btn btn-primary" onClick={() => advanceStatus('repairing')}>
            Start repair <span>→</span>
          </button>
        )}
        {job.status === 'repairing' && !showCost && (
          <button className="btn btn-primary" onClick={() => setShowCost(true)}>
            Submit cost breakdown <span>→</span>
          </button>
        )}

        {/* Cost form */}
        {showCost && job.status !== 'completed' && (
          <div>
            <div className="label" style={{ marginBottom:'14px' }}>Submit Final Cost to Customer</div>
            {costItems.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                <input type="text" placeholder="Item description" value={item.name}
                  onChange={e => { const a=[...costItems]; a[i].name=e.target.value; setCostItems(a); }}
                  style={{ ...input, flex:1 }} />
                <input type="number" placeholder="₦" value={item.price}
                  onChange={e => { const a=[...costItems]; a[i].price=e.target.value; setCostItems(a); }}
                  style={{ ...input, width:'100px' }} />
                {costItems.length > 1 && (
                  <button onClick={() => setCostItems(costItems.filter((_,j) => j!==i))}
                    style={{ width:'36px', height:'36px', border:'1.5px solid var(--line)', background:'none', color:'var(--slate)', borderRadius:'10px', cursor:'pointer', fontSize:'14px' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setCostItems([...costItems,{name:'',price:''}])} style={{
              width:'100%', border:'1.5px dashed var(--line)', background:'none', color:'var(--slate)',
              padding:'12px', borderRadius:'12px', cursor:'pointer', marginBottom:'12px', fontSize:'14px',
              fontFamily:"'Plus Jakarta Sans',sans-serif",
            }}>+ Add item</button>
            <textarea rows={2} placeholder="Notes for customer (optional)" value={notes}
              onChange={e => setNotes(e.target.value)} style={{ ...input, marginBottom:'12px', resize:'none' }} />
            <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg)', border:'1.5px solid var(--line)', borderRadius:'12px', marginBottom:'14px' }}>
              <span style={{ color:'var(--slate)', fontSize:'14px' }}>Customer Total</span>
              <span style={{ fontWeight:'800', fontSize:'18px', color:'var(--ink)' }}>₦{costItems.reduce((s,i)=>s+(parseFloat(i.price)||0),0).toLocaleString()}</span>
            </div>
            <button className="btn btn-primary" style={{ opacity:submitting?.6:1 }} disabled={submitting} onClick={sendQuote}>
              {submitting ? 'Sending…' : 'Send quote to customer'} {!submitting && <span>→</span>}
            </button>
          </div>
        )}

        {job.status === 'completed' && (
          <div style={{ textAlign:'center', padding:'16px 0', background:'rgba(255,106,61,.06)', border:'1.5px solid rgba(255,106,61,.15)', borderRadius:'16px' }}>
            <div style={{ fontWeight:'800', fontSize:'16px', color:'var(--ink)', marginBottom:'6px' }}>Waiting for customer approval</div>
            <div style={{ fontSize:'14px', color:'var(--slate)' }}>Quote of ₦{job.cost?.total?.toLocaleString()} sent. Customer will review shortly.</div>
          </div>
        )}

        {job.status === 'approved' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(150deg,#22c55e,#16a34a)', display:'grid', placeItems:'center', margin:'0 auto 14px', fontSize:'26px', color:'#fff', boxShadow:'0 14px 32px -10px #16a34a' }}>✓</div>
            <div style={{ fontWeight:'800', fontSize:'18px', color:'#16a34a', marginBottom:'6px' }}>Payment received!</div>
            <div style={{ fontSize:'14px', color:'var(--slate)' }}>₦{job.cost?.total?.toLocaleString()} approved and paid.</div>
          </div>
        )}
      </div>
    </div>
  );
}
