<template>
  <n-layout-sider bordered show-trigger collapse-mode="width" :collapsed-width="0" :width="260" class="left-sidebar"
    :native-scrollbar="false">
    <div class="sidebar-header">
      <n-h3 style="margin: 10px 0 5px 12px; font-size: 1.1em;">Navigation</n-h3>
    </div>

    <div v-if="bibleStore.isLoadingBooks" class="loading-container">
      <n-spin size="small" />
    </div>
    <n-scrollbar v-else class="book-list-scrollbar" ref="bookListScrollbarRef">
      <n-collapse arrow-placement="right"
        :expanded-names="bibleStore.expandedBookOsisCode ? [bibleStore.expandedBookOsisCode] : []"
        @item-header-click="handleCollapseToggle" accordion class="custom-collapse">
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
            <template #arrow>
              <n-icon
                :component="bibleStore.expandedBookOsisCode === bookItem.key ? ChevronDownOutline : ChevronForwardOutline" />
            </template>

            <div v-if="bibleStore.expandedBookOsisCode === bookItem.key" class="chapter-grid-container">
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
              <n-text v-else depth="3" class="no-chapters-text">
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
import { onMounted, computed, ref } from 'vue';
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
const bookListScrollbarRef = ref(null);

onMounted(() => {
  bibleStore.fetchBooks();
});

const groupedBooks = computed(() => {
  const testamentMap = { OT: [], NT: [], OTHER: [] };
  bibleStore.books.forEach(book => {
    const bookMenuItem = {
      label: book.name,
      key: book.osis_code,
      bookData: book,
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
  return options;
});

function handleCollapseToggle({ name }) {
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
  overflow: hidden;
  /* Sider itself should not scroll if inner scrollbar is used */
}

.sidebar-header {
  flex-shrink: 0;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--n-border-color);
}

.book-list-scrollbar {
  flex-grow: 1;
  /* The n-scrollbar component will manage its own overflow.
     It needs to know its bounds. Its parent (.left-sidebar) is a flex column,
     and .sidebar-header is flex-shrink:0, so .book-list-scrollbar with flex-grow:1
     should fill the remaining vertical space.
     If still no scrollbar, the content inside n-scrollbar is not tall enough,
     OR the n-scrollbar itself isn't getting a proper height.
  */
}

.custom-collapse {
  /* No specific height rules needed here, it will expand as much as its content */
}

:deep(.n-collapse .n-collapse-item .n-collapse-item__header) {
  padding-top: 7px !important;
  padding-bottom: 7px !important;
  padding-left: 12px !important;
  font-size: 0.9em;
}

:deep(.n-collapse .n-collapse-item .n-collapse-item__header .n-collapse-item-arrow) {
  font-size: 1.1em !important;
  margin-right: 8px !important;
}

:deep(.n-collapse .n-collapse-item .n-collapse-item__content-inner) {
  padding: 6px 8px 8px 8px !important;
}

.testament-group-header :deep(.n-collapse-item__header) {
  padding-top: 8px !important;
  padding-bottom: 0px !important;
  font-size: 0.85em;
  font-weight: bold;
  color: var(--n-text-color-disabled);
  cursor: default !important;
}

.testament-group-header :deep(.n-collapse-item-arrow) {
  display: none !important;
}

.chapter-grid-container {
  /* container for loader or grid */
}

.chapter-grid {
  /* styles for the grid itself */
}

.chapter-button {
  font-size: 0.85em;
  padding: 3px 5px !important;
  min-width: auto;
  width: 100%;
  height: auto !important;
  line-height: 1.3;
  justify-content: center;
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
  min-height: 40px;
}

.no-chapters-text {
  padding: 10px;
  display: block;
  text-align: center;
  font-size: 0.85em;
}
</style>