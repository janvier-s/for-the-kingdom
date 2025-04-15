// views/TestamentView.vue
<template>
  <div class="testament-view">
    <header v-if="!isLoading && !error">
      <h1>{{ testamentName }} Testament</h1>
    </header>
    <header v-else-if="isLoading">
      <h1>Loading...</h1>
    </header>
    <header v-else-if="error">
      <h1 class="error-message">Error: {{ error }}</h1>
    </header>

    <main>
      <TestamentTypeList
        v-if="testamentId && testamentSlug"
        :testament-id="testamentId"
        :testament-slug="testamentSlug"
      />
      <p v-else-if="!isLoading">Missing testament data to load types.</p>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'
import TestamentTypeList from '../components/TestamentTypeList.vue'

const props = defineProps({
  testamentId: {
    type: [Number, String], // Route params can initially be strings
    required: true,
  },
  testamentSlug: {
    type: String,
    required: true,
  },
})

const testamentId = ref(Number(props.testamentId))
const testamentSlug = ref(props.testamentSlug)
const testamentName = ref('')
const isLoading = ref(true)
const error = ref(null)

const fetchTestamentDetails = async (id) => {
  if (!id) return
  isLoading.value = true
  error.value = null
  testamentName.value = ''

  try {
    const { data, error: fetchError } = await supabase
      .from('testaments')
      .select('name')
      .eq('testament_id', id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (data) {
      testamentName.value = data.name
    } else {
      throw new Error(`Testament with ID ${id} not found.`)
    }
  } catch (err) {
    console.error('Error fetching testament details:', err)
    error.value = err.message || 'Failed to load testament details.'
  } finally {
    isLoading.value = false
  }
}

// Watch for changes in the route parameter 'testamentId'
watch(
  () => props.testamentId,
  (newId) => {
    const idAsNumber = Number(newId)
    if (!isNaN(idAsNumber)) {
      testamentId.value = idAsNumber
      testamentSlug.value = props.testamentSlug
      fetchTestamentDetails(idAsNumber)
    } else {
      error.value = 'Invalid Testament ID received.'
      isLoading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.testament-view {
  padding: 20px;
}
header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.error-message {
  color: red;
}
</style>
