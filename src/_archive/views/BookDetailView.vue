<!-- src/views/BookDetailView.vue -->
<template>
  <div class="book-detail-view container">
    <header class="view-header book-header">
      <!-- Book Loading/Error -->
      <BaseLoadingIndicator v-if="isLoadingBook" message="Loading book details..." />
      <BaseErrorMessage v-if="isErrorBook" :message="errorBook?.message" />

      <template v-if="bookDetails">
        <h1>{{ bookDetails.title }}</h1>

        <!-- Version Loading/Error/Selection -->
        <BaseLoadingIndicator v-if="isLoadingVersions" message="Loading versions..." />
        <BaseErrorMessage v-if="isErrorVersions" :message="errorVersions?.message" />
        <div v-if="versions && versions.length > 1" class="version-selector">
          <label for="versionSelect">Version:</label>
          <select id="versionSelect" v-model="selectedVersionId">
            <option :value="null" disabled>Select Version</option>
            <!-- Use version.id for the value -->
            <option v-for="version in versions" :key="version.id" :value="version.id">
              {{ version.abbr }} ({{ version.full_name }})
            </option>
          </select>
        </div>
        <p v-if="versions && versions.length === 1" class="single-version">
          <!-- Use version.id for the key -->
          Version: {{ versions[0].abbr }}
        </p>
        <p v-if="!isLoadingVersions && !isErrorVersions && (!versions || versions.length === 0)" class="no-results">
          No Bible versions found.
        </p>
      </template>
      <h1 v-if="!isLoadingBook && !isErrorBook && !bookDetails">Book Not Found</h1>
    </header>

    <!-- Main content requires book, version, and chapter to be selected/loaded -->
    <main v-if="bookDetails && selectedVersionCode && chapterNumbers !== undefined">

      <!-- Chapter Loading/Error/Navigation -->
      <BaseLoadingIndicator v-if="isLoadingChapters" message="Loading chapters..." />
      <BaseErrorMessage v-if="isErrorChapters" :message="errorChapters?.message" />
      <nav v-if="chapterNumbers && chapterNumbers.length > 1" class="chapter-nav">
        <button @click="changeChapter(-1)"
          :disabled="!selectedChapterNumber || selectedChapterNumber <= chapterNumbers[0]"
          aria-label="Previous Chapter">
          < Prev </button>
            <span role="status" aria-live="polite">
              Chapter {{ selectedChapterNumber ?? '...' }} of {{ chapterNumbers.length }}
            </span>
            <button @click="changeChapter(1)"
              :disabled="!selectedChapterNumber || selectedChapterNumber >= chapterNumbers[chapterNumbers.length - 1]"
              aria-label="Next Chapter">
              Next >
            </button>
      </nav>
      <h2 v-else-if="chapterNumbers && chapterNumbers.length === 1" class="single-chapter-heading">
        Chapter {{ chapterNumbers[0] }}
      </h2>
      <p v-if="!isLoadingChapters && !isErrorChapters && chapterNumbers && chapterNumbers.length === 0"
        class="no-results">
        No chapters found for this book in the selected version.
      </p>

      <!-- Verse Loading/Error/Display -->
      <div v-if="selectedChapterNumber" class="content-area">
        <!-- Combined loading indicator -->
        <BaseLoadingIndicator v-if="isLoadingVersesCombinedDelayed" message="Loading content..." />
        <!-- Combined error message -->
        <BaseErrorMessage v-if="combinedVerseError" :message="combinedVerseError" />

        <div v-if="!isLoadingVersesCombined && !combinedVerseError && versesWithLinks && versesWithLinks.length > 0"
          class="verses-container">
          <!-- Iterate over versesWithLinks -->
          <p v-for="verse in versesWithLinks" :key="verse.id" class="verse">
            <!-- Use sort_order for verse number, id for key -->
            <sup :id="`v${selectedChapterNumber}-${verse.sort_order}`">{{ verse.sort_order }}</sup>
            {{ verse.content_text }}
            <!-- Use verse.cccParagraphNumbers -->
            <span v-if="verse.cccParagraphNumbers && verse.cccParagraphNumbers.length > 0" class="ccc-link-indicator"
              :title="`Links to CCC: ${verse.cccParagraphNumbers.join(', ')}`" role="link" tabindex="0"
              @click="showCatechismLinks(verse.cccParagraphNumbers)"
              @keydown.enter="showCatechismLinks(verse.cccParagraphNumbers)"
              @keydown.space.prevent="showCatechismLinks(verse.cccParagraphNumbers)">
              [CCC]
            </span>
          </p>
        </div>
        <p v-if="!isLoadingVersesCombined && !combinedVerseError && versesWithLinks && versesWithLinks.length === 0 && chapterNumbers && chapterNumbers.length > 0"
          class="no-results">
          No verses found for Chapter {{ selectedChapterNumber }} in {{ selectedVersionCode }}.
        </p>
      </div>
      <div v-else-if="!isLoadingChapters && !isErrorChapters && chapterNumbers && chapterNumbers.length > 0">
        <p class="no-results">Select a chapter.</p>
      </div>

    </main>

    <!-- Fallback messages -->
    <div v-else-if="!isLoadingBook && !isErrorBook && !bookDetails">
      <p class="no-results">Could not load book details.</p>
    </div>
    <div v-else-if="!isLoadingVersions && !isErrorVersions && !selectedVersionId && versions && versions.length > 0">
      <p class="no-results">Please select a Bible version.</p>
    </div>
    <div
      v-else-if="bookDetails && selectedVersionCode && chapterNumbers === undefined && !isLoadingChapters && !isErrorChapters">
      <p class="no-results">Could not load chapter list.</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue';
import { useDelayedTrueState } from '@/composables/useDelayedState';
import {
  useBookDetails,
  useBibleVersions,
  useChapterNumbers,
  useVerseText,
  useCatechismLinksForVerses,
} from '@/composables/useBibleData';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';
import type { Version, Verse, BaseVerse } from '@/types';

interface Props {
  bookSlug: string;
}
const props = defineProps<Props>();

const bookSlugRef = computed(() => props.bookSlug);

// --- Local State Refs ---
const selectedVersionId = ref<number | null>(null);
const selectedChapterNumber = ref<number | null>(null);

// --- Composables (Vue Query) ---

// 1. Fetch Book Details -> provides id, title, cleaned_book_label
const {
  data: bookDetails,
  isLoading: isLoadingBook,
  isError: isErrorBook,
  error: errorBook
} = useBookDetails(bookSlugRef as Ref<string | undefined>);
const bookId = computed(() => bookDetails.value?.book_id ?? null);
const bookLabel = computed(() => bookDetails.value?.cleaned_book_label ?? null);

// 2. Fetch Available Versions
const {
  data: versions,
  isLoading: isLoadingVersions,
  isError: isErrorVersions,
  error: errorVersions
} = useBibleVersions();
const selectedVersionCode = computed(() => {
  if (!selectedVersionId.value || !versions.value) return null;
  return versions.value.find(v => v.id === selectedVersionId.value)?.abbr ?? null;
});
console.log(`%c[BookDetailView setup] Initial values before useChapterNumbers:`, 'background: #eee; color: #333');
console.log(`  -> bookId.value: ${bookId.value} (type: ${typeof bookId.value})`);
console.log(`  -> bookLabel.value: ${bookLabel.value} (type: ${typeof bookLabel.value})`);
console.log(`  -> selectedVersionCode.value: ${selectedVersionCode.value} (type: ${typeof selectedVersionCode.value})`);

watch(bookId, (val) => console.log(`bookId changed to: ${val}`));
watch(bookLabel, (val) => console.log(`bookLabel changed to: ${val}`));
watch(selectedVersionCode, (val) => console.log(`selectedVersionCode changed to: ${val}`));

// 3. Fetch Chapter Numbers (NEW)
const {
  data: chapterNumbers,
  isLoading: isLoadingChapters,
  isError: isErrorChapters,
  error: errorChapters,
  status: chapterStatus
} = useChapterNumbers(bookId, bookLabel, selectedVersionCode);

watch([bookLabel, selectedChapterNumber, selectedVersionCode], ([label, chapNum, verCode]) => {
  console.log(`%c[Verse Trigger Check] bookLabel: ${label}, chapter: ${chapNum}, version: ${verCode}`, 'color: blue');
}, { immediate: true });

watch(chapterStatus, (status) => {
  console.log(`%c[Chapter Fetch Status]: ${status}`, 'color: brown');
  if (status === 'error') {
    console.error('%c[Chapter Fetch Status] Error:', 'color: red;', errorChapters.value?.message);
  } else if (status === 'success') {
    console.log('%c[Chapter Fetch Status] Success, data:', 'color: brown', chapterNumbers.value);
  }
});

// 4a. Fetch Base Verse Text
const {
  data: baseVerses,
  isLoading: isLoadingVerseTextRaw,
  isError: isErrorVerseText,
  error: errorVerseText,
  status: verseTextStatus,
} = useVerseText(bookLabel, selectedChapterNumber, selectedVersionCode);

watch(verseTextStatus, (status) => {
  if (status === 'success') {
    console.log('%c[Verse Fetch Status] Raw baseVerses data:', 'color: orange', JSON.parse(JSON.stringify(baseVerses.value ?? [])));
  } else if (status === 'error') {
    console.error('%c[Verse Fetch Status] Error:', 'color: red; font-weight: bold;', errorVerseText.value?.message);
  }
})

// 4b. Extract Verse IDs (use verse.id)
const verseIdsForLinks = computed(() => baseVerses.value?.map(v => v.id));

// 4c. Fetch CCC Links (uses verse.id)
const {
  data: cccLinksMap,
  isLoading: isLoadingCccLinksRaw,
  isError: isErrorCccLinks,
  error: errorCccLinks,
} = useCatechismLinksForVerses(verseIdsForLinks);


// --- Combined Loading/Error/Data State ---

const isLoadingVersesCombined = computed(() => {
  // Considered loading if verse text is loading OR if links are expected and loading
  const linksShouldLoad = !!verseIdsForLinks.value && verseIdsForLinks.value.length > 0;
  return isLoadingVerseTextRaw.value || (linksShouldLoad && isLoadingCccLinksRaw.value);
});
// Apply delay only to the combined loading state for verses
const isLoadingVersesCombinedDelayed = useDelayedTrueState(isLoadingVersesCombined, 600);


const combinedVerseError = computed(() => {
  // Prioritize errors: Book -> Version -> Chapter -> Verse Text -> CCC Links
  if (isErrorBook.value) return `Book Error: ${errorBook.value?.message}`;
  if (isErrorVersions.value) return `Version Error: ${errorVersions.value?.message}`;
  if (isErrorChapters.value) return `Chapter Error: ${errorChapters.value?.message}`;
  if (isErrorVerseText.value) return `Verse Error: ${errorVerseText.value?.message}`;
  if (isErrorCccLinks.value) return `Link Error: ${errorCccLinks.value?.message}`;
  return null;
});

// 4d. Merge Base Verses and Links
const versesWithLinks = computed((): Verse[] => {
  if (!baseVerses.value) return [];
  const linkMap = cccLinksMap.value;
  return baseVerses.value.map(baseVerse => {
    const linkedIds = linkMap?.get(baseVerse.id);
    return {
      ...baseVerse,
      // Use cccParagraphNumbers to match type definition
      ...(linkedIds && linkedIds.length > 0 && { cccParagraphNumbers: linkedIds }),
    };
  });
});
watch(chapterNumbers, (nums) => {
  console.log('Chapter Numbers Loaded:', nums);
})

watch(versesWithLinks, (newVal) => {
  console.log(`%c[Verse Watcher] Merged versesWithLinks updated. Length: ${newVal?.length ?? 0}`, 'color: green; font-weight: bold;');
  // Optional: Log the actual data if length is small
  // if (newVal && newVal.length < 10) {
  //    console.log('%c[Verse Watcher] Data:', 'color: green;', JSON.parse(JSON.stringify(newVal)));
  // }
}, { deep: true });
// --- Watchers and Logic ---

// Set default version (ID 1) or first available
watch(versions, (newVersions) => {
  if (newVersions && newVersions.length > 0 && selectedVersionId.value === null) {
    // Prioritize version with id=1, otherwise take the first one
    const defaultVersion = newVersions.find(v => v.id === 1) || newVersions[0];
    selectedVersionId.value = defaultVersion.id;
    console.debug(`[Watcher versions] Auto-selected version ID: ${selectedVersionId.value}`);
  }
}, { immediate: true });

// Set initial chapter when chapter numbers load
watch(chapterNumbers, (newChapters) => {
  if (newChapters && newChapters.length > 0 && selectedChapterNumber.value === null) {
    // Select the first chapter number from the list
    selectedChapterNumber.value = newChapters[0];
    console.debug(`[Watcher chapterNumbers] Auto-selected chapter: ${selectedChapterNumber.value}`);
  }
  // Reset if chapter list becomes empty/invalid while a chapter was selected
  else if ((!newChapters || newChapters.length === 0) && selectedChapterNumber.value !== null) {
    console.debug("[Watcher chapterNumbers] Chapter list empty/invalid, resetting selection.");
    selectedChapterNumber.value = null;
  }
}, { immediate: true });

// Reset chapter selection if book or version changes
watch([bookId, selectedVersionId], () => {
  console.debug("[Watcher book/version] Resetting chapter selection.");
  selectedChapterNumber.value = null; // Reset chapter, which will trigger re-fetch or auto-select
});

// Optional: Add logging for debugging state changes
watch(selectedChapterNumber, (newVal) => console.log(`Selected Chapter Number: ${newVal}`));
watch(selectedVersionId, (newVal) => console.log(`Selected Version ID: ${newVal}`));
watch(versesWithLinks, (newVal) => {
  console.log(`%c[Verse Watcher] Merged versesWithLinks updated (${newVal?.length ?? 0} items)`, 'color: green; font-weight: bold;');
}, { deep: true });


// --- Methods ---
const showCatechismLinks = (paragraphNumbers: number[] | undefined) => {
  if (!paragraphNumbers) return;
  alert(`Linked Catechism Paragraphs (Numbers):\n${paragraphNumbers.join('\n')}`);
};

const changeChapter = (direction: 1 | -1) => {
  if (!chapterNumbers.value || chapterNumbers.value.length === 0 || selectedChapterNumber.value === null) return;

  const currentIndex = chapterNumbers.value.indexOf(selectedChapterNumber.value);
  if (currentIndex === -1) {
    console.warn("Current chapter not found in list, cannot navigate.");
    return; // Should not happen if state is consistent
  }

  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < chapterNumbers.value.length) {
    selectedChapterNumber.value = chapterNumbers.value[newIndex];
    console.debug(`Changed chapter to: ${selectedChapterNumber.value}`);
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
  min-height: 200px;
  position: relative;
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

.ccc-link-indicator {
  margin-left: 8px;
  color: var(--text-link);
  cursor: pointer;
  font-size: 0.8em;
  font-weight: bold;
  user-select: none;
  /* Prevent text selection */
  display: inline-block;
  /* Allows transform */
  transition: transform 0.1s ease-out;
}

.ccc-link-indicator:hover {
  text-decoration: underline;
  transform: scale(1.1);
}

.ccc-link-indicator:focus {
  outline: 1px dotted var(--text-link);
  outline-offset: 2px;
  border-radius: 2px;
}

.content-area .loading-indicator {
  /* position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); */
  margin-top: var(--spacing-xl);
  /* Simpler margin approach */
}
</style>