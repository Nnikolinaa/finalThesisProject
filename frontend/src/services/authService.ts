// src/services/authService.ts
import { ref, watch } from "vue";
import type { AuthModel } from "@/models/auth.model"; // Ensure AuthModel has access, refresh, name, userId

// Key for localStorage
const AUTH_STORAGE_KEY = 'authData';

// Reactive state to hold authentication data
const authData = ref<AuthModel | null>(null);

// Initialize authData from localStorage on application startup
const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
if (storedAuth) {
    try {
        authData.value = JSON.parse(storedAuth);
    } catch (e) {
        console.error('Failed to parse auth data from localStorage, clearing it:', e);
        localStorage.removeItem(AUTH_STORAGE_KEY); // Clear corrupted data
    }
}

// Watch for changes in authData and persist them to localStorage
// This ensures that whenever authData is updated, it's saved.
watch(authData, (newValue) => {
    if (newValue) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newValue));
    } else {
        localStorage.removeItem(AUTH_STORAGE_KEY); // Remove from storage if logged out
    }
}, { deep: true }); // Use deep watch for nested changes if AuthModel becomes complex

export class AuthService {
    // Reactive state for authentication status, derived from authData
    static isAuthenticated = ref(!!authData.value);

    /**
     * Stores new authentication data and updates reactive states.
     * @param model The AuthModel containing access, refresh tokens, name, and userId.
     */
    static createAuth(model: AuthModel) {
        authData.value = model; // Set the new model
        this.isAuthenticated.value = true; // Update authentication status
    }

    /**
     * Retrieves the current access token.
     * @returns The access token string or null if not authenticated.
     */
    static getAccessToken(): string | null {
        return authData.value?.access || null;
    }

    /**
     * Retrieves the current refresh token.
     * @returns The refresh token string or null if not authenticated.
     */
    static getRefreshToken(): string | null {
        return authData.value?.refresh || null;
    }

    /**
     * Retrieves the user's display name.
     * @returns The user's name string or null if not authenticated.
     */
    static getUserName(): string | null {
        return authData.value?.name || null;
    }

    /**
     * Retrieves the user's ID.
     * @returns The user's ID number or null if not authenticated.
     */
    static getUserId(): number | null {
        return authData.value?.userId || null;
    }

    /**
     * Updates the access and refresh tokens after a successful token refresh.
     * @param newAccess The new access token.
     * @param newRefresh The new refresh token.
     */
    static updateTokens(newAccess: string, newRefresh: string) {
        if (authData.value) {
            authData.value.access = newAccess;
            authData.value.refresh = newRefresh;
        }
    }

    /**
     * Clears all authentication data and sets isAuthenticated to false.
     */
    static removeAuth() {
        authData.value = null; // Clear the reactive state
        this.isAuthenticated.value = false; // Update authentication status
        // localStorage.removeItem(AUTH_STORAGE_KEY) is handled by the watch effect
    }
}