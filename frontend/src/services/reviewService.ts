// src/services/reviewService.ts
import { MainService } from '@/services/mainService'; // Uvezite vaš MainService
import { AuthService } from '@/services/authService'; // Uvezite vaš AuthService
import { ref } from 'vue'; // Ako planirate da koristite reaktivne varijable unutar servisa
import axios from 'axios'; 
// Definirajte TypeScript interfejse za podatke recenzije
export interface ReviewData {
    review_id: number;
    rating: number;
    comment: string | null;
    created_at: string; // Datum u string formatu
    user_display_name: string; // Anonimizovani e-mail korisnika
}

// Definirajte interfejs za ulazne podatke za kreiranje recenzije
export interface CreateReviewPayload {
    vehicle_id: number;
    rental_id: number;
    rating: number;
    comment?: string; // Komentar je opcionalan
}

export class ReviewService {
    // Reaktivna varijabla za čuvanje recenzija (opciono, možete ih čuvati i direktno u komponentama)
    static reviews = ref<ReviewData[]>([]);

    /**
     * Dohvata recenzije za specifično vozilo.
     * Ne zahteva autentifikaciju.
     */
    static async fetchReviewsForVehicle(vehicleId: number): Promise<ReviewData[]> {
        try {
            // requireAuth je false jer GET ruta ne zahteva autentifikaciju
            const response = await MainService.useAxios<ReviewData[]>(`/vehicles/${vehicleId}/reviews`, 'get', {}, false);
            this.reviews.value = response.data; // Ažurira reaktivnu listu recenzija
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch reviews for vehicle ${vehicleId}:`, error);
            // Možete baciti grešku ili vratiti prazan niz zavisno od UI-ja
            throw error; // Propagirajte grešku da je komponenta može uhvatiti
        }
    }

    /**
     * Šalje novu recenziju.
     * Zahteva autentifikaciju (jer samo ulogovani korisnici mogu ostavljati recenzije).
     */
static async createReview(payload: CreateReviewPayload): Promise<ReviewData> {
        // Provera da li je korisnik ulogovan pre slanja recenzije
        // Use AuthService.isAuthenticated.value to check the reactive state
        if (!AuthService.isAuthenticated.value) {
            throw new Error('User not authenticated. Please log in to leave a review.');
        }

        try {
            // requireAuth je true jer POST ruta zahteva autentifikaciju
            const response = await MainService.useAxios<ReviewData>('/reviews', 'post', payload, true);
            return response.data;
        } catch (error) {
            console.error('Failed to create review:', error);
            throw error; // Propagate the error
        }
    }

    /**
     * Proverava da li je korisnik završio određeno iznajmljivanje.
     * U praksi, ovo bi verovatno bila GET ruta na vašem backendu (npr. /api/user/rentals/:rental_id/status).
     */
      static async checkIfRentalCompleted(vehicleId: number): Promise<boolean> {
        // Check if the user is authenticated
        if (!AuthService.isAuthenticated.value) {
            console.warn('User not authenticated. Cannot check rental completion.');
            return false;
        }

        const currentUserId = AuthService.getUserId(); // Get the ID of the logged-in user from AuthService

        if (currentUserId === null) {
            console.error('Authenticated user ID not found. Cannot check rental completion.');
            return false;
        }

        try {
            // Call the backend route specifically designed to check for completed rentals by user and vehicle.
            // The backend's 'UserService.verifyToken' middleware will handle authentication
            // and the route handler will ensure `currentUserId` matches the one in the URL path.
            const response = await MainService.useAxios<{ hasCompletedRental: boolean, rentalId: number | null }>(
                `/rentals/user/${currentUserId}/vehicle/${vehicleId}/completed`, // Correct endpoint
                'get',
                {},
                true // This endpoint requires authentication
            );

            // The backend now returns { hasCompletedRental: boolean, rentalId: number | null }
            return response.data.hasCompletedRental;

        } catch (error) {
            console.error(`Error checking completed rental for vehicle ${vehicleId} by user ${currentUserId}:`, error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    // This means the authenticated user ID didn't match the URL ID on the backend
                    // Or other forbidden access issues.
                    console.error('Access forbidden: You might be trying to check another user\'s rental status.');
                } else if (error.response?.status === 404) {
                    // Means no matching completed rental was found, which is not an error for this check
                    // (It just means hasCompletedRental is false). So we can return false.
                    console.log('No completed rental found for this user and vehicle.');
                    return false;
                }
            }
            // For any other error, assume the check failed and return false.
            return false;
        }
    }
}