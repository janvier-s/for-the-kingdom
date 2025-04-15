// src/api/bibleData.js
import supabase from '@/supabase'

// Add jsDoc comments
/**
 * Fetches all books from the database, ordered by bible_order.
 * @returns {Promise<Array>} An array of book objects.
 * @throws {Error} If there's an error fetching the books.
 */
export async function fetchBooks() {
  try {
    const { data, error } = await supabase.from('books').select('*').order('bible_order')
    if (error) {
      console.error('Error fetching books:', error) // Log the error for debugging
      throw error // Re-throw the error so the calling component knows something went wrong
    }
    return data
  } catch (error) {
    console.error('Unexpected error in fetchBooks:', error)
    throw error
  }
}

/**
 * Fetches chapters for a specific book.
 * @param {number} bookId - The ID of the book.
 * @returns {Promise<Array>} An array of chapter objects.
 * @throws {Error} If there's an error fetching the chapters.
 */
export async function fetchChapters(bookId) {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number')
    if (error) {
      console.error('Error fetching chapters:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Unexpected error in fetchChapters:', error)
    throw error
  }
}

/**
 * Fetches verses for a specific chapter and version.
 * @param {number} chapterId - The ID of the chapter.
 * @param {number} versionId - The ID of the version.
 * @returns {Promise<Array>} An array of verse objects.
 * @throws {Error} If there's an error fetching the verses.
 */
export async function fetchVerses(chapterId, versionId) {
  try {
    const { data, error } = await supabase
      .from('verses')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('version_id', versionId)
      .order('verse_number')
    if (error) {
      console.error('Error fetching verses:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Unexpected error in fetchVerses:', error)
    throw error
  }
}
