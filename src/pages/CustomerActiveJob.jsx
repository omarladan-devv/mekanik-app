import React, { useEffect, useState } from 'react';
import { listenToActiveJob, updateJobStatus } from '../services/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Using a simplified map placeholder since this UI focuses on timeline/chat/payment
export default function CustomerActiveJob({ jobId }) {
  const [job, setJob]               = useState(null);
  const [view, setView]             = useState('timeline'); // 'timeline', 'chat', 'payment'
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  useEffect(() => {
    const unsub = listenToActiveJob(jobId, (updatedJob) => {
      setJob(updatedJob || null);
      if (updatedJob?.status === 'completed' || updatedJob?.status === 'approved') {
        setView('payment');
      }
    });
    return () => unsub();
  }, [jobId]);

  if (!job) return null;

  const mechanicName = job.mechanicName || 'Musa';
  const mechanicInitial = mechanicName[0] || 'M';

  // --- PENDING VIEW ---
  if (job.status === 'pending') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 'calc(100vh - 40px)', background: 'var(--bg)', fontFamily: "'Plus Jakarta Sans',sans-serif", padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3.5px solid #e8eaf0', borderTopColor: '#ff6a3d', animation: 'spin .7s linear infinite', marginBottom: '24px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontWeight: '800', fontSize: '22px', color: 'var(--ink)' }}>Waiting for mechanic...</div>
        <div style={{ fontSize: '15px', color: 'var(--slate)', marginTop: '8px', marginBottom: '40px', lineHeight: 1.5 }}>Your request has been sent to {job.targetMechanicId ? 'the selected mechanic' : 'mechanics nearby'}. Please wait while they review it.</div>
        
        <button onClick={() => { if(window.confirm('Cancel this request?')) updateJobStatus(job.id, 'cancelled'); }} style={{
          width: '100%', padding: '16px', fontSize: '15px', fontWeight: '700', color: '#e8481f',
          background: 'rgba(255,106,61,.08)', border: '1.5px solid rgba(255,106,61,.2)',
          borderRadius: '16px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}>Cancel Request</button>
      </div>
    );
  }

  // --- TIMELINE VIEW ---
  if (view === 'timeline') {
    const statuses = ['accepted', 'diagnosing', 'repairing', 'completed'];
    const currentIdx = statuses.indexOf(job.status);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 40px)', background: 'var(--bg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-.4px', color: 'var(--ink)' }}>{mechanicName} is on the way</div>
          <button onClick={() => setView('chat')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>💬</button>
        </div>

        {/* Circular Timer */}
        <div style={{ margin: '0 auto 40px', position: 'relative', width: '160px', height: '160px' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e9edf2" strokeWidth="12" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#ff6a3d" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.4} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontWeight: '800', fontSize: '42px', color: 'var(--ink)', lineHeight: 1 }}>8</div>
            <div style={{ fontSize: '11px', color: 'var(--slate)', fontWeight: '700', letterSpacing: '1px', fontFamily: "'JetBrains Mono',monospace", marginTop: '4px' }}>MIN AWAY</div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ paddingLeft: '8px' }}>
          <TimelineItem 
            active={currentIdx >= 0}
            completed={currentIdx > 0}
            num="1" 
            title="Request accepted" 
            sub={`${mechanicName} confirmed your job`} 
          />
          <TimelineItem 
            active={currentIdx >= 0}
            completed={currentIdx > 1}
            num="2" 
            title="En route to you" 
            sub="Tracking live location..." 
          />
          <TimelineItem 
            active={currentIdx >= 1}
            completed={currentIdx > 2}
            num="3" 
            title="Arrived & diagnosing" 
            sub={currentIdx >= 1 ? "Mechanic is looking at the vehicle" : "Pending"} 
          />
          <TimelineItem 
            active={currentIdx >= 2}
            completed={currentIdx > 3}
            num="4" 
            title="Repair completed" 
            sub={currentIdx >= 2 ? "Finalizing fixes..." : "Pending"}
            last
          />
        </div>

        <div style={{ flex: 1 }} />
      </div>
    );
  }

  // --- CHAT VIEW ---
  if (view === 'chat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 40px)', background: 'var(--bg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>
          <button onClick={() => setView('timeline')} style={{
            width:'40px', height:'40px', borderRadius:'13px',
            border:'1.5px solid var(--line)', background:'var(--surface)',
            display:'grid', placeItems:'center', cursor:'pointer', fontSize:'16px',
            flexShrink: 0,
          }}>←</button>
          
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#4338ca', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '18px', fontWeight: '800' }}>
            {mechanicInitial}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight:'800', fontSize:'17px', letterSpacing:'-.3px' }}>{mechanicName}</div>
            <div style={{ fontSize:'12px', color:'#16a34a', fontWeight: '600' }}>● On the way to you</div>
          </div>
          
          <div style={{ width: '40px', height: '40px', borderRadius: '13px', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: '16px' }}>
            📞
          </div>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', maxWidth: '85%' }}>
            <div style={{ fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.4 }}>Hello👋 I've accepted your request and I'm heading to you now.</div>
            <div style={{ fontSize: '10px', color: 'var(--slate)', marginTop: '6px' }}>9:41</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', maxWidth: '85%' }}>
            <div style={{ fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.4 }}>Does the car make any sound when you turn the key, or nothing at all?</div>
            <div style={{ fontSize: '10px', color: 'var(--slate)', marginTop: '6px' }}>9:41</div>
          </div>
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '20px', marginBottom: '16px' }}>
          <input type="text" placeholder="Type a message..." style={{
            flex: 1, background: '#fff', border: '1.5px solid var(--line)', borderRadius: '24px', padding: '14px 20px', fontSize: '14px', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif"
          }} />
          <button style={{
            width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(150deg,#ff8a4c,#e8481f)', color: '#fff', border: 'none', fontSize: '18px', boxShadow: '0 4px 12px rgba(232,72,31,.3)'
          }}>↑</button>
        </div>

        <button className="btn" style={{ background: 'var(--ink)', color: '#fff' }} onClick={() => setView('timeline')}>
          Track arrival <span>→</span>
        </button>

      </div>
    );
  }

  // --- PAYMENT VIEW ---
  if (view === 'payment') {
    const total = job.cost?.total || 0;
    const [approving, setApproving] = useState(false);

    async function approve() {
      setApproving(true);
      await updateJobStatus(job.id, 'approved');
      setApproving(false);
    }

    if (job.status === 'approved') {
      return (
        <div style={{ textAlign:'center', paddingTop: '80px', height: '100%', minHeight: 'calc(100vh - 40px)', background: 'var(--bg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(150deg,#22c55e,#16a34a)', display:'grid', placeItems:'center', margin:'0 auto 24px', fontSize:'32px', color:'#fff', boxShadow:'0 14px 32px -10px #16a34a' }}>✓</div>
          <div style={{ fontWeight:'800', fontSize:'24px', color:'#16a34a', marginBottom:'8px' }}>Payment successful</div>
          <div style={{ fontSize:'15px', color:'var(--slate)' }}>₦{total.toLocaleString()} paid to {mechanicName}.</div>
          <button className="btn" style={{ marginTop: '40px' }} onClick={() => window.location.reload()}>Done</button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 40px)', background: 'var(--bg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        
        {/* Invoice */}
        <div style={{ background: '#fff', border: '1.5px solid var(--line)', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
          {job.cost?.items?.map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom: '1px solid var(--line)', fontSize:'14.5px' }}>
              <span style={{ color:'var(--slate)' }}>{item.name}</span>
              <span style={{ fontWeight:'700', color:'var(--ink)' }}>₦{Number(item.price).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'16px', fontWeight:'800', fontSize:'20px', color: 'var(--ink)' }}>
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="label" style={{ marginBottom: '12px' }}>PAY WITH</div>
        
        {/* Payment Methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { id: 'Card', label: 'Debit / Credit Card', icon: '💳' },
            { id: 'Bank Transfer', label: 'Bank Transfer', icon: '🏦' },
            { id: 'Digital Wallet', label: 'Digital Wallet', icon: '📱' },
            { id: 'Cash', label: 'Cash', icon: '💵' },
          ].map(m => {
            const isSelected = paymentMethod === m.id;
            return (
              <div key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                background: '#fff', border: `1.5px solid ${isSelected ? '#e8481f' : 'var(--line)'}`, borderRadius: '16px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: '.2s',
                boxShadow: isSelected ? '0 4px 14px rgba(232,72,31,.1)' : 'none'
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1, fontWeight: '700', fontSize: '15px', color: 'var(--ink)' }}>
                  {m.label}
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `1.5px solid ${isSelected ? '#e8481f' : 'var(--line-2)'}`, background: isSelected ? '#e8481f' : 'none', display: 'grid', placeItems: 'center', transition: '.2s' }}>
                  {isSelected && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />
        
        <button onClick={approve} disabled={approving} className="btn" style={{ opacity: approving ? .6 : 1 }}>
          {approving ? 'Processing…' : `Pay ₦${total.toLocaleString()}`} {!approving && <span>→</span>}
        </button>

      </div>
    );
  }

  return null;
}

// Helper for Timeline
function TimelineItem({ active, completed, num, title, sub, last }) {
  const color = completed ? '#16a34a' : (active ? '#ff6a3d' : '#e3e8ee');
  const textColor = active ? 'var(--ink)' : 'var(--slate-2)';
  
  return (
    <div style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: last ? '0' : '28px' }}>
      {!last && (
        <div style={{ position: 'absolute', left: '15px', top: '32px', bottom: '0', width: '2px', background: 'var(--line)' }} />
      )}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', background: color, 
        display: 'grid', placeItems: 'center', color: completed ? '#fff' : (active ? '#fff' : 'var(--slate)'),
        fontWeight: '800', fontSize: '13px', zIndex: 1
      }}>
        {completed ? '✓' : num}
      </div>
      <div style={{ paddingTop: '4px' }}>
        <div style={{ fontWeight: '800', fontSize: '16px', color: textColor, letterSpacing: '-.2px' }}>{title}</div>
        <div style={{ fontSize: '13.5px', color: 'var(--slate)', marginTop: '2px' }}>{sub}</div>
      </div>
    </div>
  );
}
