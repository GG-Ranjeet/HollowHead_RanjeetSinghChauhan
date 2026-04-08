import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Ticket, LayoutDashboard, LogOut, Star, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { currentUser, dbUser, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/');
  };

  // Use the Google profile photo if available, otherwise a fallback
  const avatarUrl = currentUser?.photoURL || "https://i.pravatar.cc/150?img=11";
  const displayName = currentUser?.displayName || dbUser?.name || "User";

  // Check role from Firestore database user (authoritative source)
  const isOrganizer = dbUser?.role === 'organizer';

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-text">FlickyFest</span>
          <span className="logo-dot">.</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/explore" className="nav-item">
            <Search size={20} />
            <span>Explore</span>
          </Link>
          
          {isOrganizer && (
            <Link to="/organizer/dashboard" className="nav-item org-portal-btn" style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
              <LayoutDashboard size={18} />
              <span>Organizer Portal</span>
            </Link>
          )}
        </div>
        
        <div className="nav-profile">
          {!currentUser ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={openAuthModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontWeight: '500', cursor: 'pointer', fontSize: '1rem' }}>Login</button>
              <button onClick={openAuthModal} className="btn btn-primary" style={{ border: 'none', cursor: 'pointer', padding: '0.6rem 1.2rem', fontSize: '0.95rem' }}>Sign Up</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                className="profile-dropdown-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ background: isDropdownOpen ? '#f1f5f9' : 'transparent' }}
              >
                <img src={avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="dropdown-avatar" />
                <span className="user-name-desktop">{displayName}</span>
              </div>
              
              {isDropdownOpen && (
                <div className="profile-dropdown-menu">
                  {isOrganizer ? (
                    <>
                      <Link to="/organizer/dashboard" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <LayoutDashboard size={18} /> Organizer Portal
                      </Link>
                      <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <User size={18} /> My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <Ticket size={18} /> Profile & Tickets
                      </Link>
                      <Link to="/pricing" className="dropdown-item" onClick={() => setIsDropdownOpen(false)} style={{ color: '#059669', background: '#ecfdf5' }}>
                        <Star size={18} /> Upgrade to Host
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
