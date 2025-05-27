<template>
    <div class="actual-content-area">
        <n-h2>{{ bibleStore.currentReference }}</n-h2>

        <!-- CORRECTED: v-if instead of v.if -->
        <div v-if="bibleStore.isLoadingVerses || bibleStore.isLoadingBooks || bibleStore.isLoadingContentBlocks">
            <n-spin size="large" />
            <p>Loading content...</p>
        </div>
        <div v-else>
            <p v-if="!bibleStore.selectedBook || !bibleStore.selectedChapter">
                Please select a book and chapter from the navigation.
            </p>
            <div v-else>
                <!-- Verse-by-verse display -->
                <div v-if="bibleStore.displayMode === 'verse-by-verse'">
                    <div v-if="bibleStore.verses && bibleStore.verses.length">
                        <div v-for="verse in bibleStore.verses" :key="verse.id" class="verse-item">
                            <strong>{{ verse.verse_number }}</strong> {{ verse.text_content }}
                            <n-button v-if="verse.footnotes && verse.footnotes.length" size="tiny" text
                                @click="showFootnotes(verse)" title="Show footnotes">
                                <n-icon><reader-outline /></n-icon>
                            </n-button>
                        </div>
                    </div>
                    <p v-else>No verses found for this selection.</p> <!-- Specific message for no verses -->
                </div>

                <!-- Paragraph display -->
                <div v-else-if="bibleStore.displayMode === 'paragraph'">
                    <div v-if="bibleStore.contentBlocks && bibleStore.contentBlocks.length">
                        <div v-for="block in bibleStore.contentBlocks" :key="block.id" class="content-block">
                            <div v-if="isHeadingBlock(block.block_type)">
                                <n-h3
                                    v-if="block.block_type.includes('major_section') || block.block_type === 'book_title'">{{
                                        block.plain_text_content }}</n-h3>
                                <n-h4 v-else-if="block.block_type.includes('section_heading')">{{
                                    block.plain_text_content }}</n-h4>
                                <n-h5 v-else>{{ block.plain_text_content }}</n-h5>
                            </div>
                            <!-- Using a component for rendering blocks is safer and more maintainable -->
                            <BibleBlockRenderer v-else :block="block" @footnote-click="handleFootnoteClickInBlock" />
                            <!-- OR the simplified v-html (still with caution) -->
                            <!-- <p v-else v-html="renderBlockXml(block.xml_content)"></p> -->
                        </div>
                    </div>
                    <p v-else>No content blocks found for this selection.</p> <!-- Specific message for no blocks -->
                </div>
                <!-- Fallback if displayMode is unknown or some other unhandled state -->
                <p v-else>No content to display for the current mode or selection.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'; // Import computed
import { NH2, NSpin, NButton, NIcon, NH3, NH4, NH5 } from 'naive-ui'
import { ReaderOutline } from '@vicons/ionicons5'
import { useBibleStore } from '@/stores/bibleStore'
import { useUiStore } from '@/stores/uiStore'
import BibleBlockRenderer from '@/components/utils/BibleBlockRenderer.vue';
const bibleStore = useBibleStore()
const uiStore = useUiStore()

// Add isLoadingContentBlocks to your bibleStore state if you haven't
// For the initial loading state:
// const isLoading = computed(() => bibleStore.isLoadingBooks || bibleStore.isLoadingChapters || bibleStore.isLoadingVerses || bibleStore.isLoadingContentBlocks);


function showFootnotes(verse) {
    uiStore.openRightDrawer({ type: 'footnotes', data: verse.footnotes, verseRef: `${verse.book_osis_code} ${verse.chapter_number}:${verse.verse_number}` });
}

function handleFootnoteClickInBlock(footnoteData) {
    // footnoteData should be an object containing the necessary info for the drawer
    uiStore.openRightDrawer({ type: 'block_footnote', data: footnoteData });
}

function isHeadingBlock(blockType) {
    if (!blockType) return false;
    const headingTypes = ['book_title', 'major_section_heading', 'section_heading', 'toc_level']; // Add more if needed
    return headingTypes.some(type => blockType.includes(type));
}

// Removing renderBlockXml from here. It's better in a dedicated component.
// If you absolutely need a quick v-html placeholder, use it with extreme caution and sanitize.

</script>

<style scoped>
.actual-content-area {
    /* Styles for the content rendering area */
}

.verse-item {
    margin-bottom: 0.5em;
    line-height: 1.6;
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