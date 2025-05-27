// src/utils/prefetchHelpers.ts
// This needs significant updates due to changes in how chapters/verses are fetched

import { inject } from 'vue'
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query'
import * as apiService from '@/_archive/services/apiService' // Import the updated service
import type { PrefetchOptions } from '@tanstack/vue-query'
import type { BaseVerse, Version } from '@/_archive/types' // Import updated types

// Helper to find version code, defaulting to ID 1 if available
function getDefaultVersionCode(versions: Version[] | null | undefined): string | null {
  if (!versions || versions.length === 0) return null
  // Assuming version ID 1 is the default/preferred (e.g., Vulgata Latina)
  const defaultVersion = versions.find((v) => v.id === 1) || versions[0]
  return defaultVersion.abbr // Use the abbreviation as the code
}

/**
 * Creates prefetch options for navigating to a Book Detail view.
 * Prefetches book details, versions, first chapter number, first chapter base verses,
 * and the Catechism links for the first chapter's verses.
 *
 * @param bookSlug - The slug of the book to prefetch details for.
 * @returns An object containing queryKey, queryFn, and staleTime suitable for prefetch.
 */
export function createBookPrefetchOptions(bookSlug: string): PrefetchOptions {
  const primaryQueryKey = ['book_detail', bookSlug]

  const combinedQueryFn = async () => {
    const queryClient = inject<QueryClient>(VUE_QUERY_CLIENT)
    if (!queryClient) {
      console.warn('[Prefetch Helper] QueryClient not available.')
      return null // Cannot proceed without client
    }

    console.debug(`[Prefetch Helper] Running prefetch sequence for slug: ${bookSlug}`)
    try {
      // Prefetch Versions first, as we need the code
      const versions = await queryClient.fetchQuery<Version[]>({
        queryKey: ['bible_versions'],
        queryFn: apiService.fetchAvailableVersions,
        staleTime: 10 * 60 * 1000,
      })

      const defaultVersionCode = getDefaultVersionCode(versions)
      if (!defaultVersionCode) {
        console.warn(
          `[Prefetch Helper] Could not determine default version code, stopping prefetch.`,
        )
        return null
      }
      // Use default Version ID 1 for verse prefetch target
      const defaultVersionId = versions?.find((v) => v.abbr === defaultVersionCode)?.id ?? null
      if (!defaultVersionId) {
        console.warn(`[Prefetch Helper] Could not determine default version ID, stopping prefetch.`)
        return null
      }

      // Step 1: Book Details (provides book_id and cleaned_book_label)
      const bookDetails = await queryClient.fetchQuery({
        queryKey: primaryQueryKey,
        queryFn: () => apiService.fetchBookBySlug(bookSlug), // Returns { book_id, title, cleaned_book_label }
        staleTime: 5 * 60 * 1000,
      })

      if (bookDetails?.book_id && bookDetails?.cleaned_book_label) {
        const bookId = bookDetails.book_id
        const bookLabel = bookDetails.cleaned_book_label

        // Step 2: Fetch Chapter Numbers
        const chapterNumbers = await queryClient.fetchQuery({
          queryKey: ['chapter_numbers', bookId, bookLabel, defaultVersionCode],
          queryFn: () => apiService.fetchChaptersForBook(bookId, bookLabel, defaultVersionCode),
          staleTime: 10 * 60 * 1000,
        })

        if (chapterNumbers && chapterNumbers.length > 0) {
          const firstChapterNumber = chapterNumbers[0]

          // Step 3: Prefetch Base Verses for the first chapter
          const firstChapterVerses = await queryClient.fetchQuery<BaseVerse[]>({
            queryKey: ['verseText', bookLabel, firstChapterNumber, defaultVersionCode],
            queryFn: () =>
              apiService.fetchVersesForChapter(bookLabel, firstChapterNumber, defaultVersionCode),
            staleTime: 5 * 60 * 1000,
          })

          // Step 4: If verses were fetched, prefetch their CCC Links
          if (firstChapterVerses && firstChapterVerses.length > 0) {
            const verseIds = firstChapterVerses.map((v) => v.id) // Use the new 'id' field
            console.debug(
              `[Prefetch Helper]   Prefetching CCC links via RPC for ${verseIds.length} verses from Ch ${firstChapterNumber}.`,
            )
            await queryClient
              .prefetchQuery({
                // Ensure key matches the one used in useCatechismLinksForVerses
                queryKey: ['cccLinks', verseIds.sort((a, b) => a - b).join(',')],
                queryFn: () => apiService.fetchCatechismLinksViaRpc(verseIds),
                staleTime: 5 * 60 * 1000,
              })
              .catch((err) => {
                console.warn(`[Prefetch Helper]   CCC links prefetch failed:`, err?.message ?? err)
              })
          } else {
            console.debug(
              `[Prefetch Helper]   No verses found for Ch ${firstChapterNumber}, skipping CCC link prefetch.`,
            )
          }
        } else {
          console.debug(
            `[Prefetch Helper]   No chapters found for book ${bookLabel}, skipping verse/link prefetch.`,
          )
        }
      } else {
        console.warn(
          `[Prefetch Helper] Could not get book_id/label for slug ${bookSlug}, skipping secondary fetches.`,
        )
      }
      return bookDetails // Return primary data
    } catch (error: any) {
      console.error(
        `[Prefetch Helper] Error during prefetch sequence for slug ${bookSlug}:`,
        error?.message ?? error,
      )
      throw error // Re-throw
    }
  }

  return {
    queryKey: primaryQueryKey,
    queryFn: combinedQueryFn,
    staleTime: 60 * 1000, // Stale time for the combined operation trigger
  }
}
