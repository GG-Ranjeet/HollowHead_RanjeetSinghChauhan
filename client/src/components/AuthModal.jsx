import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff } from 'lucide-react';
import './AuthModal.css';

function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form refs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle('attendee'); // Fast-track everyone to attendee
    } catch (err) {
      setError(err.message || 'Google Auth Failed');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name, 'attendee'); // Enforce attendee role
      }
    } catch (err) {
      setError(err.message || 'Authentication Failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal}>
          <X size={18} />
        </button>

        {/* Left Side: Impact Banner */}
        <div className="auth-side-banner">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }}>FlickyFest<span style={{ color: '#fbbf24' }}>.</span></h2>
          </div>
          <div className="auth-banner-content">
            <h2>Unlock The Campus Experience.</h2>
            <p>Access your digital wallet, seamlessly check into events, and explore what's happening around you.</p>
          </div>
        </div>

        {/* Right Side: Form Component */}
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h3>{isLogin ? 'Welcome Back' : 'Get Started'}</h3>
            <p>{isLogin ? 'Sign in to access your digital tickets.' : 'Create your free attendee account today.'}</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {error && <div className="auth-error-msg">{error}</div>}

          <form onSubmit={handleEmailAuth}>
            {!isLogin && (
              <div className="auth-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <div className="auth-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-btn-stack">
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Processing..." : (isLogin ? "Sign In" : "Register")}
              </button>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  style={{ width: 22 }}
                />
                Continue with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
