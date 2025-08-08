<template>
  <div class="reviews-section">
    <h2>Vehicle Reviews</h2>

    <div v-if="vehicleDetails && typeof vehicleDetails.averageRating === 'number'" class="average-rating">
      <p>Average Rating: <strong>{{ vehicleDetails.averageRating.toFixed(2) }}</strong> / 5</p>
      <p>Total Reviews: <strong>{{ vehicleDetails.reviewCount || 0 }}</strong></p>
    </div>
    <div v-else class="average-rating no-rating">
        <p>No average rating available yet.</p>
    </div>

    <div v-if="reviews.length > 0" class="review-list">
      <div v-for="review in reviews" :key="review.review_id" class="review-item">
        <p class="review-header">
          <strong>{{ review.user_display_name }}</strong> - Rating:
          <span class="rating-stars">{{ '⭐'.repeat(review.rating) }}</span>
        </p>
        <p class="review-comment" v-if="review.comment">{{ review.comment }}</p>
        <p class="review-date">{{ formatDate(review.created_at) }}</p>
      </div>
    </div>
    <div v-else class="no-reviews-message">
      <p>No reviews yet for this vehicle. Be the first to leave a review!</p>
    </div>

    <hr class="section-divider">

    <div v-if="AuthService.isAuthenticated.value && !hasAlreadyReviewedRental">
      <h3>Leave a Review</h3>
      <div v-if="canLeaveReview" class="review-form">
        <form @submit.prevent="submitReview">
          <div class="form-group">
            <label for="rating">Rating:</label>
            <select id="rating" v-model.number="newReview.rating" required>
              <option disabled value="">Select a rating</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} star<span v-if="n !== 1">s</span></option>
            </select>
          </div>

          <div class="form-group">
            <label for="comment">Comment (optional):</label>
            <textarea id="comment" v-model="newReview.comment" rows="4" maxlength="500"></textarea>
          </div>

          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
          </button>
          <p v-if="submitMessage" :class="submitMessageType === 'success' ? 'success-message' : 'error-message'">
            {{ submitMessage }}
          </p>
        </form>
      </div>
      <div v-else class="info-message">
        <p>You can only leave a review for vehicles you have **completed** renting.</p>
        <p>Check your rental history to see which rentals are finished.</p>
      </div>
    </div>
    <div v-else-if="AuthService.isAuthenticated.value && hasAlreadyReviewedRental" class="info-message">
        <p>You have already submitted a review for your completed rental of this vehicle.</p>
    </div>
    <div v-else class="info-message">
      <p>Please **log in** to leave a review.</p>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { MainService } from '@/services/mainService';
import { AuthService } from '@/services/authService';
import type { Review } from '@/models/review.model';
import type { Vehicle } from '@/models/vehicle.model';

interface NewReview {
  rental_id: number | null;
  rating: number | null;
  comment: string;
}

const props = defineProps<{
  vehicleId: number;
}>();

const reviews = ref<Review[]>([]);
const newReview = ref<NewReview>({
  rental_id: null,
  rating: null,
  comment: '',
});
const isSubmitting = ref(false);
const submitMessage = ref('');
const submitMessageType = ref('');
const canLeaveReview = ref(false);
const vehicleDetails = ref<{ averageRating: number | null; reviewCount: number } | null>(null);

// This variable indicates if a user has completed a rental AND already left a review for it.
const hasAlreadyReviewedRental = ref(false);

const fetchReviews = async () => {
  try {
    const response = await MainService.useAxios<Review[]>(`/reviews/vehicle/${props.vehicleId}`, 'get', {}, false);
    reviews.value = response.data;
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    reviews.value = [];
  }
};

const fetchVehicleDetailsForRating = async () => {
  try {
    const response = await MainService.useAxios<Vehicle>(`/vehicles/${props.vehicleId}`, 'get', {}, false);
    
    // Explicitly convert averageRating to a number
    const avgRating = response.data.averageRating !== null && response.data.averageRating !== undefined
      ? parseFloat(response.data.averageRating as string) // Cast to string if needed, then parse
      : null;

    vehicleDetails.value = {
      averageRating: avgRating,
      reviewCount: response.data.reviewCount ?? 0
    };
    console.log('Fetched vehicle details:', vehicleDetails.value);
  } catch (error) {
    console.error('Failed to fetch vehicle details for rating:', error);
    vehicleDetails.value = { averageRating: null, reviewCount: 0 };
  }
};

const checkIfCanLeaveReview = async () => {
  canLeaveReview.value = false; // Reset to false
  newReview.value.rental_id = null; // Reset rental_id
  hasAlreadyReviewedRental.value = false; // Reset the new flag

  if (!AuthService.isAuthenticated.value) {
    return; // Not authenticated, cannot leave review
  }

  const userId = AuthService.getUserId();
  if (userId === null) {
    console.warn('User ID not found from AuthService. Cannot check rental status.');
    return;
  }

  try {
    // 1. Check for a completed rental for this user and vehicle
    const rentalStatusResponse = await MainService.useAxios<{ hasCompletedRental: boolean, rentalId: number | null }>(
      `/rentals/user/${userId}/vehicle/${props.vehicleId}/completed`,
      'get',
      {},
      true
    );

    if (rentalStatusResponse.data.hasCompletedRental && rentalStatusResponse.data.rentalId !== null) {
      const foundRentalId = rentalStatusResponse.data.rentalId;

      // 2. Now, check if a review already exists for this specific rentalId
      const existingReviewResponse = await MainService.useAxios<Review[]>(
          `/reviews/rental/${foundRentalId}`,
          'get',
          {},
          true
      );

      if (existingReviewResponse.data && existingReviewResponse.data.length === 0) {
          // A completed rental exists, and NO review has been left for it yet.
          canLeaveReview.value = true;
          newReview.value.rental_id = foundRentalId;
          hasAlreadyReviewedRental.value = false;
      } else {
          // A completed rental exists, AND a review HAS been left for it.
          canLeaveReview.value = false;
          hasAlreadyReviewedRental.value = true; // Set this flag to indicate a review already exists.
      }
    } else {
      // No completed rental found for this user/vehicle.
      canLeaveReview.value = false;
      hasAlreadyReviewedRental.value = false; // Ensure this is false as there's no completed rental to have reviewed.
    }
  } catch (error) {
    console.error('Failed to check if user can leave review:', error);
    canLeaveReview.value = false;
    newReview.value.rental_id = null;
    hasAlreadyReviewedRental.value = false;
  }
};

const submitReview = async () => {
  isSubmitting.value = true;
  submitMessage.value = '';
  submitMessageType.value = '';

  const userId = AuthService.getUserId();
  if (userId === null) {
    submitMessage.value = 'You must be logged in to submit a review.';
    submitMessageType.value = 'error';
    isSubmitting.value = false;
    return;
  }

  if (newReview.value.rental_id === null || newReview.value.rating === null) {
      submitMessage.value = 'Rental ID and Rating are required.';
      submitMessageType.value = 'error';
      isSubmitting.value = false;
      return;
  }

  try {
    const reviewData = {
      user_id: userId,
      vehicle_id: props.vehicleId,
      rental_id: newReview.value.rental_id,
      rating: newReview.value.rating,
      comment: newReview.value.comment,
    };
    await MainService.useAxios('/reviews', 'post', reviewData);
    submitMessage.value = 'Review submitted successfully!';
    submitMessageType.value = 'success';
    newReview.value = { rental_id: null, rating: null, comment: '' }; // Reset form
    await fetchReviews(); // Refresh the list of reviews
    await fetchVehicleDetailsForRating(); // Refresh average rating and count
    await checkIfCanLeaveReview(); // Re-check eligibility after submission
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    if (error.response && error.response.data && error.response.data.message) {
      submitMessage.value = error.response.data.message;
    } else {
      submitMessage.value = 'Failed to submit review. Please try again.';
    }
    submitMessageType.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(async () => {
  await fetchReviews();
  await fetchVehicleDetailsForRating();
  await checkIfCanLeaveReview();
});

watch(AuthService.isAuthenticated, () => {
  checkIfCanLeaveReview();
});

watch(() => props.vehicleId, async (newId) => {
  if (newId) {
    await fetchReviews();
    await fetchVehicleDetailsForRating();
    await checkIfCanLeaveReview();
  }
});
</script>


<style scoped>
/* Vaši postojeći stilovi, samo prevedeni komentari ako ih ima */
.reviews-section {
  background-color: lightgray;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  margin-top: 30px;
  font-family: 'Arial', sans-serif;
  color: #333;
}

h2, h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.average-rating {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  padding: 15px 20px;
  margin-bottom: 25px;
  font-size: 1.1em;
  color: #1890ff;
}

.average-rating strong {
  color: #096dd9;
}

.review-list {
  margin-top: 20px;
}

.review-item {
  background-color: #FFFACD;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.review-header {
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-stars {
  color: gold; /* Unicode stars are usually yellow */
  font-size: 1.2em;
}

.review-comment {
  margin-top: 10px;
  line-height: 1.6;
  color: #555;
}

.review-date {
  font-size: 0.85em;
  color: #888;
  text-align: right;
  margin-top: 10px;
}

.no-reviews-message {
  font-style: italic;
  color: #777;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 6px;
  text-align: center;
}

.section-divider {
  border: 0;
  height: 1px;
  background: #eee;
  margin: 30px 0;
}

.review-form {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box; /* Include padding in element's total width and height */
}

.form-group textarea {
  resize: vertical; /* Allow vertical resizing */
}

.help-text {
  font-size: 0.85em;
  color: #777;
  margin-top: 5px;
  display: block;
}

.submit-button {
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #0056b3;
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.success-message {
  color: #28a745;
  margin-top: 15px;
  font-weight: bold;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
  font-weight: bold;
}

.info-message {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 6px;
  padding: 15px 20px;
  margin-top: 20px;
  color: #856404;
  text-align: center;
}

.info-message strong {
  color: #664d03;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .reviews-section {
    padding: 15px;
  }

  .review-item {
    padding: 10px 15px;
  }
}
</style>