import { Router } from 'express';
import { prisma } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import { getOrCreateUser } from '../lib/getUser';
import { z } from 'zod';

export const valuationsRouter = Router();

// Get valuation for a car
valuationsRouter.get('/car/:carId', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, userId: user.id },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const valuation = await prisma.valuation.findFirst({
      where: { carId: req.params.carId },
      orderBy: { createdAt: 'desc' },
    });

    const sales = await prisma.comparableSale.findMany({
      where: { carId: req.params.carId },
      orderBy: { saleDate: 'desc' },
    });

    res.json({ valuation, comparableSales: sales });
  } catch (error) {
    console.error('Error fetching valuation:', error);
    res.status(500).json({ error: 'Failed to fetch valuation' });
  }
});

// Add comparable sale
const addSaleSchema = z.object({
  carId: z.string().uuid(),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  salePrice: z.number().positive(),
  saleDate: z.string(),
  condition: z.string().optional(),
  mileage: z.number().int().optional(),
  description: z.string().optional(),
});

valuationsRouter.post('/sales', async (req: AuthRequest, res) => {
  try {
    const data = addSaleSchema.parse(req.body);
    const user = await getOrCreateUser(req.user!);

    const car = await prisma.car.findFirst({
      where: { id: data.carId, userId: user.id },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const sale = await prisma.comparableSale.create({
      data: {
        ...data,
        saleDate: new Date(data.saleDate),
      },
    });

    // Recalculate valuation
    const valuation = await recalculateValuation(data.carId, user.id);

    res.status(201).json({ sale, valuation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error adding sale:', error);
    res.status(500).json({ error: 'Failed to add sale' });
  }
});

// Delete comparable sale
valuationsRouter.delete('/sales/:id', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const sale = await prisma.comparableSale.findFirst({
      where: {
        id: req.params.id,
        car: { userId: user.id },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const carId = sale.carId;
    await prisma.comparableSale.delete({ where: { id: req.params.id } });

    // Recalculate valuation
    const valuation = await recalculateValuation(carId, user.id);

    res.json({ success: true, valuation });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// Recalculate valuation
valuationsRouter.post('/recalculate/:carId', async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!);

    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, userId: user.id },
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const valuation = await recalculateValuation(req.params.carId, user.id);

    res.json(valuation);
  } catch (error) {
    console.error('Error recalculating valuation:', error);
    res.status(500).json({ error: 'Failed to recalculate valuation' });
  }
});

// Helper function to recalculate valuation
async function recalculateValuation(carId: string, userId: string) {
  const sales = await prisma.comparableSale.findMany({
    where: { carId },
    orderBy: { saleDate: 'desc' },
  });

  if (sales.length === 0) {
    // Delete existing valuation if no sales
    await prisma.valuation.deleteMany({ where: { carId } });
    return null;
  }

  const prices = sales.map((s) => s.salePrice);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Confidence based on sample size (max 1.0 at 10+ sales)
  const confidence = Math.min(sales.length / 10, 1);

  // Calculate estimates
  const lowEstimate = min * 0.95;
  const highEstimate = max * 1.05;
  const midEstimate = avg;

  // Upsert valuation
  const existingValuation = await prisma.valuation.findFirst({
    where: { carId },
    orderBy: { createdAt: 'desc' },
  });

  if (existingValuation) {
    return prisma.valuation.update({
      where: { id: existingValuation.id },
      data: {
        lowEstimate,
        midEstimate,
        highEstimate,
        confidence,
        salesCount: sales.length,
      },
    });
  } else {
    return prisma.valuation.create({
      data: {
        carId,
        userId,
        lowEstimate,
        midEstimate,
        highEstimate,
        confidence,
        salesCount: sales.length,
      },
    });
  }
}
