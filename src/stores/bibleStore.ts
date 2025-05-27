import { defineStore } from 'pinia'
// import supabaseService from '@/services/supabaseService' // We'll create this next

export const useBibleStore = defineStore('bible', {
  state: () => ({
    books: [], // To store list of bible_books
    chapters: [], // To store chapter numbers for a selected book
    verses: [], // To store verse content for selected chapter (from bible_verses)
    contentBlocks: [], // To store structural blocks (from bible_content_blocks)

    selectedBook: null, // e.g., { id: 1, osis_code: 'GEN', name: 'Genesis' }
    selectedChapter: null, // e.g., 1

    isLoadingBooks: false,
    isLoadingChapters: false,
    isLoadingVerses: false,

    displayMode: 'paragraph', // 'paragraph' or 'verse-by-verse'
  }),
  getters: {
    // Example getter
    currentReference: (state) => {
      if (state.selectedBook && state.selectedChapter) {
        return `${state.selectedBook.name_en || state.selectedBook.osis_code} ${state.selectedChapter}`
      }
      return 'Select Book and Chapter'
    },
  },
  actions: {
    // We will add actions to fetch data here
    // async fetchBooks() {
    //   this.isLoadingBooks = true;
    //   try {
    //     const data = await supabaseService.getBibleBooks(); // Example
    //     this.books = data;
    //   } catch (error) {
    //     console.error("Error fetching books:", error);
    //   } finally {
    //     this.isLoadingBooks = false;
    //   }
    // },
    // async fetchChaptersForBook(bookId) { /* ... */ },
    // async fetchContentForChapter(bookOsisCode, chapterNum) { /* ... */ },

    selectBook(book) {
      if (this.selectedBook?.id !== book.id) {
        this.selectedBook = book
        this.selectedChapter = null // Reset chapter when book changes
        this.verses = []
        this.contentBlocks = []
        // this.fetchChaptersForBook(book.id); // Automatically fetch chapters
      }
    },
    selectChapter(chapter) {
      this.selectedChapter = chapter
      this.verses = []
      this.contentBlocks = []
      // this.fetchContentForChapter(this.selectedBook.osis_code, chapter);
    },
    setDisplayMode(mode) {
      if (['paragraph', 'verse-by-verse'].includes(mode)) {
        this.displayMode = mode
        // Potentially re-fetch or re-process content if mode changes
      }
    },
  },
})
