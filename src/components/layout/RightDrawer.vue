// src/components/layout/RightDrawer.vue
<template>
  <n-drawer v-model:show="uiStore.isRightDrawerActive" :width="500" placement="right" @update:show="handleUpdateShow">
    <n-drawer-content title="Details">
      <div v-if="uiStore.rightDrawerContent">
        <!-- Customize how you display the content -->
        <pre>{{ uiStore.rightDrawerContent }}</pre>
      </div>
      <p v-else>No details to show.</p>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()

const handleUpdateShow = (value) => {
  if (!value) {
    uiStore.closeRightDrawer(); // Sync store if drawer is closed by clicking overlay or X
  }
};
</script>