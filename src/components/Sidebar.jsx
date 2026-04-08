import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings, Home, LogOut } from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <span className="logo-text">FlickyFest</span>
          <span className="logo-dot">.</span>
        </NavLink>
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
        <button className="sidebar-link logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
