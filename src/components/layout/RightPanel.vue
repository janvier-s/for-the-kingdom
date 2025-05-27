// src/components/layout/RightPanel.vue
<template>
  <n-layout-sider bordered :collapsed="uiStore.isRightPanelCollapsed" collapse-mode="width" :collapsed-width="30"
    :width="350" show-trigger="arrow-circle" @update:collapsed="handleCollapseUpdateSider" class="right-panel"
    content-style="padding: 15px;" native-scrollbar="false">
    <!-- Content here, only visible if not collapsed -->
    <div v-if="!uiStore.isRightPanelCollapsed">
      <n-h4 style="margin-top: 0;">{{ uiStore.rightPanelTitle }}</n-h4>
      <n-scrollbar style="max-height: calc(100vh - 150px);"> <!-- Adjust max-height as needed -->
        <div v-if="uiStore.rightPanelContentType === 'footnotes' && uiStore.rightPanelContent">
          <div v-if="uiStore.rightPanelContent.verseRef" class="verse-ref-header">
            Footnotes for: <strong>{{ uiStore.rightPanelContent.verseRef }}</strong>
          </div>
          <div v-for="(footnote, index) in uiStore.rightPanelContent.data" :key="index" class="footnote-detail">
            <n-text strong v-if="footnote.caller">[{{ footnote.caller }}] </n-text>
            <n-text strong v-if="footnote.reference">{{ footnote.reference }}: </n-text>
            <div class="footnote-text-parts">
              <p v-for="(part, pIndex) in footnote.text_parts" :key="pIndex" :class="`fn-part-${part.type}`">
                {{ part.content }}
              </p>
            </div>
          </div>
        </div>
        <div v-else-if="uiStore.rightPanelContentType === 'block_footnote' && uiStore.rightPanelContent">
          <!-- Custom rendering for footnotes extracted from blocks -->
          <pre>{{ uiStore.rightPanelContent.data }}</pre>
        </div>
        <div v-else-if="uiStore.rightPanelContent">
          <pre>{{ uiStore.rightPanelContent }}</pre>
        </div>
        <n-empty v-else description="No details selected." style="margin-top: 30px;" />
      </n-scrollbar>
    </div>
    <template #trigger v-if="uiStore.isRightPanelCollapsed"> <!-- Custom trigger for collapsed state -->
      <div @click="uiStore.toggleRightPanel()"
        style="height:100%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
        <n-icon size="20"><chevron-back-outline /></n-icon>
      </div>
    </template>
  </n-layout-sider>
</template>

<script setup>
import { NLayoutSider, NButton, NIcon, NH4, NScrollbar, NEmpty, NText } from 'naive-ui';
import { ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5';
import { useUiStore } from '@/stores/uiStore';

const uiStore = useUiStore();

function handleCollapseUpdateSider(collapsedState) {
  // This is called by n-layout-sider's own trigger
  if (collapsedState) {
    uiStore.hideRightPanel();
  } else {
    // If expanded by its own trigger, ensure our store reflects this if content is present
    if (uiStore.rightPanelContent) {
      uiStore.isRightPanelCollapsed = false;
    } else {
      // If no content, perhaps keep it logically collapsed in store or force collapse
      // This part needs careful thought on desired UX
      uiStore.toggleRightPanel(); // Or specific logic
    }
  }
}
</script>

<style scoped>
.right-panel {
  height: 100%;
  /* Prevent its own scrollbar if content-style handles it */
  border-left: 1px solid var(--n-border-color);
}

.collapsed-right-panel-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  /* Width of the trigger when panel is collapsed */
  height: 100%;
  background-color: var(--n-sider-color);
  border-left: 1px solid var(--n-border-color);
  cursor: pointer;
  color: var(--n-text-color);
}

.collapsed-right-panel-trigger:hover {
  background-color: var(--n-action-color);
}

.verse-ref-header {
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--n-divider-color);
  font-size: 0.95em;
}

.footnote-detail {
  margin-bottom: 12px;
  font-size: 0.9em;
  line-height: 1.5;
}

.footnote-text-parts p {
  margin: 3px 0;
}

.fn-part-ft {
  /* Example styling for footnote text */
  /* display: inline; */
}

.fn-part-fq {
  /* Example styling for footnote quotation */
  font-style: italic;
  margin-left: 10px;
}
</style>