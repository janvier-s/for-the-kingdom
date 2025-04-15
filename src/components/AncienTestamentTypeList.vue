<template>
  <div class="ancien-testament-type-list">
    <router-link
      v-for="type in types"
      :key="type"
      :to="{ name: 'type-detail', params: { typeName: type } }"
      class="type-link"
    >
      {{ type }}
    </router-link>
    <p v-if="isLoadingTables">Loading types...</p>
    <p v-if="tableError">{{ tableError }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../supabase'
// REMOVE: import { useRouter } from 'vue-router'

// REMOVE: const router = useRouter()
const types = ref([])
const isLoadingTables = ref(true)
const tableError = ref(null)

// Fetch available types from Supabase
const fetchTypes = async () => {
  isLoadingTables.value = true
  tableError.value = null

  try {
    // Query the 'types' table to fetch its data
    const { data, error } = await supabase.from('types').select('name').eq('testament_id', 1)

    if (error) throw error

    // Use the fetched data to populate the types array
    types.value = data.map((type) => type.name)
    console.log('Available types:', types.value)
  } catch (err) {
    tableError.value = err.message || 'Failed to fetch types'
    console.error('Error fetching types:', err)
  } finally {
    isLoadingTables.value = false
  }
}

onMounted(() => {
  fetchTypes()
})
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
