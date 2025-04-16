// src/utils/prefetchHelpers.ts
import { inject } from 'vue'
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query'
import {
  fetchBookBySlug,
  fetchChaptersForBook,
  fetchAvailableVersions,
  fetchVersesForChapter, // <-- Import verse fetcher
} from '@/services/apiService'
import type { PrefetchOptions } from '@tanstack/vue-query'

interface PrefetchHelperResult extends PrefetchOptions {}

/**
 * Creates prefetch options for navigating to a Book Detail view.
 * It fetches the book details first, then uses the resulting book_id
 * to fetch the chapters list. Concurrently, it prefetches Bible versions.
 * Finally, it attempts to prefetch the verses for the *first chapter*
 * using a default version ID (assumed to be 1).
 *
 * @param bookSlug - The slug of the book to prefetch details for.
 * @returns An object containing queryKey, queryFn, and staleTime suitable for prefetch.
 */
export function createBookPrefetchOptions(bookSlug: string): PrefetchHelperResult {
  const primaryQueryKey = ['book_detail', bookSlug]
  const defaultVersionIdForPrefetch = 1 // Assume version 1 for verse prefetch

  const combinedQueryFn = async () => {
    const queryClient = inject<QueryClient>(VUE_QUERY_CLIENT)
    if (!queryClient) {
      console.warn('[Prefetch Helper] QueryClient not available.')
      return null
    }

    console.debug(`[Prefetch Helper] Running prefetch sequence for slug: ${bookSlug}`)
    try {
      // --- Step 1: Fetch Book Details (Need Result for book_id) ---
      const bookDetails = await queryClient.fetchQuery({
        queryKey: primaryQueryKey,
        queryFn: () => fetchBookBySlug(bookSlug),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      if (bookDetails?.book_id) {
        const bookId = bookDetails.book_id
        console.debug(
          `[Prefetch Helper]   Got bookId: ${bookId}. Fetching chapters & prefetching versions.`,
        )

        // --- Step 2a: Fetch Chapters (Need Result for first chapter_id) ---
        // Use fetchQuery as we need the result immediately for verse prefetch
        const chaptersPromise = queryClient.fetchQuery({
          queryKey: ['chapters', bookId],
          queryFn: () => fetchChaptersForBook(bookId),
          staleTime: 5 * 60 * 1000, // Keep chapters fresh too
        })

        // --- Step 2b: Prefetch Versions (Run concurrently) ---
        const versionsPromise = queryClient.prefetchQuery({
          queryKey: ['bible_versions'],
          queryFn: fetchAvailableVersions,
          staleTime: 10 * 60 * 1000,
        })

        // Wait for chapters to be fetched
        const chapters = await chaptersPromise

        // --- Step 3: Prefetch First Chapter Verses (If chapters loaded) ---
        if (chapters && chapters.length > 0) {
          const firstChapterId = chapters[0].chapter_id
          console.debug(
            `[Prefetch Helper]   Got first chapterId: ${firstChapterId}. Prefetching verses for default version ${defaultVersionIdForPrefetch}.`,
          )

          // Don't wait for this, just fire and forget
          queryClient
            .prefetchQuery({
              queryKey: ['verses', firstChapterId, defaultVersionIdForPrefetch], // Key matches useVerses
              queryFn: () => fetchVersesForChapter(firstChapterId, defaultVersionIdForPrefetch),
              staleTime: 1 * 60 * 1000, // Keep verses fresh for 1 minute
            })
            .catch((err) => {
              // Log verse prefetch errors but don't block anything
              console.warn(
                `[Prefetch Helper]   Verse prefetch failed (this might be ok):`,
                err.message,
              )
            })
        } else {
          console.debug(
            `[Prefetch Helper]   No chapters found or chapters failed to load, skipping verse prefetch.`,
          )
        }

        // Optional: Wait for versions prefetch if needed elsewhere, but not strictly necessary here
        await versionsPromise // Ensure versions are at least initiated
      } else {
        console.warn(
          `[Prefetch Helper]   Could not get book_id for slug ${bookSlug}, skipping secondary fetches.`,
        )
      }

      return bookDetails // Return primary data
    } catch (error) {
      console.error(`[Prefetch Helper] Error during prefetch sequence for slug ${bookSlug}:`, error)
      throw error
    }
  }

  return {
    queryKey: primaryQueryKey,
    queryFn: combinedQueryFn,
    staleTime: 60 * 1000, // Stale time for the overall prefetch action
  }
}
