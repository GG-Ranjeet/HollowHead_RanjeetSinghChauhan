import express from 'express';
import { purchaseTicket, getUserTickets, checkInTicket, getTicketById, validateTicketById } from '../controllers/ticketController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require auth for all ticket routes
router.use(verifyFirebaseToken); 

router.post('/purchase', purchaseTicket);
router.get('/my-tickets', getUserTickets);
router.get('/:id', getTicketById);
router.post('/checkin', checkInTicket);       // Organizer: scan QR token
router.post('/validate-by-id', validateTicketById); // Organizer: validate by ticket ID

export default router;
