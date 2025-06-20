<template>
    <div id="app-wrapper">
        <header class="app-header">
            <nav>
                <router-link :to="{ name: 'home' }">Home</router-link>
            </nav>
            <div class="auth-section">
                <BaseLoadingIndicator v-if="isAuthLoading" message="Auth..." />
                <BaseErrorMessage :message="authError" />
                <span v-if="isLoggedIn && user">Welcome, {{ user.email }}!</span>
                <button v-if="isLoggedIn" @click="handleSignOut">Sign Out</button>
            </div>
        </header>

        <main class="app-main">
            <router-view v-slot="{ Component, route }">
                <component :is="Component" :key="route.path" />
            </router-view>
        </main>

        <footer class="app-footer">
            <p>© {{ new Date().getFullYear() }} Bible App</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const {
    user,
    isLoggedIn,
    isLoading: isAuthLoading, // Renamed to avoid conflict if other loading states exist
    error: authError,
    signOut
} = useSupabaseAuth();

const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) {
        // Optionally navigate the user after sign out
        router.push({ name: 'home' });
        console.log('User signed out successfully.');
    } else {
        // Error is handled and displayed by the auth store/composable
        console.error('Sign out failed.');
    }
};

// Global error handling example (optional)
// import { onErrorCaptured } from 'vue';
// onErrorCaptured((err, instance, info) => {
//   console.error("Unhandled error captured in App.vue:", err, info);
//   // Send to logging service (Sentry, etc.)
//   // Display a generic error message to the user
//   // globalError.value = 'An unexpected error occurred.';
//   return false; // Prevent propagation if handled
// });

</script>

<style scoped>
#app-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--bg-primary);
}

.app-header {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-divider);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
}

.app-header nav {
    display: flex;
    gap: var(--spacing-md);
}

.app-header nav a {
    color: var(--text-link);
    text-decoration: none;
    font-weight: 500;
}

.app-header nav a:hover,
.app-header nav a.router-link-exact-active {
    color: var(--text-link-hover);
    text-decoration: underline;
}

.auth-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.auth-section button {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.85rem;
    border: 1px solid var(--border-primary);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.auth-section button:hover {
    background-color: var(--bg-tertiary);
}

.auth-section .loading-indicator,
.auth-section .error-message-box {
    padding: var(--spacing-xs);
    margin: 0;
    font-size: 0.8rem;
    border: none;
    background: none;
}

.auth-section .loading-indicator .spinner {
    width: 16px;
    height: 16px;
    border-width: 2px;
}


.app-main {
    flex-grow: 1;
}

.app-footer {
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: center;
    font-size: 0.85rem;
    color: var(--text-secondary);
    border-top: 1px solid var(--border-divider);
    background-color: var(--bg-secondary);
    margin-top: auto;
}

.app-footer p {
    margin: 0;
}
</style>