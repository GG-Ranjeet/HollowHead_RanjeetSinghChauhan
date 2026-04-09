import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

// Layouts
import ClientLayout from './layouts/ClientLayout';
import OrganizerLayout from './layouts/OrganizerLayout';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import EventDetail from './pages/EventDetail';
import Ticket from './pages/Ticket';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import OrganizerSettings from './pages/OrganizerSettings';
import TicketValidator from './pages/TicketValidator';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';

function App() {
  return (
    <div className="app-container">
      <ScrollToTop />
      <AuthModal />
      <OnboardingModal />
      <Routes>
        {/* Client Flow */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/events/:id" element={<EventDetail />} />
          
          {/* Protected Client Routes */}
          <Route element={<ProtectedRoute requiredRole="client" />}>
            <Route path="/ticket/:id" element={<Ticket />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Organizer Flow (Protected) */}
        <Route path="/organizer" element={<ProtectedRoute requiredRole="organizer" />}>
          <Route element={<OrganizerLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreateEvent />} />
            <Route path="settings" element={<OrganizerSettings />} />
            <Route path="validate" element={<TicketValidator />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
