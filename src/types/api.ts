/**
 * @file TypeScript interfaces for API data structures.
 */

export interface Language {
  lang_id: number
  lang: string
  // Add other fields if needed
}

export interface Testament {
  testament_id: number
  // Add other base testament fields if needed
}

export interface TestamentTranslation {
  testament_translation_id: number // Assuming a primary key exists
  testament_id: number
  lang_id: number
  name: string
  slug: string
  testaments?: Testament // Relation might be included
}

export interface BookGenre {
  genre_id: number
  // Add other base genre fields if needed
}

export interface GenreTranslation {
  genre_translation_id: number // Assuming a primary key exists
  genre_id: number
  lang_id: number
  name: string
  slug: string
}

export interface Book {
  book_id: number
  testament_id: number
  genre_id: number | null
  bible_order: number
  // Add other base book fields if needed
}

// Type for the structure returned when joining bible_books and bible_book_translations
export interface BookWithTranslation extends Book {
  bible_book_translations: Array<{
    book_translation_id: number // Assuming a primary key exists
    title: string
    abbr: string
    slug: string
    lang_id: number
  }>
}

// Simplified structure often used in components
export interface BookSummary {
  book_id: number
  bible_order: number
  title: string
  abbr: string
  slug: string
}

export interface Chapter {
  chapter_id: number
  book_id: number
  chapter_number: number
}

export interface Version {
  version_id: number
  lang_id: number
  abbr: string
  full_name: string
}

export interface Verse {
  verse_id: number
  chapter_id: number
  version_id: number
  verse_number: number
  verse_text: string
}
