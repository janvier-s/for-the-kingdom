/**
 * @file Composable functions for fetching and managing Bible-related data state.
 * These composables utilize the apiService for data fetching and provide reactive state.
 */
import { ref, watch, shallowRef, computed, type Ref, type ComputedRef } from 'vue'
import * as apiService from '@/services/apiService'
import type {
  TestamentTranslation,
  TypeTranslation,
  BookSummary,
  Chapter,
  Version,
  Verse,
} from '@/types'

// --- Helper for creating generic data fetching composable ---

interface UseDataFetcherOptions<T> {
  fetcher: (...args: any[]) => Promise<T>
  initialDataValue: T
  watchSource?: Ref<any> | Ref<any>[] // Source(s) to watch for refetching
  autoFetch?: boolean // Fetch immediately on creation
}

interface UseDataFetcherReturn<T> {
  data: Ref<T>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  fetchData: (...args: any[]) => Promise<void>
}

function useDataFetcher<T>(options: UseDataFetcherOptions<T>): UseDataFetcherReturn<T> {
  const data = shallowRef<T>(options.initialDataValue) // Use shallowRef for arrays/objects
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchData = async (...args: any[]) => {
    // Prevent fetching if already loading or if required args are missing (basic check)
    if (isLoading.value || args.some((arg) => arg === undefined || arg === null)) {
      if (args.some((arg) => arg === undefined || arg === null)) {
        console.warn('Fetch aborted: Missing required arguments.', args)
        // Optionally set an error or reset state here
        // error.value = "Required information missing to fetch data.";
        // data.value = options.initialDataValue;
      }
      return
    }

    isLoading.value = true
    error.value = null
    console.debug(`Fetching data with args:`, args)

    try {
      const result = await options.fetcher(...args)
      data.value = result
      console.debug(`Fetch successful.`)
    } catch (err) {
      console.error('Error during data fetch:', err)
      error.value = err instanceof Error ? err.message : 'An unknown error occurred.'
      data.value = options.initialDataValue // Reset data on error
    } finally {
      isLoading.value = false
    }
  }

  if (options.watchSource) {
    watch(
      options.watchSource,
      (newArgs, oldArgs) => {
        // Ensure args are treated as an array even if a single ref is passed
        const argsArray = Array.isArray(newArgs) ? newArgs : [newArgs]
        // Only fetch if the relevant args have actually changed and are valid
        if (argsArray.every((arg) => arg !== undefined && arg !== null)) {
          console.debug('Watched source changed, refetching...', argsArray)
          fetchData(...argsArray)
        } else {
          console.debug('Watched source changed, but args invalid, clearing data.', argsArray)
          // Reset state if args become invalid
          data.value = options.initialDataValue
          error.value = null // Clear previous errors
          isLoading.value = false
        }
      },
      { immediate: options.autoFetch ?? true }, // Fetch immediately if autoFetch is true
    )
  } else if (options.autoFetch) {
    fetchData() // Initial fetch if autoFetch and no watchSource
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
  }
}

// --- Specific Data Composables ---

/**
 * Fetches and manages the list of testaments.
 * @returns Reactive state for testaments, loading status, and errors.
 */
export function useTestaments() {
  return useDataFetcher<TestamentTranslation[]>({
    fetcher: apiService.fetchTestaments,
    initialDataValue: [],
    autoFetch: true, // Fetch immediately on component mount
  })
}

/**
 * Fetches and manages details for a specific testament based on its slug.
 * @param testamentSlugRef - A Ref containing the testament slug.
 * @returns Reactive state for testament details, loading status, and errors.
 */
export function useTestamentDetails(testamentSlugRef: Ref<string | undefined>) {
  const details = useDataFetcher<Pick<TestamentTranslation, 'name' | 'testament_id'> | null>({
    fetcher: apiService.fetchTestamentBySlug,
    initialDataValue: null,
    watchSource: testamentSlugRef,
    autoFetch: !!testamentSlugRef.value, // Only auto-fetch if slug is initially present
  })

  // Expose name and id directly for convenience
  const testamentName = computed(() => details.data.value?.name ?? '')
  const testamentId = computed(() => details.data.value?.testament_id ?? null)

  return {
    ...details,
    testamentName,
    testamentId,
  }
}

/**
 * Fetches and manages the list of book types for a given testament ID.
 * @param testamentIdRef - A Ref containing the testament ID.
 * @returns Reactive state for types, loading status, and errors.
 */
export function useTestamentTypes(testamentIdRef: Ref<number | null>) {
  return useDataFetcher<TypeTranslation[]>({
    fetcher: apiService.fetchTypesForTestament,
    initialDataValue: [],
    watchSource: testamentIdRef,
    autoFetch: testamentIdRef.value !== null, // Fetch only if ID is initially valid
  })
}

/**
 * Fetches and manages details for a specific book type based on its slug.
 * @param typeSlugRef - A Ref containing the type slug.
 * @returns Reactive state for type details, loading status, and errors.
 */
export function useTypeDetails(typeSlugRef: Ref<string | undefined>) {
  const details = useDataFetcher<Pick<TypeTranslation, 'name' | 'type_id'> | null>({
    fetcher: apiService.fetchTypeBySlug,
    initialDataValue: null,
    watchSource: typeSlugRef,
    autoFetch: !!typeSlugRef.value,
  })

  const typeName = computed(() => details.data.value?.name ?? '')
  const typeId = computed(() => details.data.value?.type_id ?? null)

  return {
    ...details,
    typeName,
    typeId,
  }
}

/**
 * Fetches and manages the list of books for a given type ID.
 * @param typeIdRef - A Ref containing the type ID.
 * @returns Reactive state for books, loading status, and errors.
 */
export function useBooksByType(typeIdRef: Ref<number | null>) {
  return useDataFetcher<BookSummary[]>({
    fetcher: apiService.fetchBooksByType,
    initialDataValue: [],
    watchSource: typeIdRef,
    autoFetch: typeIdRef.value !== null,
  })
}

/**
 * Fetches and manages details for a specific book based on its slug.
 * @param bookSlugRef - A Ref containing the book slug.
 * @returns Reactive state for book details, loading status, and errors.
 */
export function useBookDetails(bookSlugRef: Ref<string | undefined>) {
  const details = useDataFetcher<
    (Pick<BookWithTranslation['book_translations'][0], 'title'> & { book_id: number }) | null
  >({
    fetcher: apiService.fetchBookBySlug,
    initialDataValue: null,
    watchSource: bookSlugRef,
    autoFetch: !!bookSlugRef.value,
  })

  const bookTitle = computed(() => details.data.value?.title ?? '')
  const bookId = computed(() => details.data.value?.book_id ?? null)

  return {
    ...details,
    bookTitle,
    bookId,
  }
}

/**
 * Fetches and manages the list of available Bible versions.
 * @returns Reactive state for versions, loading status, and errors.
 */
export function useBibleVersions() {
  return useDataFetcher<Version[]>({
    fetcher: apiService.fetchAvailableVersions,
    initialDataValue: [],
    autoFetch: true, // Usually needed early in BookDetailView
  })
}

/**
 * Fetches and manages the list of chapters for a given book ID.
 * @param bookIdRef - A Ref containing the book ID.
 * @returns Reactive state for chapters, loading status, and errors.
 */
export function useChapters(bookIdRef: Ref<number | null>) {
  return useDataFetcher<Chapter[]>({
    fetcher: apiService.fetchChaptersForBook,
    initialDataValue: [],
    watchSource: bookIdRef,
    autoFetch: bookIdRef.value !== null,
  })
}

/**
 * Fetches and manages the list of verses for a given chapter and version ID.
 * @param chapterIdRef - A Ref containing the chapter ID.
 * @param versionIdRef - A Ref containing the version ID.
 * @returns Reactive state for verses, loading status, and errors.
 */
export function useVerses(chapterIdRef: Ref<number | null>, versionIdRef: Ref<number | null>) {
  // Combine refs into an array for the watchSource
  const sources = computed(() => [chapterIdRef.value, versionIdRef.value])

  return useDataFetcher<Verse[]>({
    fetcher: apiService.fetchVersesForChapter,
    initialDataValue: [],
    watchSource: sources as unknown as Ref<any>[], // Watch the computed array of values
    autoFetch: chapterIdRef.value !== null && versionIdRef.value !== null,
  })
}
