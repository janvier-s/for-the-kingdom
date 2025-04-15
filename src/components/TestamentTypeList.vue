<template>
  <div class="testament-type-list">
    <p v-if="isLoading">Loading types...</p>
    <p v-else-if="error">{{ error }}</p>
    <div v-else-if="types.length > 0">
      <router-link
        v-for="type in types"
        :key="type"
        :to="{ name: 'type-detail', params: { typeName: type } }"
        class="type-link"
      >
        {{ type }}
      </router-link>
    </div>
    <p v-else>No types found for this testament.</p>
  </div>
</template>

<script setup>
// REMOVE onMounted from here
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'

// Define the props this component expects
const props = defineProps({
  testamentId: {
    type: Number, // Expecting a number
    required: true, // This prop is mandatory
  },
})

const types = ref([])
const isLoading = ref(true)
const error = ref(null)

// Function to fetch types based on the testamentId prop
const fetchTypes = async (id) => {
  if (!id) {
    types.value = []
    error.value = 'Invalid Testament ID provided.'
    isLoading.value = false
    return
  }
  isLoading.value = true
  error.value = null
  types.value = [] // Clear previous types

  try {
    const { data, error: fetchError } = await supabase
      .from('types')
      .select('name')
      .eq('testament_id', id) // Use the testamentId from props

    if (fetchError) {
      throw fetchError
    }

    types.value = data.map((type) => type.name)
    console.log(`Available types for testament ${id}:`, types.value)
  } catch (err) {
    console.error(`Error fetching types for testament ${id}:`, err)
    error.value = err.message || 'Failed to fetch types'
  } finally {
    isLoading.value = false
  }
}

// Watch the testamentId prop for changes
watch(
  () => props.testamentId,
  (newId) => {
    fetchTypes(newId)
  },
  { immediate: true }, // Fetch immediately when the component mounts/prop is first set
)
</script>

<style scoped>
.type-link {
  display: block; /* Make the link take up the full width */
  padding: 8px 16px;
  margin: 5px;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 4px;
  text-decoration: none; /* Remove underline from links */
  color: #333; /* Set link color */
}

.type-link:hover {
  background-color: #f0f0f0;
}
</style>
