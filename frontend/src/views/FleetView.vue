<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVehicleService } from '@/services/vehicleService';
import type { Vehicle } from '@/models/vehicle.model';
import BookView from './BookView.vue';
import { AuthService } from '@/services/authService'; 

const showBookingPopup = ref(false);
const selectedCar = ref<Vehicle | null>(null);

const openBookingPopup = (car: any) => {
  if (!AuthService.isAuthenticated.value) { // Use the reactive isAuthenticated ref's value
    alert('You must register to book your dream car.');
    return;
  }
  selectedCar.value = car;
  showBookingPopup.value = true;
};

const closeBookingPopup = () => {
  showBookingPopup.value = false;
};

const { vehicles, fetchVehicles } = useVehicleService();

const filters = ref({
  type: '',
  seats: '',
  brand: '',
  transmission: '',
  fuelType: '',
  color: '',
  horsepower: '',
  torque: '',
  acceleration: '',
  topSpeed: '',
  interiorMaterial: '',
  convertible: '',
  hasHeatedSeats: '',
  hasMassageSeats: '',
  chauffeurAvailable: '',
  year: '',
});

const searchQuery = ref('');

const filteredVehicles = computed(() => {
  return vehicles.value.filter((vehicle: Vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Convert string boolean filters to actual booleans
    const convertibleFilter = filters.value.convertible !== '' 
      ? filters.value.convertible === 'true' 
      : null;
    const heatedSeatsFilter = filters.value.hasHeatedSeats !== '' 
      ? filters.value.hasHeatedSeats === 'true' 
      : null;
    const massageSeatsFilter = filters.value.hasMassageSeats !== '' 
      ? filters.value.hasMassageSeats === 'true' 
      : null;
    const chauffeurFilter = filters.value.chauffeurAvailable !== '' 
      ? filters.value.chauffeurAvailable === 'true' 
      : null;

    return (
      matchesSearch &&
      (filters.value.type === '' || vehicle.type === filters.value.type) &&
      (filters.value.seats === '' || vehicle.seats === Number(filters.value.seats)) &&
      (filters.value.brand === '' || vehicle.brand === filters.value.brand) &&
      (filters.value.transmission === '' || vehicle.transmission === filters.value.transmission) &&
      (filters.value.fuelType === '' || vehicle.fuelType === filters.value.fuelType) &&
      (filters.value.color === '' || vehicle.color === filters.value.color) &&
      (filters.value.horsepower === '' || vehicle.horsepower >= Number(filters.value.horsepower)) &&
      (filters.value.torque === '' || vehicle.torque >= Number(filters.value.torque)) &&
      (filters.value.acceleration === '' || vehicle.acceleration <= Number(filters.value.acceleration)) &&
      (filters.value.topSpeed === '' || vehicle.topSpeed >= Number(filters.value.topSpeed)) &&
      (filters.value.interiorMaterial === '' || vehicle.interiorMaterial === filters.value.interiorMaterial) &&
      (convertibleFilter === null || vehicle.convertible === convertibleFilter) &&
      (heatedSeatsFilter === null || vehicle.hasHeatedSeats === heatedSeatsFilter) &&
      (massageSeatsFilter === null || vehicle.hasMassageSeats === massageSeatsFilter) &&
      (chauffeurFilter === null || vehicle.chauffeurAvailable === chauffeurFilter) &&
      (filters.value.year === '' || vehicle.year >= Number(filters.value.year))
    );
  });
});

onMounted(fetchVehicles);
</script>

<template>
  <div class="fleet">
    <h1>Our Fleet</h1>
    <!-- Search Bar -->
    <nav class="navbar bg-body-tertiary mb-3">
      <div class="container-fluid">
        <form class="d-flex" role="search" @submit.prevent>
          <input
            class="form-control me-2"
            type="search"
            placeholder="Search by car name"
            aria-label="Search"
            v-model="searchQuery"
          />
          <button class="btn btn-outline-success" type="submit">Search</button>
        </form>
      </div>
    </nav>

    <div class="filters">
      <div class="filter-item">
        <select v-model="filters.type">
          <option value="">All Types</option>
          <option value="Sports">Sports</option>
          <option value="Luxury">Luxury</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.seats">
          <option value="">All Seating Capacities</option>
          <option value="2">2 Seats</option>
          <option value="4">4 Seats</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.brand">
          <option value="">All Brands</option>
          <option value="Lamborghini">Lamborghini</option>
          <option value="Rolls Royce">Rolls Royce</option>
          <option value="Ferrari">Ferrari</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.transmission">
          <option value="">All Transmissions</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.fuelType">
          <option value="">All Fuel Types</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.color">
          <option value="">All Colors</option>
          <option value="Yellow">Yellow</option>
          <option value="Black">Black</option>
          <option value="Red">Red</option>
          <option value="Olive">Olive</option>
          <option value="Blue">Blue</option>
          <option value="White">White</option>
          <option value="Gray">Gray</option>
        </select>
      </div>
      <div class="filter-item">
        <input type="number" v-model="filters.horsepower" placeholder="Min Horsepower" />
      </div>
      <div class="filter-item">
        <input type="number" v-model="filters.torque" placeholder="Min Torque (lb-ft)" />
      </div>
      <div class="filter-item">
        <input type="number" v-model="filters.acceleration" placeholder="Max Acceleration (sec)" />
      </div>
      <div class="filter-item">
        <input type="number" v-model="filters.topSpeed" placeholder="Min Top Speed (mph)" />
      </div>
      <div class="filter-item">
        <select v-model="filters.interiorMaterial">
          <option value="">All Interior Materials</option>
          <option value="Leather">Leather</option>
          <option value="Alcantara">Alcantara</option>
          <option value="Carbon">Carbon</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.convertible">
          <option value="">Convertible?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.hasHeatedSeats">
          <option value="">Heated Seats?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.hasMassageSeats">
          <option value="">Massage Seats?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="filters.chauffeurAvailable">
          <option value="">Chauffeur?</option>
          <option value="true">Available</option>
          <option value="false">Self-Drive Only</option>
        </select>
      </div>
      <div class="filter-item">
        <input type="number" v-model="filters.year" placeholder="Min Year of Manufacture" />
      </div>
    </div>
    <div class="vehicle-grid">
        <div 
        v-for="vehicle in filteredVehicles" 
        :key="vehicle.vehicleId"
        class="vehicle-card"
      >
        <img :src="vehicle.imagePath" :alt="vehicle.name" />
        <h3>{{ vehicle.name }}</h3>
        <p>{{ vehicle.price }}</p>
 <button class="book-button" @click="openBookingPopup(vehicle)">Book Now</button>
        <button class="view-button" @click="$router.push({ name: 'car-details', params: { id: vehicle.vehicleId } })">
          View Details
        </button>
      </div>


<BookView v-if="showBookingPopup" :car="selectedCar" @close="closeBookingPopup" />
    </div>
  </div>
</template>

<style scoped>
.fleet {
  padding: 20px;
  font-family: 'Poppins', sans-serif;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.filter-item select,
.filter-item input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vehicle-card {
  background: rgb(24, 27, 29);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  padding: 15px;
}

.vehicle-card img {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 10px;
}

.vehicle-card h3 {
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.vehicle-card p {
  font-size: 1rem;
  color: #5bb8a8;
}

.book-button {
  background: #8b8894;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}
.view-button {
  margin-left: 10px;
  background: #453d4e;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s; 
}
.book-button:hover {
  background: #3c274b;
}
.view-button:hover {
  background: #3c274b;
}
</style>
