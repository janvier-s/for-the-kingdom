//src/views/GenreDetailView.vue

<template>
  <div class="genre-detail-view container">
    <header class="view-header">
      <BaseLoadingIndicator v-if="isLoadingGenre" message="Loading genre details..." />
      <BaseErrorMessage v-if="isErrorGenre" :message="errorGenre?.message" />
      <h1 v-if="!isLoadingGenre && !isErrorGenre && genreName">{{ genreName }}</h1>
      <h1 v-if="!isLoadingGenre && !isErrorGenre && !genreName && !isLoadingGenre">Genre Not Found</h1>
    </header>

    <main>
      <BaseLoadingIndicator v-if="isLoadingBooks" message="Loading books..." />
      <BaseErrorMessage v-if="isErrorBooks" :message="errorBooks?.message" />

      <div v-if="!isLoadingBooks && !isErrorBooks && books && books.length > 0" class="book-list">
        <router-link v-for="book in books" :key="book.book_id" :to="{
          name: 'book-detail',
          params: {
            testamentSlug: props.testamentSlug,
            genreSlug: props.genreSlug,
            bookSlug: book.slug
          },
        }" class="book-link list-item-link" v-prefetch="createBookPrefetchOptions(book.slug)">
          {{ book.title }}
        </router-link>
      </div>

      <p v-if="!isLoadingBooks && !isErrorBooks && books && books.length === 0" class="no-results">
        No books found listed under this genre ({{ genreName }}).
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref, watch } from 'vue';
import { useGenreDetails, useBooksByGenre } from '@/composables/useBibleData';
import { createBookPrefetchOptions } from '@/utils/prefetchHelpers';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentSlug: string;
  genreSlug: string;
}
const props = defineProps<Props>();

console.log(`[GenreDetailView] Rendering with genreSlug: ${props.genreSlug}`);

const genreSlugRef = computed(() => props.genreSlug);

// Fetch Genre Details
const {
  data: genreDetailsData,
  isLoading: isLoadingGenre,
  isError: isErrorGenre,
  error: errorGenre,
  status: genreStatus
} = useGenreDetails(genreSlugRef as Ref<string | undefined>);

// Log genre details query results reactively
watch(genreStatus, (newStatus) => {
  console.log(`[GenreDetailView] Genre Details Status: ${newStatus}`);
  if (newStatus === 'success') {
    console.log(`[GenreDetailView] Genre Details Data:`, genreDetailsData.value);
  }
  if (newStatus === 'error') {
    console.error(`[GenreDetailView] Genre Details Error:`, errorGenre.value?.message);
  }
});

// Recreate computed properties for genre name and ID
const genreName = computed(() => genreDetailsData.value?.name ?? '');
const genreId = computed(() => genreDetailsData.value?.genre_id ?? null);

// Fetch Books based on the computed genreId ref
const {
  data: books,
  isLoading: isLoadingBooks,
  isError: isErrorBooks,
  error: errorBooks,
  status: booksStatus,
  isFetching: isFetchingBooks
} = useBooksByGenre(genreId);

// Log the enabled state for the books query directly
const isBooksQueryEnabled = computed(() => typeof genreId.value === 'number');
watch(isBooksQueryEnabled, (enabled) => {
  console.log(`%c[GenreDetailView] Is Books Query Enabled?: ${enabled}`, 'color: red; font-weight: bold;');
}, { immediate: true });
</script>

<style scoped>
.genre-detail-view {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

main {
  margin-top: var(--spacing-lg);
}

.book-list {
  margin-top: var(--spacing-md);
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-xl);
  font-style: italic;
}
</style>