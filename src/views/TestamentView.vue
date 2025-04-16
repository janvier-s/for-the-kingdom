<template>
  <div class="testament-view container">
    <header class="view-header">
      <BaseLoadingIndicator v-if="isLoading" message="Loading Testament..." />
      <BaseErrorMessage v-if="isError" :message="error?.message" />
      <h1 v-if="!isLoading && !isError && testamentName">{{ testamentName }}</h1>
      <h1 v-if="!isLoading && !isError && !testamentName">Testament Not Found</h1>
    </header>

    <main>
      <TestamentTypeList v-if="!isLoading && !isError && testamentId && props.testamentSlug" :testament-id="testamentId"
        :testament-slug="props.testamentSlug" />
      <p v-if="!isLoading && !isError && !testamentId" class="no-results">
        Could not load details for this testament.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref } from 'vue';
// No longer need useRoute if slug comes from props
import { useTestamentDetails } from '@/composables/useBibleData';
import TestamentTypeList from '@/components/TestamentTypeList.vue';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentSlug: string;
}
const props = defineProps<Props>();

// Use computed for reactive prop access passed to useQuery key
const slugRef = computed(() => props.testamentSlug);

// Get Vue Query result object
const {
  data: testamentDetails, // The raw data object { name, testament_id } | null
  isLoading,
  isError,
  error
} = useTestamentDetails(slugRef as Ref<string | undefined>); // Cast needed if prop isn't optional

// Recreate computed properties based on the data returned by useQuery
const testamentName = computed(() => testamentDetails.value?.name ?? '');
const testamentId = computed(() => testamentDetails.value?.testament_id ?? null);

</script>

<style scoped>
.testament-view {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

main {
  margin-top: var(--spacing-lg);
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-xl);
  font-style: italic;
}
</style>