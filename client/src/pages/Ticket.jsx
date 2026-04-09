import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Share2, Download, ArrowLeft } from 'lucide-react';
import { auth } from '../config/firebase';
import html2canvas from 'html2canvas';
import { imgFallback } from '../utils/eventImageFallback';

function Ticket() {
  const { id } = useParams();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`/api/tickets/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok && data.ticket) {
          // Format date if needed
          const eventPayload = data.event || {};
          if (eventPayload.date) {
             eventPayload.dateStr = new Date(eventPayload.date).toLocaleDateString();
          }
          setTicketData({ ticket: data.ticket, event: eventPayload });
        } else {
          setErrorObj(data.error || "Ticket not found");
        }
      } catch (err) {
        setErrorObj("Failed to verify ticket details");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleSaveTicket = async () => {
    if (!ticketRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: null,
        scale: 2,           // retina quality
        useCORS: true,      // allow cross-origin images (event banners)
        allowTaint: false,
        logging: false,
      });
      const link = document.createElement('a');
      const safeName = (ticketData?.event?.title || 'ticket').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `flickyfest_${safeName}_ticket.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to save ticket image:', err);
      alert('Could not save ticket. Please try taking a screenshot manually.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const eventTitle = ticketData?.event?.title || 'an event';
    const eventId = ticketData?.ticket?.eventId;
    const eventUrl = eventId
      ? `${window.location.origin}/events/${eventId}`
      : window.location.href;

    const shareData = {
      title: `My ticket for ${eventTitle} — FlickyFest`,
      text: `I'm attending “${eventTitle}”! Grab your spot on FlickyFest.`,
      url: eventUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy event URL to clipboard
      try {
        await navigator.clipboard.writeText(eventUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch {
        alert(`Share this link: ${eventUrl}`);
      }
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: '2rem' }}>Loading Ticket...</div>;
  if (errorObj || !ticketData) return <div className="container" style={{ paddingTop: '2rem', color: 'var(--danger-color)' }}>{errorObj || "Ticket not found."}</div>;

  const { ticket, event } = ticketData;
  const userName = auth.currentUser?.displayName || "Guest Ticket";

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '500px' }}>
      <Link to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={16} /> Back to My Tickets
      </Link>

      <div ref={ticketRef} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
        {/* Ticket Header */}
        <div style={{ height: '120px', position: 'relative' }}>
          <img src={event.image} alt="Ticket banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={imgFallback(event.category)} crossOrigin="anonymous" />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }}></div>
          <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', color: 'white' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Admission Ticket</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{event.title}</div>
          </div>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '2px dashed var(--border-color)' }}>
          <div style={{ border: '4px solid white', borderRadius: '8px', boxShadow: '0 0 0 1px var(--border-color)', padding: '1rem', background: 'white', marginBottom: '1.5rem' }}>
            <QRCodeSVG value={ticket.qrToken || "INVALID"} size={160} />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
            ID: {ticket.id}
          </div>
        </div>

        {/* Ticket Details */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name</div>
              <div style={{ fontWeight: 600 }}>{userName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type</div>
              <div style={{ fontWeight: 600 }}>General</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date & Time</div>
              <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14}/> {event.dateStr || 'TBA'}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Venue</div>
            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14}/> {event.venue}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={handleSaveTicket}
          disabled={isSaving}
        >
          <Download size={18} /> {isSaving ? 'Saving…' : 'Save Ticket'}
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={handleShare}
        >
          <Share2 size={18} /> {isCopied ? 'Link Copied!' : 'Share'}
        </button>
      </div>
    </div>
  );
}

export default Ticket;
