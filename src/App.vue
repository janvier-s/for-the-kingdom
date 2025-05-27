<template>
  <n-config-provider :theme-overrides="{ common: { bodyColor: '#fdfdfd' } }">
    <n-message-provider>
      <n-dialog-provider>
        <!-- This div will be the main flex container for the whole app page -->
        <div class="app-page-container">
          <app-header />
          <n-layout class="main-layout-has-sider" has-sider>
            <left-sidebar />
            <n-layout-content class="router-view-wrapper">
              <router-view />
            </n-layout-content>
          </n-layout>
          <!-- RightDrawer is an overlay, its position is less dependent on this flex structure -->
          <right-drawer />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import {
  NConfigProvider, NMessageProvider, NDialogProvider,
  NLayout, NLayoutContent
} from 'naive-ui'
import AppHeader from './components/layout/AppHeader.vue'
import LeftSidebar from './components/layout/LeftSidebar.vue'
import RightDrawer from './components/layout/RightDrawer.vue'

</script>

<style scoped>
.app-page-container {
  display: flex;
  flex-direction: column;
  /* Stack header and main-layout vertically */
  height: 100vh;
  /* Full viewport height */
  overflow: hidden;
  /* Prevent whole page scroll if something overflows weirdly */
}

/* AppHeader is a direct child of app-page-container */
/* Ensure AppHeader itself doesn't try to grow if it's not supposed to */
/* (Usually headers have a fixed or auto height) */

.main-layout-has-sider {
  flex-grow: 1;
  /* This n-layout will take the remaining vertical space */
  display: flex;
  /* It's already a flex container by default when has-sider */
  overflow: hidden;
  /* Prevent this layout from showing its own scrollbars if children misbehave */
}

.router-view-wrapper {
  /* n-layout-content usually handles its own flex-grow within an n-layout */
  padding: 15px;
  /* Slightly less padding */
  overflow-y: auto;
  /* Main content area scrolls */
  /* height: 100%; */
  /* This might not be needed if parent n-layout correctly gives it space */
  /* In a flex row (n-layout has-sider), items stretch vertically by default */
}
</style>