<template>
  <div class="book-detail">
    <header v-if="isLoadingBook">Loading book details...</header>
    <header v-else-if="bookError" class="error-message">Error loading book: {{ bookError }}</header>
    <header v-else-if="bookData">
      <h1>{{ bookData.title }}</h1>
    </header>
    <header v-else>
      <h1 class="error-message">Book not found.</h1>
    </header>

    <main v-if="bookData">
      <div v-if="isLoadingContent" class="loading">Loading content...</div>
      <div v-else-if="contentError" class="error-message">
        Error loading content: {{ contentError }}
      </div>

      <div v-else-if="verses.length > 0">
        <h2>Chapter {{ selectedChapterNumber }}</h2>
        <div class="verses-container">
          <p v-for="verse in verses" :key="verse.verse_id" class="verse">
            <sup>{{ verse.verse_number }}</sup> {{ verse.verse_text }}
          </p>
        </div>
      </div>
      <p v-else>No verses found for this chapter/version.</p>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  bookId: {
    type: [String, Number],
    required: true,
  },
  testamentSlug: {
    type: String,
    required: false,
  },
  typeSlug: {
    type: String,
    required: false,
  },
  bookSlug: {
    type: String,
    required: true,
  },
})

// --- State ---
const bookData = ref(null)
const chapters = ref([])
const verses = ref([])
const selectedChapterId = ref(null)
const selectedChapterNumber = ref(1)
const selectedVersionId = ref(1) // Default version ID
const isLoadingBook = ref(true)
const bookError = ref(null)
const isLoadingContent = ref(false)
const contentError = ref(null)

const fetchBookDetails = async (id) => {
  isLoadingBook.value = true
  bookError.value = null
  bookData.value = null
  try {
    const { data, error } = await supabase
      .from('books')
      .select('book_id, title')
      .eq('book_id', id)
      .single()
    if (error) throw error
    bookData.value = data
  } catch (err) {
    bookError.value = err.message || 'Failed to load book details.'
  } finally {
    isLoadingBook.value = false
  }
}
const fetchChapters = async (bookId) => {
  isLoadingContent.value = true
  contentError.value = null
  chapters.value = []
  selectedChapterId.value = null
  verses.value = []
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('chapter_id, chapter_number')
      .eq('book_id', bookId)
      .order('chapter_number')
    if (error) throw error
    chapters.value = data

    const chapterOne = chapters.value.find((ch) => ch.chapter_number === 1)
    if (chapterOne) {
      selectedChapterId.value = chapterOne.chapter_id
      selectedChapterNumber.value = 1
      await fetchVerses(chapterOne.chapter_id, selectedVersionId.value)
    } else if (chapters.value.length > 0) {
      selectedChapterId.value = chapters.value[0].chapter_id
      selectedChapterNumber.value = chapters.value[0].chapter_number
      await fetchVerses(chapters.value[0].chapter_id, selectedVersionId.value)
    } else {
      contentError.value = 'No chapters found for this book.'
    }
  } catch (err) {
    contentError.value = err.message || 'Failed to load chapters.'
  }
}

const fetchVerses = async (chapterId, versionId) => {
  isLoadingContent.value = true
  contentError.value = null
  verses.value = []
  if (!chapterId || !versionId) {
    contentError.value = 'Missing chapter or version ID.'
    isLoadingContent.value = false
    return
  }
  try {
    const { data, error } = await supabase
      .from('verses')
      .select('verse_id, verse_number, verse_text')
      .eq('chapter_id', chapterId)
      .eq('version_id', versionId)
      .order('verse_number')
    if (error) throw error
    verses.value = data
  } catch (err) {
    contentError.value = err.message || 'Failed to load verses.'
  } finally {
    isLoadingContent.value = false
  }
}

// --- Watcher ---
watch(
  () => props.bookId,
  async (newBookId) => {
    const id = Number(newBookId)
    if (!isNaN(id)) {
      bookData.value = null
      chapters.value = []
      verses.value = []
      selectedChapterId.value = null
      selectedChapterNumber.value = 1
      bookError.value = null
      contentError.value = null

      await fetchBookDetails(id)
      if (bookData.value) {
        await fetchChapters(id)
      }
    } else {
      bookError.value = 'Invalid Book ID provided.'
      isLoadingBook.value = false
    }
  },
  { immediate: true },
)
</script>
