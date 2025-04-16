<template>
    <div v-if="message" class="error-message-box" role="alert">
        <p><strong>Error:</strong> {{ message }}</p>
        <!-- Optionally add an icon or close button -->
    </div>
</template>

<script setup lang="ts">
interface Props {
    message: string | null | undefined;
}

defineProps<Props>();
</script>

<style scoped>
.error-message-box {
    color: var(--error-text);
    background-color: var(--error-bg);
    border: 1px solid var(--error-border);
    padding: var(--spacing-md);
    border-radius: var(--radius-sm);
    margin: var(--spacing-lg) 0;
    text-align: center;
}

.error-message-box p {
    margin: 0;
}
</style>