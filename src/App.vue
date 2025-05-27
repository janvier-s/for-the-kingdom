<template>
  <n-config-provider>
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-container">
          <app-header />
          <div class="main-content-wrapper">
            <left-sidebar />
            <!-- The main content area will now render the matched route component -->
            <div class="router-view-container">
              <router-view />
            </div>
          </div>
          <right-drawer />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
// ... (imports for NConfigProvider, AppHeader, etc. as before) ...
import AppHeader from './components/layout/AppHeader.vue'
import LeftSidebar from './components/layout/LeftSidebar.vue'
// MainContentArea is now a route component, so it's not directly imported here for layout
import RightDrawer from './components/layout/RightDrawer.vue'
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content-wrapper {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.router-view-container {
  flex-grow: 1; /* Takes up remaining space next to sidebar */
  padding: 20px;
  overflow-y: auto; /* Allows this area to scroll */
  height: 100%; /* Important for overflow-y to work correctly within flex item */
}
</style>