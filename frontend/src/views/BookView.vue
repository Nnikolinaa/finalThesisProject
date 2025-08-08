<template>
  <div class="book-view">
    <div class="booking-panel">
      <h1 class="car-title">{{ car.name }}</h1>
      <div class="price-badge">{{ car.price }}</div>

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
        @click="confirmBooking"
      >
        <i class="fas fa-calendar-check"></i> Book
      </button>
      <button @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { MainService } from '@/services/mainService';
import { AuthService } from '@/services/authService'; // <--- IMPORT AUTHSERVICE HERE

// Accept the `car` prop
const props = defineProps({
  car: {
    type: Object,
    required: true,
  },
});

// Emit a `close` event
defineEmits(['close']);

const startDate = ref('');
const endDate = ref('');

// Check if a date is unavailable
const isDateUnavailable = (date: string) => {
  return props.car?.unavailableDates?.includes(date) || false;
};

// Highlight unavailable dates in the input field
const highlightUnavailableDates = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const date = input.value;
  if (isDateUnavailable(date)) {
    input.classList.add('unavailable-date');
  } else {
    input.classList.remove('unavailable-date');
  }
};

// Calculate the total price based on the selected dates
const totalPrice = computed(() => {
  if (!startDate.value || !endDate.value) return 0;

  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  // Calculate days including both start and end date
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Ensure props.car.price is safely parsed
  const carPrice = parseInt(String(props.car.price).replace(/[^0-9]/g, '') || '0');
  
  return days > 0 ? days * carPrice : 0;
});


// Confirm the booking
const confirmBooking = async () => {
  if (!startDate.value || !endDate.value || isDateUnavailable(startDate.value) || isDateUnavailable(endDate.value)) {
    alert('Please select valid dates.');
    return;
  }

  // --- GET USER ID FROM AUTHSERVICE ---
  const userId = AuthService.getUserId(); 
  if (userId === null) {
      alert('User is not properly authenticated. Please log in again.');
      console.error('AuthService.getUserId() returned null. User might not be fully logged in.');
      return;
  }

  const bookingData = {
    userId: userId,
    vehicleId: props.car.vehicleId, // ID of the car being booked
    startDate: startDate.value,
    endDate: endDate.value,
    totalPrice: totalPrice.value,
  };

  // --- ADD THIS LOG ---
  console.log('Frontend bookingData being sent:', bookingData);
  console.log('Frontend vehicleId:', props.car.vehicleId); // Explicitly check vehicleId

  try {
    await MainService.useAxios('/rentals', 'post', bookingData, true); 
    alert('Almost done! Confirm booking in your profile.');
  } catch (error) {
    console.error('Error booking vehicle:', error);
    alert('Failed to book the vehicle. Please try again.');
  }
};
</script>

<style scoped>
/* Your existing styles */
.book-view {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1e1e1e;
  color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5); 
  z-index: 1000;
}

.booking-panel {
  text-align: center;
}

.price-badge {
  background: #333333; 
  color: #ffffff; 
  padding: 5px 10px;
  border-radius: 5px;
  display: inline-block;
  margin-bottom: 20px;
}

.availability-calendar label {
  color: #ffffff; 
}

.form-control {
  background: #2c2c2c; 
  color: #ffffff;
  border: 1px solid #444444; 
  border-radius: 5px;
  padding: 10px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff; 
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); 
}

.invalid-feedback {
  color: #ff6b6b;
}

.book-now-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #007bff; 
  color: #ffffff; 
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.book-now-btn:hover {
  background: #0056b3; 
}

.book-now-btn:disabled {
  background: #444444; 
  color: #888888; 
  cursor: not-allowed;
}

button {
  margin-top: 10px;
  padding: 10px 20px;
  background: #444444; 
  color: #ffffff; 
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background: #555555; 
}
</style>