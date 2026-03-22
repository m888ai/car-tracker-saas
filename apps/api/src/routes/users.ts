import { Router } from 'express';
import { prisma } from '@car-tracker/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const usersRouter = Router();

// Get current user
usersRouter.get('/me', async (req: AuthRequest, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
      include: {
        _count: {
          select: { cars: true, serviceRecords: true },
        },
      },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: req.user!.uid,
          email: req.user!.email || '',
        },
        include: {
          _count: {
            select: { cars: true, serviceRecords: true },
          },
        },
      });
    }

    res.json(user);
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

    const user = await prisma.user.update({
      where: { firebaseUid: req.user!.uid },
      data,
    });

    res.json(user);
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
    await prisma.user.delete({
      where: { firebaseUid: req.user!.uid },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
