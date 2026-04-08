import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import crypto from 'crypto';

export const purchaseTicket = async (req, res) => {
  try {
    const { eventId, paymentStatus } = req.body;
    const userId = req.user.uid;

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const existingTicket = await db.collection('tickets')
        .where('eventId', '==', eventId)
        .where('userId', '==', userId)
        .get();
        
    if (!existingTicket.empty) {
        return res.status(400).json({ error: "ALREADY_BOOKED" });
    }

    const eventRef = db.collection('events').doc(eventId);
    
    // We use a Firestore transaction to ensure we don't oversell tickets
    const ticketRef = db.collection('tickets').doc();
    const qrToken = crypto.randomUUID();

    await db.runTransaction(async (t) => {
      const eventDoc = await t.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error("EVENT_NOT_FOUND");
      }
      
      const eventData = eventDoc.data();
      if (eventData.ticketsSold >= eventData.totalCapacity && eventData.totalCapacity > 0) {
        throw new Error("EVENT_SOLD_OUT");
      }

      const newTicket = {
        eventId,
        userId,
        qrToken,
        paymentStatus: paymentStatus || 'free',
        isCheckedIn: false,
        checkedInAt: null,
        createdAt: admin.firestore.Timestamp.now()
      };

      t.set(ticketRef, newTicket);
      t.update(eventRef, { ticketsSold: admin.firestore.FieldValue.increment(1) });
    });

    res.status(201).json({ message: 'Ticket purchased successfully', ticketId: ticketRef.id, qrToken });
  } catch (error) {
    console.error("Error creating ticket:", error);
    if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: "Event not found" });
    if (error.message === 'EVENT_SOLD_OUT') return res.status(400).json({ error: "Event is sold out" });
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const snapshot = await db.collection('tickets').where('userId', '==', req.user.uid).get();
    const tickets = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      tickets.push({ 
          id: doc.id, 
          ...data,
          checkedInAt: data.checkedInAt ? data.checkedInAt.toDate() : null,
          createdAt: data.createdAt ? data.createdAt.toDate() : null
      });
    });
    
    res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

export const checkInTicket = async (req, res) => {
  try {
    const { qrToken } = req.body;
    
    if (!qrToken) {
        return res.status(400).json({ error: "QR Token is required" });
    }

    const snapshot = await db.collection('tickets').where('qrToken', '==', qrToken).get();
    
    if (snapshot.empty) {
        return res.status(404).json({ error: "Invalid ticket QR code" });
    }
    
    const ticketDoc = snapshot.docs[0];
    const ticketData = ticketDoc.data();

    // Verify organizer permission
    const eventDoc = await db.collection('events').doc(ticketData.eventId).get();
    if (eventDoc.exists && eventDoc.data().organizerId !== req.user.uid) {
        return res.status(403).json({ error: "Only the event organizer can check in tickets" });
    }

    if (ticketData.isCheckedIn) {
        return res.status(400).json({ error: "Ticket has already been checked in" });
    }

    await ticketDoc.ref.update({
        isCheckedIn: true,
        checkedInAt: admin.firestore.Timestamp.now()
    });

    res.status(200).json({ message: "Ticket checked in successfully", eventId: ticketData.eventId });
  } catch (error) {
    console.error("Error checking in ticket:", error);
    res.status(500).json({ error: "Failed to check in ticket" });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('tickets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticketData = doc.data();
    if (ticketData.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized to view this ticket' });
    }

    const eventDoc = await db.collection('events').doc(ticketData.eventId).get();
    let eventPayload = null;
    
    if (eventDoc.exists) {
        const eventData = eventDoc.data();
        eventPayload = {
            id: eventDoc.id,
            title: eventData.title,
            image: eventData.image,
            date: eventData.date ? eventData.date.toDate() : null,
            venue: eventData.addressString || 'TBA'
        };
    }

    res.status(200).json({ 
        ticket: { 
            id: doc.id, 
            ...ticketData,
            checkedInAt: ticketData.checkedInAt ? ticketData.checkedInAt.toDate() : null,
            createdAt: ticketData.createdAt ? ticketData.createdAt.toDate() : null
        },
        event: eventPayload
    });
  } catch (error) {
    console.error("Error fetching ticket by id:", error);
    res.status(500).json({ error: "Failed to fetch ticket details" });
  }
};
