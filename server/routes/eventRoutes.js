import express from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent, getOrganizerEvents } from '../controllers/eventController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to fetch events
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected route to create an event (Requires Firebase Auth token)
router.post('/', verifyFirebaseToken, createEvent);

// Protected routes to update and delete events
router.put('/:id', verifyFirebaseToken, updateEvent);
router.delete('/:id', verifyFirebaseToken, deleteEvent);

// Protected route to get all events for the logged-in organizer
router.get('/organizer/me', verifyFirebaseToken, getOrganizerEvents);

export default router;
