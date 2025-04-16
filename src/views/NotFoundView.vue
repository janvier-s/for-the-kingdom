<template>
    <div class="not-found-view container">
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
        <router-link :to="{ name: 'home' }">Go to Home</router-link>
    </div>
</template>

<script setup lang="ts">
// No script logic needed for a simple not found page
</script>

<style scoped>
.not-found-view {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-lg);
}

.not-found-view h1 {
    color: var(--error-text);
    margin-bottom: var(--spacing-md);
}

.not-found-view p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
}
</style>