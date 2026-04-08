import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, ArrowRight, Star, Navigation, Search, AlertCircle } from 'lucide-react';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { userProfile } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import './Home.css';

// Hardcoded Lucknow pincodes for fallback
const pincodeMap = {
  "226028": { lat: 26.8833, lng: 81.0494, name: "BBDU Area" }, 
  "226010": { lat: 26.8528, lng: 80.9995, name: "Gomti Nagar" },
  "226001": { lat: 26.8500, lng: 80.9389, name: "Hazratganj" },
};

function Home() {
  const { dbUser } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [pincodeStr, setPincodeStr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [nearbyEvents, setNearbyEvents] = useState([]);
  
  const [displayEvents, setDisplayEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        const data = await response.json();
        
        if (response.ok && data.events) {
          const formatted = data.events.map(e => ({
            ...e,
            date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            latitude: e.location?.lat,
            longitude: e.location?.lng,
            spotsLeft: (e.totalCapacity || 100) - (e.ticketsSold || 0),
            totalSpots: e.totalCapacity || 100,
            moods: e.tags || [],
            venue: e.addressString || 'TBA',
          }));
          setDisplayEvents(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, []);

  const handleEnableGPS = () => {
    setErrorMsg("");
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "Current GPS Location"
        });
      },
      (error) => {
        setErrorMsg("Unable to retrieve your location. " + error.message);
      }
    );
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    const loc = pincodeMap[pincodeStr];
    if (loc) {
      setUserLocation(loc);
    } else {
      setErrorMsg("Pincode outside service area. Try 226028, 226010, or 226001.");
    }
  };

  // Filter logic based on userLocation
  useEffect(() => {
    if (userLocation) {
      const center = [userLocation.lat, userLocation.lng];
      const radiusInKm = 10;
      
      const filtered = displayEvents.filter(event => {
        if (!event.latitude || !event.longitude) return false;
        const distance = distanceBetween(center, [event.latitude, event.longitude]);
        return distance <= radiusInKm;
      });
      
      setNearbyEvents(filtered);
    }
  }, [userLocation, displayEvents]);

  const recommendedEvents = displayEvents.slice(0, 2);
  const otherEvents = displayEvents.slice(2);

  return (
    <div className="home-container">
      {/* Location Top Bar */}
      <div className="location-bar">
        <div className="container loc-container">
          {!userLocation ? (
             <div className="loc-prompt">
                <div className="loc-prompt-text">
                  <MapPin size={20} color="var(--primary-color)" />
                  <span>Discover events near you. Enable location or enter a pincode.</span>
                </div>
                <div className="loc-actions">
                  <button onClick={handleEnableGPS} className="btn-loc-gps">
                    <Navigation size={16} /> Enable GPS
                  </button>
                  <form onSubmit={handlePincodeSubmit} className="loc-form">
                     <input 
                       type="text" 
                       placeholder="e.g. 226028" 
                       className="loc-input"
                       value={pincodeStr}
                       onChange={(e) => setPincodeStr(e.target.value)}
                     />
                     <button type="submit" className="loc-btn-submit"><Search size={16}/></button>
                  </form>
                </div>
             </div>
          ) : (
            <div className="loc-active">
               <MapPin size={20} color="var(--success-color)" />
               <span>Showing events within 10km of <strong>{userLocation.name}</strong></span>
               <button onClick={() => setUserLocation(null)} className="loc-clear">Change</button>
            </div>
          )}
          
          {errorMsg && (
            <div className="loc-error">
               <AlertCircle size={16}/> {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-text-area">
            <span className="badge">Welcome back, {userProfile.name} 👋</span>
            <h1 className="hero-title">
              Find the perfect <br/>
              <span className="text-highlight">vibes</span> near you.
            </h1>
            <p className="hero-subtitle">
              Discover amazing fests, tech hackathons, open mics, and networking workshops directly on your campus or across the city.
            </p>
            <div className="hero-actions">
              <Link to="/explore" className="btn btn-primary">
                Explore Events <ArrowRight size={18} />
              </Link>
              <Link to={dbUser?.role === 'organizer' ? "/organizer/create" : "/pricing"} className="btn btn-secondary">
                Host an Event
              </Link>
            </div>
            
            <div className="hero-stats">
              <div className="stat-item">
                <strong>500+</strong> <span>Events Hosted</span>
              </div>
              <div className="stat-item">
                <strong>10k+</strong> <span>Active Students</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual-area">
             <div className="hero-image-stack">
               <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=600&q=80" alt="Hackathon" className="h-img h-img-1" />
               <img src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80" alt="Fest" className="h-img h-img-2" />
               <div className="floating-card">
                  <div className="fl-avatar" style={{background: 'var(--success-color)'}}></div>
                  <div className="fl-text">
                     <strong>Ticket Booked!</strong>
                     <span>Just now</span>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Nearby Events Section (Only shows if Location is Active) */}
      {userLocation && (
        <section className="featured-section" style={{ background: 'var(--bg-subtle)' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation color="var(--primary-color)" size={28} />
                Nearby Events (10km Radius)
              </h2>
            </div>
            
            {nearbyEvents.length === 0 ? (
               <p style={{color:'var(--text-muted)'}}>No events found nearby in this radius.</p>
            ) : (
              <div className="events-grid">
                {nearbyEvents.map(event => (
                  <Link to={`/events/${event.id}`} key={`nearby-${event.id}`} className="event-card">
                    <div className="card-image-wrap">
                      <img src={event.image} alt={event.title} className="card-image" />
                      <div className="card-tags">
                        {event.moods.slice(0, 2).map((mood, idx) => (
                          <span key={idx} className="tag tag-blur">{mood}</span>
                        ))}
                      </div>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{event.title}</h3>
                      <div className="card-meta">
                        <span><Calendar size={14} /> {event.date}</span>
                        <span><MapPin size={14} /> {event.venue}</span>
                      </div>
                      <div className="card-footer">
                        <span className="price">{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                        <span className="spots">
                          <Users size={14} />
                          {event.spotsLeft} spots left
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recommended For You Section */}
      <section className="featured-section" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star color="var(--warning-color)" fill="var(--warning-color)" size={28} />
              Recommended for You
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Based on your interests in {userProfile.interests.join(", ")}</p>
          </div>
          
          <div className="events-grid">
            {recommendedEvents.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="event-card recommended-card">
                <div className="card-image-wrap">
                  <img src={event.image} alt={event.title} className="card-image" />
                  <div className="card-tags">
                    {event.moods.slice(0, 2).map((mood, idx) => (
                      <span key={idx} className="tag tag-blur">{mood}</span>
                    ))}
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{event.title}</h3>
                  <div className="card-meta">
                    <span><Calendar size={14} /> {event.date}</span>
                    <span><MapPin size={14} /> {event.venue}</span>
                  </div>
                  <div className="card-footer">
                    <span className="price">{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                    <span className="spots">
                      <Users size={14} />
                      {event.spotsLeft} spots left
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Trending Events */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trending Near {userProfile.college}</h2>
            <Link to="/explore" className="view-all">View all filters</Link>
          </div>
          
          <div className="events-grid">
            {otherEvents.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="event-card">
                <div className="card-image-wrap" style={{ height: '160px' }}>
                  <img src={event.image} alt={event.title} className="card-image" />
                </div>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{event.title}</h3>
                  <div className="card-meta" style={{ marginBottom: '1rem' }}>
                    <span><Calendar size={14} /> {event.date}</span>
                  </div>
                  <div className="card-footer" style={{ paddingTop: '0.75rem' }}>
                    <span className="price" style={{ fontSize: '1rem' }}>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
