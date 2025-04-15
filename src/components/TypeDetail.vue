<template>
  <div class="type-detail">
    <h2>Type Detail</h2>
    <p>Type Name: {{ typeName }}</p>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  typeName: {
    type: String,
    required: true,
  },
})

const typeData = ref(null)
const isLoading = ref(false)
const error = ref(null)

const fetchTypeData = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('types')
      .select('*') // Or select specific columns you need
      .eq('name', props.typeName)
      .single() // Expect only one result

    if (fetchError) {
      console.error('Error fetching type data:', fetchError)
      error.value = fetchError.message
      return
    }

    typeData.value = data
    console.log('Type data:', data)
  } catch (err) {
    console.error('Unexpected error fetching type data:', err)
    error.value = err.message || 'Failed to fetch type data'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchTypeData()
})
</script>

<style scoped>
.type-detail {
  padding: 20px;
  border: 1px solid #ccc;
  margin: 20px;
}
</style>
