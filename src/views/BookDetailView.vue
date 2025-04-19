<template>
  <div class="book-detail-view container">
    <header class="view-header book-header">
      <BaseLoadingIndicator v-if="isLoadingBook" message="Loading book details..." />
      <BaseErrorMessage v-if="isErrorBook" :message="errorBook?.message" />

      <template v-if="!isLoadingBook && !isErrorBook && bookTitle">
        <h1>{{ bookTitle }}</h1>

        <BaseLoadingIndicator v-if="isLoadingVersions" message="Loading versions..." />
        <BaseErrorMessage v-if="isErrorVersions" :message="errorVersions?.message" />
        <div v-if="!isLoadingVersions && !isErrorVersions && versions && versions.length > 1" class="version-selector">
          <label for="versionSelect">Version:</label>
          <select id="versionSelect" v-model="selectedVersionId">
            <option :value="null" disabled>Select Version</option>
            <option v-for="version in versions" :key="version.version_id" :value="version.version_id">
              {{ version.abbr }} ({{ version.full_name }})
            </option>
          </select>
        </div>
        <p v-if="!isLoadingVersions && !isErrorVersions && versions && versions.length === 1" class="single-version">
          Version: {{ versions[0].abbr }}
        </p>
        <p v-if="!isLoadingVersions && !isErrorVersions && versions && versions.length === 0" class="no-results">
          No Bible versions found.
        </p>
      </template>
      <h1 v-if="!isLoadingBook && !isErrorBook && !bookTitle">Book Not Found</h1>
    </header>

    <main v-if="bookId && selectedVersionId">
      <BaseLoadingIndicator v-if="isLoadingChapters" message="Loading chapters..." />
      <BaseErrorMessage v-if="isErrorChapters" :message="errorChapters?.message" />
      <nav v-if="!isLoadingChapters && !isErrorChapters && chapters && chapters.length > 1" class="chapter-nav">
        <button @click="changeChapter(-1)" :disabled="selectedChapterNumber <= 1" aria-label="Previous Chapter">
          < Prev </button>
            <span role="status" aria-live="polite">
              Chapter {{ selectedChapterNumber }} of {{ chapters.length }}
            </span>
            <button @click="changeChapter(1)" :disabled="selectedChapterNumber >= chapters.length"
              aria-label="Next Chapter">
              Next >
            </button>
      </nav>
      <h2 v-else-if="!isLoadingChapters && !isErrorChapters && chapters && chapters.length === 1"
        class="single-chapter-heading">
        Chapter {{ selectedChapterNumber }}
      </h2>
      <p v-if="!isLoadingChapters && !isErrorChapters && chapters && chapters.length === 0" class="no-results">
        No chapters found for this book.
      </p>

      <div v-if="selectedChapterId" class="content-area">
        <!-- Show combined loading indicator -->
        <BaseLoadingIndicator v-if="isLoadingVersesCombined" message="Loading content..." />
        <!-- Show combined error message -->
        <BaseErrorMessage v-if="combinedVerseError" :message="combinedVerseError" />

        <div v-if="!isLoadingVersesCombined && !combinedVerseError && versesWithLinks && versesWithLinks.length > 0"
          class="verses-container">
          <!-- Iterate over the computed versesWithLinks -->
          <p v-for="verse in versesWithLinks" :key="verse.verse_id" class="verse">
            <sup :id="`v${selectedChapterNumber}-${verse.verse_number}`">{{ verse.verse_number }}</sup>
            {{ verse.verse_text }}
            <!-- CCC Link Indicator (logic remains the same, uses verse.cccParagraphIds) -->
            <span v-if="verse.cccParagraphIds && verse.cccParagraphIds.length > 0" class="ccc-link-indicator"
              :title="`Links to CCC: ${verse.cccParagraphIds.join(', ')}`" role="link" tabindex="0"
              @click="showCatechismLinks(verse.cccParagraphIds)"
              @keydown.enter="showCatechismLinks(verse.cccParagraphIds)"
              @keydown.space.prevent="showCatechismLinks(verse.cccParagraphIds)">
              [CCC]
            </span>
          </p>
        </div>
        <p v-if="!isLoadingVersesCombined && !combinedVerseError && versesWithLinks && versesWithLinks.length === 0 && chapters && chapters.length > 0"
          class="no-results">
          No verses found for Chapter {{ selectedChapterNumber }} in the selected version.
        </p>
      </div>
      <div v-else-if="!isLoadingChapters && !isErrorChapters && chapters && chapters.length > 0">
        <p class="no-results">Select a chapter.</p>
      </div>

    </main>
    <div v-else-if="!isLoadingBook && !isErrorBook && !bookId">
      <p class="no-results">Could not determine book details to load content.</p>
    </div>
    <div v-else-if="!isLoadingVersions && !isErrorVersions && !selectedVersionId && versions && versions.length > 0">
      <p class="no-results">Please select a Bible version to view content.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue';
import { useDelayedTrueState } from '@/composables/useDelayedState';
import {
  useBookDetails,
  useBibleVersions,
  useChapters,
  useVerseText,
  useCatechismLinksForVerses,
} from '@/composables/useBibleData';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';
import type { Chapter, Version, Verse } from '@/types';
type BaseVerse = Omit<Verse, 'cccParagraphIds'>;


interface Props {
  bookSlug: string;
}
const props = defineProps<Props>();

const bookSlugRef = computed(() => props.bookSlug);

// --- Local State Refs ---
const selectedVersionId = ref<number | null>(null);
const selectedChapterId = ref<number | null>(null);
const selectedChapterNumber = ref<number>(1);

// --- Composables (Vue Query) ---

// 1. Fetch Book Details
const {
  data: bookDetailsData,
  isLoading: isLoadingBookRaw,
  isError: isErrorBook,
  error: errorBook
} = useBookDetails(bookSlugRef as Ref<string | undefined>);

// Computed properties dependent on bookDetailsData
const bookTitle = computed(() => bookDetailsData.value?.title ?? '');
const bookId = computed(() => bookDetailsData.value?.book_id ?? null);

// 2. Fetch Available Versions
const {
  data: versions,
  isLoading: isLoadingVersionsRaw,
  isError: isErrorVersions,
  error: errorVersions
} = useBibleVersions();

// 3. Fetch Chapters
const {
  data: chapters,
  isLoading: isLoadingChaptersRaw,
  isError: isErrorChapters,
  error: errorChapters
} = useChapters(bookId);

// 4a. Fetch Base Verse Text
const {
  data: baseVerses,
  isLoading: isLoadingVerseTextRaw,
  isError: isErrorVerseText,
  error: errorVerseText,
  status: verseTextStatus,
} = useVerseText(selectedChapterId, selectedVersionId);

// 4b. Extract Verse IDs
const verseIdsForLinks = computed(() => baseVerses.value?.map(v => v.verse_id));

// 4c. Fetch CCC Links
const {
  data: cccLinksMap,
  isLoading: isLoadingCccLinksRaw,
  isError: isErrorCccLinks,
  error: errorCccLinks,
  status: cccLinksStatus,
} = useCatechismLinksForVerses(verseIdsForLinks);


// --- Combined Loading/Error/Data State ---

// Combined loading state specifically for the verse content area
const isLoadingVersesCombined = computed(() => {
  const linksShouldLoad = !!verseIdsForLinks.value && verseIdsForLinks.value.length > 0;
  // True if verse text is loading OR if links are expected and loading
  return isLoadingVerseTextRaw.value || (linksShouldLoad && isLoadingCccLinksRaw.value);
});

const isLoadingVersesDelayed = useDelayedTrueState(isLoadingVersesCombined, 750);

// Combined error prioritizing prerequisite data errors
const combinedVerseError = computed(() => {
  if (isErrorBook.value) return errorBook.value?.message ?? 'Failed to load book details.';
  if (isErrorChapters.value) return errorChapters.value?.message ?? 'Failed to load chapters.';
  if (isErrorVerseText.value) return errorVerseText.value?.message ?? 'Failed to load verses.';
  if (isErrorCccLinks.value) return errorCccLinks.value?.message ?? 'Failed to load Catechism links.';
  return null;
});


// 4d. Merge Base Verses and Links
const versesWithLinks = computed((): Verse[] => {
  if (!baseVerses.value) return [];
  return baseVerses.value.map(baseVerse => {
    const linkedIds = cccLinksMap.value?.get(baseVerse.verse_id);
    return {
      ...baseVerse,
      ...(linkedIds && linkedIds.length > 0 && { cccParagraphIds: linkedIds }),
    };
  });
});

// --- Watchers and Logic ---

// Set default/initial version once versions load
watch(versions, (newVersions) => {
  console.log('[Watcher versions] Running. newVersions:', newVersions, 'selectedVersionId currently:', selectedVersionId.value);

  // Only proceed if versions are loaded, there are versions, and none is selected yet
  if (newVersions && newVersions.length > 0 && !selectedVersionId.value) {
    console.log('[Watcher versions] Conditions met: Has new versions, length > 0, none selected yet.');
    console.log('[Watcher versions] Available versions:', JSON.parse(JSON.stringify(newVersions)));

    // Find the version to select: Prioritize ID 1, otherwise take the first.
    let versionToSelect: Version | undefined = newVersions.find(v => v.version_id === 1) || newVersions[0];

    // Set the selected ID if we found a version to select
    if (versionToSelect) {
      console.log(`[Watcher versions] Selecting version: ${versionToSelect.abbr} (ID: ${versionToSelect.version_id}).`);
      selectedVersionId.value = versionToSelect.version_id;
    } else {
      // This case should theoretically not happen if newVersions.length > 0
      console.warn('[Watcher versions] Could not determine a version to select, though versions array is not empty.');
    }
  } else {
    console.log('[Watcher versions] Conditions NOT met or version already selected.');
    // Optional: Log specific reasons why conditions weren't met
    // console.log('[Watcher versions] Details:', { hasNewVersions: !!newVersions, length: newVersions?.length, isSelected: !!selectedVersionId.value });
  }
}, { immediate: true });

// --- ADD LOGGING FOR VERSES ---
// Set initial/current chapter once chapters load
watch(chapters, (newChapters) => {
  if (newChapters && newChapters.length > 0) {
    // Find chapter matching selectedChapterNumber OR default to first chapter
    const targetChapter = newChapters.find(ch => ch.chapter_number === selectedChapterNumber.value) || newChapters[0];
    if (targetChapter && targetChapter.chapter_id !== selectedChapterId.value) {
      console.debug(`Setting current chapter: ${targetChapter.chapter_number} (ID: ${targetChapter.chapter_id})`);
      selectedChapterId.value = targetChapter.chapter_id;
      selectedChapterNumber.value = targetChapter.chapter_number; // Ensure consistency
    } else if (!targetChapter) {
      console.warn("Could not find target chapter.");
      selectedChapterId.value = null; // Reset if no chapter found
    }
  }
  // Reset chapter if chapters become empty/undefined (e.g., book changes)
  else if (!newChapters || newChapters.length === 0) {
    selectedChapterId.value = null;
    selectedChapterNumber.value = 1; // Reset to default
  }
}, { immediate: true }); // Check immediately when chapters data arrives

// Reset chapter selection if book changes
watch(bookId, (newBookId, oldBookId) => {
  // Prevent reset on initial load if bookId is already set
  if (newBookId !== oldBookId) {
    console.debug("Book ID changed, resetting chapter selection.");
    selectedChapterId.value = null;
    selectedChapterNumber.value = 1;
  }
});

// Watch the status of the CCC links fetch
watch(cccLinksStatus, (status) => {
  console.log(`%c[CCCLinks Watcher] Status: ${status}`, 'color: purple;');
  // Optional: Log data/error on status change
  if (status === 'success') {
    console.log(`%c[CCCLinks Watcher] Data (Map):`, 'color: purple;', cccLinksMap.value); // Map doesn't need stringify usually
  } else if (status === 'error') {
    console.error(`%c[CCCLinks Watcher] Error:`, 'color: red; font-weight: bold;', errorCccLinks.value?.message);
  }
});
// Watch the final computed/merged data
watch(versesWithLinks, (newVal) => {
  console.log('%c[Verse Watcher] Merged versesWithLinks updated:', 'color: green; font-weight: bold;', JSON.parse(JSON.stringify(newVal ?? [])));
  const countWithLinks = newVal?.filter(v => v.cccParagraphIds && v.cccParagraphIds.length > 0).length ?? 0;
  console.log(`%c[Verse Watcher]   ${countWithLinks} verses have CCC links.`, 'color: green;');
}, { deep: true }); // deep might be necessary if Vue doesn't pick up changes within the computed array otherwise

// --- Methods ---
const showCatechismLinks = (paragraphIds: number[] | undefined) => {
  if (!paragraphIds) return;
  console.log('Clicked CCC Link Indicator. Linked Paragraph IDs:', paragraphIds);
  alert(`Linked Catechism Paragraphs:\n${paragraphIds.join('\n')}`);
};

const changeChapter = (direction: 1 | -1) => {
  if (!chapters.value || chapters.value.length <= 1) return;
  const currentIdx = chapters.value.findIndex(ch => ch.chapter_id === selectedChapterId.value);
  if (currentIdx === -1 && chapters.value.length > 0) {
    const newChapter = chapters.value[0];
    console.warn("Current chapter ID not found, resetting to first chapter.");
    selectedChapterId.value = newChapter.chapter_id;
    selectedChapterNumber.value = newChapter.chapter_number;
    return;
  }
  const newIdx = currentIdx + direction;
  if (newIdx >= 0 && newIdx < chapters.value.length) {
    const newChapter = chapters.value[newIdx];
    console.debug(`Changing chapter to: ${newChapter.chapter_number} (ID: ${newChapter.chapter_id})`);
    selectedChapterId.value = newChapter.chapter_id;
    selectedChapterNumber.value = newChapter.chapter_number;
  }
};

</script>

<style scoped>
.book-detail-view {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.book-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.book-header h1 {
  margin-bottom: var(--spacing-xs);
}

.version-selector {
  font-size: 0.95em;
  color: var(--text-secondary);
}

.version-selector label {
  margin-right: var(--spacing-xs);
}

.version-selector select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  min-width: 150px;
}

.single-version {
  font-size: 0.95em;
  color: var(--text-secondary);
  margin: 0;
}


main {
  margin-top: var(--spacing-lg);
}

.chapter-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-divider);
  border-top: 1px solid var(--border-divider);
}

.chapter-nav span {
  font-weight: 600;
  color: var(--text-heading);
  flex-grow: 1;
  text-align: center;
  margin: 0 var(--spacing-sm);
}

.chapter-nav button {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--border-primary);
  background-color: var(--bg-secondary);
  color: var(--text-link);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.chapter-nav button:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  border-color: var(--border-hover);
}

.chapter-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.single-chapter-heading {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-weight: 500;
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.content-area {
  margin-top: var(--spacing-lg);
}

.verses-container {
  line-height: 1.8;
  padding: 0 var(--spacing-sm);
}

.verse {
  margin-bottom: var(--spacing-md);
}

.verse sup {
  font-weight: bold;
  margin-right: 0.6em;
  color: var(--text-link);
  font-size: 0.8em;
  line-height: 1;
  vertical-align: super;
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  margin-top: var(--spacing-xl);
  font-style: italic;
}
</style>