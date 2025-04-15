<template>
  <div class="testament-type-list">
    <p v-if="isLoading" class="loading-text">Loading types...</p>
    <p v-else-if="error" class="error-box">Error loading types: {{ error }}</p>
    <div v-else-if="types.length > 0">
      <router-link
        v-for="type in types"
        :key="type.type_id"
        :to="{
          name: 'type-detail-by-slug',
          params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
        }"
        class="type-link list-item-link"
      >
        {{ type.name }}
      </router-link>
    </div>
    <p v-else style="text-align: center; color: var(--text-secondary)">
      No specific book types found listed under this testament.
    </p>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  testamentId: {
    type: Number,
    required: true,
  },
  testamentSlug: {
    type: String,
    required: true,
  },
})

const types = ref([])
const isLoading = ref(true)
const error = ref(null)
const frenchLangId = ref(null)

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

const fetchTypesForTestament = async (testamentId) => {
  if (typeof testamentId !== 'number' || isNaN(testamentId)) {
    error.value = `Invalid Testament ID received: ${testamentId}`
    isLoading.value = false
    console.error(error.value)
    types.value = []
    return
  }

  isLoading.value = true
  error.value = null
  types.value = []

  try {
    const langId = await getLanguageId('Français')

    const { data: bookTypeData, error: bookTypeError } = await supabase
      .from('books')
      .select('type_id')
      .eq('testament_id', testamentId)
      .not('type_id', 'is', null)

    if (bookTypeError) throw bookTypeError

    const distinctTypeIds = [
      ...new Set(bookTypeData.map((item) => item.type_id).filter((id) => id !== null)),
    ]

    if (distinctTypeIds.length === 0) {
      isLoading.value = false
      return
    }

    const { data: typeTranslationsData, error: translationError } = await supabase
      .from('type_translations')
      .select('name, slug, type_id')
      .in('type_id', distinctTypeIds)
      .eq('lang_id', langId)
      .order('name')

    if (translationError) throw translationError

    types.value = typeTranslationsData || []
  } catch (err) {
    console.error('Error fetching types for testament:', err)
    error.value = err.message || `Failed to fetch types for Testament ID ${testamentId}`
    types.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.testamentId,
  (newId) => {
    fetchTypesForTestament(newId)
  },
  { immediate: true },
)
</script>

<style scoped>
/* Add relevant styles */
.testament-type-list {
  padding-top: 1rem;
}
.type-link {
  display: block;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  text-decoration: none;
  color: var(--text-primary);
  background-color: var(--card-bg);
  transition: background-color 0.2s ease;
}
.type-link:hover {
  background-color: var(--hover-bg);
}
.loading-text,
.error-box {
  text-align: center;
  padding: 1rem;
}
.error-box {
  color: var(--error-color);
  background-color: var(--error-bg-light); /* Assuming a light error bg */
  border: 1px solid var(--error-color);
  border-radius: var(--border-radius-small);
}
</style>
