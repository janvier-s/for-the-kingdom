import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Bible Data Functions ---

// Fetch Bible books with their English translation for display
// Assuming lang_id for English is, for example, 2. Adjust as needed.
// You'll need to know the lang_id for the language you want book names in.
async function getBibleBooks(languageId = 1) {
  // Default to French (lang_id 1 based on your previous setup)
  const { data, error } = await supabase
    .from('bible_books')
    .select(
      `
      id,
      osis_code,
      custom_ref_code,
      bible_order,
      testament_id,
      bible_book_translations!inner (
        title,
        abbr
      )
    `,
    )
    .eq('bible_book_translations.lang_id', languageId)
    .order('bible_order', { ascending: true })

  if (error) {
    console.error('Error fetching Bible books:', error.message)
    throw error
  }
  // Flatten the structure for easier use
  return data.map((book) => ({
    ...book,
    name: book.bible_book_translations[0]?.title || book.osis_code,
    abbr: book.bible_book_translations[0]?.abbr || book.osis_code,
  }))
}

// Fetch available chapters for a given book_osis_code and version_id
// (Assuming your bible_verses table has version_id)
async function getChaptersForBook(bookOsisCode, versionId = 1) {
  // Default to version_id 1
  const { data, error } = await supabase
    .from('bible_verses')
    .select('chapter_number')
    .eq('book_osis_code', bookOsisCode)
    .eq('version_id', versionId) // Filter by version
    .order('chapter_number', { ascending: true })

  if (error) {
    console.error(`Error fetching chapters for ${bookOsisCode}:`, error.message)
    throw error
  }
  // Get unique chapter numbers
  const uniqueChapters = [...new Set(data.map((item) => item.chapter_number))].sort((a, b) => a - b)
  return uniqueChapters
}

// Fetch verses for a specific book, chapter, and version
async function getVerses(bookOsisCode, chapterNumber, versionId = 1) {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*') // Select all columns for now, or be specific
    .eq('book_osis_code', bookOsisCode)
    .eq('chapter_number', chapterNumber)
    .eq('version_id', versionId)
    .order('verse_number', { ascending: true })

  if (error) {
    console.error('Error fetching verses:', error.message)
    throw error
  }
  return data
}

// Fetch content blocks for a specific book and chapter
async function getContentBlocks(bookOsisCode, chapterNumber) {
  const { data, error } = await supabase
    .from('bible_content_blocks')
    .select('*')
    .eq('book_osis_code', bookOsisCode)
    .eq('start_chapter_num', chapterNumber) // Or how you determined chapter for blocks
    .order('block_order', { ascending: true })

  if (error) {
    console.error('Error fetching content blocks:', error.message)
    throw error
  }
  return data
}

export default {
  getBibleBooks,
  getChaptersForBook,
  getVerses,
  getContentBlocks,
  // Add more functions for CCC, Commentary, XRefs later
}
