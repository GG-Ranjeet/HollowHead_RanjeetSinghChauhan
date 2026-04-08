import express from 'express';
import { syncUser, getUserProfile, updateRole } from '../controllers/userController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sync', verifyFirebaseToken, syncUser);
router.get('/me', verifyFirebaseToken, getUserProfile);
router.put('/role', verifyFirebaseToken, updateRole); // New endpoint to upgrade account

export default router;
