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
