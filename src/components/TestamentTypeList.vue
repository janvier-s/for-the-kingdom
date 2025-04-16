<template>
  <div class="testament-type-list">
    <BaseLoadingIndicator v-if="isLoading" message="Loading types..." />
    <BaseErrorMessage :message="error" />

    <div v-if="!isLoading && !error && types.length > 0">
      <router-link v-for="type in types" :key="type.type_id" :to="{
        name: 'type-detail', // Use the correct route name
        params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
      }" class="type-link list-item-link">
        {{ type.name }}
      </router-link>
    </div>

    <p v-if="!isLoading && !error && types.length === 0" class="no-results">
      No specific book types found listed under this testament.
    </p>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useTestamentTypes } from '@/composables/useBibleData';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentId: number | null; // Allow null initially
  testamentSlug: string; // Needed for linking
}

const props = defineProps<Props>();

// Use toRef to pass a reactive reference to the composable
const testamentIdRef = toRef(props, 'testamentId');

const { data: types, isLoading, error } = useTestamentTypes(testamentIdRef);

</script>

<style scoped>
.testament-type-list {
  padding-top: var(--spacing-lg);
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-lg);
  font-style: italic;
}
</style>