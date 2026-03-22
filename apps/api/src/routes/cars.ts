import { Router } from 'express';
import { prisma } from '@car-tracker/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const carsRouter = Router();

// Get all cars for user
carsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cars = await prisma.car.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { serviceRecords: true },
        },
      },
    });

    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// Get single car
carsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const car = await prisma.car.findFirst({
      where: { id: req.params.id, userId: user!.id },
      include: {
        serviceRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        valuations: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(car);
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
  nickname: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  currentMileage: z.number().int().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  imageUrl: z.string().optional(),
});

carsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createCarSchema.parse(req.body);

    let user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: req.user!.uid,
          email: req.user!.email || '',
        },
      });
    }

    const car = await prisma.car.create({
      data: {
        ...data,
        userId: user.id,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
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

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const car = await prisma.car.updateMany({
      where: { id: req.params.id, userId: user!.id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
    });

    if (car.count === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const updated = await prisma.car.findUnique({ where: { id: req.params.id } });
    res.json(updated);
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
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const result = await prisma.car.deleteMany({
      where: { id: req.params.id, userId: user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

// Get car stats
carsRouter.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const car = await prisma.car.findFirst({
      where: { id: req.params.id, userId: user!.id },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const services = await prisma.serviceRecord.findMany({
      where: { carId: car.id },
    });

    const totalSpent = services.reduce((sum, s) => sum + Number(s.cost), 0);
    const serviceCount = services.length;
    const avgCost = serviceCount > 0 ? totalSpent / serviceCount : 0;

    res.json({
      totalSpent,
      serviceCount,
      avgCostPerService: avgCost,
      currentMileage: car.currentMileage,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
