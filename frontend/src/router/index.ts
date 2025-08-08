import { createRouter, createWebHistory } from 'vue-router';
import { AuthService } from '@/services/authService'; // Import AuthService
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import AboutView from '@/views/AboutView.vue';
import FleetView from '@/views/FleetView.vue';
import CarDetailsView from '@/views/CarDetailsView.vue';
import MyProfileView from '@/views/MyProfileView.vue';
import SignUpView from '@/views/SignUpView.vue';
import PaymentView from '@/views/PaymentView.vue'; // Import PaymentView

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{path: '/', redirect: '/about'}, // Redirect root path to AboutView
    {path: '/login',name: 'login',component: LoginView,meta: {title: 'Login',},},
    {path: '/signup',name: 'signup',component: SignUpView,meta: {title: 'Signup',requiresAuth: false},},
    {path: '/dashboard', name: 'dashboard',component: DashboardView,meta: { requiresAuth: false },},
    {path: '/about',name: 'about',component: AboutView,},
    {path: '/fleet',name: 'fleet',component: FleetView,meta: { requiresAuth: false },},
    {path: '/car/:id',name: 'car-details',component: CarDetailsView,meta: { requiresAuth: false },},
    {path: '/profile',name: 'profile',component: MyProfileView,meta: { requiresAuth: true },},
    {path: '/payment/:rentalId',name: 'payment',component: PaymentView,meta: { requiresAuth: true },},
    {path: '/:catchAll(.*)',redirect: '/about',},
  ],
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }; // Always scroll to the top of the page
  },
});

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  // --- CHANGE THIS LINE ---
  const isAuthenticated = AuthService.isAuthenticated.value; // Use the reactive value

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'signup' }); // Redirect to signup if not authenticated
  } else {
    next();
  }
});

export default router;


