// components/TestamentTypeList.vue
<template>
  <div class="testament-type-list">
    <!-- Add console log here to check received props -->
    {{ logReceivedProps() }}
    <p v-if="isLoading">Loading types...</p>
    <p v-else-if="error">Error loading types: {{ error }}</p>
    <!-- Display specific error -->
    <div v-else-if="types.length > 0">
      <router-link
        v-for="type in types"
        :key="type.slug"
        :to="{
          name: 'type-detail-by-slug',
          params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
        }"
        class="type-link"
      >
        {{ type.name }}
      </router-link>
    </div>
    <p v-else>No types found for this testament.</p>
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

const fetchTypes = async (id) => {
  // Add detailed logging
  console.log(`TestamentTypeList: fetchTypes called with ID: ${id}`) // 1. Log entry

  if (typeof id !== 'number' || isNaN(id)) {
    // 2. Validate ID early
    types.value = []
    error.value = `Invalid Testament ID received: ${id}`
    isLoading.value = false
    console.error(error.value)
    return
  }

  isLoading.value = true
  error.value = null
  types.value = []

  try {
    console.log(`TestamentTypeList: Querying Supabase for types with testament_id = ${id}`) // 3. Log before query
    const { data, error: fetchError } = await supabase
      .from('types')
      .select('name, slug')
      .eq('testament_id', id)

    // 4. Log Supabase response
    console.log(`TestamentTypeList: Supabase response for ID ${id}:`, { data, fetchError })

    if (fetchError) {
      console.error(`TestamentTypeList: Supabase error for ID ${id}:`, fetchError) // 5. Log error object
      throw fetchError // Throw to be caught below
    }

    // 6. Log successful data
    console.log(`TestamentTypeList: Successfully fetched data for ID ${id}:`, data)
    types.value = data
  } catch (err) {
    // 7. Log caught error
    console.error(`TestamentTypeList: CATCH block error for ID ${id}:`, err)
    error.value = err.message || `Failed to fetch types for Testament ID ${id}`
  } finally {
    // 8. Log before setting isLoading false
    console.log(`TestamentTypeList: FINALLY block for ID ${id}. Setting isLoading to false.`)
    isLoading.value = false
  }
}

// Helper function for logging received props in template
const logReceivedProps = () => {
  console.log(`TestamentTypeList rendering. Received props:`, props)
}

watch(
  () => props.testamentId,
  (newId) => {
    fetchTypes(newId) // Make sure newId is actually a number here
  },
  { immediate: true },
)
</script>

<style scoped>
/* ... styles ... */
</style>
