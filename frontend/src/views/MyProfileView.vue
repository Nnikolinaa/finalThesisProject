<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { MainService } from '@/services/mainService';
import { AuthService } from '@/services/authService';
import { useVehicleService } from '@/services/vehicleService';
import type { Rental } from '@/models/rental.model'; // Import Rental model
import type { Vehicle } from '@/models/vehicle.model'; // Import Vehicle model
import fallbackImage from '@/assets/mercedesAMGGTR.jpg'; // Import fallback image
import { formatTime } from '@/utils.ts'; 

interface User {
  email: string;
  phone: string;
  createdAt: string;
}

const user = ref<User | null>(null);

const upcomingRentals = ref<Rental[]>([]); // Use Rental model for type checking
const showPaymentModal = ref(false); // State to control payment modal visibility
const selectedRental = ref<Rental | null>(null); // Store the selected rental for payment
const paymentDetails = ref({
  paymentMethod: 'credit_card',
  transcationId: '',
});

const router = useRouter();
const { imageMap } = useVehicleService(); // Import imageMap from vehicleService

const formatDate = (dateString: string): string => {
  // Return the date string as-is, assuming it is already in YYYY-MM-DD format
  return dateString;
};

const fetchUser = async () => {
  try {
    const userId = AuthService.getUserId(); // Get userId using AuthService
    if (userId === null) { // Check for null explicitly
      throw new Error('User ID not found in AuthService.'); // More specific error
    }

    const response = await MainService.useAxios<User>(`/user/users/${userId}`);
    user.value = response.data;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    alert('Failed to load user data. Please try again.');
  }
};

const fetchRentals = async () => {
  try {
    const userId = AuthService.getUserId(); // Get userId using AuthService
    if (userId === null) { // Check for null explicitly
      throw new Error('User ID not found in AuthService.'); // More specific error
    }

    const response = await MainService.useAxios<Rental[]>(`/rentals/user/${userId}`);
    const rentals = response.data;

    // Fetch vehicle details for each rental
    const rentalWithVehicleDetails = await Promise.all(
      rentals.map(async (rental) => {
        const vehicle = await MainService.useAxios<Vehicle>(`/vehicles/${rental.vehicleId}`).then(res => res.data);

        return {
          ...rental,
          vehicleName: vehicle.name, // Add vehicle name
          vehicleImage: imageMap[vehicle.imagePath] || fallbackImage, // Map vehicle image path or use fallback
          startDate: new Date(rental.startDate).toLocaleDateString('en-GB'), // Format start date as DD.MM.YY
          endDate: new Date(rental.endDate).toLocaleDateString('en-GB'), // Format end date as DD.MM.YY
        };
      })
    );

    upcomingRentals.value = rentalWithVehicleDetails;
  } catch (error) {
    console.error('Failed to fetch rentals:', error);
    alert('Failed to load rentals. Please try again.');
  }
};

const confirmPayment = async () => {
  if (!selectedRental.value) {
    alert('No rental selected for payment.');
    return;
  }

  try {
    const userId = AuthService.getUserId(); // Get userId using AuthService
    if (userId === null) { // Check for null explicitly
      throw new Error('User ID not found in AuthService.');
    }

    const paymentData = {
      rentalId: selectedRental.value.rentalId,
      userId: parseInt(userId),
      amount: selectedRental.value.totalPrice,
      paymentMethod: paymentDetails.value.paymentMethod,
      transcationId: paymentDetails.value.transcationId || `MOCK-${Date.now()}`, // Generate a mock transaction ID if not provided
    };

    await MainService.useAxios('/payments', 'post', paymentData);
    alert('Payment confirmed successfully.');
    showPaymentModal.value = false; // Close the modal
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    alert('Failed to confirm payment. Please try again.');
  }
};

const logout = async () => {
  try {
    const userId = AuthService.getUserId();
    if (userId === null) {
      // If for some reason userId is null here, we can still attempt a logout
      // (clearing frontend state) but alert the user if the API call won't work.
      console.warn('User ID is null during logout attempt. Clearing local auth state only.');
      AuthService.removeAuth();
      router.push({ name: 'login' });
      return; // Exit if userId is null, as backend requires it
    }

    // Send the userId in the request body
    await MainService.useAxios('/user/logout', 'post', { userId: userId });
    AuthService.removeAuth();

    router.push({ name: 'login' }); // Navigate to the login view
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Logout failed. Please try again.');
  }
};
const cancelRental = async (rentalId: number) => {
  try {
    const userId = AuthService.getUserId(); // Get userId using AuthService
    if (userId === null) { // Check for null explicitly
      throw new Error('User ID not found in AuthService.');
    }

    await MainService.useAxios(`/rentals/${rentalId}/user/${userId}`, 'delete');
    upcomingRentals.value = upcomingRentals.value.filter((r) => r.rentalId !== rentalId);
  } catch (error) {
    console.error('Failed to delete rental:', error);
    alert('Failed to delete the rental. Please try again.');
  }
};

const openPaymentModal = (rental: Rental) => {
  selectedRental.value = rental; // Set the selected rental
  showPaymentModal.value = true; // Open the payment modal
};

const navigateToPaymentView = (rental: Rental) => {
  router.push({ name: 'payment', params: { rentalId: rental.rentalId } }); // Use rentalId
};

onMounted(() => {
  fetchUser();
  fetchRentals();
});
</script>

<template>
  <div class="profile-container dark-theme">
    <!-- User Profile Section -->
    <div class="user-profile-section">
      <div class="user-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <div class="user-details">
        <h2 class="user-name">Premium Member</h2>
        <div class="user-info">
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>{{ user?.email }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>{{ user?.phone || 'Not provided' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-card"></i>
            <span>Member since {{ user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A' }}</span>
          </div>
        </div>
      </div>
      <button class="logout-btn" @click="logout">
        <i class="fas fa-sign-out-alt"></i> Log Out
      </button>
    </div>

    <!-- Upcoming Rentals Section -->
    <div class="rentals-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="fas fa-calendar-alt"></i> My Upcoming Rentals
        </h2>
        <RouterLink to="/fleet" class="explore-btn">
          <i class="fas fa-car"></i> Explore More Vehicles
        </RouterLink>
      </div>

      <div v-if="upcomingRentals.length > 0" class="rentals-grid">
        <div
          v-for="rental in upcomingRentals"
          :key="rental.rentalId"
          class="rental-card"
        >
          <div class="card-header">
            <img :src="rental.vehicleImage" :alt="rental.vehicleName" class="vehicle-image" />
            <div class="vehicle-badge">{{ rental.status || 'Pending' }}</div>
          </div>

          <div class="card-body">
            <h3 class="vehicle-name">{{ rental.vehicleName }}</h3>

            <div class="rental-dates">
              <div class="date-item">
                <i class="fas fa-play-circle"></i>
                <div>
                  <span class="date-label">Pickup</span>
                  <span class="date-value">{{ rental.startDate }}</span>
                </div>
              </div>

              <div class="date-item">
                <i class="fas fa-flag-checkered"></i>
                <div>
                  <span class="date-label">Return</span>
                  <span class="date-value">{{ rental.endDate }}</span>
                </div>
              </div>
            </div>

            <div class="rental-meta">
              <div class="meta-item">
                <i class="fas fa-tag"></i>
                <span>Total: {{ rental.totalPrice }}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-file-alt"></i>
                <span>Booking #{{ rental.rentalId }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <!-- Conditionally render buttons or status -->
            <template v-if="rental.status === 'pending' || rental.status === 'confirmed'">
              <button
                class="action-btn confirm-btn"
                @click="navigateToPaymentView(rental)"
              >
                <i class="fas fa-credit-card"></i> Book
              </button>
              <button
                class="action-btn cancel-btn"
                @click="cancelRental(rental.rentalId)"
              >
                <i class="fas fa-times"></i> Cancel
              </button>
            </template>
            <template v-else-if="rental.status === 'completed'">
              <span class="status-completed">
                <i class="fas fa-check-circle"></i> Booked
              </span>
            </template>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-calendar-times"></i>
        </div>
        <h3 class="empty-title">No Upcoming Rentals</h3>
        <p class="empty-message">
          You don't have any scheduled rentals. Explore our luxury fleet to book your next ride.
        </p>
        <RouterLink to="/fleet" class="cta-btn">
          <i class="fas fa-search"></i> Browse Fleet
        </RouterLink>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="payment-modal">
      <div class="modal-content">
        <h2>Confirm Payment</h2>
        <p><strong>Vehicle:</strong> {{ selectedRental?.vehicleName }}</p>
        <p><strong>Total Amount:</strong> ${{ selectedRental?.totalPrice }}</p>

        <label for="paymentMethod">Payment Method</label>
        <select id="paymentMethod" v-model="paymentDetails.paymentMethod">
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="paypal">PayPal</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>

        <label for="transactionId">Transaction ID (Optional)</label>
        <input
          id="transactionId"
          type="text"
          v-model="paymentDetails.transcationId"
          placeholder="Enter transaction ID"
        />

        <div class="modal-actions">
          <button class="confirm-btn" @click="confirmPayment">Confirm</button>
          <button class="cancel-btn" @click="showPaymentModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dark-theme {
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #f39c12;
  --border: #333333;
  --highlight: #2a2a2a;
  --danger: #e74c3c;
  --success: #2ecc71;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: 'Poppins', sans-serif;
}

/* User Profile Section Styles */
.user-profile-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid var(--border);
  position: relative;
}

.user-avatar {
  font-size: 4rem;
  color: var(--accent);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 1.8rem;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.info-item i {
  width: 1.2rem;
  color: var(--accent);
  text-align: center;
}

.logout-btn {
  background: var(--danger);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: absolute;
  bottom: 2rem;
  right: 2rem;
}

.logout-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(192, 57, 43, 0.3);
}

/* Rentals Section Styles */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1.5rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.section-title i {
  color: var(--accent);
  margin-right: 0.8rem;
}

.explore-btn {
  background: var(--accent);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.explore-btn:hover {
  background: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

/* Rest of your existing rental card styles */
.rentals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.rental-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  transition: transform 0.3s ease;
}

.rental-card:hover {
  transform: translateY(-5px);
}

.card-header {
  position: relative;
}

.vehicle-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.vehicle-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--accent);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}

.vehicle-name {
  font-size: 1.4rem;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.rental-dates {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.date-item i {
  font-size: 1.2rem;
  color: var(--accent);
}

.date-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.2rem;
}

.date-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.rental-meta {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.meta-item i {
  width: 1rem;
  color: var(--accent);
}

.card-actions {
  display: flex;
  border-top: 1px solid var(--border);
}

.action-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background: var(--highlight);
}

.cancel-btn:hover {
  color: var(--danger);
}

.status-completed {
  color: var(--success);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin-left: 20px;
  margin-top: 10px;
}

.payment-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  text-align: center;
  color: var(--text-primary);
}

.modal-content h2 {
  margin-bottom: 1rem;
}

.modal-content label {
  display: block;
  margin-top: 1rem;
  text-align: left;
}

.modal-content input,
.modal-content select {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--highlight);
  color: var(--text-primary);
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
}

.confirm-btn {
  background: var(--accent);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: var(--danger);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px dashed var(--border);
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.empty-message {
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0 auto 2rem auto;
  line-height: 1.6;
}

.cta-btn {
  background: var(--accent);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cta-btn:hover {
  background: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

@media (max-width: 768px) {
  .user-profile-section {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }

  .logout-btn {
    position: static;
    width: 100%;
    margin-top: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .rentals-grid {
    grid-template-columns: 1fr;
  }
}
</style>