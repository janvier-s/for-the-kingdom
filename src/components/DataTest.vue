<template>
  <div class="data-test">
    <h2>Supabase Database Explorer</h2>

    <div v-if="isLoadingTables" class="loading">
      <p>Discovering available tables...</p>
    </div>

    <div v-else-if="tableError" class="error-message">
      <p>Error fetching tables: {{ tableError }}</p>
    </div>

    <div v-else-if="tables.length > 0" class="tables-container">
      <h3>Available Tables</h3>
      <div class="table-selector">
        <button
          v-for="table in tables"
          :key="table"
          @click="selectTable(table)"
          :class="{ active: selectedTable === table }"
          class="table-button"
        >
          {{ table }}
        </button>
      </div>

      <div v-if="selectedTable" class="selected-table">
        <h3>Data from {{ selectedTable }}</h3>

        <div v-if="isLoadingData" class="loading">
          <p>Loading data...</p>
        </div>

        <div v-else-if="dataError" class="error-message">
          <p>Error: {{ dataError }}</p>
        </div>

        <div v-else-if="tableData && tableData.length > 0" class="data-container">
          <!-- Display data as a table -->
          <table>
            <thead>
              <tr>
                <th v-for="(value, key) in tableData[0]" :key="key">{{ key }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in tableData" :key="index">
                <td v-for="(value, key) in item" :key="`${index}-${key}`">
                  {{ typeof value === 'object' ? JSON.stringify(value) : value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-data">
          <p>No data found in table "{{ selectedTable }}"</p>
        </div>
      </div>
    </div>

    <div v-else class="no-tables">
      <p>No tables found in your Supabase database.</p>
      <p>You may need to create tables or check your permissions.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../supabase'

// State
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
    // Query the 'books' table to fetch its data
    const { data, error } = await supabase.from('books').select('title')

    if (error) throw error

    // Use the fetched data to populate the tables array
    tables.value = data.map((book) => book.title)
    console.log('Available books:', tables.value)

    // If books exist, select the first one by default
    if (tables.value.length > 0) {
      selectTable(tables.value[0])
    }
  } catch (err) {
    tableError.value = err.message || 'Failed to fetch books'
    console.error('Error fetching books:', err)
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
    const { data, error } = await supabase.from(tableName).select('*').limit(10)

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

<style scoped>
.data-test {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.error-message {
  padding: 10px;
  background-color: #ffdddd;
  border-left: 6px solid #f44336;
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  margin: 20px 0;
  color: #666;
}

.table-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.table-button {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.table-button:hover {
  background-color: #e0e0e0;
}

.table-button.active {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}

.selected-table {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.data-container {
  margin-top: 10px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

tr:hover {
  background-color: #f5f5f5;
}

.no-data,
.no-tables {
  text-align: center;
  margin: 30px 0;
  color: #666;
  font-style: italic;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
</style>
