import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import './OnboardingModal.css';

function OnboardingModal() {
  const { showOnboarding, closeOnboardingModal, dbUser } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [hobbiesText, setHobbiesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!showOnboarding) return;
    
    // Fetch live categories for the selector
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (response.ok && data.categories) {
          setCategories(data.categories.map(c => c.name));
        }
      } catch (err) {
        console.error("Failed to fetch onboarding categories", err);
        setCategories(['Tech', 'Art', 'Music', 'Fest', 'Sports']);
      }
    };
    fetchCategories();
  }, [showOnboarding]);

  if (!showOnboarding) return null;

  const toggleInterest = (cat) => {
    setSelectedInterests(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat) 
        : [...prev, cat]
    );
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    
    try {
      let token = window.FIREBASE_TOKEN; // Set during auth flow
      if (!token && auth.currentUser) {
         token = await auth.currentUser.getIdToken();
      }
      if (!token) throw new Error("Authentication missing. Please re-login.");

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interests: selectedInterests,
          hobbies: hobbiesText
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save profile preferences");
      }

      // Success
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    closeOnboardingModal();
  };

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-modal-card">
        
        <div className="onboard-header">
          <h2>Welcome to FlickyFest, {dbUser?.name?.split(' ')[0] || 'Explorer'}! 🎉</h2>
          <p>Let's personalize your feed. Tell us what you love so organizers can notify you when matching events drop in your city.</p>
        </div>

        {error && <div className="onboard-error">{error}</div>}

        <div className="onboard-section">
          <h3>Select Your Interests</h3>
          <p className="subtext">Choose all that apply.</p>
          <div className="onboard-tags-grid">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`onboard-tag ${selectedInterests.includes(cat) ? 'active' : ''}`}
                onClick={() => toggleInterest(cat)}
              >
                {cat}
                {selectedInterests.includes(cat) && <CheckCircle2 size={16} className="tag-check" />}
              </button>
            ))}
          </div>
        </div>

        <div className="onboard-section">
          <h3>Other Hobbies & Passion (Optional)</h3>
          <p className="subtext">Help us match you with highly specific niche workshops!</p>
          <textarea 
            className="onboard-textarea"
            placeholder="e.g. Vintage synth repair, competitive coding, sustainable gardening..."
            value={hobbiesText}
            onChange={(e) => setHobbiesText(e.target.value)}
            rows={3}
          />
        </div>

        <div className="onboard-footer">
          <button className="onboard-skip-btn" onClick={handleSkip} disabled={saving}>
            Skip for now
          </button>
          
          <button className="onboard-save-btn" onClick={handleSave} disabled={saving || selectedInterests.length === 0}>
            {saving ? 'Saving...' : 'Curate My Feed'} <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default OnboardingModal;
