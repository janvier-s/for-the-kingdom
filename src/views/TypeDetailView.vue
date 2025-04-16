// src/views/TypeDetailView.vue

<template>
  <div class="type-detail-view container">
    <header class="view-header">
      <BaseLoadingIndicator v-if="isLoadingType" message="Loading type details..." />
      <BaseErrorMessage v-if="isErrorType" :message="errorType?.message" />
      <h1 v-if="!isLoadingType && !isErrorType && typeName">{{ typeName }}</h1>
      <h1 v-if="!isLoadingType && !isErrorType && !typeName && !isLoadingType">Type Not Found</h1>
    </header>

    <main>
      <BaseLoadingIndicator v-if="isLoadingBooks" message="Loading books..." />
      <BaseErrorMessage v-if="isErrorBooks" :message="errorBooks?.message" />

      <div v-if="!isLoadingBooks && !isErrorBooks && books && books.length > 0" class="book-list">
        <router-link v-for="book in books" :key="book.book_id" :to="{
          name: 'book-detail',
          params: {
            testamentSlug: props.testamentSlug,
            typeSlug: props.typeSlug,
            bookSlug: book.slug
          },
        }" class="book-link list-item-link" v-prefetch="createBookPrefetchOptions(book.slug)">
          {{ book.title }}
        </router-link>
      </div>

      <p v-if="!isLoadingBooks && !isErrorBooks && books && books.length === 0" class="no-results">
        No books found listed under this type ({{ typeName }}).
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref, watch } from 'vue';
import { useTypeDetails, useBooksByType } from '@/composables/useBibleData';
import { createBookPrefetchOptions } from '@/utils/prefetchHelpers';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentSlug: string;
  typeSlug: string;
}
const props = defineProps<Props>();

console.log(`[TypeDetailView] Rendering with typeSlug: ${props.typeSlug}`);

const typeSlugRef = computed(() => props.typeSlug);

// Fetch Type Details
const {
  data: typeDetailsData,
  isLoading: isLoadingType,
  isError: isErrorType,
  error: errorType,
  status: typeStatus
} = useTypeDetails(typeSlugRef as Ref<string | undefined>);

// Log type details query results reactively
watch(typeStatus, (newStatus) => {
  console.log(`[TypeDetailView] Type Details Status: ${newStatus}`);
  if (newStatus === 'success') {
    console.log(`[TypeDetailView] Type Details Data:`, typeDetailsData.value);
  }
  if (newStatus === 'error') {
    console.error(`[TypeDetailView] Type Details Error:`, errorType.value?.message);
  }
});

// Recreate computed properties for type name and ID
const typeName = computed(() => typeDetailsData.value?.name ?? '');
const typeId = computed(() => typeDetailsData.value?.type_id ?? null);

// Fetch Books based on the computed typeId ref
const {
  data: books,
  isLoading: isLoadingBooks,
  isError: isErrorBooks,
  error: errorBooks,
  status: booksStatus,
  isFetching: isFetchingBooks
} = useBooksByType(typeId);

// Log the enabled state for the books query directly
const isBooksQueryEnabled = computed(() => typeof typeId.value === 'number');
watch(isBooksQueryEnabled, (enabled) => {
  console.log(`%c[TypeDetailView] Is Books Query Enabled?: ${enabled}`, 'color: red; font-weight: bold;');
}, { immediate: true });
</script>

<style scoped>
.type-detail-view {
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