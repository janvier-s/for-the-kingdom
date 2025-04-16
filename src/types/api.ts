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

export interface BookType {
  type_id: number
  // Add other base type fields if needed
}

export interface TypeTranslation {
  type_translation_id: number // Assuming a primary key exists
  type_id: number
  lang_id: number
  name: string
  slug: string
}

export interface Book {
  book_id: number
  testament_id: number
  type_id: number | null
  bible_order: number
  // Add other base book fields if needed
}

// Type for the structure returned when joining books and book_translations
export interface BookWithTranslation extends Book {
  book_translations: Array<{
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
