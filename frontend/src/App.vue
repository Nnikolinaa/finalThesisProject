<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { AuthService } from '@/services/authService';

const isAuthenticated = AuthService.isAuthenticated; // Use the reactive state directly
</script>

<template>
  <div class="container">
    <nav class="navbar navbar-expand-lg bg-body-tertiary mb-3">
      <div class="container">
        <RouterLink class="navbar-brand" to="/about">
          <i class="fa-solid fa-car"></i> Dream Car
        </RouterLink>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/dashboard">
                <i class="fa-solid fa-house"></i> Dashboard
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/fleet">
                <i class="fa-solid fa-table"></i> Fleet
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                class="nav-link"
                :to="isAuthenticated ? '/profile' : '/signup'"
              >
                <i class="fa-solid fa-user"></i>
                {{ isAuthenticated ? 'My Profile' : 'Register' }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <RouterView />
  </div>
</template>
