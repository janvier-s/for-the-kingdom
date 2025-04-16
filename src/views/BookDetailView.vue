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
        <BaseLoadingIndicator v-if="isLoadingVerses" message="Loading content..." />
        <BaseErrorMessage v-if="isErrorVerses" :message="errorVerses?.message" />
        <div v-if="!isLoadingVerses && !isErrorVerses && verses && verses.length > 0" class="verses-container">
          <p v-for="verse in verses" :key="verse.verse_id" class="verse">
            <sup :id="`v${selectedChapterNumber}-${verse.verse_number}`">{{ verse.verse_number }}</sup>
            {{ verse.verse_text }}
          </p>
        </div>
        <p v-if="!isLoadingVerses && !isErrorVerses && verses && verses.length === 0 && chapters && chapters.length > 0"
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
// No longer need useRoute if slug comes from props
import {
  useBookDetails,
  useBibleVersions,
  useChapters,
  useVerses,
} from '@/composables/useBibleData';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';
import type { Chapter, Version } from '@/types';

interface Props {
  bookSlug: string;
}
const props = defineProps<Props>();

const bookSlugRef = computed(() => props.bookSlug);

// --- Local State Refs ---
const selectedVersionId = ref<number | null>(null);
const selectedChapterId = ref<number | null>(null);
const selectedChapterNumber = ref<number>(1); // Default to chapter 1

// --- Composables (Vue Query) ---

// 1. Fetch Book Details (Title, ID) based on Slug
const {
  data: bookDetailsData, // Raw data { title, book_id } | null
  isLoading: isLoadingBookRaw,
  isError: isErrorBook,
  error: errorBook
} = useBookDetails(bookSlugRef as Ref<string | undefined>);

// Recreate computed properties for book title and ID
const bookTitle = computed(() => bookDetailsData.value?.title ?? '');
const bookId = computed(() => bookDetailsData.value?.book_id ?? null); // Ref<number | null>

// 2. Fetch Available Versions (runs automatically via Vue Query)
const {
  data: versions, // Ref<Version[] | undefined>
  isLoading: isLoadingVersionsRaw,
  isError: isErrorVersions,
  error: errorVersions
} = useBibleVersions();

// 3. Fetch Chapters (enabled when bookId is valid)
const {
  data: chapters, // Ref<Chapter[] | undefined>
  isLoading: isLoadingChaptersRaw,
  isError: isErrorChapters,
  error: errorChapters
} = useChapters(bookId); // Pass reactive bookId ref

// 4. Fetch Verses (enabled when chapterId and versionId are valid)
const {
  data: verses, // Ref<Verse[] | undefined>
  isLoading: isLoadingVersesRaw,
  isError: isErrorVerses,
  error: errorVerses
  // refetch: refetchVerses // Can get refetch function if needed
} = useVerses(selectedChapterId, selectedVersionId); // Pass local state refs

// --- Delayed Loaders ---
const isLoadingBook = useDelayedTrueState(isLoadingBookRaw, 750); // 750ms delay
const isLoadingVersions = useDelayedTrueState(isLoadingVersionsRaw, 750);
const isLoadingChapters = useDelayedTrueState(isLoadingChaptersRaw, 750);
const isLoadingVerses = useDelayedTrueState(isLoadingVersesRaw, 750);

// --- Watchers and Logic ---

// Set default version once versions load and are available
watch(versions, (newVersions) => {
  if (newVersions && newVersions.length > 0 && !selectedVersionId.value) {
    // If only one version, select it automatically
    if (newVersions.length === 1) {
      selectedVersionId.value = newVersions[0].version_id;
      console.debug(`Auto-selected single version: ${newVersions[0].abbr}`);
    } else {
      // Prioritize LSG if multiple versions exist
      const defaultVersion = newVersions.find((v) => v.abbr === 'LSG') || null; // Don't default select if LSG not found
      if (defaultVersion) {
        // selectedVersionId.value = defaultVersion.version_id; // Optional: auto-select LSG
        console.debug(`Default version LSG found (ID: ${defaultVersion.version_id}), but not auto-selecting.`);
      } else {
        console.warn("LSG version not found among available versions.");
      }
    }
  }
}, { immediate: true }); // Check immediately when versions data arrives

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
watch(bookId, () => {
  console.debug("Book ID changed, resetting chapter selection.");
  selectedChapterId.value = null;
  selectedChapterNumber.value = 1;
  // Verses query will become disabled automatically if selectedChapterId is null
});

// Function to change chapter
const changeChapter = (direction: 1 | -1) => {
  if (!chapters.value || chapters.value.length <= 1) return;

  const currentIdx = chapters.value.findIndex(ch => ch.chapter_id === selectedChapterId.value);
  // Handle case where current chapter isn't found (shouldn't happen often with watcher)
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
    // Update local state refs - Vue Query watcher on useVerses will trigger refetch
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