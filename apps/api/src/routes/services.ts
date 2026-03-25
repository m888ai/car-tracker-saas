import { Router } from 'express';
import { prisma } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import { getOrCreateUser } from '../lib/getUser';
import { z } from 'zod';

export const servicesRouter = Router();

// Get all services for user (optionally filtered by car)
servicesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);
    const carId = req.query.carId as string | undefined;

    const services = await prisma.serviceRecord.findMany({
      where: {
        car: { userId: user.id },
        ...(carId && { carId }),
      },
      orderBy: { date: 'desc' },
      include: {
        car: { select: { make: true, model: true, year: true } },
      },
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service
servicesRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const service = await prisma.serviceRecord.findFirst({
      where: {
        id: req.params.id,
        car: { userId: user.id },
      },
      include: { car: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create service
const createServiceSchema = z.object({
  carId: z.string().uuid(),
  category: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().min(0),
  mileage: z.number().int().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

servicesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createServiceSchema.parse(req.body);
    const user = await getOrCreateUser(req.user!);

    // Verify car belongs to user
    const car = await prisma.car.findFirst({
      where: { id: data.carId, userId: user.id },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const service = await prisma.serviceRecord.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    // Update car mileage if provided
    if (data.mileage && data.mileage > car.mileage) {
      await prisma.car.update({
        where: { id: data.carId },
        data: { mileage: data.mileage },
      });
    }

    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
servicesRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = createServiceSchema.partial().parse(req.body);
    const user = await getOrCreateUser(req.user!);

    const existingService = await prisma.serviceRecord.findFirst({
      where: {
        id: req.params.id,
        car: { userId: user.id },
      },
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await prisma.serviceRecord.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
servicesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const existingService = await prisma.serviceRecord.findFirst({
      where: {
        id: req.params.id,
        car: { userId: user.id },
      },
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.serviceRecord.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Spending analytics
servicesRouter.get('/analytics/spending', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const carId = req.query.carId as string | undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const services = await prisma.serviceRecord.findMany({
      where: {
        car: { userId: user.id },
        ...(carId && { carId }),
        date: { gte: startDate, lt: endDate },
      },
      include: { car: { select: { make: true, model: true } } },
    });

    // Monthly spending
    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
    services.forEach((s) => {
      const month = new Date(s.date).getMonth();
      monthly[month].total += s.cost;
    });

    // By category
    const byCategory = services.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + s.cost;
      return acc;
    }, {} as Record<string, number>);

    // By car
    const byCar = services.reduce((acc, s) => {
      const key = `${s.car.make} ${s.car.model}`;
      acc[key] = (acc[key] || 0) + s.cost;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      year,
      totalSpent: services.reduce((sum, s) => sum + s.cost, 0),
      serviceCount: services.length,
      monthly,
      byCategory,
      byCar,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
