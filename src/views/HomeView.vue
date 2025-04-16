<template>
  <div class="home-view container">
    <h1>Testaments de la Bible</h1>

    <BaseLoadingIndicator v-if="isLoading" message="Loading testaments..." />
    <BaseErrorMessage v-if="isError" :message="error?.message" />

    <section v-if="!isLoading && !isError && testaments && testaments.length > 0" class="testament-sections">
      <router-link v-for="testament in testaments" :key="testament.testament_id"
        :to="{ name: 'testament-detail', params: { testamentSlug: testament.slug } }" custom v-slot="{ navigate }">
        <div class="testament-section card" role="link" tabindex="0" @click="navigate" @keydown.enter="navigate"
          @keydown.space.prevent="navigate" v-prefetch="{
            queryKey: ['testament_detail', testament.slug],
            queryFn: () => fetchTestamentBySlug(testament.slug),
            staleTime: 60 * 1000
          }">
          <h2>{{ testament.name }}</h2>
        </div>
      </router-link>
    </section>

    <p v-if="!isLoading && !isError && testaments && testaments.length === 0" class="no-results">
      No testaments found in the database for the selected language.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useTestaments } from '@/composables/useBibleData';
import { fetchTestamentBySlug } from '@/services/apiService';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

// useQuery returns specific properties
const {
  data: testaments, // Access data via the 'data' ref
  isLoading,       // True during initial fetch when no data is cached yet
  isError,         // Boolean flag for error state
  error            // The actual error object (Ref<Error | null>)
  // isFetching,    // True during initial fetch AND background refetches (optional)
} = useTestaments();

</script>

<style scoped>
.home-view {
  padding-top: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
}

h1 {
  margin-bottom: var(--spacing-xl);
}

.testament-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.testament-section {
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
}

.testament-section:focus {
  outline: 2px solid var(--text-link);
  outline-offset: 2px;
}

.testament-section h2 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.4rem;
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-xl);
  font-style: italic;
}
</style>