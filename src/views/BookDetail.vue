<template>
  <div class="book-detail">
    <header v-if="isLoadingBook">Loading book details...</header>
    <header v-else-if="bookError" class="error-message">Error loading book: {{ bookError }}</header>
    <header v-else-if="bookTitle">
      <h1>{{ bookTitle }}</h1>
      <div v-if="availableVersions.length > 1" class="version-selector">
        <label for="versionSelect">Version: </label>
        <select id="versionSelect" v-model="selectedVersionId" @change="handleVersionChange">
          <option
            v-for="version in availableVersions"
            :key="version.version_id"
            :value="version.version_id"
          >
            {{ version.abbr }} ({{ version.full_name }})
          </option>
        </select>
      </div>
      <div v-else-if="availableVersions.length === 1">
        <p>Version: {{ availableVersions[0].abbr }}</p>
      </div>
    </header>
    <header v-else>
      <h1 class="error-message">Book not found.</h1>
    </header>

    <main v-if="actualBookId">
      <div v-if="chapters.length > 1" class="chapter-nav">
        <button @click="changeChapter(-1)" :disabled="selectedChapterNumber <= 1">&lt; Prev</button>
        <span>Chapter {{ selectedChapterNumber }} of {{ chapters.length }}</span>
        <button @click="changeChapter(1)" :disabled="selectedChapterNumber >= chapters.length">
          Next >
        </button>
      </div>
      <h2 v-else-if="chapters.length === 1">Chapter {{ selectedChapterNumber }}</h2>

      <div v-if="isLoadingContent" class="loading">Loading content...</div>
      <div v-else-if="contentError" class="error-message">
        Error loading content: {{ contentError }}
      </div>
      <div v-else-if="verses.length > 0">
        <div class="verses-container">
          <p v-for="verse in verses" :key="verse.verse_id" class="verse">
            <sup>{{ verse.verse_number }}</sup> {{ verse.verse_text }}
          </p>
        </div>
      </div>
      <p v-else>No verses found for Chapter {{ selectedChapterNumber }} in the selected version.</p>
    </main>
    <div v-else-if="!isLoadingBook && !bookError">
      <p>Could not determine book details to load content.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  bookSlug: {
    type: String,
    required: true,
  },
  testamentSlug: { type: String, required: false },
  typeSlug: { type: String, required: false },
})

const bookTitle = ref('')
const actualBookId = ref(null)
const chapters = ref([])
const verses = ref([])
const selectedChapterId = ref(null)
const selectedChapterNumber = ref(1)
const availableVersions = ref([])
const selectedVersionId = ref(null)
const frenchLangId = ref(null)

const isLoadingBook = ref(true)
const bookError = ref(null)
const isLoadingContent = ref(false)
const contentError = ref(null)

const getLanguageId = async (langName) => {
  if (frenchLangId.value) return frenchLangId.value
  try {
    const { data, error: langError } = await supabase
      .from('languages')
      .select('lang_id')
      .eq('lang', langName)
      .single()
    if (langError) throw langError
    if (!data) throw new Error(`Language '${langName}' not found.`)
    frenchLangId.value = data.lang_id
    return data.lang_id
  } catch (err) {
    console.error(`Error fetching language ID for ${langName}:`, err)
    throw new Error(`Failed to find language ID for ${langName}. ${err.message}`)
  }
}

const getAvailableVersions = async (langId) => {
  if (!langId) return []
  try {
    const { data, error } = await supabase
      .from('versions')
      .select('version_id, abbr, full_name')
      .eq('lang_id', langId)
      .order('abbr')
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching available versions:', err)
    contentError.value = contentError.value
      ? `${contentError.value} | Failed to load versions.`
      : 'Failed to load versions.'
    return []
  }
}

const fetchBookDetailsAndInitialContent = async (slug) => {
  isLoadingBook.value = true
  isLoadingContent.value = true
  bookError.value = null
  contentError.value = null
  bookTitle.value = ''
  actualBookId.value = null
  chapters.value = []
  verses.value = []
  selectedChapterId.value = null
  selectedChapterNumber.value = 1
  availableVersions.value = []
  selectedVersionId.value = null

  try {
    const langId = await getLanguageId('Français')
    const versionsPromise = getAvailableVersions(langId)

    const { data: bookTransData, error: bookFetchError } = await supabase
      .from('book_translations')
      .select('title, book_id')
      .eq('slug', slug)
      .eq('lang_id', langId)
      .single()

    if (bookFetchError) {
      if (bookFetchError.code === 'PGRST116') {
        throw new Error(`Book '${slug}' not found.`)
      }
      throw bookFetchError
    }
    if (!bookTransData) throw new Error(`Book '${slug}' not found.`)

    bookTitle.value = bookTransData.title
    actualBookId.value = bookTransData.book_id

    availableVersions.value = await versionsPromise
    const defaultVersion =
      availableVersions.value.find((v) => v.abbr === 'LSG') || availableVersions.value[0]
    if (defaultVersion) {
      selectedVersionId.value = defaultVersion.version_id
    } else {
      contentError.value = 'No Bible version found.'
      isLoadingContent.value = false
      isLoadingBook.value = false
      return
    }

    await fetchChapters(actualBookId.value)

    if (selectedChapterId.value && selectedVersionId.value) {
      await fetchVerses(selectedChapterId.value, selectedVersionId.value)
    } else if (chapters.value.length === 0) {
      contentError.value = contentError.value
        ? `${contentError.value} | No chapters.`
        : 'No chapters.'
    } else {
      contentError.value = contentError.value
        ? `${contentError.value} | No initial verses.`
        : 'No initial verses.'
    }
  } catch (err) {
    console.error('Error fetching book details/content:', err)
    bookError.value = err.message || 'Failed to load book data.'
    isLoadingContent.value = false
  } finally {
    isLoadingBook.value = false
  }
}

const fetchChapters = async (bookId) => {
  contentError.value = null
  chapters.value = []
  selectedChapterId.value = null
  verses.value = []

  if (!bookId) return

  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('chapter_id, chapter_number')
      .eq('book_id', bookId)
      .order('chapter_number')

    if (error) throw error
    chapters.value = data || []

    const targetChapter =
      chapters.value.find((ch) => ch.chapter_number === selectedChapterNumber.value) ||
      chapters.value[0]
    if (targetChapter) {
      selectedChapterId.value = targetChapter.chapter_id
      selectedChapterNumber.value = targetChapter.chapter_number
    }
  } catch (err) {
    console.error('Error fetching chapters:', err)
    contentError.value = err.message || 'Failed to load chapters.'
    isLoadingContent.value = false
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
    verses.value = data || []
  } catch (err) {
    console.error('Error fetching verses:', err)
    contentError.value = err.message || 'Failed to load verses.'
  } finally {
    isLoadingContent.value = false
  }
}

const handleVersionChange = () => {
  if (selectedChapterId.value && selectedVersionId.value) {
    fetchVerses(selectedChapterId.value, selectedVersionId.value)
  }
}

const changeChapter = (direction) => {
  const currentIdx = chapters.value.findIndex((ch) => ch.chapter_id === selectedChapterId.value)
  const newIdx = currentIdx + direction
  if (newIdx >= 0 && newIdx < chapters.value.length) {
    const newChapter = chapters.value[newIdx]
    selectedChapterId.value = newChapter.chapter_id
    selectedChapterNumber.value = newChapter.chapter_number
    if (selectedVersionId.value) {
      fetchVerses(selectedChapterId.value, selectedVersionId.value)
    }
  }
}

watch(
  () => props.bookSlug,
  (newSlug) => {
    if (newSlug) {
      fetchBookDetailsAndInitialContent(newSlug)
    } else {
      bookError.value = 'Invalid Book identifier provided.'
      isLoadingBook.value = false
      isLoadingContent.value = false
      bookTitle.value = ''
      actualBookId.value = null
      chapters.value = []
      verses.value = []
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* Keep existing styles */
.book-detail {
  padding: 1rem;
}
header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}
header h1 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}
.version-selector {
  margin-top: 0.5rem;
  font-size: 0.9em;
}
.chapter-nav {
  text-align: center;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}
.chapter-nav span {
  font-weight: bold;
}
main h2 {
  text-align: center;
  margin-bottom: 1rem;
  font-weight: normal;
  color: var(--text-secondary);
}
.verses-container {
  margin-top: 1rem;
  line-height: 1.8;
}
.verse {
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}
.verse sup {
  font-weight: bold;
  margin-right: 0.5em;
  color: var(--primary-color);
  font-size: 0.8em;
}
.loading,
.error-message {
  text-align: center;
  padding: 2rem;
  margin-top: 1rem;
}
.error-message {
  color: var(--error-color);
}
</style>
