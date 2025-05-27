<template>
  <n-layout-sider
    bordered
    show-trigger
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    class="left-sidebar"
  >
    <n-h3 style="padding-left: 15px; margin-top: 10px;">Navigation</n-h3>
    <!-- Bible Book/Chapter selection will go here -->
    <p style="padding: 15px;">Book/Chapter List...</p>
  </n-layout-sider>
</template>

<script setup>
import { NLayoutSider, NH3 } from 'naive-ui'
</script>

<style scoped>
.left-sidebar {
  height: 100%; /* Fill the height of main-content-wrapper */
  overflow-y: auto; /* Allow sidebar to scroll independently */
}
</style>