<template>
  <div class="testament-view container">
    <header class="view-header">
      <BaseLoadingIndicator v-if="isLoading" message="Loading Testament..." />
      <BaseErrorMessage :message="error" />
      <h1 v-if="!isLoading && !error && testamentName">{{ testamentName }}</h1>
      <h1 v-if="!isLoading && !error && !testamentName">Testament Not Found</h1>
    </header>

    <main>
      <TestamentTypeList v-if="testamentId && props.testamentSlug" :testament-id="testamentId"
        :testament-slug="props.testamentSlug" />
      <p v-if="!isLoading && !error && !testamentId" class="no-results">
        Could not load details for this testament.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTestamentDetails } from '@/composables/useBibleData';
import TestamentTypeList from '@/components/TestamentTypeList.vue';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentSlug: string;
}
const props = defineProps<Props>();

// Use computed for reactive prop access
const slugRef = computed(() => props.testamentSlug);

const {
  data: testamentDetails,
  isLoading,
  error,
  testamentName,
  testamentId
} = useTestamentDetails(slugRef);

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