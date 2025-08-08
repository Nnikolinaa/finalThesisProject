<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { MainService } from '@/services/mainService';

const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const router = useRouter();

const signUp = async () => {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const response = await MainService.useAxios('/user/register', 'post', {
      email: email.value,
      phone: phone.value,
      password: password.value,
    }, false);

    const data = response.data as { userId: number }; 
    const { userId } = data; // Extract `userId` from the typed response
    if (userId) {
      localStorage.setItem('userId', userId.toString()); // Store `userId` in localStorage
    }

    alert('Sign-up successful! You can now log in.');
    router.push('/login');
  } catch (error) {
    console.error('Sign-up failed:', error);
    alert('Sign-up failed. Please try again.');
  }
};
</script>

<template>
  <div class="background">
    <div class="overlay"></div>
  </div>
  <form class="form" @submit.prevent="signUp">
    <h3>Sign Up</h3>

    <label for="email">Email</label>
    <input type="email" placeholder="Enter your email" id="email" v-model="email" />

    <label for="phone">Phone Number</label>
    <input type="tel" placeholder="Enter your phone number" id="phone" v-model="phone" />

    <label for="password">Password</label>
    <input type="password" placeholder="Enter your password" id="password" v-model="password" />

    <label for="confirmPassword">Confirm Password</label>
    <input type="password" placeholder="Confirm your password" id="confirmPassword" v-model="confirmPassword" />

    <button>Sign Up</button>
    <div class="login-prompt">
      <p>Already have an account? <router-link to="/login">Log in here</router-link>.</p>
    </div>
  </form>
</template>

<style scoped>
.login-prompt {
  margin-top: 20px;
  text-align: center;
  font-size: 0.9rem;
  color: #e5e5e5;
}
.login-prompt a {
  color: #f39c12;
  text-decoration: none;
  font-weight: 600;
}
.login-prompt a:hover {
  text-decoration: underline;
}
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
  background: url('@/assets/luxury-car.jpg') no-repeat center center / cover;
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
  height: 570px;
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
</style>
