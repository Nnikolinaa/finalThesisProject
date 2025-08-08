<script setup lang="ts">
import { ref } from 'vue';
import lamborghiniImage from '@/assets/lamborghini.jpg';
import rollsRoyceImage from '@/assets/rolls-royce.jpg';
import ferrariImage from '@/assets/ferrari.jpg';
import heroBg from '@/assets/luxury-dashboard-bg.jpg';
import BookView from './BookView.vue';
import { AuthService } from '@/services/authService';

// Define a type for your Vehicle, including vehicleId
interface Vehicle {
  vehicleId: number; // Add vehicleId
  name: string;
  image: string;
  price: string; // Or number, depending on how you handle it
  specs: string;
}

const showBookingPopup = ref(false);
const selectedCar = ref<Vehicle | null>(null); // Use the new Vehicle type

const openBookingPopup = (car: Vehicle) => { // Type 'car' as Vehicle
  if (!AuthService.isAuthenticated.value) {
    alert('You must register to book your dream car.');
    return;
  }
  selectedCar.value = car;
  showBookingPopup.value = true;
};

const closeBookingPopup = () => {
  showBookingPopup.value = false;
};

const stats = ref([
  { label: 'Total Bookings', value: '120+', icon: '📅' },
  { label: 'Available Cars', value: '15+', icon: '🚗' },
  { label: 'Sattisfied Customers', value: '1000+', icon: '😊' },
]);

const featuredCars = ref<Vehicle[]>([ // Explicitly type the array
  {
    vehicleId: 1, // <--- IMPORTANT: Assign a valid vehicleId from your DB
    name: 'Lamborghini Aventador',
    image: lamborghiniImage,
    price: '$1,200/day',
    specs: 'V12, 740HP, 217mph'
  },
  {
    vehicleId: 2, // <--- IMPORTANT: Assign a valid vehicleId from your DB
    name: 'Rolls Royce Phantom',
    image: rollsRoyceImage,
    price: '$1,500/day',
    specs: 'V12, 563HP, Luxury'
  },
  {
    vehicleId: 3, // <--- IMPORTANT: Assign a valid vehicleId from your DB
    name: 'Ferrari 488 Spider',
    image: ferrariImage,
    price: '$1,000/day',
    specs: 'V8, 661HP, 205mph'
  },
]);
</script>

<template>
  <div class="dashboard">
    <!-- Hero Section -->
    <section class="hero" :style="{ backgroundImage: `url(${heroBg})` }">
      <div class="hero-content">
        <h1>Premium Luxury Rentals</h1>
        <p>Drive the extraordinary. Book your dream car in seconds.</p>
        <button class="cta-button" @click="$router.push({ name: 'fleet' })">Browse Fleet</button>
      </div>
    </section>

    <!-- Statistics Section -->
    <section class="stats-section">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-icon">{{ stat.icon }}</span>
        <h2>{{ stat.value }}</h2>
        <p>{{ stat.label }}</p>
      </div>
    </section>

    <!-- Featured Cars Section -->
    <section class="featured-section">
      <div class="section-header">
        <h2>Our Featured Collection</h2>
        <p>Handpicked luxury vehicles for discerning clients</p>
      </div>
      <div class="car-grid">
        <article v-for="car in featuredCars" :key="car.name" class="car-card">
          <div class="car-image-container">
            <img :src="car.image" :alt="car.name" class="car-image" />
            <span class="price-badge">{{ car.price }}</span>
          </div>
          <div class="car-details">
            <h3>{{ car.name }}</h3>
            <p class="specs">{{ car.specs }}</p>
            <button class="book-button" @click="openBookingPopup(car)">Book Now</button>
          </div>
        </article>
      </div>
    </section>
    
  </div>
  <BookView v-if="showBookingPopup" :car="selectedCar" @close="closeBookingPopup" />
</template>

<style scoped>

.dashboard {
  font-family: 'Poppins', sans-serif;
  color: #2d3436;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}


.hero {
  height: 500px;
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  position: relative;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  padding: 0 20px;
  max-width: 800px;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.cta-button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1.1rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.cta-button:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}


.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.stat-card {
  background: #555757;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 10px;
}

.stat-card h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 5px;
  color: #2c3e50;
}

.stat-card p {
  color: #7f8c8d;
  font-size: 1rem;
}


.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #2c3e50;
}

.section-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.car-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.car-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.car-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.car-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.car-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.car-card:hover .car-image {
  transform: scale(1.05);
}

.price-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: 600;
}

.car-details {
  padding: 20px;
  background-color: #7f8c8d;
}

.car-details h3 {
  font-size: 1.4rem;
  margin-bottom: 10px;
  color: #2c3e50;
}

.specs {
  color: #192020;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.book-button {
  width: 100%;
  background: #db3434;
  color: rgb(254, 253, 255);
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.book-button:hover {
  background: #6c29b9;
}


@media (max-width: 768px) {
  .hero h1 {
    font-size: 2.5rem;
  }
  
  .hero p {
    font-size: 1.2rem;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .car-grid {
    grid-template-columns: 1fr;
  }
}
</style>
