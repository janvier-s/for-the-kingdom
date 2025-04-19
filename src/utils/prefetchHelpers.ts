// src/utils/prefetchHelpers.ts
import { inject } from 'vue'
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query'
import {
  fetchBookBySlug,
  fetchChaptersForBook,
  fetchAvailableVersions,
  fetchVersesForChapter,
  fetchCatechismIndexForVerseIds,
  fetchCatechismLinksViaRpc,
} from '@/services/apiService'
import type { PrefetchOptions } from '@tanstack/vue-query'
import type { BaseVerse } from '@/types' // Import BaseVerse if needed

interface PrefetchHelperResult extends PrefetchOptions {}

/**
 * Creates prefetch options for navigating to a Book Detail view.
 * Prefetches book details, chapters, versions, first chapter base verses,
 * and the Catechism index for the first chapter's verses.
 *
 * @param bookSlug - The slug of the book to prefetch details for.
 * @returns An object containing queryKey, queryFn, and staleTime suitable for prefetch.
 */
export function createBookPrefetchOptions(bookSlug: string): PrefetchHelperResult {
  const primaryQueryKey = ['book_detail', bookSlug]
  const defaultVersionIdForPrefetch = 1

  const combinedQueryFn = async () => {
    const queryClient = inject<QueryClient>(VUE_QUERY_CLIENT)
    if (!queryClient) {
      console.warn('[Prefetch Helper] QueryClient not available.')
      return null
    }

    console.debug(`[Prefetch Helper] Running prefetch sequence for slug: ${bookSlug}`)
    try {
      // Step 1: Book Details
      const bookDetails = await queryClient.fetchQuery({
        queryKey: primaryQueryKey,
        queryFn: () => fetchBookBySlug(bookSlug),
        staleTime: 5 * 60 * 1000,
      })

      if (bookDetails?.book_id) {
        const bookId = bookDetails.book_id
        // Step 2a: Chapters
        const chaptersPromise = queryClient.fetchQuery({
          queryKey: ['chapters', bookId],
          queryFn: () => fetchChaptersForBook(bookId),
          staleTime: 5 * 60 * 1000,
        })
        // Step 2b: Versions
        const versionsPromise = queryClient.prefetchQuery({
          queryKey: ['bible_versions'],
          queryFn: fetchAvailableVersions,
          staleTime: 10 * 60 * 1000,
        })

        const chapters = await chaptersPromise

        if (chapters && chapters.length > 0) {
          const firstChapterId = chapters[0].chapter_id

          // Step 3a: Prefetch Base Verses for the first chapter
          // Use fetchQuery because we need the result (verse IDs) for the next step
          const firstChapterVersesPromise = queryClient.fetchQuery({
            queryKey: ['verseText', firstChapterId, defaultVersionIdForPrefetch],
            queryFn: () => fetchVersesForChapter(firstChapterId, defaultVersionIdForPrefetch),
            staleTime: 1 * 60 * 1000,
          })

          // Step 3b: Prefetch CCC Links via RPC
          firstChapterVersesPromise
            .then((baseVerses: BaseVerse[] | undefined) => {
              if (baseVerses && baseVerses.length > 0) {
                const verseIds = baseVerses.map((v) => v.verse_id)
                console.debug(
                  `[Prefetch Helper]   Prefetching CCC links via RPC for ${verseIds.length} verses.`,
                )
                queryClient
                  .prefetchQuery({
                    queryKey: ['cccLinks', verseIds.join(',')],
                    queryFn: () => apiService.fetchCatechismLinksViaRpc(verseIds),
                    staleTime: 5 * 60 * 1000,
                  })
                  .catch((err) => {
                    console.warn(`[Prefetch Helper]   CCC links prefetch failed:`, err.message)
                  })
              }
            })
            .catch((err) => {
              console.warn(
                `[Prefetch Helper]   Base verse prefetch failed (needed for links):`,
                err.message,
              )
            })
        } else {
          console.debug(`[Prefetch Helper]   No chapters found, skipping verse/link prefetch.`)
        }
        await versionsPromise
      } else {
        console.warn(
          `[Prefetch Helper]   Could not get book_id for slug ${bookSlug}, skipping secondary fetches.`,
        )
      }
      return bookDetails
    } catch (error) {
      console.error(`[Prefetch Helper] Error during prefetch sequence for slug ${bookSlug}:`, error)
      throw error
    }
  }

  return {
    queryKey: primaryQueryKey,
    queryFn: combinedQueryFn,
    staleTime: 60 * 1000,
  }
}
