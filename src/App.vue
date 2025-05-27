<template>
  <n-config-provider>
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-container">
          <app-header />
          <div class="main-content-wrapper">
            <left-sidebar />
            <main-content-area />
          </div>
          <right-drawer />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import AppHeader from './components/layout/AppHeader.vue'
import LeftSidebar from './components/layout/LeftSidebar.vue'
import MainContentArea from './components/layout/MainContentArea.vue'
import RightDrawer from './components/layout/RightDrawer.vue'

// You might want to fetch initial data or set theme here later
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; /* Prevent body scroll if content overflows */
}

.main-content-wrapper {
  display: flex;
  flex-grow: 1;
  overflow: hidden; /* Important for independent scrolling of sidebar/content */
}
</style>