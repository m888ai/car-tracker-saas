import { Router } from 'express';
import { servicesRef, carsRef } from '../lib/firebase';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const servicesRouter = Router();

const SERVICE_TYPES = [
  'OIL_CHANGE', 'TIRES', 'BRAKES', 'BATTERY', 'TRANSMISSION',
  'INSPECTION', 'REGISTRATION', 'INSURANCE', 'WASH_DETAIL',
  'REPAIR', 'MAINTENANCE', 'UPGRADE', 'FUEL', 'OTHER'
] as const;

// Get all services
servicesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const carId = req.query.carId as string | undefined;

    let query = servicesRef(req.user!.uid).orderBy('date', 'desc');
    
    const snapshot = await query.get();
    let services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by carId if provided (Firestore compound query limitation)
    if (carId) {
      services = services.filter(s => (s as any).carId === carId);
    }

    // Get car info for each service
    const carsSnap = await carsRef(req.user!.uid).get();
    const carsMap = new Map(carsSnap.docs.map(d => [d.id, d.data()]));

    services = services.map(s => ({
      ...s,
      car: carsMap.get((s as any).carId),
    }));

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create service
const createServiceSchema = z.object({
  carId: z.string(),
  date: z.string(),
  type: z.enum(SERVICE_TYPES),
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

    // Verify car exists
    const carDoc = await carsRef(req.user!.uid).doc(data.carId).get();
    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const serviceRef = servicesRef(req.user!.uid).doc();
    const service = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    await serviceRef.set(service);

    // Update car mileage if provided
    if (data.mileage) {
      await carsRef(req.user!.uid).doc(data.carId).update({
        currentMileage: data.mileage,
        updatedAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ id: serviceRef.id, ...service });
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
    const serviceRef = servicesRef(req.user!.uid).doc(req.params.id);

    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await serviceRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get spending summary
servicesRouter.get('/spending', async (req: AuthRequest, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const snapshot = await servicesRef(req.user!.uid).get();
    const allServices = snapshot.docs.map(doc => doc.data());

    // Filter by year
    const services = allServices.filter(s => {
      const serviceYear = new Date(s.date).getFullYear();
      return serviceYear === year;
    });

    const total = services.reduce((sum, s) => sum + (s.cost || 0), 0);

    // By category
    const byCategory: Record<string, number> = {};
    services.forEach(s => {
      byCategory[s.type] = (byCategory[s.type] || 0) + (s.cost || 0);
    });

    // By car
    const carsSnap = await carsRef(req.user!.uid).get();
    const carsMap = new Map(carsSnap.docs.map(d => [d.id, d.data()]));

    const byCarMap: Record<string, number> = {};
    services.forEach(s => {
      byCarMap[s.carId] = (byCarMap[s.carId] || 0) + (s.cost || 0);
    });

    const byCar = Object.entries(byCarMap).map(([carId, total]) => {
      const car = carsMap.get(carId);
      return {
        carId,
        name: car ? `${car.year} ${car.make} ${car.model}` : 'Unknown',
        total,
      };
    });

    // By month
    const byMonthMap: Record<string, number> = {};
    services.forEach(s => {
      const month = s.date.slice(0, 7);
      byMonthMap[month] = (byMonthMap[month] || 0) + (s.cost || 0);
    });

    const byMonth = Object.entries(byMonthMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      year,
      total,
      byCategory,
      byCar,
      byMonth,
    });
  } catch (error) {
    console.error('Error fetching spending:', error);
    res.status(500).json({ error: 'Failed to fetch spending' });
  }
});
