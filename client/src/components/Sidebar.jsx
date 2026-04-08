import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings, Home, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

function Sidebar() {
  const { currentUser, dbUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const avatarUrl = currentUser?.photoURL || "https://i.pravatar.cc/150";
  const displayName = currentUser?.displayName || dbUser?.name || "Organizer";
  const roleLabel = dbUser?.role === 'organizer' ? 'Organizer' : 'Attendee';

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <NavLink to="/" className="sidebar-logo">
          <span className="logo-text">FlickyFest</span>
          <span className="logo-dot">.</span>
        </NavLink>
        
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: '12px', width: '100%', marginTop: '0.5rem' }}>
            <img src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '36px', height: '36px', borderRadius: '50%'}} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{displayName}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleLabel}</span>
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-title">MENU</div>
        
        <NavLink 
          to="/organizer/dashboard" 
          className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/organizer/create" 
          className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
        >
          <PlusCircle size={20} />
          <span>Create Event</span>
        </NavLink>

        <NavLink 
          to="/organizer/settings" 
          className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="sidebar-link">
          <Home size={20} />
          <span>Back to Main Page</span>
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
