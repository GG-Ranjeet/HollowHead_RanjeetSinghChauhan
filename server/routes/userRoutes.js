import express from 'express';
import { syncUser, getUserProfile, updateRole, updateProfile, deleteUserAccount } from '../controllers/userController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sync', verifyFirebaseToken, syncUser);
router.get('/me', verifyFirebaseToken, getUserProfile);
router.delete('/me', verifyFirebaseToken, deleteUserAccount);
router.put('/role', verifyFirebaseToken, updateRole);
router.put('/profile', verifyFirebaseToken, updateProfile); // Endpoint to edit profile info

export default router;
