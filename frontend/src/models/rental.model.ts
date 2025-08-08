export interface Rental {
  rentalId: number; // Unique identifier for the rental
  userId: number; // ID of the user who made the rental
  vehicleId: number; // ID of the rented vehicle
  startDate: string; // Start date of the rental (YYYY-MM-DD)
  endDate: string; // End date of the rental (YYYY-MM-DD)
  totalPrice: number; // Total price of the rental
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // Status of the rental
  vehicleName: string; // Name of the rented vehicle
  vehicleImage: string; // Image path of the rented vehicle
}
