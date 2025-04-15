<template>
  <div>
    <h2>Verses for Chapter {{ chapterNumber }}</h2>
    <div v-if="verses.length === 0">No verses found.</div>
    <ul v-else>
      <li v-for="verse in verses" :key="verse.verse_id">
        <strong>{{ verse.verse_number }}.</strong> {{ verse.verse_text }}
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { fetchVerses } from '@/api/bibleData.js'
import supabase from '@/supabase'

export default {
  name: 'VersesList',
  props: ['chapterId', 'versionId'],
  setup(props) {
    const verses = ref([])
    const chapterNumber = ref(null)

    const loadChapterNumber = async () => {
      if (!props.chapterId) {
        chapterNumber.value = null
        return
      }
      try {
        const { data, error } = await supabase
          .from('chapters')
          .select('chapter_number')
          .eq('chapter_id', Number(props.chapterId))
          .single()
        if (error) throw error
        chapterNumber.value = data.chapter_number
      } catch (error) {
        console.error('Failed to load chapter number:', error)
      }
    }

    const loadVerses = async () => {
      if (!props.chapterId || !props.versionId) {
        verses.value = []
        return
      }
      try {
        verses.value = await fetchVerses(Number(props.chapterId), Number(props.versionId))
      } catch (error) {
        console.error('Failed to load verses:', error)
      }
    }

    onMounted(() => {
      loadChapterNumber()
      loadVerses()
    })

    watch(
      () => [props.chapterId, props.versionId],
      () => {
        loadChapterNumber() // Load chapter number when changes
        loadVerses()
      },
      { immediate: true }, // Execute immediately upon creation
    )

    return { verses, chapterNumber } // Return chapterNumber
  },
}
</script>
