<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <script src="https://unpkg.com/pinia@2.1.7/dist/pinia.iife.prod.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app" class="min-h-screen bg-gray-100">
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Content Management Admin Panel</h1>

      <!-- Role Toggle -->
      <div class="mb-4">
        <label class="mr-2">Current Role:</label>
        <select v-model="userRole" class="border p-2 rounded">
          <option value="contributor">Contributor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <!-- Contributor View: List and Edit Content -->
      <div v-if="userRole === 'contributor'" class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Edit Content</h2>
        <div class="grid gap-4">
          <div v-for="content in publishedContent" :key="content.id" class="bg-white p-4 rounded shadow">
            <h3 class="font-bold">{{ content.title }}</h3>
            <p class="text-gray-600">{{ content.body.substring(0, 100) }}...</p>
            <button @click="startEditing(content)" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Edit</button>
          </div>
        </div>

        <!-- Edit Form -->
        <div v-if="editingContent" class="mt-4 bg-white p-4 rounded shadow">
          <h3 class="text-lg font-semibold mb-2">Editing: {{ editingContent.title }}</h3>
          <div class="mb-4">
            <label class="block font-medium">Title</label>
            <input v-model="editingContent.title" class="w-full border p-2 rounded" />
          </div>
          <div class="mb-4">
            <label class="block font-medium">Body</label>
            <textarea v-model="editingContent.body" class="w-full border p-2 rounded" rows="5"></textarea>
          </div>
          <button @click="submitChanges" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Submit for Review</button>
          <button @click="cancelEditing" class="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
        </div>
      </div>

      <!-- Admin View: Review Pending Changes -->
      <div v-if="userRole === 'admin'" class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Pending Changes</h2>
        <div v-if="pendingChanges.length === 0" class="bg-white p-4 rounded shadow">
          <p>No pending changes to review.</p>
        </div>
        <div v-for="change in pendingChanges" :key="change.id" class="bg-white p-4 rounded shadow mb-4">
          <h3 class="font-bold">Original: {{ change.original.title }}</h3>
          <p class="text-gray-600">Proposed Title: {{ change.proposed.title }}</p>
          <p class="text-gray-600">Proposed Body: {{ change.proposed.body.substring(0, 100) }}...</p>
          <button @click="approveChange(change)" class="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Approve</button>
          <button @click="rejectChange(change)" class="mt-2 ml-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Reject</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const { createApp } = Vue
    const { createPinia, defineStore } = Pinia

    // Mock backend API
    const mockApi = {
      async getPublishedContent() {
        return [
          { id: 1, title: "Article 1", body: "This is the first article content." },
          { id: 2, title: "Article 2", body: "This is the second article content." }
        ]
      },
      async getPendingChanges() {
        return JSON.parse(localStorage.getItem('pendingChanges') || '[]')
      },
      async savePendingChange(change) {
        const changes = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
        changes.push(change)
        localStorage.setItem('pendingChanges', JSON.stringify(changes))
      },
      async updateContent(content) {
        console.log('Content updated:', content)
        // In a real app, this would update the backend
      },
      async deletePendingChange(changeId) {
        const changes = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
        const updatedChanges = changes.filter(c => c.id !== changeId)
        localStorage.setItem('pendingChanges', JSON.stringify(updatedChanges))
      }
    }

    // Pinia Store
    const useContentStore = defineStore('content', {
      state: () => ({
        publishedContent: [],
        pendingChanges: [],
        editingContent: null,
        userRole: 'contributor'
      }),
      actions: {
        async fetchPublishedContent() {
          this.publishedContent = await mockApi.getPublishedContent()
        },
        async fetchPendingChanges() {
          this.pendingChanges = await mockApi.getPendingChanges()
        },
        async submitChange(original, proposed) {
          const change = {
            id: Date.now(),
            original,
            proposed
          }
          await mockApi.savePendingChange(change)
          this.pendingChanges.push(change)
        },
        async approveChange(change) {
          await mockApi.updateContent(change.proposed)
          await mockApi.deletePendingChange(change.id)
          this.pendingChanges = this.pendingChanges.filter(c => c.id !== change.id)
          this.publishedContent = this.publishedContent.map(c =>
            c.id === change.original.id ? change.proposed : c
          )
        },
        async rejectChange(change) {
          await mockApi.deletePendingChange(change.id)
          this.pendingChanges = this.pendingChanges.filter(c => c.id !== change.id)
        }
      }
    })

    // Vue App
    createApp({
      setup() {
        const store = useContentStore()

        // Initialize data
        store.fetchPublishedContent()
        store.fetchPendingChanges()

        return {
          publishedContent: Vue.computed(() => store.publishedContent),
          pendingChanges: Vue.computed(() => store.pendingChanges),
          editingContent: Vue.computed({
            get: () => store.editingContent,
            set: (val) => store.editingContent = val
          }),
          userRole: Vue.computed({
            get: () => store.userRole,
            set: (val) => store.userRole = val
          }),
          startEditing(content) {
            store.editingContent = { ...content }
          },
          async submitChanges() {
            const original = store.publishedContent.find(c => c.id === store.editingContent.id)
            await store.submitChange(original, { ...store.editingContent })
            store.editingContent = null
          },
          cancelEditing() {
            store.editingContent = null
          },
          approveChange(change) {
            store.approveChange(change)
          },
          rejectChange(change) {
            store.rejectChange(change)
          }
        }
      }
    })
      .use(createPinia())
      .mount('#app')
  </script>
</body>
</html>