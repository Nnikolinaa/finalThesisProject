<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MainService } from '@/services/mainService';

interface RentalDetails {
  rentalId: number;
  userId: number;
  vehicleName: string;
  totalPrice: number;
}

const route = useRoute();
const router = useRouter();
const rentalId = route.params.rentalId as string;
const rentalDetails = ref<RentalDetails | null>(null);

const paymentDetails = ref({
  paymentMethod: 'credit_card',
  cardNumber: '',
  cardHolder: '',
  expirationDate: '',
  cvv: '',
  paypalEmail: '',
  bankAccountNumber: '',
  bankRoutingNumber: '',
  bankName: '',
  transactionId: '',
});

const formatExpirationDate = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters

  if (value.length > 2) {
    value = value.slice(0, 2) + '/' + value.slice(2, 4); // Add slash after the first two digits
  }

  if (value.length > 5) {
    value = value.slice(0, 5); // Restrict to 5 characters (MM/YY)
  }

  input.value = value; // Update the input field value
  paymentDetails.value.expirationDate = value; // Update the v-model
};

const isProcessing = ref(false); // For transaction animation

const fetchRentalDetails = async () => {
  try {
    const response = await MainService.useAxios<RentalDetails>(`/rentals/${rentalId}`);
    rentalDetails.value = response.data;
  } catch (error) {
    console.error('Failed to fetch rental details:', error);
    alert('Failed to load rental details. Please try again.');
  }
};

const showSuccessModal = ref(false); // To control the visibility of the success modal

const confirmPayment = async () => {
  if (!rentalDetails.value) {
    alert('No rental details available.');
    return;
  }

  // Validate fields based on payment method
  if (paymentDetails.value.paymentMethod === 'credit_card' || paymentDetails.value.paymentMethod === 'debit_card') {
    const formattedExpirationDate = paymentDetails.value.expirationDate.replace('/', ''); // Remove the slash for validation

    if (
      !paymentDetails.value.cardNumber ||
      paymentDetails.value.cardNumber.length !== 16 ||
      !paymentDetails.value.cardHolder ||
      !formattedExpirationDate ||
      formattedExpirationDate.length !== 4 || // Validate MMYY format
      !paymentDetails.value.cvv ||
      paymentDetails.value.cvv.length !== 3
    ) {
      alert('Please fill in all card details correctly.');
      return;
    }
  } else if (paymentDetails.value.paymentMethod === 'paypal') {
    if (!paymentDetails.value.paypalEmail) {
      alert('Please provide your PayPal email.');
      return;
    }
  } else if (paymentDetails.value.paymentMethod === 'bank_transfer') {
    if (!paymentDetails.value.bankAccountNumber || !paymentDetails.value.bankRoutingNumber || !paymentDetails.value.bankName) {
      alert('Please fill in all bank transfer details.');
      return;
    }
  }

  try {
    isProcessing.value = true; // Start transaction animation

    const paymentData = {
      rentalId: rentalDetails.value.rentalId,
      userId: rentalDetails.value.userId,
      amount: rentalDetails.value.totalPrice,
      ...paymentDetails.value,
      expirationDate: paymentDetails.value.expirationDate.replace('/', ''), // Remove the slash before sending to the backend
      transactionId: paymentDetails.value.transactionId || `MOCK-${Date.now()}`,
    };

    await MainService.useAxios('/payments/mock', 'post', paymentData);

    // Wait for 4 seconds before showing the success modal
    setTimeout(() => {
      isProcessing.value = false; // Stop transaction animation
      showSuccessModal.value = true; // Show success modal
    }, 4000); // 4 seconds delay
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    alert('Failed to confirm payment. Please try again.');
    isProcessing.value = false; // Stop transaction animation
  }
};

onMounted(fetchRentalDetails);
</script>

<template>
  <div class="payment-container">
    <div class="modal-content">
      <h2>Confirm Payment</h2>
      <p><strong>Vehicle:</strong> {{ rentalDetails?.vehicleName }}</p>
      <p><strong>Total Amount:</strong> ${{ rentalDetails?.totalPrice }}</p>

      <label for="paymentMethod">Payment Method</label>
      <select id="paymentMethod" v-model="paymentDetails.paymentMethod">
        <option value="credit_card">Credit Card</option>
        <option value="debit_card">Debit Card</option>
        <option value="paypal">PayPal</option>
        <option value="bank_transfer">Bank Transfer</option>
      </select>

      <!-- Credit/Debit Card Fields -->
      <div v-if="paymentDetails.paymentMethod === 'credit_card' || paymentDetails.paymentMethod === 'debit_card'" class="card-details">
        <label for="cardHolder">Card Holder Name</label>
        <input
          id="cardHolder"
          type="text"
          v-model="paymentDetails.cardHolder"
          placeholder="Enter card holder name"
        />

        <label for="cardNumber">Card Number</label>
        <input
          id="cardNumber"
          type="text"
          v-model="paymentDetails.cardNumber"
          placeholder="Enter card number"
          maxlength="16"
          oninput="this.value = this.value.replace(/[^0-9]/g, '')"
        />

        <div class="card-info">
          <div>
            <label for="expirationDate">Expiration Date</label>
            <input
              id="expirationDate"
              type="text"
              v-model="paymentDetails.expirationDate"
              placeholder="MM/YY"
              maxlength="5"
              @input="formatExpirationDate"
            />
          </div>
          <div>
            <label for="cvv">CVV</label>
            <input
              id="cvv"
              type="text"
              v-model="paymentDetails.cvv"
              placeholder="CVV"
              maxlength="3"
              oninput="this.value = this.value.replace(/[^0-9]/g, '')"
            />
          </div>
        </div>
      </div>

      <!-- Transaction Animation -->
      <div v-if="isProcessing" class="transaction-animation">
        <p>Processing payment...</p>
        <div class="spinner"></div>
      </div>

      <div class="modal-actions" v-else>
        <button class="confirm-btn" @click="confirmPayment">Pay</button>
        <router-link to="/profile" class="cancel-btn">Cancel</router-link>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="success-modal">
      <div class="success-content">
        <h2>Payment Successful!</h2>
        <p>Your payment has been processed successfully.</p>
        <button class="close-btn" @click="router.push({ name: 'profile' })">Go to Profile</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
}

.modal-content {
  background: #1e1e1e;
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  text-align: center;
  color: #ffffff;
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
  border: 1px solid #333333;
  background: #2a2a2a;
  color: #ffffff;
}

.card-details,
.paypal-details,
.bank-details {
  margin-top: 1rem;
}

.card-info {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.card-info div {
  flex: 1;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
}

.confirm-btn {
  background: #f39c12;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  text-align: center;
}
.transaction-animation {
  text-align: center;
  margin-top: 1rem;
}

.transaction-animation .spinner {
  margin: 1rem auto;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #f39c12;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.success-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.success-content {
  background: #1e1e1e;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  color: #ffffff;
}

.success-content h2 {
  margin-bottom: 1rem;
  color: #4caf50;
}

.success-content p {
  margin-bottom: 1.5rem;
}

.close-btn {
  background: #f39c12;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
</style>
