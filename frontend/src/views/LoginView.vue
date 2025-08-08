<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { MainService } from '@/services/mainService';
import { AuthService } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';
import type { AuthModel } from "@/models/auth.model"; // Import AuthModel type

const email = ref('');
const password = ref('');
const router = useRouter();

const login = async () => {
  try {
    const response = await MainService.login(email.value, password.value);

    const { access, refresh, name } = response.data;

    // Validate tokens and essential user data
    if (!access || !refresh || !name) {
      throw new Error('Invalid tokens or missing user data from login response.');
    }

    // Decode the access token to extract the user ID
    // Ensure that your JWT payload contains an 'id' field for the user's ID
    // The type assertion { id: number } is based on your backend providing an 'id'
    const decodedToken: { id: number; email: string; } = jwtDecode(access); // Added email to decoded token type for clarity
    
    if (!decodedToken.id) {
      throw new Error('User ID not found in token payload. Ensure your JWT includes a "id" field.');
    }

    // Create the AuthModel including the decoded userId
    const authModel: AuthModel = {
      name,
      access,
      refresh,
      userId: decodedToken.id, // Include the decoded user ID here
    };

    // Store tokens and user ID using AuthService
    AuthService.createAuth(authModel);
    
    console.log(`Login successful for user ID: ${decodedToken.id}, redirecting to About view...`);
    router.push({ name: 'about' }); // Navigate to the "about" view
  } catch (error: any) {
    console.error('Login failed:', error);
    // Display a more user-friendly error message
    const errorMessage = error.response?.data?.message || 'Login failed. Please check your email and password.';
    alert(errorMessage);
  }
};
</script>

<template>
  <div class="background">
    <div class="overlay"></div>
  </div>
  <form class="form" @submit.prevent="login">
    <h3>Login Here</h3>

    <label for="username">Username</label>
    <input type="text" placeholder="Email or Phone" id="username" v-model="email" />

    <label for="password">Password</label>
    <input type="password" placeholder="Password" id="password" v-model="password" />

    <button>Log In</button>
    <div class="signup-prompt">
      <p>Not signed up? <router-link to="/signup">Sign up here</router-link>.</p>
    </div>
  </form>
</template>

<style scoped>
/* Your existing styles remain unchanged */
*,
*:before,
*:after {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

body {
  background-color: #080710;
}

.background {
  width: 100%;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  background: url('@/assets/luxury-car.jpg') no-repeat center center/cover;
}

.overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5); 
}

form {
  height: 520px;
  width: 400px;
  background-color: rgba(255, 255, 255, 0.13);
  position: absolute;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 40px rgba(8, 7, 16, 0.6);
  padding: 50px 35px;
}

form * {
  font-family: 'Poppins', sans-serif;
  color: #ffffff;
  letter-spacing: 0.5px;
  outline: none;
  border: none;
}

form h3 {
  font-size: 32px;
  font-weight: 500;
  line-height: 42px;
  text-align: center;
}

label {
  display: block;
  margin-top: 30px;
  font-size: 16px;
  font-weight: 500;
}

input {
  display: block;
  height: 50px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.07);
  border-radius: 3px;
  padding: 0 10px;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 300;
}

::placeholder {
  color: #e5e5e5;
}

button {
  margin-top: 50px;
  width: 100%;
  background-color: #ffffff;
  color: #080710;
  padding: 15px 0;
  font-size: 18px;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
}

.signup-prompt {
  margin-top: 20px;
  text-align: center;
  font-size: 0.9rem;
  color: #e5e5e5;
}

.signup-prompt a {
  color: #f39c12;
  text-decoration: none;
  font-weight: 600;
}

.signup-prompt a:hover {
  text-decoration: underline;
}
</style>