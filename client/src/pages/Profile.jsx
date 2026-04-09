import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Loader2, ArrowRight, Edit3, Save, X, Settings, Download, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import './Profile.css';

function Profile() {
  const { currentUser, dbUser, openOnboardingModal } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);  // modal
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const ticketModalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (dbUser && !isEditing) {
      setEditName(dbUser.name || currentUser?.displayName || '');
      setEditUniversity(dbUser.university || '');
    }
  }, [dbUser, currentUser, isEditing]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/tickets/my-tickets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.tickets) {
          // Fetch real event data for every ticket in parallel
          const enriched = await Promise.all(
            data.tickets.map(async (t) => {
              try {
                const evRes = await fetch(`/api/events/${t.eventId}`);
                if (evRes.ok) {
                  const evData = await evRes.json();
                  const ev = evData.event;
                  return {
                    ...t,
                    eventName: ev.title || 'Untitled Event',
                    eventDate: ev.date
                      ? new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'TBA',
                    eventTime: ev.date
                      ? new Date(ev.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '',
                    eventLocation: ev.addressString || 'TBA',
                    eventImage: ev.image || '',
                  };
                }
              } catch { /* fallback below */ }
              return {
                ...t,
                eventName: `Event (${t.eventId.slice(0, 6)})`,
                eventDate: 'TBA',
                eventTime: '',
                eventLocation: 'TBA',
                eventImage: '',
              };
            })
          );
          setTickets(enriched);
        } else {
          setError(data.error || 'Failed to load tickets');
        }
      } catch (err) {
        setError('Network error loading tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await currentUser.getIdToken();
      
      // Update Name / University if changed
      if (editName !== dbUser.name || editUniversity !== dbUser.university) {
         await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: editName, university: editUniversity })
         });
      }
      
      // Reload page to reflect fresh global state throughout the app
      window.location.reload();
      
    } catch (err) {
       console.error("Failed to save profile:", err);
       alert("Failed to save profile. Please try again.");
       setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm("Are you absolutely sure you want to permanently delete your account? This action cannot be undone.");
    if (!isConfirmed) return;

    setSaving(true);
    try {
      const token = await currentUser.getIdToken();
      
      // 1. Delete deeply from Database backend
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to purge backend data");

      // 2. Delete Authentication account
      await currentUser.delete();
      
      navigate('/');
    } catch (err) {
      console.error("Deletion failed:", err);
      alert("Failed to delete account. You may need to log out and log back in to verify your identity before deleting.");
      setSaving(false);
    }
  };

  // ── Ticket Modal: Save as PNG ──────────────────────────────────────
  const handleSaveTicket = async () => {
    if (!ticketModalRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(ticketModalRef.current, {
        backgroundColor: null, scale: 2, useCORS: true, allowTaint: false, logging: false,
      });
      const link = document.createElement('a');
      const safeName = (activeTicket?.eventName || 'ticket').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `flickyfest_${safeName}_ticket.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Ticket Modal: Share ───────────────────────────────────────────
  const handleShareTicket = async () => {
    const eventUrl = activeTicket?.eventId
      ? `${window.location.origin}/events/${activeTicket.eventId}`
      : window.location.href;
    const shareData = {
      title: `My ticket for ${activeTicket?.eventName || 'an event'} — FlickyFest`,
      text: `I'm attending "${activeTicket?.eventName || 'an event'}"! Grab your spot on FlickyFest.`,
      url: eventUrl,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch (e) { if (e.name !== 'AbortError') console.error(e); }
    } else {
      try {
        await navigator.clipboard.writeText(eventUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch { alert(`Share: ${eventUrl}`); }
    }
  };

  const avatarUrl = currentUser?.photoURL || "https://i.pravatar.cc/150?img=11";

  if (!currentUser || !dbUser) {
    return <div className="profile-container loading"><Loader2 className="spinner" size={40} /></div>;
  }

  return (
    <div className="profile-container">
      {/* Profile Header Block */}
      <div className="profile-header-card">
        <div className="profile-header-bg">
           <button className="header-action-btn secondary-action" onClick={openOnboardingModal}>
             <Settings size={16} /> Preferences
           </button>
           <button className="header-action-btn primary-action" onClick={() => setIsEditing(true)}>
             <Edit3 size={16} /> Edit Profile
           </button>
        </div>
        
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <img src={avatarUrl} alt="User Avatar" className="profile-avatar" referrerPolicy="no-referrer" />
            <div className="profile-role-badge">{dbUser.role || 'Attendee'}</div>
          </div>
          
          <div className="profile-info">
             <h1>{dbUser.name || currentUser.displayName || 'Anonymous User'}</h1>
             <p className="profile-email">{currentUser.email}</p>
             {dbUser.university && <p className="profile-university"><MapPin size={16}/> {dbUser.university}</p>}
             
             {dbUser.interests && dbUser.interests.length > 0 && (
               <div className="profile-interests-wrapper">
                 {dbUser.interests.map(interest => (
                   <span key={interest} className="interest-tag">
                     {interest}
                   </span>
                 ))}
               </div>
             )}
             {dbUser.hobbies && (
                <p className="profile-hobbies">
                  <strong>Hobbies:</strong> {dbUser.hobbies}
                </p>
             )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="edit-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Edit Profile</h3>
              <button className="close-modal-btn" onClick={() => setIsEditing(false)}><X size={20}/></button>
            </div>
            <div className="edit-modal-body">
              <div className="edit-group" style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Full Name</label>
                 <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your Name" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
              <div className="edit-group" style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>University (Optional)</label>
                 <input type="text" value={editUniversity} onChange={e => setEditUniversity(e.target.value)} placeholder="E.g. Stanford University" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
            </div>
            <div className="edit-modal-footer" style={{ justifyContent: 'space-between' }}>
               <button onClick={handleDeleteAccount} disabled={saving} style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                 Delete Account
               </button>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button onClick={() => setIsEditing(false)} disabled={saving} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                   Cancel
                 </button>
                 <button onClick={handleSaveProfile} disabled={saving} style={{ padding: '10px 20px', background: '#10b981', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   {saving ? <Loader2 size={16} className="spinner"/> : <Save size={16} />} Save Changes
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Section */}
      <div className="profile-section">
        <div className="section-title">
          <h2><Ticket size={24} /> My Digital Wallet</h2>
          {tickets.length > 0 && <span className="ticket-count">{tickets.length} Tickets</span>}
        </div>

        {loading ? (
          <div className="tickets-loading">
            <Loader2 className="spinner" size={32} />
            <p>Loading your tickets...</p>
          </div>
        ) : error ? (
          <div className="tickets-error">
            <p>{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="tickets-empty">
            <div className="empty-icon"><Ticket size={48} /></div>
            <h3>No tickets found!</h3>
            <p>Looks like you haven't grabbed any tickets yet. Explore events happening around your campus now.</p>
            <Link to="/explore" className="btn btn-primary">Find Events <ArrowRight size={18}/></Link>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={`ticket-card ${ticket.isCheckedIn ? 'checked-in' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => { setActiveTicket(ticket); setIsCopied(false); }}
              >
                <div className="ticket-visuals">
                  <div className="qr-wrapper">
                    <QRCodeSVG 
                      value={ticket.qrToken} 
                      size={120}
                      level="H"
                      fgColor={ticket.isCheckedIn ? "#94a3b8" : "#0f172a"}
                    />
                    {ticket.isCheckedIn && <div className="scanned-overlay">SCANNED</div>}
                  </div>
                  <div className="ticket-id">#{ticket.id.slice(0,8).toUpperCase()}</div>
                </div>
                
                <div className="ticket-details">
                  <div className="ticket-status-row">
                    <span className={`status-pill ${ticket.paymentStatus}`}>
                      {ticket.paymentStatus.toUpperCase()}
                    </span>
                    {ticket.isCheckedIn && (
                      <span className="status-pill checked">Used</span>
                    )}
                  </div>
                  
                  <h3>{ticket.eventName}</h3>
                  
                  <div className="ticket-meta">
                    <div className="meta-item">
                      <Calendar size={16} />
                      <span>{ticket.eventDate}</span>
                    </div>
                    <div className="meta-item">
                      <MapPin size={16} />
                      <span>{ticket.eventLocation}</span>
                    </div>
                  </div>
                  
                  <div className="ticket-footer">
                    <p className="purchase-date">
                      Purchased on {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ticket Detail Modal ── */}
      {activeTicket && (
        <div className="tm-overlay" onClick={() => setActiveTicket(null)}>
          <div className="tm-dialog" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button className="tm-close" onClick={() => setActiveTicket(null)}>
              <X size={20} />
            </button>

            {/* Ticket card (captured by html2canvas) */}
            <div ref={ticketModalRef} className="tm-card">
              {/* Banner */}
              <div className="tm-banner">
                {activeTicket.eventImage
                  ? <img src={activeTicket.eventImage} alt="" className="tm-banner-img" crossOrigin="anonymous" />
                  : <div className="tm-banner-placeholder" />}
                <div className="tm-banner-overlay" />
                <div className="tm-banner-text">
                  <div className="tm-banner-label">Admission Ticket</div>
                  <div className="tm-banner-title">{activeTicket.eventName}</div>
                </div>
              </div>

              {/* QR Section */}
              <div className="tm-qr-section">
                <div className="tm-qr-box">
                  <QRCodeSVG
                    value={activeTicket.qrToken || 'INVALID'}
                    size={180}
                    level="H"
                    fgColor={activeTicket.isCheckedIn ? '#94a3b8' : '#0f172a'}
                  />
                  {activeTicket.isCheckedIn && <div className="tm-scanned-overlay">USED</div>}
                </div>
                <div className="tm-ticket-id">ID: {activeTicket.id}</div>
              </div>

              {/* Details */}
              <div className="tm-details">
                <div className="tm-detail-row">
                  <div className="tm-detail-label">Holder</div>
                  <div className="tm-detail-value">{currentUser?.displayName || 'Guest'}</div>
                </div>
                <div className="tm-detail-row">
                  <div className="tm-detail-label">Date</div>
                  <div className="tm-detail-value"><Calendar size={14} /> {activeTicket.eventDate} {activeTicket.eventTime}</div>
                </div>
                <div className="tm-detail-row">
                  <div className="tm-detail-label">Venue</div>
                  <div className="tm-detail-value"><MapPin size={14} /> {activeTicket.eventLocation}</div>
                </div>
                <div className="tm-detail-row">
                  <div className="tm-detail-label">Type</div>
                  <div className="tm-detail-value">
                    <span className={`status-pill ${activeTicket.paymentStatus}`}>{activeTicket.paymentStatus.toUpperCase()}</span>
                    {activeTicket.isCheckedIn && <span className="status-pill checked" style={{marginLeft:'6px'}}>USED</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="tm-actions">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveTicket} disabled={isSaving}>
                <Download size={18} /> {isSaving ? 'Saving…' : 'Save Ticket'}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleShareTicket}>
                <Share2 size={18} /> {isCopied ? 'Link Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
