<template>
  <div class="home-view container">
    <h1>Testaments de la Bible</h1>

    <div v-if="isLoading" class="loading-text">Loading testament information...</div>
    <div v-else-if="error" class="error-box">Error loading testaments: {{ error }}</div>

    <section v-else-if="displayTestaments.length > 0" class="testament-sections">
      <div
        v-for="testament in displayTestaments"
        :key="testament.testament_id"
        class="testament-section card-link"
        @click="goToTestament(testament.slug)"
        role="link"
        tabindex="0"
        @keydown.enter="goToTestament(testament.slug)"
      >
        <h2>{{ testament.name }}</h2>
      </div>
    </section>

    <p v-else style="text-align: center; color: var(--text-secondary)">
      No testaments found in the database for the selected language.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../supabase'

const router = useRouter()
const rawTestamentTranslations = ref([])
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

const fetchTestamentsData = async () => {
  isLoading.value = true
  error.value = null
  rawTestamentTranslations.value = []

  try {
    const frenchLangId = await getLanguageId('Français')

    const { data: translationsData, error: fetchError } = await supabase
      .from('testament_translations')
      .select(
        `
        name,
        slug,
        testament_id,
        testaments ( testament_id )
      `,
      )
      .eq('lang_id', frenchLangId)
      .order('testament_id')

    if (fetchError) throw fetchError

    rawTestamentTranslations.value = translationsData || []
  } catch (err) {
    console.error('Error fetching testaments data:', err)
    error.value = err.message || 'Failed to load testament list.'
  } finally {
    isLoading.value = false
  }
}

const displayTestaments = computed(() => {
  return rawTestamentTranslations.value
    .map((item) => ({
      testament_id: item.testament_id || item.testaments?.testament_id,
      name: item.name,
      slug: item.slug,
    }))
    .filter((item) => item.testament_id != null)
})

const goToTestament = (slug) => {
  if (!slug) {
    console.error('Cannot navigate: slug is undefined')
    error.value = 'Navigation error: Missing identifier for the selected testament.'
    return
  }
  router.push({ name: 'testament-detail', params: { testamentSlug: slug } })
}

onMounted(() => {
  fetchTestamentsData()
})
</script>

<style scoped>
.home-view {
  padding: 2rem 1rem;
}

.testament-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.testament-section {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-medium);
  padding: 1.5rem;
  text-align: center;
  background-color: var(--card-bg);
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  cursor: pointer;
}

.testament-section:hover,
.testament-section:focus {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.testament-section h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.4rem;
}

.loading-text,
.error-box {
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
}

.error-box {
  color: var(--error-color);
  background-color: var(--error-bg);
  border: 1px solid var(--error-color);
  border-radius: var(--border-radius-medium);
}
</style>
