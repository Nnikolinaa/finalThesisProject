import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { Rental } from '../entities/Rental';
import { Vehicle } from '../entities/Vehicle';
import { UserService } from '../services/user.service'; 
const router = Router();

// Proširite Express Request interfejs da uključite 'user' property
declare global {
    namespace Express {
        interface Request {
            user?: { id: number; email: string; }; // Prilagodite ovo strukturi vašeg JWT payload-a
        }
    }
}
// --- NOVA RUTA: GET /api/rentals/:rentalId/details-for-user (ZAHTEVA AUTENTIFIKACIJU) ---
// Ova ruta proverava detalje o specifičnom rentalu za autentifikovanog korisnika.
router.get('/rentals/:rentalId/details-for-user', UserService.verifyToken, async (req: Request, res: Response): Promise<void> => {
    const { rentalId } = req.params;
    const currentUserId = req.user?.id; // ID autentifikovanog korisnika

    // Provera da li je korisnik autentifikovan
    if (!currentUserId) {
        res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        return;
    }

    if (!rentalId || isNaN(parseInt(rentalId, 10))) {
        res.status(400).json({ message: 'Invalid rental ID provided.' });
        return;
    }

    try {
        const rentalRepository = AppDataSource.getRepository(Rental);

        // Dohvatite rental, ali samo ako pripada trenutno ulogovanom korisniku
        const rental = await rentalRepository.findOne({
            where: {
                rentalId: parseInt(rentalId, 10),
                userId: currentUserId // Ključna provera: rental mora pripadati ulogovanom korisniku
            },
            relations: ['vehicle'] // Učitajte i vozilo ako su vam potrebni detalji vozila
        });

        if (!rental) {
            res.status(404).json({ message: 'Rental not found or does not belong to the authenticated user.' });
            return;
        }

        // Vratite samo relevantne detalje
        res.json({
            rentalId: rental.rentalId,
            userId: rental.userId,
            vehicleId: rental.vehicleId, // Dodajte vehicleId
            status: rental.status,
            startDate: rental.startDate,
            endDate: rental.endDate,
            totalPrice: rental.totalPrice,
            // Možete dodati i neke detalje o vozilu ako su potrebni na frontendu
            vehicleName: rental.vehicle?.name,
            vehicleBrand: rental.vehicle?.brand
        });

    } catch (error) {
        console.error('Error fetching rental details for user:', error);
        res.status(500).json({ message: 'Server error while fetching rental details.' });
    }
});


// Book a vehicle
router.post('/rentals', async (req: Request, res: Response): Promise<void> => {
  const { userId, vehicleId, startDate, endDate, totalPrice } = req.body;

  // Validate request body
  if (!userId || !vehicleId || !startDate || !endDate || !totalPrice) {
    res.status(400).json({ error: 'All fields are required.' });
    return;
  }

  try {
    const rentalRepository = AppDataSource.getRepository(Rental);
    const newRental = rentalRepository.create({
      userId,
      vehicleId,
      startDate,
      endDate,
      totalPrice,
    });
    await rentalRepository.save(newRental);

    res.status(201).json({ message: 'Vehicle booked successfully.' });
  } catch (error) {
    console.error('Error booking vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rentals for a user
router.get('/rentals/user/:userId', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const rentalRepository = AppDataSource.getRepository(Rental);
    const rentals = await rentalRepository.find({
      where: { userId: userId ? parseInt(userId, 10) : 0 },
      relations: ['vehicle'],
    });

    res.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- NEW ROUTE: Check if user has completed a rental for a specific vehicle ---
// This route is used by the frontend to determine if the review form should be shown.
// It requires authentication to ensure the user is checking their own rentals.
router.get('/rentals/user/:userId/vehicle/:vehicleId/completed', UserService.verifyToken, async (req: Request, res: Response): Promise<void> => {
    const { userId, vehicleId } = req.params;
    const currentUserId = req.user?.id; // ID of the authenticated user

    // --- ADDED VALIDATION HERE ---
    // Ensure userId and vehicleId are defined strings before parsing
    if (!userId || !vehicleId) {
        res.status(400).json({ message: 'User ID and Vehicle ID are required in the URL.' });
        return;
    }

    console.log(`[Rental Check] Request URL userId: ${userId}, VehicleId: ${vehicleId}`);
    console.log(`[Rental Check] Authenticated currentUserId: ${currentUserId}`);

    const parsedUserId = parseInt(userId, 10);
    const parsedVehicleId = parseInt(vehicleId, 10);

    console.log(`[Rental Check] Parsed userId: ${parsedUserId}, Parsed VehicleId: ${parsedVehicleId}`);

    if (isNaN(parsedUserId) || isNaN(parsedVehicleId)) {
        res.status(400).json({ message: 'Invalid User ID or Vehicle ID provided.' });
        return;
    }

    if (!currentUserId || currentUserId !== parsedUserId) {
        console.error(`[Rental Check] 403 Forbidden: currentUserId (${currentUserId}) !== parsedUserId (${parsedUserId})`);
        res.status(403).json({ message: 'Forbidden: You can only check your own rental status.' });
        return;
    }

    try {
        const rentalRepository = AppDataSource.getRepository(Rental);

        // Instead of just counting, find the most recent completed rental
        const completedRental = await rentalRepository.findOne({
            where: {
                userId: parsedUserId,
                vehicleId: parsedVehicleId,
                status: 'completed'
            },
            // Order by a relevant date column (e.g., 'dropOffDate' or 'createdAt' if 'completed_at' isn't available)
            // This ensures you get the most recent one. Adjust 'createdAt' if you have a different completion date field.
            order: { endDate: 'DESC' } // Assuming 'createdAt' or 'dropOffDate' or similar exists and is suitable
        });

        if (completedRental) {
            // Return the rentalId of the found completed rental
            res.json({ hasCompletedRental: true, rentalId: completedRental.rentalId });
        } else {
            // If no completed rental is found, indicate that
            res.json({ hasCompletedRental: false, rentalId: null });
        }

    } catch (error) {
        console.error('Error checking completed rental for user and vehicle:', error);
        res.status(500).json({ message: 'Server error while checking rental completion.' });
    }
});


// Update rental status
router.patch('/rentals/:rentalId', async (req: Request, res: Response): Promise<void> => {
  const { rentalId } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required.' });
    return;
  }

  try {
    const rentalRepository = AppDataSource.getRepository(Rental);
    if (!rentalId) {
      res.status(400).json({ error: 'Rental ID is required.' });
      return;
    }
    const rental = await rentalRepository.findOneBy({ rentalId: parseInt(rentalId, 10) });

    if (!rental) {
      res.status(404).json({ error: 'Rental not found.' });
      return;
    }

    rental.status = status;
    await rentalRepository.save(rental);

    res.status(200).json({ message: 'Rental status updated successfully.' });
  } catch (error) {
    console.error('Error updating rental status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rental details by rental ID
router.get('/rentals/:rentalId', async (req: Request, res: Response): Promise<void> => {
  const { rentalId } = req.params;

  try {
    const rentalRepository = AppDataSource.getRepository(Rental);
    const rental = await rentalRepository.findOne({
      where: { rentalId: rentalId ? parseInt(rentalId, 10) : 0 },
      relations: ['vehicle'],
    });

    if (!rental) {
      res.status(404).json({ error: 'Rental not found.' });
      return;
    }

    res.json({
      rentalId: rental.rentalId,
      userId: rental.userId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalPrice: rental.totalPrice,
      vehicleName: rental.vehicle?.name,
      vehicleImage: rental.vehicle?.imagePath,
    });
  } catch (error) {
    console.error('Error fetching rental details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a rental for a given user ID and rental ID
router.delete('/rentals/:rentalId/user/:userId', async (req: Request, res: Response): Promise<void> => {
  const { rentalId, userId } = req.params;

  try {
    const rentalRepository = AppDataSource.getRepository(Rental);
    const rental = await rentalRepository.findOne({
      where: {
        rentalId: rentalId ? parseInt(rentalId, 10) : undefined,
        userId: userId ? parseInt(userId, 10) : undefined,
      },
    });

    if (!rental) {
      res.status(404).json({ error: 'Rental not found or does not belong to the user.' });
      return;
    }

    await rentalRepository.remove(rental);

    res.status(200).json({ message: 'Rental deleted successfully.' });
  } catch (error) {
    console.error('Error deleting rental:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
