import { Router } from 'express';
import { salesRef, carsRef, db } from '../lib/firebase';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const valuationsRouter = Router();

// Get comparable sales for a car
valuationsRouter.get('/cars/:carId/sales', async (req: AuthRequest, res) => {
  try {
    const snapshot = await salesRef(req.user!.uid)
      .where('carId', '==', req.params.carId)
      .orderBy('saleDate', 'desc')
      .get();

    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Add comparable sale
const createSaleSchema = z.object({
  carId: z.string(),
  source: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().optional(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  price: z.number(),
  saleDate: z.string(),
  mileage: z.number().int().optional(),
  condition: z.string().optional(),
  transmission: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  location: z.string().optional(),
});

valuationsRouter.post('/sales', async (req: AuthRequest, res) => {
  try {
    const data = createSaleSchema.parse(req.body);

    // Verify car exists
    const carDoc = await carsRef(req.user!.uid).doc(data.carId).get();
    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const saleRef = salesRef(req.user!.uid).doc();
    const sale = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    await saleRef.set(sale);

    res.status(201).json({ id: saleRef.id, ...sale });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Delete comparable sale
valuationsRouter.delete('/sales/:id', async (req: AuthRequest, res) => {
  try {
    const saleRef = salesRef(req.user!.uid).doc(req.params.id);

    const saleDoc = await saleRef.get();
    if (!saleDoc.exists) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    await saleRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// Get valuation for a car
valuationsRouter.get('/cars/:carId', async (req: AuthRequest, res) => {
  try {
    const carDoc = await carsRef(req.user!.uid).doc(req.params.carId).get();

    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Get comparable sales
    const salesSnap = await salesRef(req.user!.uid)
      .where('carId', '==', req.params.carId)
      .get();

    const sales = salesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate estimate
    let estimate = null;
    if (sales.length > 0) {
      const prices = sales.map(s => (s as any).price).sort((a: number, b: number) => a - b);
      const sum = prices.reduce((a: number, b: number) => a + b, 0);
      const avg = sum / prices.length;

      // Standard deviation
      const variance = prices.reduce((acc: number, p: number) => acc + Math.pow(p - avg, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);

      // Confidence
      let confidence = 'low';
      if (sales.length >= 10 && stdDev / avg < 0.3) {
        confidence = 'high';
      } else if (sales.length >= 5 && stdDev / avg < 0.5) {
        confidence = 'medium';
      }

      estimate = {
        low: Math.round(avg - stdDev),
        mid: Math.round(avg),
        high: Math.round(avg + stdDev),
        confidence,
        basedOn: sales.length,
      };
    }

    res.json({
      car: { id: carDoc.id, ...carDoc.data() },
      estimate,
      comparableSales: sales,
    });
  } catch (error) {
    console.error('Error fetching valuation:', error);
    res.status(500).json({ error: 'Failed to fetch valuation' });
  }
});
