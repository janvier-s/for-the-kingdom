/**
 * @file TypeScript interfaces for API data structures.
 */

export interface Language {
  lang_id: number
  lang: string
}

export interface Testament {
  testament_id: number
}

export interface TestamentTranslation {
  testament_translation_id: number
  testament_id: number
  lang_id: number
  name: string
  slug: string
  testaments?: Testament
}

export interface BookGenre {
  genre_id: number
}

export interface GenreTranslation {
  genre_translation_id: number
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
}

export interface BookWithTranslation extends Book {
  bible_book_translations: Array<{
    book_translation_id: number
    title: string
    abbr: string
    slug: string
    lang_id: number
  }>
}

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

export interface BaseVerse {
  verse_id: number
  chapter_id: number
  version_id: number
  verse_number: number
  verse_text: string
  reference_id: number | null
}

export interface Verse extends BaseVerse {
  cccParagraphIds?: number[]
}

export interface CatechismBibleIndexEntry {
  link_id?: number
  ccc_num: number
  reference_id: number
}

export interface CatechismParagraph {
  // ccc_num is the primary identifier based on schema
  ccc_num: number
  // Optional: paragraph_id might be a separate concept or PK of translations table
  // paragraph_id?: number;
  paragraph_number?: string // This might come from translations if needed
  text?: string // This likely comes from translations
  // Other structural IDs if available directly on this table (less likely)
  // part_id?: number | null;
  // section_id?: number | null;
  // chapter_id?: number | null;
  // article_id?: number | null;
}
