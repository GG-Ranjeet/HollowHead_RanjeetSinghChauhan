import { db } from '../config/firebase.js';

export const syncUser = async (req, res) => {
  try {
    const { uid, email, name, role, university } = req.body;
    
    // Fallbacks to decoded token if values not provided in body
    const userUid = uid || req.user.uid;
    const userEmail = email || req.user.email;
    const userName = name || req.user.name || req.user.displayName;
    
    const userRef = db.collection('users').doc(userUid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      // Create new user using schema provided
      const newUser = {
        name: userName || 'Anonymous',
        email: userEmail,
        role: role || 'attendee', 
        university: university || null,
        createdAt: new Date(), 
      };
      
      await userRef.set(newUser);
      return res.status(201).json({ message: 'User created', user: newUser });
    } else {
      return res.status(200).json({ message: 'User exists', user: doc.data() });
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    if (req.dbUser) {
        return res.status(200).json({ user: req.dbUser });
    }
    
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user: doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { newRole } = req.body;
    
    // Validate role is strictly one of the allowed types
    if (!newRole || !['attendee', 'organizer'].includes(newRole)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }
    
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({ role: newRole });
    
    res.status(200).json({ message: `Successfully updated account role to ${newRole}` });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, university } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (university !== undefined) updateData.university = university;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update(updateData);
    
    res.status(200).json({ message: "Profile updated successfully", updatedFields: updateData });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const uid = req.user.uid;
    // Delete the document from the users collection
    await db.collection('users').doc(uid).delete();
    
    // (Optional) Here we could also purge their tickets/events if this was a deep cascading delete,
    // but typically event platforms soft-delete or anonymize records. For now, removing user access is sufficient.
    
    res.status(200).json({ message: "Account successfully purged." });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to permanently delete account." });
  }
};
