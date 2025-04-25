// src/services/apiService.ts
/**
 * @file Centralized service for interacting with the Supabase database (Bible data).
 * Encapsulates all Supabase queries related to fetching biblical content,
 * adapted for the core_unit and core_xref schema.
 */
import supabase from '@/supabase'
import { getLanguageId } from '@/utils/language'
import type {
  TestamentTranslation,
  GenreTranslation,
  BookSummary,
  Chapter,
  Version,
  BaseVerse,
  CccLinkResult,
} from '@/types'
import { DEFAULT_LANGUAGE_NAME } from '@/constants'

function getCleanedBookLabel(abbr_ccc: string | null, abbr: string | null): string {
  const rawLabel = abbr_ccc ?? abbr ?? 'unk_book'
  let cleaned = rawLabel.replace(/[^a-zA-Z0-9_]+/g, '_')
  if (cleaned.match(/^[0-9]/)) {
    cleaned = 'b' + cleaned
  }
  return cleaned.toLowerCase()
}

/**
 * Fetches testament translations for the default language.
 *
 * @returns A promise resolving to an array of testament translations.
 * @throws If there's an error during the fetch or language ID retrieval.
 */
export async function fetchTestaments(): Promise<Omit<TestamentTranslation, 'lang_id'>[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_testament_translations')
    .select(
      `
      testament_id,
      name,
      slug
    `,
    )
    .eq('lang_id', langId)
    .order('name')

  if (error) {
    console.error('Error fetching testaments:', error)
    throw new Error(`Failed to fetch testaments: ${error.message}`)
  }
  return (data || []) as Omit<TestamentTranslation, 'lang_id'>[]
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
 * (Logic remains similar, verify column names)
 * @param testamentId - The ID of the testament (bible_testaments.id).
 * @returns A promise resolving to an array of genre translations.
 * @throws If there's an error during the fetch.
 */
export async function fetchGenresForTestament(testamentId: number): Promise<GenreTranslation[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)

  const { data: bookGenreData, error: bookGenreError } = await supabase
    .from('bible_books')
    .select('genre_id')
    .eq('testament_id', testamentId)
    .not('genre_id', 'is', null)

  if (bookGenreError) {
    console.error(`Error fetching book genres for testament ${testamentId}:`, bookGenreError)
    throw new Error(`Failed to fetch book genre associations: ${bookGenreError.message}`)
  }

  const distinctGenreIds = [
    ...new Set(
      bookGenreData?.map((item) => item.genre_id).filter((id): id is number => id !== null) ?? [],
    ),
  ]

  if (distinctGenreIds.length === 0) {
    return []
  }

  const { data: genreTranslationsData, error: translationError } = await supabase
    .from('bible_genre_translations')
    .select('name, slug, genre_id')
    .in('genre_id', distinctGenreIds)
    .eq('lang_id', langId)
    .order('name')

  if (translationError) {
    console.error(
      `Error fetching genre translations for testament ${testamentId}:`,
      translationError,
    )
    throw new Error(`Failed to fetch genre names: ${translationError.message}`)
  }

  return (genreTranslationsData || []).map((g) => ({
    genre_id: g.genre_id,
    lang_id: langId,
    name: g.name,
    slug: g.slug,
  }))
}

/**
 * Fetches details (name, ID) for a specific book genre by its slug.
 * (Verify column names)
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
 * Adapted for new schema (PK is 'id').
 * @param genreId - The ID of the book genre (bible_genres.id).
 * @returns A promise resolving to an array of book summaries.
 * @throws If there's an error during the fetch.
 */
export async function fetchBooksByGenre(genreId: number): Promise<BookSummary[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_books') // Base table
    .select(
      `
      id,
      bible_order,
      bible_book_translations!inner (
          title,
          abbr,
          slug,
          lang_id,
          abbr_ccc
      )
    `,
    )
    .eq('genre_id', genreId)
    .eq('bible_book_translations.lang_id', langId)
    .order('bible_order')

  if (error) {
    console.error(`Error fetching books for genre ${genreId}:`, error)
    throw new Error(`Failed to fetch books: ${error.message}`)
  }

  return (data || [])
    .filter(
      (book) =>
        book.bible_book_translations &&
        Array.isArray(book.bible_book_translations) &&
        book.bible_book_translations.length > 0,
    )
    .map((book) => {
      const translation = book.bible_book_translations[0]
      const cleanedLabel = getCleanedBookLabel(translation?.abbr_ccc, translation?.abbr)
      return {
        book_id: book.id,
        bible_order: book.bible_order,
        title: translation?.title || 'Unknown Title',
        abbr: translation?.abbr || 'N/A',
        slug: translation?.slug || `book-${book.id}`,
        cleaned_book_label: cleanedLabel,
      }
    })
}

/**
 * Fetches details (title, ID, label) for a specific book by its slug.
 * Adapted for new schema.
 * @param slug - The URL slug of the book.
 * @returns A promise resolving to the book details needed for display and path construction.
 * @throws If the book is not found or if there's a fetch error.
 */
export async function fetchBookBySlug(
  slug: string,
): Promise<{ book_id: number; title: string; cleaned_book_label: string }> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_book_translations')
    .select('title, book_id, abbr, abbr_ccc')
    .eq('slug', slug)
    .eq('lang_id', langId)
    .single()

  if (error) {
    console.error(`Error fetching book by slug '${slug}':`, error)
    if (error.code === 'PGRST116') {
      throw new Error(`Book with slug '${slug}' not found for the selected language.`)
    }
    throw new Error(`Failed to fetch book details: ${error.message}`)
  }
  if (!data || data.book_id === null) {
    throw new Error(`Book with slug '${slug}' not found or missing book ID.`)
  }

  const cleanedLabel = getCleanedBookLabel(data.abbr_ccc, data.abbr)

  return {
    book_id: data.book_id as number,
    title: data.title,
    cleaned_book_label: cleanedLabel,
  }
}

/**
 * Fetches available Bible versions for the default language.
 * Adapted for new schema (PK is 'id').
 * @returns A promise resolving to an array of versions.
 * @throws If there's an error during the fetch.
 */
export async function fetchAvailableVersions(): Promise<Version[]> {
  const langId = await getLanguageId(DEFAULT_LANGUAGE_NAME)
  const { data, error } = await supabase
    .from('bible_versions')
    .select('id, abbr, full_name, lang_id')
    .eq('lang_id', langId)
    .order('abbr')

  if (error) {
    console.error('Error fetching available versions:', error)
    throw new Error(`Failed to load versions: ${error.message}`)
  }
  // Map to Version type, changing 'id' to 'version_id' if needed by frontend type,
  // but it's better to update the frontend type to use 'id'.
  // Sticking with the updated type:
  return (data || []).map((v) => ({
    id: v.id,
    abbr: v.abbr,
    full_name: v.full_name,
    lang_id: v.lang_id,
  }))
}

/**
 * Fetches chapter numbers for a specific book ID and version code.
 * Queries core_unit using ltree to find distinct chapter numbers.
 *
 * @param bookId - The ID of the book (bible_books.id). Used for context/logging.
 * @param bookLabel - The cleaned book label for the ltree path (e.g., 'gen').
 * @param versionCode - The version code for the ltree path (e.g., 'vul').
 * @returns A promise resolving to an array of chapter numbers.
 * @throws If there's an error during the fetch.
 */
export async function fetchChaptersForBook(
  bookId: number,
  bookLabel: string,
  versionCode: string,
): Promise<number[]> {
  const bookPath = `bib.${versionCode.toLowerCase()}.${bookLabel}`

  try {
    const { data, error } = await supabase.rpc('get_chapter_numbers_for_book', {
      book_path: bookPath,
    })

    if (error) {
      console.error(`%c[fetchChaptersForBook] RPC Error:`, 'color: red; font-weight: bold;', error)
      throw new Error(`Failed to load chapters via RPC: ${error.message}`)
    }

    const chapters = data || []
    return chapters
  } catch (catchError) {
    console.error(
      `%c[fetchChaptersForBook] CRITICAL ERROR during RPC execution:`,
      'color: red; font-weight: bold;',
      catchError,
    )
    throw new Error(`Failed to execute chapter RPC: ${catchError.message}`)
  }
}

/**
 * Fetches verses for a specific chapter using ltree path.
 *
 * @param bookLabel - The cleaned book label (e.g., 'gen').
 * @param chapterNumber - The chapter number.
 * @param versionCode - The version code (e.g., 'vul').
 * @returns A promise resolving to an array of verses.
 * @throws If there's an error during the fetch.
 */
export async function fetchVersesForChapter(
  bookLabel: string,
  chapterNumber: number,
  versionCode: string,
): Promise<BaseVerse[]> {
  const chapterPath = `bib.${versionCode.toLowerCase()}.${bookLabel}.${chapterNumber}`
  console.debug(
    `[fetchVersesForChapter] Calling RPC 'get_verses_for_chapter' with path: ${chapterPath}`,
  )

  try {
    const { data, error } = await supabase.rpc('get_verses_for_chapter', {
      chapter_path: chapterPath,
    })

    if (error) {
      console.error(`Error fetching verses via RPC for ${chapterPath}:`, error)
      throw new Error(`Failed to load verses via RPC (DB error: ${error.message})`)
    }

    return (data || []).map((item) => ({
      id: item.id,
      unit_type: 'verse',
      canonical_ref: item.canonical_ref,
      sort_order: item.sort_order,
      content_text: item.content_text,
      path: String(item.path),
    }))
  } catch (catchError) {
    console.error(
      `%c[fetchVersesForChapter] CRITICAL ERROR during RPC execution:`,
      'color: red; font-weight: bold;',
      catchError,
    )
    throw new Error(`Failed to execute verse RPC: ${catchError.message}`)
  }
}

/**
 * Fetches Catechism paragraph numbers (sort_order) linked to a given list of verse IDs (core_unit.id)
 * using a new RPC function 'get_ccc_nums_for_verse_ids'.
 *
 * @param verseIds - An array of verse core_unit IDs to look up.
 * @returns A promise resolving to a Map where keys are verse IDs and values are arrays of corresponding ccc_nums.
 * @throws If there's an error during the RPC call.
 */
export async function fetchCatechismLinksViaRpc(
  verseIds: number[],
): Promise<Map<number, number[]>> {
  if (!verseIds || verseIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase.rpc('get_ccc_nums_for_verse_ids', {
    target_verse_ids: verseIds,
  })

  if (error) {
    console.error('Error calling get_ccc_nums_for_verse_ids RPC:', error)
    throw new Error(`Failed to fetch Catechism links via RPC: ${error.message}`)
  }

  const indexMap = new Map<number, number[]>()
  if (data) {
    const results = data as CccLinkResult[]
    for (const result of results) {
      if (result.verse_id && result.ccc_nums && result.ccc_nums.length > 0) {
        indexMap.set(result.verse_id, result.ccc_nums)
      }
    }
  }
  return indexMap
}
