import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MapPin, Calendar, Clock, Image as ImageIcon, Tag, IndianRupee, Users, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import MapPinSelector from '../components/MapPinSelector';
import { auth } from '../config/firebase';
import './CreateEvent.css';

function CreateEvent() {
  const [step, setStep] = useState(1);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "Fest",
      tags: "",
      image: "",
      date: "",
      time: "",
      price: 0,
      totalCapacity: 100,
      addressString: "",
      latitude: 26.8467,
      longitude: 80.9462,
      geohash: ""
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/categories/');
        const data = await response.json();
        console.log(data);
        if (response.ok && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleNext = async (e) => {
    e.preventDefault();
    setStep(s => Math.min(s + 1, 3));
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data) => {
    setIsSubmittingForm(true);
    try {
      // Format payload to match backend Event Schema expectations
      const payload = {
        ...data,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        // combining date and time for backend if needed, or backend handles it
        date: `${data.date}T${data.time || "00:00"}`,
      };

      console.log("Submitting Event Payload:", payload);

      const token = await auth.currentUser.getIdToken();

      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create event");
      }

      setSuccess(true);

    } catch (error) {
      console.error("Submission Error:", error);
      alert(error.message || "Error submitting event");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setValue('latitude', loc.latitude);
    setValue('longitude', loc.longitude);
    setValue('geohash', loc.geohash);
    // Only update address automatically if user hasn't typed a custom one
    const currentAddress = watch('addressString');
    if (!currentAddress || currentAddress.startsWith('Selected Location')) {
      setValue('addressString', loc.addressString);
    }
  };

  if (success) {
    return (
      <div className="container create-container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <CheckCircle size={80} color="var(--success-color)" style={{ margin: '0 auto 2rem' }} />
        <h1>Event Created Successfully!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your event is now live and generating local buzz.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="btn btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="container create-container" style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="create-header" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Host New Event</h1>
        <p style={{ color: 'var(--text-muted)' }}>Bring your campus together in 3 simple steps.</p>
      </div>

      <div className="step-indicator" style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1,
            height: '6px',
            borderRadius: '3px',
            background: step >= i ? 'var(--primary-color)' : 'var(--bg-subtle)'
          }} />
        ))}
      </div>

      <form onSubmit={step === 3 ? handleSubmit(onSubmit) : handleNext} className="create-form">

        {step === 1 && (
          <div className="form-step">
            <h2 style={{ marginBottom: '2rem' }}>1. Basic Details</h2>

            <div className="form-group">
              <label>Event Title</label>
              <input type="text" {...register('title', { required: true })} placeholder="e.g. Neon Nights Music Fest" className="form-input" />
              {errors.title && <span className="error-text">Title is required</span>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea {...register('description', { required: true, minLength: 20 })} rows="4" placeholder="Tell people what to expect..." className="form-input"></textarea>
              {errors.description && <span className="error-text">Please provide a detailed description (min 20 chars).</span>}
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Category</label>
                <select {...register('category')} className="form-input">
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="Fest">Fest</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Networking">Networking</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tags (comma separated)</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="text" {...register('tags')} placeholder="e.g. Tech, Fun, Food" className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Cover Image URL</label>
              <div style={{ position: 'relative' }}>
                <ImageIcon size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input type="url" {...register('image', { required: true })} placeholder="https://..." className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2 style={{ marginBottom: '2rem' }}>2. Date & Location</h2>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="date" {...register('date', { required: true })} className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Time</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="time" {...register('time', { required: true })} className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Venue / Address Description</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input type="text" {...register('addressString', { required: true })} placeholder="e.g. Main Auditorium, BBDU Block C" className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Pin Exact Location</label>
              <MapPinSelector
                onLocationSelect={handleLocationSelect}
                initialPosition={[watch('latitude') || 26.8467, watch('longitude') || 80.9462]}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Geohash Generated: {watch('geohash') || "Waiting for pin..."}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2 style={{ marginBottom: '2rem' }}>3. Tickets & Capacity</h2>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Ticket Price (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="number" {...register('price', { valueAsNumber: true, min: 0 })} placeholder="0 for Free" className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Total Capacity (Spots)</label>
                <div style={{ position: 'relative' }}>
                  <Users size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="number" {...register('totalCapacity', { required: true, valueAsNumber: true, min: 1 })} className="form-input pl-10" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          {step > 1 ? (
            <button type="button" onClick={handlePrev} className="btn btn-secondary">
              <ArrowLeft size={18} /> Back
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
              Next Step <ArrowRight size={18} />
            </button>
          ) : (
            <button type="submit" disabled={isSubmittingForm} className="btn btn-primary" style={{ marginLeft: 'auto', background: 'var(--success-color)' }}>
              {isSubmittingForm ? "Publishing..." : "Publish Event"} <MapPin size={18} />
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

export default CreateEvent;
