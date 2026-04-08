import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Star, Loader2, ArrowRight } from 'lucide-react';
import './Pricing.css';

function Pricing() {
  const { currentUser, dbUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // If already an organizer, safely redirect them
  if (dbUser?.role === 'organizer') {
    return (
      <div className="pricing-container already-active">
        <div className="success-banner">
          <Star size={48} color="#fbbf24" fill="#fbbf24" style={{ marginBottom: '20px' }}/>
          <h2>You're already an Organizer!</h2>
          <p>Your subscription is active. Start creating and managing your campus events.</p>
          <button className="btn btn-primary" onClick={() => navigate('/organizer/dashboard')} style={{ marginTop: '20px' }}>
            Go to Organizer Portal <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const handleSubscribe = async () => {
    if (!currentUser) {
      alert("Please log in to subscribe.");
      return;
    }

    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      
      // MOCK PAYMENT: Directly update role to organizer
      const response = await fetch('/api/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newRole: 'organizer' })
      });

      if (!response.ok) throw new Error('Transaction failed');

      window.location.href = '/profile'; // Reload the app state and route to profile
    } catch (err) {
      console.error(err);
      alert("Subscription process failed. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Transform the campus experience.</h1>
        <p>Unlock powerful tools to host, monetize, and track events effortlessly.</p>
      </div>

      <div className="pricing-cards">
        <div className="pricing-card basic">
          <div className="card-header">
            <h3>Attendee</h3>
            <div className="price">Free</div>
            <p>Perfect for discovering events.</p>
          </div>
          <ul className="features-list">
            <li><Check size={18} className="icon-check" /> Browse local events</li>
            <li><Check size={18} className="icon-check" /> Purchase & securely store tickets</li>
            <li><Check size={18} className="icon-check" /> Digital QR Code wallet</li>
          </ul>
          <div className="card-footer">
            <button className="pricing-btn secondary" disabled>Current Plan</button>
          </div>
        </div>

        <div className="pricing-card premium">
          <div className="popular-badge">Most Popular</div>
          <div className="card-header">
            <h3>Event Organizer</h3>
            <div className="price">₹99<span>/month</span></div>
            <p>Everything you need to run successful events.</p>
          </div>
          <ul className="features-list">
            <li><Check size={18} className="icon-check" /> <strong>All Attendee features</strong></li>
            <li><Check size={18} className="icon-check" /> Create & publish custom events</li>
            <li><Check size={18} className="icon-check" /> In-built QR checking & validation tool</li>
            <li><Check size={18} className="icon-check" /> Real-time sales analytics & reporting</li>
            <li><Check size={18} className="icon-check" /> Payout management</li>
          </ul>
          <div className="card-footer">
            <button className="pricing-btn primary" onClick={handleSubscribe} disabled={loading}>
              {loading ? <Loader2 className="spinner" size={20} /> : "Upgrade to Organizer"}
            </button>
            <p className="secure-mock-note">Secure mock transaction.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
