// src/components/layout/MainContentArea.vue
<template>
    <div class="actual-content-area">
        <n-h2 v-if="bookOsis && chapterNumParsed">{{ currentRouteReference }}</n-h2>
        <n-h2 v-else-if="bookOsis">{{ bookOsis }} - Select a chapter</n-h2>
        <n-h2 v-else>Bible Content</n-h2>


        <div class="display-mode-toggle" v-if="bookOsis && chapterNumParsed">
            <n-button-group>
                <n-button :type="bibleStore.displayMode === 'paragraph' ? 'primary' : 'default'"
                    @click="changeDisplayMode('paragraph')" size="small">
                    Paragraph
                </n-button>
                <n-button :type="bibleStore.displayMode === 'verse-by-verse' ? 'primary' : 'default'"
                    @click="changeDisplayMode('verse-by-verse')" size="small">
                    Verse by Verse
                </n-button>
            </n-button-group>
        </div>


        <div v-if="isLoadingContent">
            <n-skeleton text :repeat="4" style="width: 71%" />
            <n-skeleton text :repeat="2" style="width: 61%" />


            <!-- <n-spin size="large" />
            <p>Loading content for {{ bookOsis }} {{ chapterNumParsed }}...</p> -->
        </div>
        <div v-else-if="!bookOsis || !chapterNumParsed" class="placeholder-content">
            <p>Select a book and chapter from the navigation to view content.</p>
        </div>
        <div v-else>
            <!-- Verse-by-verse display -->
            <div v-if="bibleStore.displayMode === 'verse-by-verse'">
                <div v-if="bibleStore.verses && bibleStore.verses.length">
                    <div v-for="verse in bibleStore.verses" :key="verse.id" class="verse-item"
                        :id="`v-${bookOsis}-${chapterNumParsed}-${verse.verse_number}`">
                        <strong>{{ verse.verse_number }}</strong> {{ verse.text_content }}
                        <n-button v-if="verse.footnotes && verse.footnotes.length" size="tiny" text
                            @click="showFootnotes(verse)" title="Show footnotes" class="footnote-btn">
                            <n-icon><reader-outline /></n-icon>
                        </n-button>
                    </div>
                </div>
                <p v-else>No verses found for {{ bookOsis }} {{ chapterNumParsed }}.</p>
            </div>

            <!-- Paragraph display -->
            <div v-else-if="bibleStore.displayMode === 'paragraph'">
                <div v-if="bibleStore.contentBlocks && bibleStore.contentBlocks.length">
                    <BibleBlockRenderer v-for="block in bibleStore.contentBlocks" :key="block.id" :block="block"
                        @footnote-click="handleFootnoteClickInBlock" :current-book-osis="bookOsis"
                        :current-chapter-num="chapterNumParsed" />
                </div>
                <p v-else>No content blocks found for {{ bookOsis }} {{ chapterNumParsed }}.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Import useRouter
import { NH2, NSpin, NButton, NButtonGroup, NIcon } from 'naive-ui';
import { ReaderOutline } from '@vicons/ionicons5';
import { useBibleStore } from '@/stores/bibleStore';
import { useUiStore } from '@/stores/uiStore';
import BibleBlockRenderer from '../utils/BibleBlockRenderer.vue';

const props = defineProps({
    bookOsis: String,
    chapterNum: [String, Number] // Route params are strings initially
});

const bibleStore = useBibleStore();
const uiStore = useUiStore();
const route = useRoute(); // To access current route details if needed beyond props
const router = useRouter(); // To programmatically navigate

// Computed property for loading state based on display mode
const isLoadingContent = computed(() => {
    if (bibleStore.displayMode === 'paragraph') {
        return bibleStore.isLoadingContentBlocks;
    }
    return bibleStore.isLoadingVerses;
});

const chapterNumParsed = computed(() => props.chapterNum ? parseInt(props.chapterNum, 10) : null);

const currentRouteReference = computed(() => {
    const book = bibleStore.books.find(b => b.osis_code === props.bookOsis);
    const bookName = book ? book.name : props.bookOsis;
    return chapterNumParsed.value ? `${bookName} ${chapterNumParsed.value}` : bookName;
});

async function loadContentForRoute(book, chapter) {
    if (book && chapter) {
        // Update the store's selected book and chapter *before* fetching
        // This ensures fetchContentForChapter uses the correct context
        const bookData = bibleStore.books.find(b => b.osis_code === book);
        if (bookData) {
            bibleStore.selectedBook = bookData;
        } else {
            // If books aren't loaded yet, fetch them, then find the book
            // This can happen on direct URL load
            if (bibleStore.books.length === 0) {
                await bibleStore.fetchBooks(); // Ensure books are loaded
                const foundBook = bibleStore.books.find(b => b.osis_code === book);
                if (foundBook) bibleStore.selectedBook = foundBook;
                else {
                    console.error(`Book ${book} not found after fetching books.`);
                    // Potentially redirect to a 404 or default page
                    router.push('/bible/GEN/1'); // Fallback
                    return;
                }
            } else {
                console.error(`Book ${book} not found in existing store.`);
                router.push('/bible/GEN/1'); // Fallback
                return;
            }
        }
        bibleStore.selectedChapter = chapter;
        await bibleStore.fetchContentForChapter();
    } else if (book) {
        // Handle case where only bookOsis is provided (e.g., show book info, prompt for chapter)
        const bookData = bibleStore.books.find(b => b.osis_code === book);
        if (bookData) bibleStore.selectedBook = bookData;
        bibleStore.selectedChapter = null;
        bibleStore.verses = [];
        bibleStore.contentBlocks = [];
    }
}

// Watch for prop changes (route params)
watch(
    () => [props.bookOsis, props.chapterNum],
    async ([newBookOsis, newChapterNumStr]) => {
        const newChapterNum = newChapterNumStr ? parseInt(newChapterNumStr, 10) : null;
        // Ensure books are loaded before trying to set selectedBook from route
        if (bibleStore.books.length === 0 && newBookOsis) {
            await bibleStore.fetchBooks();
        }
        loadContentForRoute(newBookOsis, newChapterNum);
    },
    { immediate: true } // immediate: true to run on component mount
);

onMounted(async () => {
    // Initial load based on route params, watcher with immediate:true handles this.
    // We might still want to ensure books are loaded if not already for `currentRouteReference`
    if (bibleStore.books.length === 0 && props.bookOsis) {
        await bibleStore.fetchBooks();
    }
});

function showFootnotes(verse) {
    uiStore.openRightDrawer({
        type: 'footnotes',
        data: verse.footnotes,
        verseRef: `${props.bookOsis} ${chapterNumParsed.value}:${verse.verse_number}`
    });
}

function handleFootnoteClickInBlock(footnoteData) {
    uiStore.openRightDrawer({ type: 'block_footnote', data: footnoteData });
}

function changeDisplayMode(mode) {
    bibleStore.setDisplayMode(mode); // Store will re-fetch content
}

</script>

<style scoped>
.actual-content-area {
    position: relative;
    /* For positioning things like display mode toggle */
}

.placeholder-content {
    text-align: center;
    margin-top: 50px;
    color: var(--n-text-color-disabled);
}

.verse-item {
    margin-bottom: 0.5em;
    line-height: 1.6;
    padding: 2px 0;
    /* Tighter vertical spacing */
}

.footnote-btn {
    margin-left: 4px;
    position: relative;
    top: -2px;
    /* Align better with text */
}

.display-mode-toggle {
    margin-bottom: 15px;
    text-align: center;
}

.content-block {
    margin-bottom: 1em;
}

.content-block p,
.content-block div

/* If BibleBlockRenderer renders a div */
    {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    line-height: 1.7;
}
</style>