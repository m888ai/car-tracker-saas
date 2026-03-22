import { Router } from 'express';
import { prisma } from '@car-tracker/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const valuationsRouter = Router();

// Get comparable sales for a car
valuationsRouter.get('/cars/:carId/sales', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const sales = await prisma.comparableSale.findMany({
      where: { carId: req.params.carId, userId: user!.id },
      orderBy: { saleDate: 'desc' },
    });

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

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sale = await prisma.comparableSale.create({
      data: {
        ...data,
        userId: user.id,
        saleDate: new Date(data.saleDate),
      },
    });

    // Recalculate valuation
    await recalculateValuation(data.carId);

    res.status(201).json(sale);
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
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const sale = await prisma.comparableSale.findFirst({
      where: { id: req.params.id, userId: user!.id },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    await prisma.comparableSale.delete({ where: { id: req.params.id } });

    // Recalculate valuation
    await recalculateValuation(sale.carId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// Get valuation for a car
valuationsRouter.get('/cars/:carId', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, userId: user!.id },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const valuation = await prisma.valuation.findFirst({
      where: { carId: car.id },
      orderBy: { calculatedAt: 'desc' },
    });

    const sales = await prisma.comparableSale.findMany({
      where: { carId: car.id },
      orderBy: { saleDate: 'desc' },
    });

    res.json({
      car,
      valuation,
      comparableSales: sales,
    });
  } catch (error) {
    console.error('Error fetching valuation:', error);
    res.status(500).json({ error: 'Failed to fetch valuation' });
  }
});

// Helper: Recalculate valuation
async function recalculateValuation(carId: string) {
  const sales = await prisma.comparableSale.findMany({
    where: { carId },
  });

  if (sales.length === 0) {
    await prisma.valuation.deleteMany({ where: { carId } });
    return;
  }

  const prices = sales.map((s) => Number(s.price)).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = sum / prices.length;

  // Standard deviation
  const variance = prices.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // Confidence
  let confidence = 'low';
  if (sales.length >= 10 && stdDev / avg < 0.3) {
    confidence = 'high';
  } else if (sales.length >= 5 && stdDev / avg < 0.5) {
    confidence = 'medium';
  }

  await prisma.valuation.create({
    data: {
      carId,
      estimateLow: Math.round(avg - stdDev),
      estimateMid: Math.round(avg),
      estimateHigh: Math.round(avg + stdDev),
      confidence,
      basedOn: sales.length,
    },
  });
}
