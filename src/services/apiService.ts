/**
 * @file Centralized service for interacting with the Supabase database (Bible data).
 * Encapsulates all Supabase queries related to fetching biblical content.
 */
import supabase from '@/supabase'
import { getLanguageId } from '@/utils/language'
import type {
  TestamentTranslation,
  GenreTranslation,
  BookWithTranslation,
  BookSummary,
  Chapter,
  Version,
  Verse,
  BaseVerse,
  CatechismBibleIndexEntry,
} from '@/types'
import { DEFAULT_LANGUAGE_NAME } from '@/constants'

type BaseVerse = Omit<Verse, 'cccParagraphIds'> // This type is correct

// --- Define type for RPC result row ---
interface CccLinkResult {
  verse_id: number
  ccc_nums: number[] | null // RPC might return null if array_agg finds nothing
}

/**
 * Fetches testament translations for the default language.
 *
 * @returns A promise resolving to an array of testament translations.
 * @throws If there's an error during the fetch or language ID retrieval.
 */
export async function fetchTestaments(): Promise<TestamentTranslation[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_testament_translations')
    .select(
      `
      testament_id,
      name,
      slug,
      bible_testaments ( testament_id )
    `,
    )
    .eq('lang_id', langId)
    .order('testament_id') // Use the base table's ID for ordering if possible

  if (error) {
    console.error('Error fetching testaments:', error)
    throw new Error(`Failed to fetch testaments: ${error.message}`)
  }
  // Ensure testament_id is consistently available, handling potential null from relation
  return (data || [])
    .map((item) => ({
      ...item,
      testament_id: item.testament_id ?? item.testaments?.testament_id,
    }))
    .filter((item) => item.testament_id != null) as TestamentTranslation[] // Genre assertion after filtering nulls
}

/**
 * Fetches details (name, ID) for a specific testament by its slug.
 *
 * @param slug - The URL slug of the testament.
 * @returns A promise resolving to the testament translation details.
 * @throws If the testament is not found or if there's a fetch error.
 */
export async function fetchTestamentBySlug(
  slug: string,
): Promise<Pick<TestamentTranslation, 'name' | 'testament_id'>> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_testament_translations')
    .select('name, testament_id')
    .eq('slug', slug)
    .eq('lang_id', langId)
    .single()

  if (error) {
    console.error(`Error fetching testament by slug '${slug}':`, error)
    if (error.code === 'PGRST116') {
      // Not found
      throw new Error(`Testament with slug '${slug}' not found for the selected language.`)
    }
    throw new Error(`Failed to fetch testament details: ${error.message}`)
  }
  if (!data) {
    throw new Error(`Testament with slug '${slug}' not found (no data returned).`)
  }

  return data
}

/**
 * Fetches distinct book genre translations associated with a specific testament.
 *
 * @param testamentId - The ID of the testament.
 * @returns A promise resolving to an array of genre translations.
 * @throws If there's an error during the fetch.
 */
export async function fetchGenresForTestament(testamentId: number): Promise<GenreTranslation[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)

  // Step 1: Find distinct genre_ids for books within the testament
  const { data: bookGenreData, error: bookGenreError } = await supabase
    .from('bible_books')
    .select('genre_id')
    .eq('testament_id', testamentId)
    .not('genre_id', 'is', null) // Ensure genre_id is not null

  if (bookGenreError) {
    console.error(`Error fetching book genres for testament ${testamentId}:`, bookGenreError)
    throw new Error(`Failed to fetch book genre associations: ${bookGenreError.message}`)
  }

  // Extract unique, non-null genre IDs
  const distinctGenreIds = [
    ...new Set(
      bookGenreData?.map((item) => item.genre_id).filter((id): id is number => id !== null) ?? [],
    ),
  ]

  if (distinctGenreIds.length === 0) {
    console.log(`No distinct book genres found for testament ID ${testamentId}.`)
    return [] // No genres associated
  }

  // Step 2: Fetch the translations for these distinct genre IDs
  const { data: genreTranslationsData, error: translationError } = await supabase
    .from('bible_genre_translations')
    .select('name, slug, genre_id')
    .in('genre_id', distinctGenreIds)
    .eq('lang_id', langId)
    .order('genre_id') // Or order by name if preferred: .order('name')

  if (translationError) {
    console.error(
      `Error fetching genre translations for testament ${testamentId}:`,
      translationError,
    )
    throw new Error(`Failed to fetch genre names: ${translationError.message}`)
  }

  return genreTranslationsData || []
}

/**
 * Fetches details (name, ID) for a specific book genre by its slug.
 *
 * @param slug - The URL slug of the book genre.
 * @returns A promise resolving to the genre translation details.
 * @throws If the genre is not found or if there's a fetch error.
 */
export async function fetchGenreBySlug(
  slug: string,
): Promise<Pick<GenreTranslation, 'name' | 'genre_id'>> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_genre_translations')
    .select('name, genre_id')
    .eq('slug', slug)
    .eq('lang_id', langId)
    .single()

  if (error) {
    console.error(`Error fetching genre by slug '${slug}':`, error)
    if (error.code === 'PGRST116') {
      // Not found
      throw new Error(`Genre with slug '${slug}' not found for the selected language.`)
    }
    throw new Error(`Failed to fetch genre details: ${error.message}`)
  }
  if (!data) {
    throw new Error(`Genre with slug '${slug}' not found (no data returned).`)
  }
  return data
}

/**
 * Fetches books belonging to a specific genre ID, including their translations.
 *
 * @param genreId - The ID of the book genre.
 * @returns A promise resolving to an array of book summaries.
 * @throws If there's an error during the fetch.
 */
export async function fetchBooksByGenre(genreId: number): Promise<BookSummary[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_books')
    .select(
      `
      book_id,
      bible_order,
      bible_book_translations!inner (
          title,
          abbr,
          slug,
          lang_id
      )
    `,
    )
    .eq('genre_id', genreId)
    .eq('bible_book_translations.lang_id', langId) // Filter translations by language
    .order('bible_order')

  if (error) {
    console.error(`Error fetching books for genre ${genreId}:`, error)
    throw new Error(`Failed to fetch books: ${error.message}`)
  }

  // Map the potentially complex nested structure to a flat BookSummary
  return (data || [])
    .filter(
      (book): book is BookWithTranslation =>
        book.bible_book_translations && book.bible_book_translations.length > 0, // Genre guard to ensure translation exists
    )
    .map((book) => ({
      book_id: book.book_id,
      bible_order: book.bible_order,
      // Assuming inner join guarantees one translation, but check just in case
      title: book.bible_book_translations[0]?.title || 'Unknown Title',
      abbr: book.bible_book_translations[0]?.abbr || 'N/A',
      slug: book.bible_book_translations[0]?.slug || `book-${book.book_id}`, // Fallback slug
    }))
}

/**
 * Fetches details (title, ID) for a specific book by its slug.
 *
 * @param slug - The URL slug of the book.
 * @returns A promise resolving to the book translation details.
 * @throws If the book is not found or if there's a fetch error.
 */
export async function fetchBookBySlug(
  slug: string,
): Promise<Pick<BookWithTranslation['book_translations'][0], 'title'> & { book_id: number }> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_book_translations')
    .select('title, book_id') // Select book_id from the related book table
    .eq('slug', slug)
    .eq('lang_id', langId)
    .single()

  if (error) {
    console.error(`Error fetching book by slug '${slug}':`, error)
    if (error.code === 'PGRST116') {
      // Not found
      throw new Error(`Book with slug '${slug}' not found for the selected language.`)
    }
    throw new Error(`Failed to fetch book details: ${error.message}`)
  }
  if (!data || data.book_id === null) {
    // Ensure book_id is present
    throw new Error(`Book with slug '${slug}' not found or missing book ID.`)
  }

  // We need to cast book_id because Supabase might return it as potentially null from the join
  return { title: data.title, book_id: data.book_id as number }
}

/**
 * Fetches available Bible versions for the default language.
 *
 * @returns A promise resolving to an array of versions.
 * @throws If there's an error during the fetch.
 */
export async function fetchAvailableVersions(): Promise<Version[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_versions')
    .select('version_id, abbr, full_name, lang_id')
    .eq('lang_id', langId)
    .order('abbr')

  if (error) {
    console.error('Error fetching available versions:', error)
    throw new Error(`Failed to load versions: ${error.message}`)
  }
  return data || []
}

/**
 * Fetches chapters for a specific book ID.
 *
 * @param bookId - The ID of the book.
 * @returns A promise resolving to an array of chapters.
 * @throws If there's an error during the fetch.
 */
export async function fetchChaptersForBook(bookId: number): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('bible_chapters')
    .select('chapter_id, chapter_number, book_id')
    .eq('book_id', bookId)
    .order('chapter_number')

  if (error) {
    console.error(`Error fetching chapters for book ${bookId}:`, error)
    throw new Error(`Failed to load chapters: ${error.message}`)
  }
  return data || []
}

/**
 * Fetches verses for a specific chapter and version ID.
 * Selects only columns that exist in the 'bible_verses' table.
 *
 * @param chapterId - The ID of the chapter.
 * @param versionId - The ID of the Bible version.
 * @returns A promise resolving to an array of verses (without CCC links initially).
 * @throws If there's an error during the fetch.
 */
export async function fetchVersesForChapter(
  chapterId: number,
  versionId: number,
): Promise<BaseVerse[]> {
  // Return type should be BaseVerse[]
  const { data, error } = await supabase
    .from('bible_verses')
    // --- CRITICAL CHECK: Ensure this SELECT is exactly as follows ---
    .select('verse_id, chapter_id, version_id, verse_number, verse_text')
    // --- NO reference_id should be listed here ---
    .eq('chapter_id', chapterId)
    .eq('version_id', versionId)
    .order('verse_number')

  if (error) {
    console.error(`Error fetching verses for chapter ${chapterId}, version ${versionId}:`, error)
    // Make the error message more specific
    throw new Error(`Failed to load verses (DB error: ${error.message})`)
  }
  // Cast might be needed if Supabase types aren't perfect, but `data` should match BaseVerse[]
  return (data as BaseVerse[]) || []
}

/**
 * Fetches Catechism paragraph numbers (ccc_num) linked to a given list of verse IDs.
 * Performs a two-step lookup: verse_id -> reference_id -> ccc_num.
 *
 * @param verseIds - An array of verse IDs to look up.
 * @returns A promise resolving to a Map where keys are the original verse IDs
 *          and values are arrays of corresponding ccc_num values.
 * @throws If there's an error during the fetch.
 */
export async function fetchCatechismLinksForVerseIds(
  verseIds: number[],
): Promise<Map<number, number[]>> {
  // Output maps verse_id -> ccc_num[]
  const finalLinkMap = new Map<number, number[]>()
  if (!verseIds || verseIds.length === 0) {
    return finalLinkMap
  }

  // --- Step 1: Fetch reference_id for each verse_id ---
  console.debug(
    `[fetchCatechismLinks] Step 1: Fetching reference_ids for ${verseIds.length} verses.`,
  )
  const { data: verseRefData, error: verseRefError } = await supabase
    .from('bible_verses')
    .select('verse_id, reference_id')
    .in('verse_id', verseIds)
    .not('reference_id', 'is', null) // Only interested in verses that have a reference_id

  if (verseRefError) {
    console.error('Error fetching verse reference_ids:', verseRefError)
    throw new Error(`Failed to fetch verse references: ${verseRefError.message}`)
  }

  if (!verseRefData || verseRefData.length === 0) {
    console.debug('[fetchCatechismLinks] Step 1: No verses found with reference_ids.')
    return finalLinkMap // No references found, so no links possible
  }

  // Create a map for quick lookup: verse_id -> reference_id
  const verseToReferenceMap = new Map<number, number>()
  // Collect unique reference IDs for the next query
  const uniqueReferenceIds = new Set<number>()
  for (const item of verseRefData) {
    if (item.verse_id && item.reference_id) {
      verseToReferenceMap.set(item.verse_id, item.reference_id)
      uniqueReferenceIds.add(item.reference_id)
    }
  }
  const referenceIdsToQuery = Array.from(uniqueReferenceIds)
  console.debug(
    `[fetchCatechismLinks] Step 1: Found ${referenceIdsToQuery.length} unique reference_ids.`,
  )

  // --- Step 2: Fetch ccc_num using reference_ids ---
  if (referenceIdsToQuery.length === 0) {
    return finalLinkMap // No valid reference IDs to query
  }
  console.debug(
    `[fetchCatechismLinks] Step 2: Fetching CCC links for ${referenceIdsToQuery.length} reference_ids.`,
  )
  const { data: indexData, error: indexError } = await supabase
    .from('catechism_bible_index')
    // Use correct column names from schema
    .select('reference_id, ccc_num')
    .in('reference_id', referenceIdsToQuery)

  if (indexError) {
    console.error('Error fetching Catechism index data:', indexError)
    throw new Error(`Failed to fetch Catechism index: ${indexError.message}`)
  }

  if (!indexData || indexData.length === 0) {
    console.debug('[fetchCatechismLinks] Step 2: No CCC links found for the reference_ids.')
    return finalLinkMap // No links found for these references
  }

  // Create a map for quick lookup: reference_id -> ccc_num[]
  const referenceToCccMap = new Map<number, number[]>()
  for (const entry of indexData as CatechismBibleIndexEntry[]) {
    // Use updated type
    if (entry.reference_id && entry.ccc_num) {
      const existing = referenceToCccMap.get(entry.reference_id) || []
      existing.push(entry.ccc_num)
      referenceToCccMap.set(entry.reference_id, existing)
    }
  }
  console.debug(
    `[fetchCatechismLinks] Step 2: Found links for ${referenceToCccMap.size} reference_ids.`,
  )

  // --- Step 3: Merge Results - Map original verse_id to final ccc_num[] ---
  for (const verseId of verseIds) {
    const referenceId = verseToReferenceMap.get(verseId)
    if (referenceId) {
      const cccNums = referenceToCccMap.get(referenceId)
      if (cccNums && cccNums.length > 0) {
        finalLinkMap.set(verseId, cccNums)
      }
    }
  }
  console.debug(
    `[fetchCatechismLinks] Step 3: Final map created linking ${finalLinkMap.size} original verse_ids to CCC numbers.`,
  )

  return finalLinkMap
}

/**
 * Fetches Catechism paragraph numbers (ccc_num) linked to a given list of verse IDs
 * using the 'get_ccc_links_for_verse_ids' database function (RPC).
 *
 * @param verseIds - An array of verse IDs to look up.
 * @returns A promise resolving to a Map where keys are verse IDs and values are arrays of corresponding ccc_nums.
 * @throws If there's an error during the RPC call.
 */
export async function fetchCatechismLinksViaRpc(
  verseIds: number[],
): Promise<Map<number, number[]>> {
  if (!verseIds || verseIds.length === 0) {
    return new Map() // Return empty map if no IDs are provided
  }

  // Call the database function
  const { data, error } = await supabase.rpc('get_ccc_links_for_verse_ids', {
    // Pass the verse IDs as the argument named in the function definition
    target_verse_ids: verseIds,
  })

  if (error) {
    console.error('Error calling get_ccc_links_for_verse_ids RPC:', error)
    throw new Error(`Failed to fetch Catechism links via RPC: ${error.message}`)
  }

  // Process the RPC result (which is an array of CccLinkResult objects) into a Map
  const indexMap = new Map<number, number[]>()
  if (data) {
    // Supabase RPC result type might need casting
    const results = data as CccLinkResult[]
    for (const result of results) {
      // Ensure ccc_nums is an array and not null before setting
      if (result.verse_id && result.ccc_nums && result.ccc_nums.length > 0) {
        indexMap.set(result.verse_id, result.ccc_nums)
      }
    }
  }

  console.debug(
    `[apiService] Fetched Catechism links via RPC for ${verseIds.length} verse IDs. Found links for ${indexMap.size} verses.`,
  )
  return indexMap
}
