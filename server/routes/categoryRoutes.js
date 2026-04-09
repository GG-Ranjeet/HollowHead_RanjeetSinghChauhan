import express from 'express';
import { getCategories, seedCategories } from '../controllers/categoryController.js';

const router = express.Router();

// Public route to fetch dynamically loaded categories for filtering/creation dropdowns
router.get('/', getCategories);

// Secret utility route for admins to seed the database with defaults (Hackathons, Business, etc)
// (In a prod app, this would be locked down via verifyFirebaseToken & checking a 'superadmin' role)
router.post('/seed', seedCategories);

export default router;