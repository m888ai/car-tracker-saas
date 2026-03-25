import { Router } from 'express';
import { prisma } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import { getOrCreateUser } from '../lib/getUser';
import { z } from 'zod';

export const carsRouter = Router();

// Get all cars for user
carsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const cars = await prisma.car.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { serviceRecords: true } },
      },
    });

    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// Get single car with stats
carsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const car = await prisma.car.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: {
        serviceRecords: true,
        valuations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const totalSpent = car.serviceRecords.reduce((sum, s) => sum + s.cost, 0);

    res.json({
      ...car,
      stats: {
        serviceCount: car.serviceRecords.length,
        totalSpent,
        avgCostPerService: car.serviceRecords.length > 0 ? totalSpent / car.serviceRecords.length : 0,
        latestValuation: car.valuations[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Failed to fetch car' });
  }
});

// Create car
const createCarSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  type: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  mileage: z.number().int().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
});

carsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createCarSchema.parse(req.body);
    const user = await getOrCreateUser(req.user!);

    const car = await prisma.car.create({
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        userId: user.id,
      },
    });

    res.status(201).json(car);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Failed to create car' });
  }
});

// Update car
carsRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = createCarSchema.partial().parse(req.body);
    const user = await getOrCreateUser(req.user!);

    const existingCar = await prisma.car.findFirst({
      where: { id: req.params.id, userId: user.id },
    });

    if (!existingCar) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
    });

    res.json(car);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
});

// Delete car
carsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const existingCar = await prisma.car.findFirst({
      where: { id: req.params.id, userId: user.id },
    });

    if (!existingCar) {
      return res.status(404).json({ error: 'Car not found' });
    }

    await prisma.car.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

// Get car stats
carsRouter.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const car = await prisma.car.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: { serviceRecords: true },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const totalSpent = car.serviceRecords.reduce((sum, s) => sum + s.cost, 0);
    const byCategory = car.serviceRecords.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + s.cost;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalSpent,
      serviceCount: car.serviceRecords.length,
      avgCostPerService: car.serviceRecords.length > 0 ? totalSpent / car.serviceRecords.length : 0,
      currentMileage: car.mileage,
      spendingByCategory: byCategory,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
