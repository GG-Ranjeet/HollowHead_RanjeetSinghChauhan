import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

export const createEvent = async (req, res) => {
  try {
    // Constraint: Only users with the 'organizer' role can create events
    if (!req.dbUser || req.dbUser.role !== 'organizer') {
      return res.status(403).json({ error: "Forbidden: Only organizers can create events. You must upgrade your account." });
    }

    const {
      title, description, category, 
      latitude, longitude, geohash, addressString, 
      date, price, totalCapacity, tags, image
    } = req.body;

    // Validate inputs based on provided schema
    if (!latitude || !longitude || !geohash) {
        return res.status(400).json({ error: "Geospatial data (latitude, longitude, geohash) is required" });
    }

    const newEvent = {
      title,
      description,
      organizerId: req.user.uid,
      category: category || 'Other',
      tags: Array.isArray(tags) ? tags : [],
      image: image || '',
      location: new admin.firestore.GeoPoint(parseFloat(latitude), parseFloat(longitude)),
      geohash,
      addressString,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      price: Number(price) || 0,
      totalCapacity: Number(totalCapacity) || 0,
      ticketsSold: 0,
      status: 'published' 
    };

    const eventRef = await db.collection('events').add(newEvent);
    
    res.status(201).json({ message: 'Event created successfully', id: eventRef.id });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
};

export const getEvents = async (req, res) => {
  try {
    // In production, implement GeoHash queries instead of fetching all
    const snapshot = await db.collection('events').where('status', '==', 'published').get();
    const events = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({ 
          id: doc.id, 
          ...data,
          location: { lat: data.location.latitude, lng: data.location.longitude },
          date: data.date.toDate() // Convert Firestore timestamp back to JS Date for frontend
      });
    });
    
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

export const getOrganizerEvents = async (req, res) => {
  try {
    const snapshot = await db.collection('events').where('organizerId', '==', req.user.uid).get();
    const events = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({ 
          id: doc.id, 
          ...data,
          location: { lat: data.location.latitude, lng: data.location.longitude },
          date: data.date.toDate()
      });
    });
    
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({ error: "Failed to fetch organizer events" });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('events').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const data = doc.data();
    
    // Attempt to lookup organizer data briefly (optional but helpful for frontend)
    let organizerData = { name: "Organizer", avatar: "https://i.pravatar.cc/150?u=" + data.organizerId };
    try {
      const orgDoc = await db.collection('users').doc(data.organizerId).get();
      if (orgDoc.exists && orgDoc.data().name) {
          organizerData.name = orgDoc.data().name;
      }
    } catch(e) {}

    res.status(200).json({
      event: {
        id: doc.id,
        ...data,
        location: { lat: data.location.latitude, lng: data.location.longitude },
        date: data.date.toDate(),
        organizer: organizerData
      }
    });

  } catch (error) {
    console.error("Error fetching event by id:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Constraint: Only users with the 'organizer' role can update events
    if (!req.dbUser || req.dbUser.role !== 'organizer') {
      return res.status(403).json({ error: "Forbidden: Only organizers can update events." });
    }

    const docRef = db.collection('events').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (doc.data().organizerId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden: You do not own this event." });
    }

    const {
      title, description, category, 
      latitude, longitude, geohash, addressString, 
      date, price, totalCapacity, tags, image,
      endTime, registrationDeadline, rules, status, offlineTicketsSold
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (image !== undefined) updates.image = image;
    if (addressString !== undefined) updates.addressString = addressString;
    if (price !== undefined) updates.price = Number(price);
    if (totalCapacity !== undefined) updates.totalCapacity = Number(totalCapacity);
    if (endTime !== undefined) updates.endTime = endTime ? admin.firestore.Timestamp.fromDate(new Date(endTime)) : null;
    if (registrationDeadline !== undefined) updates.registrationDeadline = registrationDeadline ? admin.firestore.Timestamp.fromDate(new Date(registrationDeadline)) : null;
    if (rules !== undefined) updates.rules = rules;
    if (status !== undefined) updates.status = status;
    
    if (date) {
      updates.date = admin.firestore.Timestamp.fromDate(new Date(date));
    }

    if (latitude && longitude && geohash) {
      updates.location = new admin.firestore.GeoPoint(parseFloat(latitude), parseFloat(longitude));
      updates.geohash = geohash;
    }

    if (offlineTicketsSold !== undefined) {
       // Note: In a production system, use increment/transactions for accuracy.
       // We update ticketsSold to incorporate the offline sale jump. 
       // If offlineTicketsSold is provided, we assume it's the number of offline tickets sold to add.
       // Or if it replaces the value, we can just add to it. Let's assume the frontend sends the *amount* to add.
       updates.ticketsSold = admin.firestore.FieldValue.increment(Number(offlineTicketsSold));
    }

    await docRef.update(updates);

    res.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.dbUser || req.dbUser.role !== 'organizer') {
      return res.status(403).json({ error: "Forbidden: Only organizers can delete events." });
    }

    const docRef = db.collection('events').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (doc.data().organizerId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden: You do not own this event." });
    }

    await docRef.delete();

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
};

