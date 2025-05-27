// src/types/api.ts
// REMOVE or MODIFY existing interfaces for Chapter, Verse, BaseVerse, CatechismBibleIndexEntry
// ADD or MODIFY based on core_unit and new relationships

/**
 * @file TypeScript interfaces for API data structures reflecting the refactored schema.
 */

export interface Language {
  id: number
  lang: string
  code: string
}

export interface TestamentTranslation {
  testament_id: number
  lang_id: number
  name: string
  slug: string
  // Optional relation if needed, points to bible_testaments
  // bible_testaments?: { id: number; canonical_identifier: string };
}

export interface GenreTranslation {
  genre_id: number
  lang_id: number
  name: string
  slug: string
}

export interface BookSummary {
  book_id: number
  bible_order: number
  title: string
  abbr: string
  slug: string
  cleaned_book_label: string
}

export interface BaseVerse {
  id: number
  unit_type: 'verse'
  canonical_ref: string
  sort_order: number
  content_text: string | null
  path: string
}

export interface Verse extends BaseVerse {
  cccParagraphNumbers?: number[]
}

export interface Version {
  id: number
  lang_id: number
  abbr: string
  full_name: string
}

export interface CccLinkResult {
  verse_id: number
  ccc_nums: number[] | null
}

export interface CccParaViewData {
  id: number
  ccc_ref: string
  ccc_number: number
  content_text: string | null
  content_html: string | null
  lang_id: number
  fts: any
  bible_ref_ids: number[]
  ccc_ref_ids: number[]
}
