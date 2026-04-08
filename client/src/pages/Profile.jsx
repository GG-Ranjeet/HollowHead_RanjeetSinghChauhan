import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Loader2, ArrowRight, Edit3, Save, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const { currentUser, dbUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [saving, setSaving] = useState(false);
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
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          const ticketsWithMockEventData = data.tickets.map(t => ({
             ...t,
             eventName: `FlickyFest Event #${t.eventId.slice(0,4)}`,
             eventDate: 'Coming Soon',
             eventLocation: 'Campus Main Arena'
          }));
          setTickets(ticketsWithMockEventData);
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

  const avatarUrl = currentUser?.photoURL || "https://i.pravatar.cc/150?img=11";

  if (!currentUser || !dbUser) {
    return <div className="profile-container loading"><Loader2 className="spinner" size={40} /></div>;
  }

  return (
    <div className="profile-container">
      {/* Profile Header Block */}
      <div className="profile-header-card">
        <div className="profile-header-bg">
           <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
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
              <div key={ticket.id} className={`ticket-card ${ticket.isCheckedIn ? 'checked-in' : ''}`}>
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
    </div>
  );
}

export default Profile;
