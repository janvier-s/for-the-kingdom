<template>
  <n-layout-content class="main-content-area">
    <router-view /> <!-- If using router for content, or display content directly -->
    <!-- Bible Verses will be displayed here -->
    <p>Verse content will appear here...</p>
  </n-layout-content>
</template>

<script setup>
import { NLayoutContent } from 'naive-ui'
</script>

<style scoped>
.main-content-area {
  padding: 20px;
  height: 100%; /* Fill the height of main-content-wrapper */
  overflow-y: auto; /* Allow content area to scroll independently */
  flex-grow: 1;
}
</style>