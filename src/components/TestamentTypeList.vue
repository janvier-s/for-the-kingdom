<template>
  <div class="testament-type-list">
    <BaseLoadingIndicator v-if="isLoading" message="Loading types..." />
    <BaseErrorMessage :message="error" />

    <div v-if="!isLoading && !error && types.length > 0">
      <div v-if="!isLoading && !error && types.length > 0">
        <router-link v-for="type in types" :key="type.type_id" :to="{
          name: 'type-detail',
          params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
        }" class="type-link list-item-link" v-prefetch="{
          queryKey: ['type_detail', type.slug],
          queryFn: () => fetchTypeBySlug(type.slug),
          staleTime: 60 * 1000
        }">
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
import { useTestamentTypes } from '@/composables/useBibleData';
import { fetchTypeBySlug } from '@/services/apiService';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentId: number | null; // Allow null initially
  testamentSlug: string; // Needed for linking
}

const props = defineProps<Props>();
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