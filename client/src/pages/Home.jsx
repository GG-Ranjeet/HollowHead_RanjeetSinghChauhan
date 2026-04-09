import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, ArrowRight, Star, Navigation, Search, AlertCircle } from 'lucide-react';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { userProfile } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { imgFallback } from '../utils/eventImageFallback';
import './Home.css';

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Hardcoded Lucknow pincodes for fallback
const pincodeMap = {
  "226028": { lat: 26.8833, lng: 81.0494, name: "BBDU Area" }, 
  "226010": { lat: 26.8528, lng: 80.9995, name: "Gomti Nagar" },
  "226001": { lat: 26.8500, lng: 80.9389, name: "Hazratganj" },
};

function Home() {
  const { currentUser, dbUser } = useAuth();
  const [userLocation, setUserLocation] = useState(() => {
    const savedLoc = localStorage.getItem('userLocation');
    return savedLoc ? JSON.parse(savedLoc) : null;
  });
  const [pincodeStr, setPincodeStr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [nearbyEvents, setNearbyEvents] = useState([]);
  
  const [displayEvents, setDisplayEvents] = useState([]);
  const [recentBooking, setRecentBooking] = useState(null);
  const [showLocationSuccess, setShowLocationSuccess] = useState(false);
  const hostBtnRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!hostBtnRef.current) return;
      const rect = hostBtnRef.current.getBoundingClientRect();
      const passed = rect.bottom < 60; // 60px accounts for the approximate navbar height
      window.dispatchEvent(new CustomEvent('navHostBtnState', { detail: passed }));
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.dispatchEvent(new CustomEvent('navHostBtnState', { detail: false }));
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('userLocation', JSON.stringify(userLocation));
    } else {
      localStorage.removeItem('userLocation');
    }
  }, [userLocation]);

  useEffect(() => {
    if (displayEvents.length === 0) return;
    const fakeNames = ["Rahul", "Anjali", "Vikram", "Sneha", "Karan", "Pooja", "Amit", "Neha", "Rohan", "Shruti"];
    const pickRandom = () => {
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const event = displayEvents[Math.floor(Math.random() * displayEvents.length)];
      setRecentBooking({ name, eventTitle: event.title });
    };
    pickRandom();
    const interval = setInterval(pickRandom, 6000);
    return () => clearInterval(interval);
  }, [displayEvents]);

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
        setShowLocationSuccess(true);
        setTimeout(() => setShowLocationSuccess(false), 4000);
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
      setShowLocationSuccess(true);
      setTimeout(() => setShowLocationSuccess(false), 4000);
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
  const lucknowEvents = displayEvents.filter(e => e.venue && e.venue.toLowerCase().includes('lucknow'));

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Location Top Bar */}
        {(!userLocation || showLocationSuccess) && (
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
        )}

        <div className="container hero-container" style={{ paddingTop: '2rem' }}>
          <div className="hero-text-area">
            {currentUser && (
              <span className="badge">Welcome back, {dbUser?.name || currentUser.displayName || 'User'} 👋</span>
            )}
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
              <Link ref={hostBtnRef} to={dbUser?.role === 'organizer' ? "/organizer/create" : "/pricing"} className="btn btn-secondary">
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
                 {recentBooking && (
                   <div className="floating-card ticker-anim" key={`${recentBooking.name}-${recentBooking.eventTitle}`}>
                      <div className="fl-avatar" style={{background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem'}}>
                        {recentBooking.name.charAt(0)}
                      </div>
                      <div className="fl-text">
                         <strong>{recentBooking.name} booked a ticket!</strong>
                         <span style={{maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{recentBooking.eventTitle}</span>
                      </div>
                   </div>
                 )}
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
                      <img src={event.image} alt={event.title} className="card-image" onError={imgFallback(event.category)} />
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
                        <span className="price" style={{ fontSize: '1rem' }}>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
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
                    <span className="price" style={{ fontSize: '1rem' }}>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
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
            <h2 className="section-title">Trending Near Lucknow</h2>
            <Link to="/explore" className="view-all">View all filters</Link>
          </div>
          
          {lucknowEvents.length > 0 ? (
            <div className="events-grid">
              {lucknowEvents.map(event => (
                <Link to={`/events/${event.id}`} key={event.id} className="event-card">
                  <div className="card-image-wrap" style={{ height: '160px' }}>
                    <img src={event.image} alt={event.title} className="card-image" onError={imgFallback(event.category)} />
                  </div>
                  <div className="card-body" style={{ padding: '1rem' }}>
                    <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{event.title}</h3>
                    <div className="card-meta" style={{ marginBottom: '1rem' }}>
                      <span><Calendar size={14} /> {event.date}</span>
                      <span><MapPin size={14} /> {event.venue}</span>
                    </div>
                    <div className="card-footer" style={{ paddingTop: '0.75rem' }}>
                      <span className="price" style={{ fontSize: '1rem' }}>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No top trending events in Lucknow at the moment. Keep an eye out!</p>
          )}
        </div>
      </section>

      {/* Event Map Section */}
      {userLocation && (
        <section className="featured-section" style={{ background: 'var(--bg-subtle)' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin color="var(--primary-color)" size={28} /> Nearby Map View
              </h2>
            </div>
            <div className="map-canvas" style={{ height: '450px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', position: 'relative', zIndex: 1 }}>
              <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>
                    <strong>You are here!</strong><br />
                    {userLocation.name}
                  </Popup>
                </Marker>

                {nearbyEvents.map(event => (
                  <Marker key={`map-${event.id}`} position={[event.latitude, event.longitude]}>
                    <Popup>
                      <div style={{ textAlign: 'center', minWidth: '150px' }}>
                        <img src={event.image} alt={event.title} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} onError={imgFallback(event.category)} />
                        <strong style={{ display: 'block', fontSize: '1rem', color: '#1e293b', marginBottom: '4px' }}>{event.title}</strong>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                        <br />
                        <Link to={`/events/${event.id}`} style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: 'var(--primary-color)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>View Details</Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </section>
      )}

      {/* Reset Location Footer */}
      {userLocation && (
        <section style={{ padding: '3rem 0', textAlign: 'center', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
          <div className="container">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Currently prioritizing events near <strong>{userLocation.name}</strong>.
            </p>
            <button 
              onClick={() => setUserLocation(null)} 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)' }}
            >
              <MapPin size={16} /> Choose Another Location
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
