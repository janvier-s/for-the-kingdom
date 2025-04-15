<template>
  <div>
    <h2>Chapters for Book {{ bookId }}</h2>
    <ul>
      <li v-for="chapter in chapters" :key="chapter.chapter_id">
        <router-link
          :to="{
            name: 'Verses',
            params: { bookId: bookId, chapterId: chapter.chapter_id, versionId: selectedVersionId },
          }"
        >
          Chapter {{ chapter.chapter_number }}
        </router-link>
      </li>
    </ul>
    <div>
      <label for="version-select">Select Version:</label>
      <select id="version-select" v-model="selectedVersionId">
        <option v-for="version in versions" :key="version.version_id" :value="version.version_id">
          {{ version.abbr }} - {{ version.full_name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { fetchChapters } from '@/api/bibleData.js'

export default {
  name: 'ChaptersList',
  props: ['bookId'],
  setup(props) {
    const chapters = ref([])
    const versions = ref([
      { version_id: 1, abbr: 'KJV', full_name: 'King James Version' },
      { version_id: 2, abbr: 'NIV', full_name: 'New International Version' },
    ]) // Example versions, adjust as needed
    const selectedVersionId = ref(versions.value[0].version_id)

    const loadChapters = async () => {
      try {
        chapters.value = await fetchChapters(Number(props.bookId))
      } catch (error) {
        console.error('Failed to load chapters:', error)
      }
    }

    onMounted(() => {
      loadChapters()
    })

    watch(
      () => props.bookId,
      () => {
        loadChapters()
      },
    )

    return {
      chapters,
      versions,
      selectedVersionId,
    }
  },
}
</script>
