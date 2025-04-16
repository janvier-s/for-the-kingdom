<template>
  <div class="testament-type-list">
    <BaseLoadingIndicator v-if="isLoading" message="Loading types..." />
    <BaseErrorMessage :message="error" />

    <div v-if="!isLoading && !error && types.length > 0">
      <div v-if="!isLoading && !error && types.length > 0">
        <router-link v-for="type in types" :key="type.type_id" :to="{
          name: 'type-detail',
          params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
        }" class="type-link list-item-link" @mouseenter="prefetchTypeDetails(type.slug)"
          @focus="prefetchTypeDetails(type.slug)">
          {{ type.name }}
        </router-link>
      </div>

      <p v-if="!isLoading && !error && types.length === 0" class="no-results">
        No specific book types found listed under this testament.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useTestamentTypes } from '@/composables/useBibleData';
import { fetchTypeBySlug } from '@/services/apiService';
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

const queryClient = useQueryClient();


// --- Prefetching Function ---
const prefetchTypeDetails = (typeSlug: string) => {
  if (!typeSlug) return;
  // console.debug(`Prefetching type details for slug: ${typeSlug}`); // Optional
  queryClient.prefetchQuery({
    // IMPORTANT: Query key must EXACTLY match the one used in useTypeDetails
    queryKey: ['type_detail', typeSlug],
    queryFn: () => fetchTypeBySlug(typeSlug),
    staleTime: 60 * 1000, // 1 minute
  });
  // Note: Only prefetching type details (name, id). Books are fetched based on ID later.
};
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