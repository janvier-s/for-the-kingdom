<template>
  <div class="home-view container">
    <h1>Testaments de la Bible</h1>

    <BaseLoadingIndicator v-if="isLoading" message="Loading testaments..." />
    <BaseErrorMessage :message="error" />

    <section v-if="!isLoading && !error && testaments.length > 0" class="testament-sections">
      <!-- Use router-link for semantic navigation -->
      <router-link v-for="testament in testaments" :key="testament.testament_id"
        :to="{ name: 'testament-detail', params: { testamentSlug: testament.slug } }" class="testament-section-link"
        custom v-slot="{ navigate }">
        <div class="testament-section card" role="link" tabindex="0" @click="navigate" @keydown.enter="navigate"
          @keydown.space.prevent="navigate">
          <h2>{{ testament.name }}</h2>
        </div>
      </router-link>
    </section>

    <p v-if="!isLoading && !error && testaments.length === 0" class="no-results">
      No testaments found in the database for the selected language.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useTestaments } from '@/composables/useBibleData'; // <--- Import
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

console.log('!!!!!! [HomeView] <script setup> EXECUTING !!!!!!'); // <--- ADD THIS LOG

const { data: testaments, isLoading, error } = useTestaments(); // <--- Invocation

console.log('!!!!!! [HomeView] useTestaments() INVOKED !!!!!!'); // <--- ADD THIS LOG
console.log(`[HomeView] Initial state - isLoading: ${isLoading.value}, error: ${error.value}, testaments:`, testaments.value); // <--- ADD THIS LOG

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