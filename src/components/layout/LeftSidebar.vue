<template>
  <n-layout-sider bordered show-trigger collapse-mode="width" :collapsed-width="0" :width="260" class="left-sidebar"
    native-scrollbar="false">
    <div class="sidebar-header">
      <n-h3 style="margin: 10px 0 5px 12px; font-size: 1.1em;">Navigation</n-h3>
    </div>

    <div v-if="bibleStore.isLoadingBooks" class="loading-container">
      <n-spin size="small" />
    </div>
    <n-scrollbar v-else class="book-list-scrollbar">
      <n-collapse arrow-placement="right"
        :default-expanded-names="bibleStore.expandedBookOsisCode ? [bibleStore.expandedBookOsisCode] : []"
        @item-header-click="handleCollapseToggle" accordion>
        <template v-for="testamentGroup in groupedBooks" :key="testamentGroup.key">
          <n-collapse-item disabled class="testament-group-header">
            <template #header>
              <n-text strong>{{ testamentGroup.label }}</n-text>
            </template>
          </n-collapse-item>
          <n-collapse-item v-for="bookItem in testamentGroup.children" :key="bookItem.key" :name="bookItem.key"
            class="book-collapse-item">
            <template #header>
              <n-icon :component="BookIcon" size="18" style="margin-right: 8px;" />
              {{ bookItem.label }}
            </template>
            <template #arrow> <!-- Custom arrow if needed, or remove for default -->
              <n-icon
                :component="bibleStore.expandedBookOsisCode === bookItem.key ? ChevronDownOutline : ChevronForwardOutline" />
            </template>

            <div v-if="bibleStore.expandedBookOsisCode === bookItem.key">
              <div v-if="bibleStore.isLoadingChaptersForMenu" class="loading-container chapter-loader">
                <n-spin size="small" />
              </div>
              <n-grid v-else-if="bibleStore.chaptersForExpandedBook.length > 0" x-gap="6" y-gap="6" :cols="5"
                class="chapter-grid">
                <n-gi v-for="chapter in bibleStore.chaptersForExpandedBook" :key="chapter">
                  <n-button text block class="chapter-button"
                    :type="isActiveChapter(bookItem.key, chapter) ? 'primary' : 'default'"
                    @click.stop="handleChapterSelect(bookItem.key, chapter)">
                    {{ chapter }}
                  </n-button>
                </n-gi>
              </n-grid>
              <n-text v-else depth="3" style="padding: 10px; display: block; text-align: center;">
                No chapters found.
              </n-text>
            </div>
          </n-collapse-item>
        </template>
      </n-collapse>
    </n-scrollbar>
  </n-layout-sider>
</template>

<script setup>
import { onMounted, computed, h } from 'vue';
import {
  NLayoutSider, NH3, NSpin, NIcon, NCollapse, NCollapseItem,
  NGrid, NGi, NButton, NScrollbar, NText
} from 'naive-ui';
import { useBibleStore } from '@/stores/bibleStore';
import {
  BookOutline as BookIcon,
  ChevronDownOutline,
  ChevronForwardOutline
} from '@vicons/ionicons5';

const bibleStore = useBibleStore();

onMounted(() => {
  bibleStore.fetchBooks();
});

const groupedBooks = computed(() => {
  const testamentMap = { OT: [], NT: [], OTHER: [] };
  bibleStore.books.forEach(book => {
    const bookMenuItem = {
      label: book.name,
      key: book.osis_code,
      bookData: book, // Keep full data if needed elsewhere
    };
    if (book.id < 47) testamentMap.OT.push(bookMenuItem);
    else if (book.id < 74) testamentMap.NT.push(bookMenuItem);
    else testamentMap.OTHER.push(bookMenuItem);
  });

  const options = [];
  if (testamentMap.OT.length) {
    options.push({ label: 'Ancien Testament', key: 'ot-group', children: testamentMap.OT });
  }
  if (testamentMap.NT.length) {
    options.push({ label: 'Nouveau Testament', key: 'nt-group', children: testamentMap.NT });
  }
  // if (testamentMap.OTHER.length) { // Optional: show "Other" group
  //   options.push({ label: 'Autres', key: 'other-group', children: testamentMap.OTHER });
  // }
  return options;
});

function handleCollapseToggle({ name, expanded }) {
  // 'name' is the key of the book (bookItem.key)
  // 'expanded' is true if it's being expanded, false if collapsing
  const bookClicked = bibleStore.books.find(b => b.osis_code === name);
  if (bookClicked) {
    bibleStore.handleBookMenuClick(bookClicked);
  }
}

function handleChapterSelect(bookOsisCode, chapterNum) {
  bibleStore.selectChapterForContent(bookOsisCode, chapterNum);
}

function isActiveChapter(bookOsisCode, chapterNum) {
  return bibleStore.selectedBook?.osis_code === bookOsisCode &&
    bibleStore.selectedChapter === chapterNum;
}

</script>

<style scoped>
.left-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  flex-shrink: 0;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--n-border-color);
}

.book-list-scrollbar {
  flex-grow: 1;
  overflow-y: auto;
}

/* Deeper styling for n-collapse to make it tighter */
:deep(.n-collapse .n-collapse-item .n-collapse-item__header) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  padding-left: 12px !important;
  /* Match header indent */
  font-size: 0.9em;
}

:deep(.n-collapse .n-collapse-item .n-collapse-item__header .n-collapse-item-arrow) {
  font-size: 1.1em !important;
  /* Arrow size */
  margin-right: 8px !important;
}

:deep(.n-collapse .n-collapse-item .n-collapse-item__content-inner) {
  padding-top: 5px !important;
  padding-bottom: 10px !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
}

.testament-group-header :deep(.n-collapse-item__header) {
  padding-top: 10px !important;
  padding-bottom: 2px !important;
  padding-left: 12px !important;
  cursor: default !important;
  /* Make group headers non-clickable in effect */
}

.testament-group-header :deep(.n-collapse-item-arrow) {
  display: none !important;
  /* Hide arrow for group headers */
}


.chapter-grid {
  /* padding: 5px 0px 5px 10px; Indent chapter grid slightly */
}

.chapter-button {
  font-size: 0.9em;
  /* Smaller chapter numbers */
  padding: 4px 6px !important;
  /* Tighter buttons */
  min-width: 30px;
  /* Ensure buttons have some width */
  height: auto !important;
  /* Adjust height to content */
  line-height: 1.4;
}

.chapter-button.n-button--primary-type {
  font-weight: bold;
}


.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
}

.chapter-loader {
  padding: 10px;
  min-height: 50px;
  /* Give some space for loader */
}
</style>