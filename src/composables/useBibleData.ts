// src/composables/useBibleData.ts
/**
 * @file Composable functions for fetching and managing Bible-related data state using Vue Query.
 * Adapted for the refactored schema.
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
  BaseVerse,
} from '@/types'

export type { TestamentTranslation, GenreTranslation, BookSummary, Version, Verse, BaseVerse }

// --- Testament Queries (Largely Unchanged Semantically) ---

export function useTestaments() {
  return useQuery({
    queryKey: ['testaments'],
    queryFn: apiService.fetchTestaments,
    // staleTime: 5 * 60 * 1000, // Example
  })
}

export function useTestamentDetails(testamentSlugRef: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['testament_detail', testamentSlugRef],
    queryFn: () => {
      const slug = testamentSlugRef.value
      if (!slug) {
        throw new Error('Testament slug is required but missing.')
      }
      return apiService.fetchTestamentBySlug(slug)
    },
    enabled: computed(() => !!testamentSlugRef.value),
  })
}

// --- Genre Queries (Largely Unchanged Semantically) ---

export function useTestamentGenres(testamentIdRef: Ref<number | null>) {
  return useQuery({
    queryKey: ['testament_genres', testamentIdRef],
    queryFn: () => {
      const id = testamentIdRef.value
      if (id === null) {
        throw new Error('Testament ID is required but missing.')
      }
      return apiService.fetchGenresForTestament(id)
    },
    enabled: computed(() => typeof testamentIdRef.value === 'number'),
  })
}

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

// --- Book Queries (Updated Service Calls) ---

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

// --- Version Query (Updated Service Call) ---

export function useBibleVersions() {
  return useQuery({
    queryKey: ['bible_versions'],
    queryFn: apiService.fetchAvailableVersions,
  })
}

// --- Chapter Query (NEW LOGIC) ---

/**
 * Fetches chapter numbers for a given book ID, book label, and version code.
 * @param bookIdRef - Ref containing the book ID (bible_books.id).
 * @param bookLabelRef - Ref containing the cleaned book label (for ltree path).
 * @param versionCodeRef - Ref containing the version code (for ltree path).
 * @returns Vue Query result object for chapter numbers (number[]).
 */
export function useChapterNumbers(
  bookIdRef: Ref<number | null>,
  bookLabelRef: Ref<string | null>,
  versionCodeRef: Ref<string | null>,
) {
  return useQuery({
    queryKey: ['chapter_numbers', bookIdRef, bookLabelRef, versionCodeRef],
    queryFn: () => {
      const bookId = bookIdRef.value
      const bookLabel = bookLabelRef.value
      const versionCode = versionCodeRef.value

      if (bookId === null || bookLabel === null || versionCode === null) {
        throw new Error('Book ID, Book Label, and Version Code are required for fetching chapters.')
      }
      // Calls the NEW service function
      return apiService.fetchChaptersForBook(bookId, bookLabel, versionCode)
    },
    enabled: computed(
      () =>
        typeof bookIdRef.value === 'number' &&
        bookLabelRef.value !== null &&
        versionCodeRef.value !== null,
    ),
    staleTime: 10 * 60 * 1000,
  })
}

// --- Verse & Link Queries ---

/**
 * Fetches base verses (text, number, ID, path) for a given chapter using ltree path components.
 * Does NOT fetch linked sources initially.
 *
 * @param bookLabelRef - Ref containing the cleaned book label (e.g., 'gen').
 * @param chapterNumberRef - Ref containing the chapter number.
 * @param versionCodeRef - Ref containing the version code (e.g., 'vul').
 * @returns Vue Query result object for base verses.
 * @see useCatechismLinksForVerses for fetching linked CCC paragraph numbers.
 */
export function useVerseText(
  bookLabelRef: Ref<string | null>,
  chapterNumberRef: Ref<number | null>,
  versionCodeRef: Ref<string | null>,
) {
  return useQuery({
    queryKey: ['verseText', bookLabelRef, chapterNumberRef, versionCodeRef],
    queryFn: async (): Promise<BaseVerse[]> => {
      const bookLabel = bookLabelRef.value
      const chapterNumber = chapterNumberRef.value
      const versionCode = versionCodeRef.value

      if (bookLabel === null || chapterNumber === null || versionCode === null) {
        throw new Error(
          'Book Label, Chapter Number, and Version Code are required for fetching verses.',
        )
      }

      console.debug(
        `[useVerseText queryFn] Fetching verses for ${bookLabel} Ch ${chapterNumber}, Version ${versionCode}`,
      )
      const versesData = await apiService.fetchVersesForChapter(
        bookLabel,
        chapterNumber,
        versionCode,
      )
      console.debug(`[useVerseText queryFn] Fetched ${versesData.length} base verses.`)
      return versesData
    },
    enabled: computed(
      () =>
        bookLabelRef.value !== null &&
        typeof chapterNumberRef.value === 'number' &&
        versionCodeRef.value !== null,
    ),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetches Catechism paragraph numbers (ccc_num/sort_order) linked to a given set of verse IDs (core_unit.id).
 * Uses the RPC function 'get_ccc_nums_for_verse_ids'.
 *
 * @param verseIdsRef - A Ref containing an array of verse IDs (core_unit.id), or undefined/null.
 * @returns Vue Query result object containing a Map<verse_id, ccc_num[]>.
 */
export function useCatechismLinksForVerses(verseIdsRef: Ref<number[] | undefined | null>) {
  return useQuery({
    queryKey: [
      'cccLinks',
      computed(() => verseIdsRef.value?.sort((a, b) => a - b).join(',') ?? ''),
    ],
    queryFn: async (): Promise<Map<number, number[]>> => {
      const verseIds = verseIdsRef.value

      if (!verseIds || verseIds.length === 0) {
        console.debug(
          '[useCatechismLinksForVerses queryFn] No verse IDs provided, returning empty map.',
        )
        return new Map()
      }

      console.debug(
        `[useCatechismLinksForVerses queryFn] Fetching CCC links via RPC for ${verseIds.length} verse IDs.`,
      )
      const indexMap = await apiService.fetchCatechismLinksViaRpc(verseIds)
      console.debug(
        `[useCatechismLinksForVerses queryFn] Fetched CCC links via RPC. Found links for ${indexMap.size} verses.`,
      )
      return indexMap
    },
    enabled: computed(() => !!verseIdsRef.value && verseIdsRef.value.length > 0),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
