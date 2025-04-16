/**
 * @file Composable functions for fetching and managing Bible-related data state using Vue Query.
 */
import { type Ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import * as apiService from '@/services/apiService'
import type {
  TestamentTranslation,
  GenreTranslation,
  BookSummary,
  Chapter,
  Version,
  Verse,
} from '@/types'

/**
 * Fetches and manages the list of testaments.
 * @returns Vue Query result object for testaments.
 */
export function useTestaments() {
  return useQuery({
    queryKey: ['testaments'], // Unique key for this query
    queryFn: apiService.fetchTestaments, // The function that fetches data
    // staleTime is likely set globally in main.ts, but can override here
    // staleTime: 5 * 60 * 1000,
  })
  // Returns { data, isLoading, isFetching, isError, error, refetch, status, ... }
}

/**
 * Fetches and manages details for a specific testament based on its slug.
 * @param testamentSlugRef - A Ref containing the testament slug.
 * @returns Vue Query result object for testament details.
 */
export function useTestamentDetails(testamentSlugRef: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['testament_detail', testamentSlugRef], // Key includes dependency
    queryFn: () => {
      const slug = testamentSlugRef.value
      if (!slug) {
        // Returning undefined or null usually prevents the queryFn from running if enabled is false
        // Or throw to indicate an invalid state if enabled is true
        throw new Error('Testament slug is required but missing.')
        // return Promise.resolve(null); // Or return null/empty if preferred when disabled
      }
      return apiService.fetchTestamentBySlug(slug)
    },
    // Only run the query if the slug exists
    enabled: computed(() => !!testamentSlugRef.value),
  })
}

/**
 * Fetches and manages the list of book genres for a given testament ID.
 * @param testamentIdRef - A Ref containing the testament ID.
 * @returns Vue Query result object for testament genres.
 */
export function useTestamentGenres(testamentIdRef: Ref<number | null>) {
  return useQuery({
    queryKey: ['testament_genres', testamentIdRef], // Key includes dependency
    queryFn: () => {
      const id = testamentIdRef.value
      if (id === null) {
        // Query function should ideally not run if ID is null due to `enabled` option
        // Throwing here ensures error state if it runs unexpectedly
        throw new Error('Testament ID is required but missing.')
        // return Promise.resolve([]); // Or return empty array
      }
      return apiService.fetchGenresForTestament(id)
    },
    // Only run the query if the ID is a valid number
    enabled: computed(() => typeof testamentIdRef.value === 'number'),
  })
}

/**
 * Fetches and manages details for a specific genre based on its slug.
 * @param genreSlugRef - A Ref containing the genre slug.
 * @returns Vue Query result object for genre details.
 */
export function useGenreDetails(genreSlugRef: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['genre_detail', genreSlugRef],
    queryFn: () => {
      const slug = genreSlugRef.value
      if (!slug) {
        throw new Error('Genre slug is required but missing.')
      }
      return apiService.fetchGenreBySlug(slug)
    },
    enabled: computed(() => !!genreSlugRef.value),
  })
}

/**
 * Fetches and manages the list of books for a given genre ID.
 * @param genreIdRef - A Ref containing the genre ID.
 * @returns Vue Query result object for books.
 */
export function useBooksByGenre(genreIdRef: Ref<number | null>) {
  return useQuery({
    queryKey: ['books_by_genre', genreIdRef],
    queryFn: () => {
      const id = genreIdRef.value
      if (id === null) {
        throw new Error('Genre ID is required but missing.')
      }
      return apiService.fetchBooksByGenre(id)
    },
    enabled: computed(() => typeof genreIdRef.value === 'number'),
  })
}

/**
 * Fetches and manages details for a specific book based on its slug.
 * @param bookSlugRef - A Ref containing the book slug.
 * @returns Vue Query result object for book details.
 */
export function useBookDetails(bookSlugRef: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['book_detail', bookSlugRef],
    queryFn: () => {
      const slug = bookSlugRef.value
      if (!slug) {
        throw new Error('Book slug is required but missing.')
      }
      return apiService.fetchBookBySlug(slug)
    },
    enabled: computed(() => !!bookSlugRef.value),
  })
}

/**
 * Fetches and manages the list of available Bible versions.
 * @returns Vue Query result object for versions.
 */
export function useBibleVersions() {
  return useQuery({
    queryKey: ['bible_versions'],
    queryFn: apiService.fetchAvailableVersions,
  })
}

/**
 * Fetches and manages the list of chapters for a given book ID.
 * @param bookIdRef - A Ref containing the book ID.
 * @returns Vue Query result object for chapters.
 */
export function useChapters(bookIdRef: Ref<number | null>) {
  return useQuery({
    queryKey: ['chapters', bookIdRef],
    queryFn: () => {
      const id = bookIdRef.value
      if (id === null) {
        throw new Error('Book ID is required but missing.')
      }
      return apiService.fetchChaptersForBook(id)
    },
    enabled: computed(() => typeof bookIdRef.value === 'number'),
  })
}

/**
 * Fetches and manages the list of verses for a given chapter and version ID.
 * @param chapterIdRef - A Ref containing the chapter ID.
 * @param versionIdRef - A Ref containing the version ID.
 * @returns Vue Query result object for verses.
 */
export function useVerses(chapterIdRef: Ref<number | null>, versionIdRef: Ref<number | null>) {
  return useQuery({
    // Key includes both dependencies
    queryKey: ['verses', chapterIdRef, versionIdRef],
    queryFn: () => {
      const chapterId = chapterIdRef.value
      const versionId = versionIdRef.value
      if (chapterId === null || versionId === null) {
        throw new Error('Chapter ID and Version ID are required but missing.')
      }
      return apiService.fetchVersesForChapter(chapterId, versionId)
    },
    // Only run the query if both IDs are valid numbers
    enabled: computed(
      () => typeof chapterIdRef.value === 'number' && typeof versionIdRef.value === 'number',
    ),
  })
}
