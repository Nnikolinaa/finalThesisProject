// src/services/mainService.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
import { AuthService } from "./authService";

const API_BASE_URL = 'https://localhost:3003';

const client: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    validateStatus: (status: number) => {
        return status >= 200 && status < 300;
    },
});

// --- Request Interceptor ---
client.interceptors.request.use(
    (config) => {
        const accessToken = AuthService.getAccessToken();
        console.log(`[Axios Request] Sending request to: ${config.url}`);
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            console.log(`[Axios Request] Access Token attached: ${accessToken.substring(0, 10)}...`); // Log first few chars
        } else {
            console.warn('[Axios Request] No Access Token available for authenticated request.');
        }
        return config;
    },
    (error) => {
        console.error('[Axios Request Error]', error);
        return Promise.reject(error);
    }
);

// --- Response Interceptor ---
let isRefreshing = false;
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

client.interceptors.response.use(
    (response) => {
        console.log(`[Axios Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        console.error(`[Axios Response Error] ${originalRequest.method?.toUpperCase()} ${originalRequest.url} - Status: ${error.response?.status}`);
        if (error.response?.data) {
            console.error('[Axios Response Error] Server message:', error.response.data);
        }

        // Specifically check for 403 with 'INVALID_TOKEN' message
        // Your backend returns 403 for INVALID_TOKEN, so we should treat it like a 401.
        const isInvalidToken = error.response?.status === 403 &&
                               (error.response.data as { message?: string })?.message === 'INVALID_TOKEN';


        if ((error.response?.status === 401 || isInvalidToken) && originalRequest.url !== '/api/user/refresh' && !originalRequest._retry) {
            originalRequest._retry = true;
            console.warn('Authentication issue detected (401/INVALID_TOKEN). Attempting to refresh token...');

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    console.log('Retrying original request with new token (from queue).');
                    return client(originalRequest);
                })
                .catch((err) => {
                    console.error('Queued request failed after token refresh attempt:', err);
                    return Promise.reject(err);
                });
            }

            isRefreshing = true;
            const refreshToken = AuthService.getRefreshToken();

            if (refreshToken) {
                try {
                    console.log('Sending refresh token request...');
                    const refreshResponse = await axios.post(`${API_BASE_URL}/api/user/refresh`, {}, {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`,
                        },
                    });

                    const { access: newAccessToken, refresh: newRefreshToken } = refreshResponse.data;
                    AuthService.updateTokens(newAccessToken, newRefreshToken);
                    console.log('Token refreshed successfully. New Access Token:', newAccessToken.substring(0, 10) + '...');

                    processQueue(null, newAccessToken); // Resolve all queued requests

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    console.log('Retrying original request immediately with new token.');
                    return client(originalRequest);

                } catch (refreshError: any) {
                    console.error('Failed to refresh token:', refreshError.response?.data?.message || refreshError.message);
                    processQueue(refreshError);
                    AuthService.removeAuth(); // Force logout
                    // You might want to redirect to login page here using router.push('/login')
                    // import { useRouter } from 'vue-router';
                    // const router = useRouter(); // if outside a component, might need a global router instance
                    // router.push('/login');
                    return Promise.reject(new Error('REFRESH_FAILED'));
                } finally {
                    isRefreshing = false;
                }
            } else {
                console.error('No refresh token available. Forcing logout.');
                AuthService.removeAuth();
                return Promise.reject(new Error('NO_REFRESH_TOKEN'));
            }
        }

        // If it's a 403 due to user ID mismatch or any other error not handled by refresh logic
        // re-throw the error so the calling function can catch it.
        return Promise.reject(error);
    }
);

export class MainService {
    // Specific login method - uses the base axios directly to avoid interceptor issues for initial token acquisition
    static async login(email: string, password: string): Promise<AxiosResponse<any>> {
        return await axios.post(`${API_BASE_URL}/api/user/login`, { email, password });
    }

    // Generic Axios call method - now uses the `client` instance with interceptors
    static async useAxios<T>(
        url: string,
        method: AxiosRequestConfig['method'] = 'get',
        data: any = {},
        // `requireAuth` parameter is now less critical as interceptor handles auth,
        // but can be kept for clarity or specific non-auth routes.
        // If a route truly doesn't need auth, the interceptor will simply not add the header.
        // For 401 handling, the interceptor will still catch it.
        requireAuth: boolean = true // Keep for consistency if you have public endpoints
    ): Promise<AxiosResponse<T, any>> {
        const config: AxiosRequestConfig = {
            url: `/api${url}`, // Ensure /api prefix is consistently added
            method: method,
            data: method !== 'get' ? data : undefined,
            params: method === 'get' ? data : undefined,
        };

        // If requireAuth is false, explicitly remove Authorization header
        // This is a safeguard if you have public endpoints that should *never* send a token.
        if (!requireAuth && config.headers) {
             delete config.headers.Authorization;
        }

        try {
            const response = await client.request<T>(config);
            return response as AxiosResponse<T>;
        } catch (error) {
            // The interceptor handles token refresh and re-tries.
            // If an error still reaches here, it's a non-401 error or a failed refresh.
            console.error(`API call failed: ${method} ${url}`, error);
            throw error;
        }
    }

    // You can add other specific methods here that use `useAxios`
    // Example:
    static async checkCompletedRental(userId: number, vehicleId: number): Promise<AxiosResponse<{ hasCompletedRental: boolean, rentalId: number | null }>> {
        return this.useAxios(`/rentals/user/${userId}/vehicle/${vehicleId}/completed`, 'get', {}, true);
    }

    static async submitReview(reviewData: any): Promise<AxiosResponse<any>> {
        return this.useAxios('/reviews', 'post', reviewData, true);
    }

    static async fetchReviewsByVehicleId(vehicleId: number): Promise<AxiosResponse<any>> {
        return this.useAxios(`/reviews/vehicle/${vehicleId}`, 'get', {}, false); // No auth needed for public reviews
    }

    static async getCarDetails(vehicleId: number): Promise<AxiosResponse<any>> {
        return this.useAxios(`/vehicles/${vehicleId}`, 'get', {}, false); // No auth needed for public vehicle details
    }
        static async getCurrentWeather(lat: number, lon: number): Promise<AxiosResponse<any>> {
        // Koristite 'get' metod i prosledite koordinate kao params
        return this.useAxios(`/weather/current`, 'get', { lat, lon }, false); // False jer ne treba auth
    }

    static async getWeatherForecast(lat: number, lon: number): Promise<AxiosResponse<any>> {
        return this.useAxios(`/weather/forecast`, 'get', { lat, lon }, false); // False jer ne treba auth
    }
 // NEW: Reverse Geocoding Function
  static async getCityNameFromCoordinates(lat: number, lon: number): Promise<string> {
    // OpenStreetMap Nominatim API for reverse geocoding
    const NOMINATIM_URL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    try {
      const response = await axios.get(NOMINATIM_URL, {
        headers: {
          // It's good practice to provide a User-Agent, e.g., your application name or email
          'User-Agent': 'SupercarRentalApp/1.0 (nikolinaaa)'
        }
      });

      // Nominatim response structure:
      // response.data.address contains various address components
      // We look for 'city', 'town', 'village', or 'county'
      const address = response.data.address;
      if (address) {
        return address.city || address.town || address.village || address.county || response.data.display_name;
      }
      return 'Unknown City'; // Fallback if no specific city name found
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      return 'Unknown City';
    }
  }
}