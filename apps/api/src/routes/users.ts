import { Router } from 'express';
import { userRef, carsRef, servicesRef, db } from '../lib/firebase';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const usersRouter = Router();

// Get current user
usersRouter.get('/me', async (req: AuthRequest, res) => {
  try {
    const docRef = userRef(req.user!.uid);
    let userDoc = await docRef.get();

    // Create user if doesn't exist
    if (!userDoc.exists) {
      const userData = {
        email: req.user!.email || '',
        plan: 'FREE',
        createdAt: new Date().toISOString(),
      };
      await docRef.set(userData);
      userDoc = await docRef.get();
    }

    // Get counts
    const [carsSnap, servicesSnap] = await Promise.all([
      carsRef(req.user!.uid).get(),
      servicesRef(req.user!.uid).get(),
    ]);

    res.json({
      id: userDoc.id,
      ...userDoc.data(),
      _count: {
        cars: carsSnap.size,
        services: servicesSnap.size,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
const updateUserSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
});

usersRouter.patch('/me', async (req: AuthRequest, res) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const docRef = userRef(req.user!.uid);

    await docRef.update({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const userDoc = await docRef.get();
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user account
usersRouter.delete('/me', async (req: AuthRequest, res) => {
  try {
    // Delete all user data
    const batch = db.batch();

    // Delete services
    const servicesSnap = await servicesRef(req.user!.uid).get();
    servicesSnap.docs.forEach(doc => batch.delete(doc.ref));

    // Delete cars
    const carsSnap = await carsRef(req.user!.uid).get();
    carsSnap.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user
    batch.delete(userRef(req.user!.uid));

    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
