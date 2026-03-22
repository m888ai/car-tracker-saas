import { Router } from 'express';
import { prisma, ServiceType } from '@car-tracker/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const servicesRouter = Router();

// Get all services for user
servicesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const carId = req.query.carId as string | undefined;

    const services = await prisma.serviceRecord.findMany({
      where: {
        userId: user.id,
        ...(carId && { carId }),
      },
      orderBy: { date: 'desc' },
      include: {
        car: {
          select: { make: true, model: true, year: true, nickname: true },
        },
      },
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create service record
const createServiceSchema = z.object({
  carId: z.string(),
  date: z.string(),
  type: z.nativeEnum(ServiceType),
  customType: z.string().optional(),
  description: z.string().min(1),
  mileage: z.number().int().optional(),
  cost: z.number().default(0),
  vendor: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  photos: z.array(z.string()).optional(),
  reminderMiles: z.number().int().optional(),
  reminderDate: z.string().optional(),
});

servicesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createServiceSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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
        userId: user.id,
        date: new Date(data.date),
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : undefined,
      },
    });

    // Update car mileage if provided
    if (data.mileage) {
      await prisma.car.update({
        where: { id: data.carId },
        data: { currentMileage: data.mileage },
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

// Delete service
servicesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const result = await prisma.serviceRecord.deleteMany({
      where: { id: req.params.id, userId: user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get spending summary
servicesRouter.get('/spending', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const services = await prisma.serviceRecord.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfYear, lte: endOfYear },
      },
      include: {
        car: { select: { make: true, model: true, year: true } },
      },
    });

    const total = services.reduce((sum, s) => sum + Number(s.cost), 0);

    // By category
    const byCategory: Record<string, number> = {};
    services.forEach((s) => {
      byCategory[s.type] = (byCategory[s.type] || 0) + Number(s.cost);
    });

    // By car
    const byCar: Record<string, { name: string; total: number }> = {};
    services.forEach((s) => {
      const carName = `${s.car.year} ${s.car.make} ${s.car.model}`;
      if (!byCar[s.carId]) {
        byCar[s.carId] = { name: carName, total: 0 };
      }
      byCar[s.carId].total += Number(s.cost);
    });

    // By month
    const byMonth: Record<string, number> = {};
    services.forEach((s) => {
      const month = s.date.toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + Number(s.cost);
    });

    res.json({
      year,
      total,
      byCategory,
      byCar: Object.entries(byCar).map(([carId, data]) => ({
        carId,
        ...data,
      })),
      byMonth: Object.entries(byMonth)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    });
  } catch (error) {
    console.error('Error fetching spending:', error);
    res.status(500).json({ error: 'Failed to fetch spending' });
  }
});
