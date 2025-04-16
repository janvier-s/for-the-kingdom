<template>
  <div class="testament-genre-list">
    <BaseLoadingIndicator v-if="isLoading" message="Loading genres..." />
    <BaseErrorMessage :message="error" />

    <div v-if="!isLoading && !error && genres.length > 0">
      <div v-if="!isLoading && !error && genres.length > 0">
        <router-link v-for="genre in genres" :key="genre.genre_id" :to="{
          name: 'genre-detail',
          params: { testamentSlug: props.testamentSlug, genreSlug: genre.slug },
        }" class="genre-link list-item-link" v-prefetch="{
          queryKey: ['genre_detail', genre.slug],
          queryFn: () => fetchGenreBySlug(genre.slug),
          staleTime: 60 * 1000
        }">
          {{ genre.name }}
        </router-link>
      </div>

      <p v-if="!isLoading && !error && genres.length === 0" class="no-results">
        No specific genres found listed under this testament.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useTestamentGenres } from '@/composables/useBibleData';
import { fetchGenreBySlug } from '@/services/apiService';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';

interface Props {
  testamentId: number | null; // Allow null initially
  testamentSlug: string; // Needed for linking
}

const props = defineProps<Props>();
const testamentIdRef = toRef(props, 'testamentId');
const { data: genres, isLoading, error } = useTestamentGenres(testamentIdRef);

</script>

<style scoped>
.testament-genre-list {
  padding-top: var(--spacing-lg);
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-lg);
  font-style: italic;
}
</style>