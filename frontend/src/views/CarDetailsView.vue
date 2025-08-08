<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { MainService } from '@/services/mainService';
import { useVehicleService } from '@/services/vehicleService'; 
import type { Vehicle } from '@/models/vehicle.model';
import fallbackImage from '@/assets/mercedesAMGGTR.jpg';
import { AuthService } from '@/services/authService'; 
import ReviewView from '@/views/ReviewView.vue'; 
import WeatherDisplayView from '@/views/WeatherDisplayView.vue';
const route = useRoute();
const carId = Number(route.params.id);
const car = ref<Vehicle | null>(null);

const startDate = ref<string | null>(null);
const endDate = ref<string | null>(null);
const totalPrice = computed(() => {
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const days = Math.ceil((end.getTime() - start.getTime())/ (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days * parseInt(car.value?.price.replace(/[^0-9]/g, '') || '0') : 0;
  }
  return 0;
});

const { imageMap } = useVehicleService(); 


const fetchCarDetails = async () => {
  try {
    const response = await MainService.useAxios<Vehicle>(`/vehicles/${carId}`, 'get', {}, false);
    const vehicle = response.data;

    // Map the imagePath using imageMap
    car.value = {
      ...vehicle,
      imagePath: imageMap[vehicle.imagePath] || fallbackImage, // Use fallback image if no match is found
    };
  } catch (error) {
    console.error('Failed to fetch car details:', error);
    alert('Failed to load car details. Please try again.');
  }
};

const isDateUnavailable = (date: string) => {
  return car.value?.unavailableDates?.includes(date) || false;
};

const bookNow = async () => {

    // Check if the user is authenticated
  if (!AuthService.isAuthenticated.value) { // Use the reactive isAuthenticated ref's value
    alert('You must register to book your dream car.');
    return; // Stop further execution
  }

  if (!startDate.value || !endDate.value || !car.value) {
    alert('Please select valid dates.');
    return;
  }

  try {
    const bookingData = {
      userId: parseInt(localStorage.getItem('userId') || '0'),
      vehicleId: car.value.vehicleId,
      startDate: startDate.value,
      endDate: endDate.value,
      totalPrice: totalPrice.value,
    };

    await MainService.useAxios('/rentals', 'post', bookingData);
    alert('Almost Done! Confirm booking in your profile.');
  } catch (error) {
    console.error('Error booking vehicle:', error);
    alert('Failed to book the vehicle. Please try again.');
  }
};

const highlightUnavailableDates = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const date = input.value;
  if (isDateUnavailable(date)) {
    input.classList.add('unavailable-date');
  } else {
    input.classList.remove('unavailable-date');
  }
};

onMounted(fetchCarDetails);
</script>

<template>
  <div class="luxury-car-details dark-theme" v-if="car">
    <div class="hero-section">
      <div class="image-gallery">
        <img :src="car.imagePath" :alt="car.name" class="main-image" />
        <div class="thumbnail-container">
          <img v-for="i in 3" :key="i" :src="car.imagePath" class="thumbnail" />
        </div>
      </div>
      
      <div class="booking-panel">
        <h1 class="car-title">{{ car.name }}</h1>
        <div class="price-badge">{{ car.price }}</div>
        
        <!-- Availability Calendar -->
        <div class="availability-calendar">
          <h2>Check Availability</h2>
          <div class="mb-3">
            <label for="startDate" class="form-label">Start Date</label>
            <input
              type="date"
              id="startDate"
              class="form-control"
              v-model="startDate"
              :min="new Date().toISOString().split('T')[0]"
              :class="{ 'is-invalid': startDate && isDateUnavailable(startDate) }"
              @input="highlightUnavailableDates($event)"
            />
            <div class="invalid-feedback">This date is unavailable.</div>
          </div>
          <div class="mb-3">
            <label for="endDate" class="form-label">End Date</label>
            <input
              type="date"
              id="endDate"
              class="form-control"
              v-model="endDate"
              :min="startDate || new Date().toISOString().split('T')[0]"
              :class="{ 'is-invalid': endDate && isDateUnavailable(endDate) }"
              @input="highlightUnavailableDates($event)"
            />
            <div class="invalid-feedback">This date is unavailable.</div>
          </div>
          <div v-if="totalPrice > 0" class="total-price">
            <strong>Total Price:</strong> ${{ totalPrice }}
          </div>
        </div>
        
        <button
          class="book-now-btn"
          :disabled="!startDate || !endDate || isDateUnavailable(startDate) || isDateUnavailable(endDate)"
          @click="bookNow"
        >
          <i class="fas fa-calendar-check"></i> Book Now
        </button>
        
        <div class="quick-features">
          <span v-if="car.convertible" class="feature-tag">
            <i class="fas fa-car-top"></i> Convertible
          </span>
          <span v-if="car.hasHeatedSeats" class="feature-tag">
            <i class="fas fa-temperature-high"></i> Heated Seats
          </span>
          <span v-if="car.hasMassageSeats" class="feature-tag">
            <i class="fas fa-spa"></i> Massage Seats
          </span>
          <span v-if="car.chauffeurAvailable" class="feature-tag">
            <i class="fas fa-user-tie"></i> Chauffeur
          </span>
        </div>
      </div>
    </div>
    
    <div class="detailed-specs">
      <h2>Technical Specifications</h2>
      <div class="specs-grid">
        <div class="spec-card">
          <h3>Engine</h3>
          <p>{{ car.engine }}</p>
        </div>
        <div class="spec-card">
          <h3>Transmission</h3>
          <p>{{ car.transmission }}</p>
        </div>
        <div class="spec-card">
          <h3>Torque</h3>
          <p>{{ car.torque }} lb-ft</p>
        </div>
        <div class="spec-card">
          <h3>Interior</h3>
          <p>{{ car.interiorMaterial }}</p>
        </div>
        <div class="spec-card">
          <h3>Fuel Type</h3>
          <p>{{ car.fuelType }}</p>
        </div>
        <div class="spec-card">
          <h3>Seating</h3>
          <p>{{ car.seats }} seats</p>
        </div>
      </div>
    </div>
    
    <div class="features-section">
      <h2>Premium Features</h2>
      <ul class="features-list">
        <li v-for="(feature, index) in car.features" :key="index">
          <i class="fas fa-check-circle"></i> {{ feature }}
        </li>
      </ul>
    </div>
 <section class="reviews-and-weather-section">

      <WeatherDisplayView
        v-if="car.latitude !== undefined && car.longitude !== undefined"
        :lat="car.latitude"
        :lon="car.longitude"
      />
      <ReviewView v-if="car && car.vehicleId" :vehicleId="car.vehicleId" />
    
    </section>
  </div>
  
  <div v-else class="not-found">
    <h2>Car Not Found</h2>
    <p>We couldn't find the vehicle you're looking for.</p>
    <router-link to="/fleet" class="back-link">
      <i class="fas fa-arrow-left"></i> Browse Our Fleet
    </router-link>
  </div>
</template>

<style scoped>
.dark-theme {
  --bg-color: #121212;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #f39c12;
  --card-bg: #1e1e1e;
  --border: #333333;
  --highlight: #2a2a2a;
}

.luxury-car-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Poppins', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
}

.hero-section {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  border: 1px solid var(--border);
}

.thumbnail-container {
  display: flex;
  gap: 1rem;
}

.thumbnail {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.3s;
  border: 1px solid var(--border);
}

.thumbnail:hover {
  transform: scale(1.05);
  border-color: var(--accent);
}

.booking-panel {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  position: sticky;
  top: 2rem;
  border: 1px solid var(--border);
}

.car-title {
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.price-badge {
  background: var(--accent);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.spec-highlights {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.spec-item {
  background: var(--highlight);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border);
}

.spec-item i {
  color: var(--accent);
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  display: block;
}

.spec-item span {
  color: var(--text-primary);
}

.book-now-btn {
  width: 100%;
  background: var(--accent);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.book-now-btn:hover {
  background: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

.book-now-btn i {
  margin-right: 0.5rem;
}

.book-now-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.quick-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.feature-tag {
  background: var(--highlight);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid var(--border);
}

.feature-tag i {
  color: var(--accent);
  margin-right: 0.3rem;
}

.detailed-specs {
  margin-bottom: 3rem;
}

.detailed-specs h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  position: relative;
  padding-bottom: 0.5rem;
}

.detailed-specs h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--accent);
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.spec-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border: 1px solid var(--border);
}

.spec-card h3 {
  color: var(--accent);
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.spec-card p {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-primary);
}

.features-section {
  margin-bottom: 3rem;
}

.features-section h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.features-list {
  columns: 2;
  column-gap: 2rem;
}

.features-list li {
  margin-bottom: 0.8rem;
  list-style: none;
  position: relative;
  padding-left: 1.8rem;
  break-inside: avoid;
  color: var(--text-primary);
}

.features-list li i {
  color: var(--accent);
  position: absolute;
  left: 0;
}

.not-found {
  text-align: center;
  padding: 4rem 0;
  color: var(--text-primary);
}

.not-found h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--accent);
  text-decoration: none;
}

.back-link i {
  margin-right: 0.5rem;
}

.availability-calendar {
  margin-bottom: 1.5rem;
}

.availability-calendar .is-invalid {
  border-color: red;
}

.availability-calendar .unavailable-date {
  background-color: #f8d7da !important;
  border-color: #f5c6cb !important;
  color: #721c24 !important;
}

.invalid-feedback {
  color: red;
  font-size: 0.9rem;
}

.total-price {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: var(--accent);
}

@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
  }
  
  .features-list {
    columns: 1;
  }
  
  .spec-highlights {
    grid-template-columns: 1fr 1fr;
  }
  
  .main-image {
    height: 300px;
  }
}

@media (max-width: 480px) {
  .luxury-car-details {
    padding: 1rem;
  }
  
  .spec-highlights {
    grid-template-columns: 1fr;
  }
  
  .specs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
