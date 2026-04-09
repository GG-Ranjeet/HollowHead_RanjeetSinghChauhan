import { useState, useEffect } from 'react';
import { imgFallback } from '../utils/eventImageFallback';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Share2, Ticket, X, CheckCircle } from 'lucide-react';
import { auth } from '../config/firebase';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/events/${id}`);
        const data = await response.json();

        if (response.ok && data.event) {
          const e = data.event;
          setEvent({
            ...e,
            date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            moods: e.tags || [],
            venue: e.addressString || 'TBA',
            proximity: 'Check Map for details',
            spotsLeft: (e.totalCapacity || 100) - (e.ticketsSold || 0),
            totalSpots: e.totalCapacity || 100,
            organizer: e.organizer || { name: 'Verified Organizer', avatar: 'https://i.pravatar.cc/150' }
          });
        } else {
          setError(data.error || "Event not found");
        }
      } catch (err) {
        setError("Failed to stream event details.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      alert("Please sign in first to reserve a spot.");
      return;
    }

    setIsProcessing(true);
    setBookingError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/tickets/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          paymentStatus: event.price === 0 ? 'free' : 'paid'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === "ALREADY_BOOKED") {
          throw new Error("You already have a valid ticket for this event!");
        }
        throw new Error(data.error || "Failed to purchase ticket");
      }

      setShowModal(false);
      navigate(`/ticket/${data.ticketId}`);

    } catch (err) {
      console.error(err);
      setBookingError(err.message || "Error reserving ticket. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>Loading Event...</div>;
  }

  if (error || !event) {
    return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center', color: 'var(--danger-color)' }}>{error || "Event not found."}</div>;
  }

  return (
    <div>
      {/* Banner */}
      <div style={{ width: '100%', height: '300px', backgroundColor: 'var(--bg-subtle)', position: 'relative' }}>
        <img src={event.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Banner" onError={imgFallback(event.category)} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)' }}></div>
      </div>

      <div className="container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10, display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

        {/* Main Content */}
        <div style={{ flex: '1', minWidth: '300px', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {event.moods.map((mood, i) => (
              <span key={i} className="badge" style={{ marginBottom: 0, background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>{mood}</span>
            ))}
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{event.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '2rem' }}>{event.description}</p>

          <h3>About the Organizer</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <img src={event.organizer.avatar} alt="org" style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-full)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>{event.organizer.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Verified Campus Organizer</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Event Details</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Calendar color="var(--primary-color)" />
                <div>
                  <div style={{ fontWeight: 500 }}>{event.date}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{event.time}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <MapPin color="var(--primary-color)" />
                <div>
                  <div style={{ fontWeight: 500 }}>{event.venue}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{event.proximity}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Users color="var(--primary-color)" />
                <div>
                  <div style={{ fontWeight: 500 }}>{event.spotsLeft} out of {event.totalSpots} spots left</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary-color)' }}>
              {event.price === 0 ? 'Free Entry' : `₹${event.price}`}
            </div>

            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Ticket size={20} /> Reserve Spot
            </button>

            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              <Share2 size={20} /> Share Event
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Complete Registration</h2>

            <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>{event.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{event.date} • {event.venue}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>General Admission</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{event.price === 0 ? 'Free' : `₹${event.price}`}</div>
              </div>
              <div style={{ fontWeight: 600 }}>1 Ticket</div>
            </div>

            {bookingError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>{bookingError}</div>}

            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem' }}>
                <span>Total</span>
                <span>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing securely...' : `Confirm & Generate Ticket`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetail;
