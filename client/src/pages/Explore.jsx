import { useState, useEffect } from 'react';
import { imgFallback } from '../utils/eventImageFallback';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Users } from 'lucide-react';

function Explore() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('All');

  const [events, setEvents] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        
        if (response.ok && data.events) {
          const formatted = data.events.map(e => ({
            ...e,
            date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            venue: e.addressString || 'TBA',
            spotsLeft: (e.totalCapacity || 100) - (e.ticketsSold || 0),
          }));
          setEvents(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (response.ok && data.categories) {
          setCategoriesList(data.categories.map(c => c.name));
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    
    fetchEvents();
    fetchCategories();
  }, []);

  const toggleCategory = (cat) => {
    setActiveCategories(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };
  
  const filteredEvents = events.filter(event => {
    const term = searchTerm.toLowerCase();
    const titleMatch = event.title?.toLowerCase().includes(term);
    const venueMatch = event.venue?.toLowerCase().includes(term);
    const tagsMatch = event.tags?.some(tag => tag.toLowerCase().includes(term));
    const matchesSearch = titleMatch || venueMatch || tagsMatch;
    
    // Fallback classification if category isn't properly assigned
    const fallbackCat = event.category || 'Fest';
    const matchesCategory = activeCategories.length === 0 || activeCategories.includes(fallbackCat);
    
    // Price filter logic
    const priceMatch = 
      priceFilter === 'All' ? true :
      priceFilter === 'Free' ? event.price === 0 :
      event.price > 0;
    
    return matchesSearch && matchesCategory && priceMatch;
  });

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Explore Events</h1>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search events, colleges, or tags..." 
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ display: 'flex', gap: '0.5rem', transition: 'all 0.2s ease' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Expandable Filter Pane */}
      {showFilters && (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '2rem', animation: 'dropdownIn 0.2s ease-out' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem', color: 'var(--text-main)' }}>Pricing Preferences</h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {['All', 'Free', 'Paid'].map(option => (
              <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input 
                  type="radio" 
                  name="priceFilter" 
                  checked={priceFilter === option}
                  onChange={() => setPriceFilter(option)}
                  style={{ accentColor: 'var(--primary-color)', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                {option === 'All' ? 'Any Price' : option}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeCategories.length === 0 ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', flexShrink: 0 }}
          onClick={() => setActiveCategories([])}
        >
          All
        </button>
        {categoriesList.map(cat => (
          <button 
            key={cat} 
            className={`btn ${activeCategories.includes(cat) ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', flexShrink: 0, transition: 'background-color 0.2s ease' }}
            onClick={() => toggleCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="events-grid">
        {filteredEvents.length > 0 ? filteredEvents.map(event => (
          <Link to={`/events/${event.id}`} key={event.id} className="event-card">
            <div className="card-image-wrap">
              <img src={event.image} alt={event.title} className="card-image" onError={imgFallback(event.category)} />
              <div className="card-tags">
                <span className="tag tag-blur">{event.category || 'Event'}</span>
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
        )) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            {loading ? <p>Loading fantastic events...</p> : <p>No events found matching your criteria.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
