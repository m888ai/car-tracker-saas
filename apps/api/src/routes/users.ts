import { Router } from 'express';
import { prisma } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import { getOrCreateUser } from '../lib/getUser';
import { z } from 'zod';

export const usersRouter = Router();

// Get or create user profile
usersRouter.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const userWithCount = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: { select: { cars: true } },
      },
    });

    res.json(userWithCount);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
const updateUserSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

usersRouter.patch('/me', async (req: AuthRequest, res) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const existingUser = await getOrCreateUser(req.user!);

    const user = await prisma.user.update({
      where: { id: existingUser.id },
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

// Get user dashboard stats
usersRouter.get('/me/stats', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const cars = await prisma.car.findMany({
      where: { userId: user.id },
      include: {
        serviceRecords: true,
        valuations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const totalCars = cars.length;
    const totalServices = cars.reduce((sum, c) => sum + c.serviceRecords.length, 0);
    const totalSpent = cars.reduce(
      (sum, c) => sum + c.serviceRecords.reduce((s, r) => s + r.cost, 0),
      0
    );
    const totalValue = cars.reduce((sum, c) => {
      const val = c.valuations[0];
      return sum + (val ? val.midEstimate : 0);
    }, 0);

    // Recent services
    const recentServices = await prisma.serviceRecord.findMany({
      where: { car: { userId: user.id } },
      orderBy: { date: 'desc' },
      take: 5,
      include: { car: { select: { make: true, model: true } } },
    });

    res.json({
      totalCars,
      totalServices,
      totalSpent,
      totalEstimatedValue: totalValue,
      recentServices,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Delete account
usersRouter.delete('/me', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    // Cascade delete handles cars, services, valuations, sales
    await prisma.user.delete({ where: { id: user.id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
