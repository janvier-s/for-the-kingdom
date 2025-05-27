// src/stores/bibleStore.ts
import { defineStore } from 'pinia'
import supabaseService from '@/services/supabaseService' // Ensure this path is correct

// Define an interface for the Book object if using TypeScript
interface Book {
  id: number
  osis_code: string
  name: string // This comes from the flattened structure after join
  abbr: string // Also from flattened structure
  // Add other properties from your bible_books table + joined translation
  bible_order: number
  testament_id?: number // Or whatever your testament identifier is
}

interface BibleState {
  books: Book[]
  expandedBookOsisCode: string | null
  chaptersForExpandedBook: number[]
  selectedBook: Book | null
  selectedChapter: number | null
  verses: any[] // Define a type for Verse if you have one
  contentBlocks: any[] // Define a type for ContentBlock
  isLoadingBooks: boolean
  isLoadingChaptersForMenu: boolean
  isLoadingVerses: boolean
  isLoadingContentBlocks: boolean
  displayMode: 'paragraph' | 'verse-by-verse'
  currentVersionId: number
  currentLanguageId: number
  forceBookRefetch?: boolean // Optional flag
}

export const useBibleStore = defineStore('bible', {
  state: (): BibleState => ({
    books: [],
    expandedBookOsisCode: null,
    chaptersForExpandedBook: [],
    selectedBook: null,
    selectedChapter: null,
    verses: [],
    contentBlocks: [],
    isLoadingBooks: false,
    isLoadingChaptersForMenu: false,
    isLoadingVerses: false,
    isLoadingContentBlocks: false,
    displayMode: 'paragraph',
    currentVersionId: 1,
    currentLanguageId: 1, // e.g., 1 for French
    forceBookRefetch: false,
  }),
  getters: {
    currentReference: (state): string => {
      if (state.selectedBook && state.selectedChapter) {
        return `${state.selectedBook.name || state.selectedBook.osis_code} ${state.selectedChapter}`
      }
      return 'Select Book and Chapter'
    },
  },
  actions: {
    async fetchBooks() {
      if (this.books.length > 0 && !this.forceBookRefetch) return
      this.isLoadingBooks = true
      try {
        // This is the call that returns { data: null, error: ... }
        const bookDataFromService = await supabaseService.getBibleBooks(this.currentLanguageId) // LINE X

        // If bookDataFromService is null or bookDataFromService.data is null,
        // and your service doesn't explicitly return an empty array in such cases,
        // then 'data' here would be null.
        // The original service code returned data.map(...)
        // If data was null, data.map would throw "TypeError: Cannot read properties of null (reading 'map')"

        // Let's assume your service has been modified to potentially return null directly
        // OR that the structure returned is { data: null, error: someErrorObject }
        // and supabaseService.getBibleBooks now returns the raw Supabase response.

        // The error message "TypeError: data is null" implies that you are trying to
        // operate on a variable named 'data' that is null.
        // Let's assume the line causing the error is where you assign to this.books.
        // If bookDataFromService IS null, then this.books = bookDataFromService would make this.books null.
        // If the service returned the raw Supabase response like { data, error }, then data could be null.

        // Original code that would cause "cannot read properties of null (reading 'map')" if data is null in service:
        // this.books = data; // where data was the result of book.map

        // Let's refine based on the error "data is null", assuming 'data' refers to the result of the service call
        // before being assigned to this.books or used in a .map

        if (bookDataFromService) {
          // Check if the result from service is not null/undefined
          this.books = bookDataFromService as Book[] // LINE 69 (potential location)
        } else {
          this.books = [] // Set to empty array if service returns null/undefined
          console.warn(
            'No book data returned from service for language ID:',
            this.currentLanguageId,
          )
        }
        this.forceBookRefetch = false
      } catch (error) {
        console.error('Error fetching books in store:', error) // This catch is for errors thrown by the service
        this.books = [] // Ensure books is an array on error
      } finally {
        this.isLoadingBooks = false
      }
    },

    async fetchChaptersForMenuExpansion(bookOsisCode: string) {
      this.isLoadingChaptersForMenu = true
      this.chaptersForExpandedBook = []
      try {
        const chapters = await supabaseService.getChaptersForBook(
          bookOsisCode,
          this.currentVersionId,
        )
        this.chaptersForExpandedBook = chapters
      } catch (error) {
        console.error(`Error fetching chapters for menu expansion for ${bookOsisCode}:`, error)
      } finally {
        this.isLoadingChaptersForMenu = false
      }
    },

    async handleBookMenuClick(book: Book) {
      // book object now has chapter_count
      if (this.expandedBookOsisCode === book.osis_code) {
        this.expandedBookOsisCode = null
        this.chaptersForExpandedBook = []
      } else {
        this.expandedBookOsisCode = book.osis_code
        if (book.chapter_count && book.chapter_count > 0) {
          // Generate chapters directly if count is known
          this.chaptersForExpandedBook = Array.from({ length: book.chapter_count }, (_, i) => i + 1)
          this.isLoadingChaptersForMenu = false // Not really loading from DB
        } else {
          // Fallback to fetching if chapter_count is not available for some reason
          // This maintains the old behavior as a backup.
          console.warn(
            `Chapter count not available for ${book.osis_code}, falling back to DB query.`,
          )
          this.isLoadingChaptersForMenu = true
          try {
            const chapters = await supabaseService.getChaptersForBook(
              book.osis_code,
              this.currentVersionId,
            )
            this.chaptersForExpandedBook = chapters
          } catch (error) {
            console.error(
              `Error fetching chapters for menu expansion for ${book.osis_code}:`,
              error,
            )
            this.chaptersForExpandedBook = []
          } finally {
            this.isLoadingChaptersForMenu = false
          }
        }
      }
    },

    selectChapterForContent(bookOsisCode: string, chapterNum: number) {
      // No async needed if fetchContentForChapter is async
      const bookToSelect = this.books.find((b) => b.osis_code === bookOsisCode)
      if (bookToSelect) {
        this.selectedBook = bookToSelect
        this.selectedChapter = chapterNum
        this.fetchContentForChapter() // This action is async
      } else {
        console.error('Book not found for chapter content selection:', bookOsisCode)
      }
    },

    async fetchContentForChapter() {
      // Already async
      if (!this.selectedBook || !this.selectedChapter) return

      if (this.displayMode === 'paragraph') {
        this.isLoadingContentBlocks = true
        this.contentBlocks = []
        this.verses = []
        try {
          const data = await supabaseService.getContentBlocks(
            this.selectedBook.osis_code,
            this.selectedChapter,
          )
          this.contentBlocks = data
        } catch (error) {
          console.error('Error fetching content blocks:', error)
        } finally {
          this.isLoadingContentBlocks = false
        }
      } else {
        // verse-by-verse
        this.isLoadingVerses = true
        this.verses = []
        this.contentBlocks = []
        try {
          const data = await supabaseService.getVerses(
            this.selectedBook.osis_code,
            this.selectedChapter,
            this.currentVersionId,
          )
          this.verses = data
        } catch (error) {
          console.error('Error fetching verses:', error)
        } finally {
          this.isLoadingVerses = false
        }
      }
    },

    setDisplayMode(mode: 'paragraph' | 'verse-by-verse') {
      // No async needed
      if (this.displayMode !== mode) {
        this.displayMode = mode
        if (this.selectedBook && this.selectedChapter) {
          this.fetchContentForChapter() // This action is async
        }
      }
    },

    // Ensure these are async if they call await
    async setLanguage(languageId: number) {
      if (this.currentLanguageId !== languageId) {
        this.currentLanguageId = languageId
        this.books = []
        this.expandedBookOsisCode = null
        this.chaptersForExpandedBook = []
        this.selectedBook = null
        this.selectedChapter = null
        this.forceBookRefetch = true
        await this.fetchBooks() // This is an async call
      }
    },

    async setVersion(versionId: number) {
      // This must be async
      if (this.currentVersionId !== versionId) {
        this.currentVersionId = versionId
        this.expandedBookOsisCode = null // Or re-fetch for current expanded
        this.chaptersForExpandedBook = [] // Or re-fetch

        if (
          this.selectedBook?.osis_code &&
          this.expandedBookOsisCode === this.selectedBook.osis_code
        ) {
          // If the currently selected book was also the one expanded for chapters,
          // re-fetch its chapters for the new version.
          await this.fetchChaptersForMenuExpansion(this.selectedBook.osis_code) // Await here
        }

        if (this.selectedBook && this.selectedChapter) {
          await this.fetchContentForChapter() // Await here as fetchContentForChapter is async
        }
      }
    },
  },
})
