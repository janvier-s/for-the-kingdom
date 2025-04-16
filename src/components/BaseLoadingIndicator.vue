<template>
    <div class="loading-indicator" role="status" aria-live="polite">
        <p>{{ message }}</p>
        <!-- Add a spinner or animation here if desired -->
        <div class="spinner"></div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    message?: string;
}

withDefaults(defineProps<Props>(), {
    message: 'Loading...',
});
</script>

<style scoped>
.loading-indicator {
    text-align: center;
    color: var(--text-secondary);
    padding: var(--spacing-xl) var(--spacing-md);
    font-style: italic;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
}

/* Basic Spinner Example */
.spinner {
    border: 4px solid var(--bg-secondary);
    border-top: 4px solid var(--text-link);
    border-radius: 50%;
    width: 30px;
    height: 30px;
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
</style>