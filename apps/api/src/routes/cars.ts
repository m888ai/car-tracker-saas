import { Router } from 'express';
import { carsRef, servicesRef, db } from '../lib/firebase';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const carsRouter = Router();

// Get all cars for user
carsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const snapshot = await carsRef(req.user!.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const cars = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// Get single car with stats
carsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const carDoc = await carsRef(req.user!.uid).doc(req.params.id).get();

    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Get service count and total spent
    const servicesSnap = await servicesRef(req.user!.uid)
      .where('carId', '==', req.params.id)
      .get();

    const services = servicesSnap.docs.map(d => d.data());
    const totalSpent = services.reduce((sum, s) => sum + (s.cost || 0), 0);

    res.json({
      id: carDoc.id,
      ...carDoc.data(),
      stats: {
        serviceCount: services.length,
        totalSpent,
        avgCostPerService: services.length > 0 ? totalSpent / services.length : 0,
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

    const carRef = carsRef(req.user!.uid).doc();
    const car = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await carRef.set(car);

    res.status(201).json({ id: carRef.id, ...car });
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
    const carRef = carsRef(req.user!.uid).doc(req.params.id);

    const carDoc = await carRef.get();
    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await carRef.update(updates);

    res.json({ id: req.params.id, ...carDoc.data(), ...updates });
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
    const carRef = carsRef(req.user!.uid).doc(req.params.id);

    const carDoc = await carRef.get();
    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Delete all services for this car
    const servicesSnap = await servicesRef(req.user!.uid)
      .where('carId', '==', req.params.id)
      .get();

    const batch = db.batch();
    servicesSnap.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(carRef);
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

// Get car stats
carsRouter.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    const carDoc = await carsRef(req.user!.uid).doc(req.params.id).get();

    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const servicesSnap = await servicesRef(req.user!.uid)
      .where('carId', '==', req.params.id)
      .get();

    const services = servicesSnap.docs.map(d => d.data());
    const totalSpent = services.reduce((sum, s) => sum + (s.cost || 0), 0);

    res.json({
      totalSpent,
      serviceCount: services.length,
      avgCostPerService: services.length > 0 ? totalSpent / services.length : 0,
      currentMileage: carDoc.data()?.currentMileage,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
