import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './OrganizerLayout.css';

export default function OrganizerLayout() {
  return (
    <div className="organizer-layout">
      <Sidebar />
      <main className="organizer-main">
        <div className="organizer-topbar">
          <h2>Organizer Space</h2>
          <div className="org-profile">
            <img src="https://ui-avatars.com/api/?name=Admin&background=0F172A&color=fff" alt="Admin" />
          </div>
        </div>
        <div className="organizer-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
