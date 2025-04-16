<template>
  <div class="type-detail-view container">
    <header class="view-header">
      <BaseLoadingIndicator v-if="isLoadingType" message="Loading type details..." />
      <BaseErrorMessage :message="typeError" />
      <h1 v-if="!isLoadingType && !typeError && typeName">{{ typeName }}</h1>
      <h1 v-if="!isLoadingType && !typeError && !typeName">Type Not Found</h1>
    </header>

    <main v-if="typeId && !isLoadingType && !typeError">
      <h2>Books in this Category</h2>
      <BaseLoadingIndicator v-if="isLoadingBooks" message="Loading books..." />
      <BaseErrorMessage :message="booksError" />

      <ul v-if="!isLoadingBooks && !booksError && books.length > 0" class="book-list">
        <li v-for="book in books" :key="book.book_id">
          <router-link :to="{
            name: 'book-detail', // Use correct route name
            params: {
              // Pass slugs through for URL structure consistency
              testamentSlug: props.testamentSlug,
              typeSlug: props.typeSlug,
              bookSlug: book.slug,
            },
          }" class="list-item-link">
            {{ book.title }}
          </router-link>
        </li>
      </ul>
      <p v-if="!isLoadingBooks && !booksError && books.length === 0" class="no-results">
        No books found for this type in the selected language.
      </p>
    </main>
    <div v-else-if="!isLoadingType && !typeError">
      <p class="no-results">Could not determine type details to load books.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTypeDetails, useBooksByType } from '@/composables/useBibleData';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentSlug: string; // Passed through for linking back or context
  typeSlug: string;
}
const props = defineProps<Props>();

const typeSlugRef = computed(() => props.typeSlug);

// Fetch Type Details
const {
  isLoading: isLoadingType,
  error: typeError,
  typeName,
  typeId // Reactive ref containing the type ID
} = useTypeDetails(typeSlugRef);

// Fetch Books based on the fetched Type ID
const {
  data: books,
  isLoading: isLoadingBooks,
  error: booksError
} = useBooksByType(typeId); // Pass the reactive typeId ref here

</script>

<style scoped>
.type-detail-view {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

/* view-header styles from main.css */

main {
  margin-top: var(--spacing-lg);
}

main h2 {
  font-size: 1.3rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-weight: 500;
}

.book-list {
  list-style: none;
  padding: 0;
  margin: 0;
  /* Remove default ul margin */
}

.book-list li {
  /* list-item-link handles margin-bottom */
}

/* list-item-link styles from main.css */

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-xl);
  font-style: italic;
}
</style>