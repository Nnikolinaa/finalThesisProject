// src/routes/reviews.ts
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express'; // Dodajte NextFunction
import { AppDataSource } from '../db';
import { Review } from '../entities/Review';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { Rental } from '../entities/Rental';
import { UserService } from '../services/user.service';


const router = Router();

// Proširite Express Request interfejs da uključite 'user' property
// Ovo je TypeScript-specifično da bi se izbegle greške tipova kada pristupate req.user
declare global {
    namespace Express {
        interface Request {
            user?: { id: number; email: string; }; // Prilagodite ovo strukturi vašeg JWT payload-a
        }
    }
}

router.get('/reviews/vehicle/:vehicleId', async (req: Request, res: Response): Promise<void> => {
    const { vehicleId } = req.params; // <--- CHANGE THIS LINE to vehicleId

    if (!vehicleId || isNaN(parseInt(vehicleId, 10))) { // <--- And this line to vehicleId
        res.status(400).json({ message: 'Invalid vehicle ID provided.' });
        return;
    }

    try {
        const reviewRepository = AppDataSource.getRepository(Review);

        const reviews = await reviewRepository.find({
            where: { vehicleId: parseInt(vehicleId, 10) }, // <--- And this line to vehicleId
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });

        const formattedReviews = reviews.map(review => ({
            review_id: review.reviewId,
            rating: review.rating,
            comment: review.comment,
            created_at: review.createdAt,
            user_display_name: review.user ? `${review.user.email.substring(0, 3)}****@****.com` : 'Anonimni Korisnik'
        }));

        res.json(formattedReviews);

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error while fetching reviews.' });
    }
});

router.get('/reviews/rental/:rentalId', UserService.verifyToken, async (req: Request, res: Response): Promise<void> => {
    const { rentalId } = req.params;
    const currentUserId = req.user?.id; // Get authenticated user ID from token

    if (!currentUserId) {
        res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        return;
    }

    if (!rentalId || isNaN(parseInt(rentalId, 10))) {
        res.status(400).json({ message: 'Invalid Rental ID provided.' });
        return;
    }

    try {
        const reviewRepository = AppDataSource.getRepository(Review);
        const parsedRentalId = parseInt(rentalId, 10);

        // Find a review for this rental ID, and ensure it belongs to the authenticated user
        const review = await reviewRepository.findOne({
            where: {
                rentalId: parsedRentalId,
                userId: currentUserId // Crucial: ensure the review belongs to the current user
            },
            relations: ['user'] // Load user relation if you need user details for the response
        });

        if (review) {
            // If a review is found, return it (or a simplified version)
            const formattedReview = {
                review_id: review.reviewId,
                rental_id: review.rentalId,
                rating: review.rating,
                comment: review.comment,
                created_at: review.createdAt.toISOString(),
                user_display_name: review.user ? `${review.user.email.substring(0, 3)}****@****.com` : 'Anonimni Korisnik'
            };
            res.json([formattedReview]); // Return as an array to match frontend's `data.length === 0` check
        } else {
            // If no review is found for this rental ID by this user
            res.json([]); // Return an empty array
        }

    } catch (error) {
        console.error('Error fetching review by rental ID:', error);
        res.status(500).json({ message: 'Server error while fetching review by rental ID.' });
    }
});

// --- POST /api/reviews: Kreiranje nove recenzije (ZAHTEVA AUTENTIFIKACIJU) ---
// Koristimo UserService.verifyToken kao middleware
router.post('/reviews', UserService.verifyToken, async (req: Request, res: Response): Promise<void> => {
    const currentUserId = req.user?.id;
    const { vehicle_id, rental_id, rating, comment } = req.body; // ulazni podaci su i dalje snake_case sa frontenda

    if (!currentUserId) {
        res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        return;
    }
    if (!vehicle_id || !rental_id || rating === undefined) {
        res.status(400).json({ message: 'Missing required fields: vehicle_id, rental_id, rating.' });
        return;
    }
    if (rating < 1 || rating > 5) {
        res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        return;
    }

    const reviewRepository = AppDataSource.getRepository(Review);
    const rentalRepository = AppDataSource.getRepository(Rental);
    const vehicleRepository = AppDataSource.getRepository(Vehicle);

    try {
        // 1. Proverite da li je rental_id validan i completed
        // Koristite rentalId i userId (camelCase) jer su to svojstva u Rental entitetu
        const rental = await rentalRepository.findOne({
            where: { rentalId: rental_id, userId: currentUserId }, // AŽURIRANO: rentalId, userId
            relations: ['vehicle']
        });

        if (!rental) {
            res.status(404).json({ message: 'Rental not found or does not belong to the authenticated user.' });
            return;
        }
        if (rental.status !== 'completed') {
            res.status(400).json({ message: 'Review can only be left for completed rentals.' });
            return;
        }
        // Upozorenje: vehicle_id iz body-ja, a rental.vehicleId iz entiteta
        if (rental.vehicleId !== vehicle_id) { // AŽURIRANO: rental.vehicleId
            res.status(400).json({ message: 'Vehicle ID in review does not match the rented vehicle.' });
            return;
        }

        // 2. Proverite da li je korisnik već ostavio recenziju za to rental_id
        // Koristite rentalId (camelCase) jer je to svojstvo u Review entitetu
        const existingReview = await reviewRepository.findOne({ where: { rentalId: rental_id } }); // AŽURIRANO: rentalId
        if (existingReview) {
            res.status(409).json({ message: 'A review has already been submitted for this specific rental.' });
            return;
        }

        // 3. Umetnite podatke u tabelu reviews
        const newReview = reviewRepository.create({
            userId: currentUserId,   // AŽURIRANO: userId
            vehicleId: vehicle_id,   // AŽURIRANO: vehicleId
            rentalId: rental_id,     // AŽURIRANO: rentalId
            rating: rating,
            comment: comment || null
        });
        await reviewRepository.save(newReview);

        // 4. Ažuriranje prosečne ocene automobila (u Vehicle tabeli)
        // Koristite vehicleId za findOneBy
        const vehicleToUpdate = await vehicleRepository.findOneBy({ vehicleId: vehicle_id }); // AŽURIRANO: vehicleId
        if (vehicleToUpdate) {
            // Koristite vehicleId za find
            const allReviewsForVehicle = await reviewRepository.find({ where: { vehicleId: vehicle_id } }); // AŽURIRANO: vehicleId
            const totalRating = allReviewsForVehicle.reduce((sum, review) => sum + review.rating, 0);
            const reviewCount = allReviewsForVehicle.length;

            // Pristupite averageRating i reviewCount svojstvima u Vehicle entitetu
            vehicleToUpdate.averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0; // AŽURIRANO: averageRating
            vehicleToUpdate.reviewCount = reviewCount; // AŽURIRANO: reviewCount
            await vehicleRepository.save(vehicleToUpdate);
        }

        res.status(201).json({ message: 'Review created successfully.', review: newReview });

    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Server error while creating review.' });
    }
});


export default router;

