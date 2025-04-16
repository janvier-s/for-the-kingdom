<template>
  <div class="book-detail-view container">
    <header class="view-header book-header">
      <BaseLoadingIndicator v-if="isLoadingBook" message="Loading book details..." />
      <BaseErrorMessage :message="bookError" />
      <template v-if="!isLoadingBook && !bookError && bookTitle">
        <h1>{{ bookTitle }}</h1>
        <!-- Version Selector -->
        <div v-if="versions.length > 1 && !isLoadingVersions" class="version-selector">
          <label for="versionSelect">Version:</label>
          <select id="versionSelect" v-model="selectedVersionId">
            <option v-for="version in versions" :key="version.version_id" :value="version.version_id">
              {{ version.abbr }} ({{ version.full_name }})
            </option>
          </select>
        </div>
        <BaseLoadingIndicator v-if="isLoadingVersions" message="Loading versions..." />
        <BaseErrorMessage :message="versionsError" />
        <p v-if="!isLoadingVersions && versions.length === 1" class="single-version">
          Version: {{ versions[0].abbr }}
        </p>
        <p v-if="!isLoadingVersions && versions.length === 0 && !versionsError" class="no-results">
          No Bible versions found.
        </p>
      </template>
      <h1 v-if="!isLoadingBook && !bookError && !bookTitle">Book Not Found</h1>
    </header>

    <main v-if="bookId && selectedVersionId">
      <!-- Chapter Navigation -->
      <BaseLoadingIndicator v-if="isLoadingChapters" message="Loading chapters..." />
      <BaseErrorMessage :message="chaptersError" />
      <nav v-if="chapters.length > 1 && !isLoadingChapters" class="chapter-nav">
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
      <h2 v-else-if="chapters.length === 1 && !isLoadingChapters" class="single-chapter-heading">
        Chapter {{ selectedChapterNumber }}
      </h2>
      <p v-if="!isLoadingChapters && chapters.length === 0 && !chaptersError" class="no-results">
        No chapters found for this book.
      </p>

      <!-- Verse Content -->
      <div class="content-area">
        <BaseLoadingIndicator v-if="isLoadingVerses" message="Loading content..." />
        <BaseErrorMessage :message="versesError" />
        <div v-if="!isLoadingVerses && !versesError && verses.length > 0" class="verses-container">
          <p v-for="verse in verses" :key="verse.verse_id" class="verse">
            <sup :id="`v${selectedChapterNumber}-${verse.verse_number}`">{{ verse.verse_number }}</sup>
            {{ verse.verse_text }}
          </p>
        </div>
        <p v-if="!isLoadingVerses && !versesError && verses.length === 0 && chapters.length > 0" class="no-results">
          No verses found for Chapter {{ selectedChapterNumber }} in the selected version.
        </p>
      </div>

    </main>
    <div v-else-if="!isLoadingBook && !bookError && !bookId">
      <p class="no-results">Could not determine book details to load content.</p>
    </div>
    <div v-else-if="!isLoadingVersions && !versionsError && !selectedVersionId">
      <p class="no-results">Please select a Bible version to view content.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  useBookDetails,
  useBibleVersions,
  useChapters,
  useVerses,
} from '@/composables/useBibleData';
import BaseLoadingIndicator from '@/components/BaseLoadingIndicator.vue';
import BaseErrorMessage from '@/components/BaseErrorMessage.vue';
import type { Chapter } from '@/types';

interface Props {
  bookSlug: string;
  // testamentSlug and typeSlug might be needed if you build breadcrumbs, but not for core logic
  // testamentSlug?: string;
  // typeSlug?: string;
}
const props = defineProps<Props>();

const route = useRoute(); // Access route if needed for query params, etc.

const bookSlugRef = computed(() => props.bookSlug);

// --- State Refs ---
const selectedVersionId = ref<number | null>(null);
const selectedChapterId = ref<number | null>(null);
const selectedChapterNumber = ref<number>(1); // Default to chapter 1

// --- Composables ---

// 1. Fetch Book Details (Title, ID) based on Slug
const {
  isLoading: isLoadingBook,
  error: bookError,
  bookTitle,
  bookId // Reactive ref: number | null
} = useBookDetails(bookSlugRef);

// 2. Fetch Available Versions (runs once bookId is potentially available, but independent)
const {
  data: versions,
  isLoading: isLoadingVersions,
  error: versionsError
} = useBibleVersions(); // Fetches automatically

// 3. Fetch Chapters once Book ID is known
const {
  data: chapters,
  isLoading: isLoadingChapters,
  error: chaptersError
} = useChapters(bookId); // Reacts to bookId changes

// 4. Fetch Verses once Chapter ID and Version ID are known
const {
  data: verses,
  isLoading: isLoadingVerses,
  error: versesError,
  fetchData: fetchVerses // Expose fetch function
} = useVerses(selectedChapterId, selectedVersionId); // Reacts to changes in these refs

// --- Watchers and Logic ---

// Set default version once versions load and book is loaded
watch([versions, bookId, isLoadingVersions], ([newVersions, newBookId, loadingVersions]) => {
  if (!loadingVersions && newBookId && newVersions.length > 0 && !selectedVersionId.value) {
    // Prioritize LSG, fallback to the first available version
    const defaultVersion = newVersions.find((v) => v.abbr === 'LSG') || newVersions[0];
    if (defaultVersion) {
      console.debug(`Setting default version: ${defaultVersion.abbr} (ID: ${defaultVersion.version_id})`);
      selectedVersionId.value = defaultVersion.version_id;
    } else {
      console.warn("No suitable default version found.");
    }
  }
}, { immediate: true }); // Check immediately

// Set initial chapter once chapters load
watch([chapters, isLoadingChapters], ([newChapters, loadingChapters]) => {
  if (!loadingChapters && newChapters.length > 0 && !selectedChapterId.value) {
    // Find chapter matching selectedChapterNumber (usually 1 initially)
    const targetChapter = newChapters.find(ch => ch.chapter_number === selectedChapterNumber.value) || newChapters[0];
    if (targetChapter) {
      console.debug(`Setting initial chapter: ${targetChapter.chapter_number} (ID: ${targetChapter.chapter_id})`);
      selectedChapterId.value = targetChapter.chapter_id;
      selectedChapterNumber.value = targetChapter.chapter_number; // Ensure consistency
    } else {
      console.warn("Could not find initial chapter.");
    }
  }
  // Reset chapter if chapters become empty (e.g., book changes)
  else if (!loadingChapters && newChapters.length === 0) {
    selectedChapterId.value = null;
    selectedChapterNumber.value = 1; // Reset to default
  }
}, { immediate: true });

// Function to change chapter
const changeChapter = (direction: 1 | -1) => {
  if (isLoadingChapters.value || chapters.value.length <= 1) return;

  const currentIdx = chapters.value.findIndex(ch => ch.chapter_id === selectedChapterId.value);
  if (currentIdx === -1 && chapters.value.length > 0) {
    // Safety net: if current chapter not found, reset to first
    selectedChapterId.value = chapters.value[0].chapter_id;
    selectedChapterNumber.value = chapters.value[0].chapter_number;
    console.warn("Current chapter ID not found in list, resetting to first chapter.");
    return;
  }

  const newIdx = currentIdx + direction;

  if (newIdx >= 0 && newIdx < chapters.value.length) {
    const newChapter = chapters.value[newIdx];
    console.debug(`Changing chapter to: ${newChapter.chapter_number} (ID: ${newChapter.chapter_id})`);
    selectedChapterId.value = newChapter.chapter_id;
    selectedChapterNumber.value = newChapter.chapter_number;
    // Verses will refetch automatically due to the watcher in useVerses
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