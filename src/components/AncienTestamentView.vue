<template>
  <h2>Types of Ancien Testament</h2>

  <p
    v-for="table in tables"
    :key="table"
    @click="selectTable(table)"
    :class="{ active: selectedTable === table }"
    class="table-button"
  >
    {{ table }}
  </p>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../supabase'

const tables = ref([])
const selectedTable = ref(null)
const tableData = ref([])
const isLoadingTables = ref(true)
const isLoadingData = ref(false)
const tableError = ref(null)
const dataError = ref(null)

// Fetch available tables from Supabase
const fetchTables = async () => {
  isLoadingTables.value = true
  tableError.value = null

  try {
    // Query the 'types' table to fetch its data
    const { data, error } = await supabase.from('types').select('name').eq('testament_id', 1)

    if (error) throw error

    // Use the fetched data to populate the tables array
    tables.value = data.map((type) => type.name)
    console.log('Available types:', tables.value)

    // If types exist, select the first one by default
    if (tables.value.length > 0) {
      selectTable(tables.value[0])
    }
  } catch (err) {
    tableError.value = err.message || 'Failed to fetch types'
    console.error('Error fetching types:', err)
  } finally {
    isLoadingTables.value = false
  }
}

// Select a table and fetch its data
const selectTable = async (tableName) => {
  selectedTable.value = tableName
  fetchTableData(tableName)
}

// Fetch data from the selected table
const fetchTableData = async (tableName) => {
  isLoadingData.value = true
  dataError.value = null

  try {
    const { data, error } = await supabase.from('types').select('name').eq('name', tableName)

    if (error) throw error

    tableData.value = data
    console.log(`Data from ${tableName}:`, data)
  } catch (err) {
    dataError.value = err.message || `Failed to fetch data from ${tableName}`
    console.error(`Error fetching data from ${tableName}:`, err)
    tableData.value = []
  } finally {
    isLoadingData.value = false
  }
}

// Initialize component
onMounted(() => {
  fetchTables()
})
</script>
