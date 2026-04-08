import React, { useState } from 'react';
import { User, Shield, Bell, IndianRupee, Save, Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './OrganizerSettings.css';

function OrganizerSettings() {
  const { currentUser, dbUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  // Mock Form States
  const [profileData, setProfileData] = useState({
    name: dbUser?.name || "Event Organizer",
    email: dbUser?.email || "organizer@example.com",
    college: "Lucknow University",
    bio: "We host the coolest fests and tech events in the city.",
    website: "https://myorganization.com"
  });

  const [payoutData, setPayoutData] = useState({
    bankName: "HDFC Bank",
    accountHolder: "Event Organizer Corp",
    accountNumber: "XXXX-XXXX-XXXX-1234",
    ifsc: "HDFC0001234"
  });

  const [notificationData, setNotificationData] = useState({
    ticketSales: true,
    weeklyReports: false,
    platformUpdates: true
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedStatus(false);
    
    // Simulate API request
    setTimeout(() => {
      setIsSaving(false);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    }, 1200);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your organization profile, active payouts, and preferences.</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Nav for Settings */}
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Public Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'payout' ? 'active' : ''}`}
            onClick={() => setActiveTab('payout')}
          >
            <IndianRupee size={18} /> Payout Details
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          <form onSubmit={handleSave}>
            
            {/* PRMOFILE TAB */}
            {activeTab === 'profile' && (
              <div className="tab-pane animate-fade-in">
                <h2>Public Profile</h2>
                <div className="settings-card">
                  <div className="avatar-section">
                     <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="settings-avatar" />
                     <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                       <Upload size={16} /> Update Logo
                     </button>
                  </div>
                  
                  <div className="form-group settings-form-group">
                    <label>Organization / Display Name</label>
                    <input 
                      type="text" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group settings-form-group">
                    <label>Contact Email</label>
                    <input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="form-input" 
                      readOnly
                    />
                    <small style={{ color: 'var(--text-muted)' }}>To change login email, contact support.</small>
                  </div>

                  <div className="form-group settings-form-group">
                    <label>College / Location Base</label>
                    <input 
                      type="text" 
                      value={profileData.college} 
                      onChange={(e) => setProfileData({...profileData, college: e.target.value})}
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group settings-form-group">
                    <label>Bio / Description</label>
                    <textarea 
                      rows="3" 
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="form-input"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* PAYOUT TAB */}
            {activeTab === 'payout' && (
              <div className="tab-pane animate-fade-in">
                <h2>Payout Details</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  Securely add your bank details where your event ticket revenue will be transferred.
                </p>
                <div className="settings-card">
                  <div className="form-group settings-form-group">
                    <label>Bank Name</label>
                    <input 
                      type="text" 
                      value={payoutData.bankName} 
                      onChange={(e) => setPayoutData({...payoutData, bankName: e.target.value})}
                      className="form-input" 
                    />
                  </div>
                  
                  <div className="form-group settings-form-group">
                    <label>Account Holder Name</label>
                    <input 
                      type="text" 
                      value={payoutData.accountHolder} 
                      onChange={(e) => setPayoutData({...payoutData, accountHolder: e.target.value})}
                      className="form-input" 
                    />
                  </div>

                  <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group settings-form-group" style={{ flex: 1 }}>
                      <label>Account Number</label>
                      <input 
                        type="text"
                        value={payoutData.accountNumber} 
                        onChange={(e) => setPayoutData({...payoutData, accountNumber: e.target.value})}
                        className="form-input" 
                      />
                    </div>
                    <div className="form-group settings-form-group" style={{ flex: 1 }}>
                      <label>IFSC Code</label>
                      <input 
                        type="text"
                        value={payoutData.ifsc} 
                        onChange={(e) => setPayoutData({...payoutData, ifsc: e.target.value})}
                        className="form-input" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="tab-pane animate-fade-in">
                <h2>Notifications</h2>
                <div className="settings-card">
                  <div className="toggle-row">
                    <div>
                      <div style={{ fontWeight: 600 }}>Ticket Sale Alerts</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Get an email whenever someone buys a ticket.</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationData.ticketSales} 
                        onChange={(e) => setNotificationData({...notificationData, ticketSales: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <hr style={{ border: 0, borderBottom: '1px solid var(--border-color)', margin: '1rem 0' }}/>
                  
                  <div className="toggle-row">
                    <div>
                      <div style={{ fontWeight: 600 }}>Weekly Performance Reports</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Receive a summary of your event views and revenue.</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationData.weeklyReports} 
                        onChange={(e) => setNotificationData({...notificationData, weeklyReports: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <hr style={{ border: 0, borderBottom: '1px solid var(--border-color)', margin: '1rem 0' }}/>

                  <div className="toggle-row">
                    <div>
                      <div style={{ fontWeight: 600 }}>Platform Updates</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>News about new Organizer features and rules.</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationData.platformUpdates} 
                        onChange={(e) => setNotificationData({...notificationData, platformUpdates: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="tab-pane animate-fade-in">
                <h2>Security</h2>
                <div className="settings-card">
                   <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Change Password</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>We will send a secure reset link to your registered email.</p>
                      <button type="button" className="btn btn-secondary">Send Reset Link</button>
                   </div>
                   
                   <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Danger Zone</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Permanently delete your organizer account and all associated events.</p>
                      <button type="button" style={{ background: 'var(--danger-color)', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>Delete Account</button>
                   </div>
                </div>
              </div>
            )}

            {/* SAVE ACTION */}
            <div className="settings-footer">
               {savedStatus && <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', fontWeight: 600 }}><CheckCircle size={18} /> Saved successfully!</span>}
               <button 
                 type="submit" 
                 className="btn btn-primary" 
                 disabled={isSaving}
                 style={{ marginLeft: 'auto' }}
               >
                 <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
               </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrganizerSettings;
