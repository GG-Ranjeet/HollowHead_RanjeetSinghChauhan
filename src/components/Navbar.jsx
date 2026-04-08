import { Link } from 'react-router-dom';
import { Search, Ticket, LayoutDashboard, User } from 'lucide-react';
import './Navbar.css';

function Navbar() {
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
          <Link to="/profile" className="nav-item">
            <Ticket size={20} />
            <span>My Tickets</span>
          </Link>
          <Link to="/organizer/dashboard" className="nav-item org-portal-btn" style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
            <LayoutDashboard size={18} />
            <span>Organizer Portal</span>
          </Link>
        </div>
        
        <div className="nav-profile">
          <button className="profile-btn">
            <User size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
