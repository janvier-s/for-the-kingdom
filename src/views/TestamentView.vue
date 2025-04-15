<template>
  <div class="testament-view">
    <header v-if="isLoading">
      <h1>Loading Testament...</h1>
    </header>
    <header v-else-if="error">
      <h1 class="error-message">Error: {{ error }}</h1>
    </header>
    <header v-else-if="testamentName">
      <h1>{{ testamentName }}</h1>
    </header>
    <header v-else>
      <h1>Testament</h1>
    </header>

    <main>
      <TestamentTypeList
        v-if="actualTestamentId && testamentSlug"
        :testament-id="actualTestamentId"
        :testament-slug="testamentSlug"
      />
      <p v-else-if="!isLoading && !error">Could not load details for this testament.</p>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'
import TestamentTypeList from '../components/TestamentTypeList.vue'

const props = defineProps({
  testamentSlug: {
    type: String,
    required: true,
  },
})

const testamentSlug = ref(props.testamentSlug)
const testamentName = ref('')
const actualTestamentId = ref(null)
const isLoading = ref(true)
const error = ref(null)

const getLanguageId = async (langName) => {
  try {
    const { data, error: langError } = await supabase
      .from('languages')
      .select('lang_id')
      .eq('lang', langName)
      .single()

    if (langError) throw langError
    if (!data) throw new Error(`Language '${langName}' not found in database.`)

    return data.lang_id
  } catch (err) {
    console.error(`Error fetching language ID for ${langName}:`, err)
    throw new Error(`Failed to find language ID for ${langName}. ${err.message}`)
  }
}

const fetchTestamentDetailsBySlug = async (slug) => {
  if (!slug) {
    error.value = 'No testament identifier provided.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null
  testamentName.value = ''
  actualTestamentId.value = null

  try {
    const frenchLangId = await getLanguageId('Français')

    const { data, error: fetchError } = await supabase
      .from('testament_translations')
      .select('name, testament_id')
      .eq('slug', slug)
      .eq('lang_id', frenchLangId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error(`Testament with slug '${slug}' not found for the selected language.`)
      }
      throw fetchError
    }

    if (data) {
      testamentName.value = data.name
      actualTestamentId.value = data.testament_id
    } else {
      throw new Error(`Testament with slug '${slug}' not found.`)
    }
  } catch (err) {
    console.error('Error fetching testament details by slug:', err)
    error.value = err.message || 'Failed to load testament details.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.testamentSlug,
  (newSlug) => {
    testamentSlug.value = newSlug
    fetchTestamentDetailsBySlug(newSlug)
  },
  { immediate: true },
)
</script>

<style scoped>
.testament-view {
  padding: 1rem;
}
header {
  text-align: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
header h1 {
  color: var(--primary-color);
}
.error-message {
  color: var(--error-color);
}
main p {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 2rem;
}
</style>
