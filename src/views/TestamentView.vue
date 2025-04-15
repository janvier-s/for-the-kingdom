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
      <!-- Pass the testamentId as a prop -->
      <TestamentTypeList :testament-id="testamentId" />
    </main>
  </div>
</template>

<script setup>
// REMOVE onMounted from here
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import supabase from '../supabase'
import TestamentTypeList from '../components/TestamentTypeList.vue'

const route = useRoute()
const testamentId = ref(null)
const testamentName = ref('')
const isLoading = ref(true)
const error = ref(null)

// Function to fetch testament details (including the name)
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
  () => route.params.testamentId,
  (newId) => {
    const idAsNumber = Number(newId)
    if (!isNaN(idAsNumber)) {
      testamentId.value = idAsNumber
      fetchTestamentDetails(idAsNumber)
    } else {
      error.value = 'Invalid Testament ID in URL.'
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
