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
} from '@/types'
import { DEFAULT_LANGUAGE_NAME } from '@/constants'

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
 *
 * @param chapterId - The ID of the chapter.
 * @param versionId - The ID of the Bible version.
 * @returns A promise resolving to an array of verses.
 * @throws If there's an error during the fetch.
 */
export async function fetchVersesForChapter(
  chapterId: number,
  versionId: number,
): Promise<Verse[]> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('verse_id, verse_number, verse_text, chapter_id, version_id')
    .eq('chapter_id', chapterId)
    .eq('version_id', versionId)
    .order('verse_number')

  if (error) {
    console.error(`Error fetching verses for chapter ${chapterId}, version ${versionId}:`, error)
    throw new Error(`Failed to load verses: ${error.message}`)
  }
  return data || []
}
