<template>
  <div>
    <h1>Bible App</h1>
    <select v-model="selectedBookId" @change="loadChapters">
      <option v-for="book in books" :key="book.book_id" :value="book.book_id">
        {{ book.title }}
      </option>
    </select>

    <select v-model="selectedChapterId" v-if="chapters.length > 0" @change="loadVerses">
      <option v-for="chapter in chapters" :key="chapter.chapter_id" :value="chapter.chapter_id">
        Chapter {{ chapter.chapter_number }}
      </option>
    </select>

    <select v-model="selectedVersionId" v-if="versions.length > 0" @change="loadVerses">
      <option v-for="version in versions" :key="version.version_id" :value="version.version_id">
        {{ version.abbr }} - {{ version.full_name }}
      </option>
    </select>

    <div v-if="verses.length > 0">
      <p v-for="verse in verses" :key="verse.verse_id">
        {{ verse.verse_number }}. {{ verse.verse_text }}
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import supabase from '@/supabase'
import { fetchBooks, fetchChapters, fetchVerses } from '@/api/bibleData.js' // Import the functions

export default {
  setup() {
    const books = ref([])
    const chapters = ref([])
    const verses = ref([])
    const versions = ref([]) // Add versions

    const selectedBookId = ref(null)
    const selectedChapterId = ref(null)
    const selectedVersionId = ref(1) // Set a default Version ID (e.g., KJV)

    const loadBooks = async () => {
      try {
        const data = await fetchBooks() // Use the fetchBooks function
        books.value = data
      } catch (error) {
        console.error('Error loading books:', error)
        // Handle the error in the UI (e.g., display an error message)
      }
    }

    const loadChapters = async () => {
      if (!selectedBookId.value) return

      try {
        const data = await fetchChapters(selectedBookId.value) // Use fetchChapters
        chapters.value = data
        selectedChapterId.value = null
        verses.value = []
      } catch (error) {
        console.error('Error loading chapters:', error)
        // Handle the error
      }
    }

    const loadVerses = async () => {
      if (!selectedChapterId.value) return

      try {
        const data = await fetchVerses(selectedChapterId.value, selectedVersionId.value) // Use fetchVerses
        verses.value = data
      } catch (error) {
        console.error('Error loading verses:', error)
        // Handle the error
      }
    }

    const loadVersions = async () => {
      try {
        const { data, error } = await supabase.from('versions').select('*')

        if (error) {
          console.error('Error loading versions:', error)
          return
        }
        versions.value = data
      } catch (err) {
        console.error('Unexpected error loading versions:', err)
      }
    }

    onMounted(() => {
      loadBooks()
      loadVersions() // Load the versions
    })

    return {
      books,
      chapters,
      verses,
      versions,
      selectedBookId,
      selectedChapterId,
      selectedVersionId,
      loadChapters,
      loadVerses,
    }
  },
}
</script>
