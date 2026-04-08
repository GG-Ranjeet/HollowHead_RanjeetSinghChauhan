import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import './Login.css';

function Signup() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginWithGoogle, dbUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (dbUser) {
      navigate('/');
    }
  }, [dbUser, navigate]);

  const handleGoogleSignup = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError('Failed to create account with Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="back-btn" style={{ color: 'white', textDecoration: 'none', position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
        <ArrowLeft size={20} /> Back to Home
      </Link>
      
      <div className="auth-card" style={{ display: 'flex', width: '900px', maxWidth: '90%', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>
        
        {/* Left Panel */}
        <div className="auth-split left-panel" style={{ flex: 1, padding: '4rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '1rem', position: 'relative', zIndex: 2 }}>Join FlickyFest<span style={{ color: '#fbbf24' }}>.</span></h1>
          <p style={{ fontSize: '1.15rem', opacity: 0.9, lineHeight: 1.7, position: 'relative', zIndex: 2 }}>Create an account to discover events, grab tickets, and track everything in one place.</p>
          
          <div style={{ marginTop: '2rem', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.85 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✓</span>
              <span>Discover events near your campus</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.85 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✓</span>
              <span>Get QR-based digital tickets</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.85 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✓</span>
              <span>Upgrade to Organizer for $10/mo</span>
            </div>
          </div>

          <div className="accent-blob" style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', top: '-10%', right: '-10%', filter: 'blur(40px)', zIndex: 1 }}></div>
          <div className="accent-blob" style={{ position: 'absolute', width: '200px', height: '200px', background: 'rgba(251,191,36,0.1)', borderRadius: '50%', bottom: '5%', left: '-5%', filter: 'blur(30px)', zIndex: 1 }}></div>
        </div>
        
        {/* Right Panel */}
        <div className="auth-split right-panel" style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fafafa' }}>
          <div className="auth-form-wrapper" style={{ maxWidth: '350px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '0.5rem' }}>Create Account</h2>
            <p className="auth-subtitle" style={{ color: '#64748b', marginBottom: '1rem' }}>Join the community today</p>
            
            <div style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '0.75rem 1rem', color: '#166534', marginBottom: '2rem', borderRadius: '4px', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Everyone starts as an <strong>Attendee</strong>. Upgrade to <strong>Organizer</strong> anytime for <strong>$10/month</strong> to host your own events!
            </div>
            
            {error && (
              <div className="auth-error" style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', color: '#b91c1c', marginBottom: '1.5rem', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            
            <div className="auth-form">
              <button 
                onClick={handleGoogleSignup} 
                disabled={isLoading} 
                className="btn btn-primary w-100 login-btn"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px', 
                  backgroundColor: '#ffffff', 
                  color: '#334155', 
                  border: '1px solid #e2e8f0', 
                  padding: '0.8rem', 
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              >
                <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google Logo" 
                    style={{ width: '24px', height: '24px' }} 
                />
                {isLoading ? 'Creating Account...' : 'Sign up with Google'}
              </button>

              <div style={{ textAlign: 'center', margin: '2rem 0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e2e8f0' }}></div>
                <span style={{ position: 'relative', background: '#fafafa', padding: '0 15px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>Secure Auth via Firebase</span>
              </div>
            </div>
            
            <p className="auth-switch" style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Already have an account? <Link to="/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
