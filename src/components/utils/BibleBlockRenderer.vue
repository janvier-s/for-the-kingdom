<template>
  <div class="bible-block-rendered-content">
    <!-- This is a placeholder. Actual rendering of USFX XML is complex. -->
    <!-- For simple text blocks or pre-formatted HTML, this might be okay with sanitization. -->
    <!-- If block.xml_content is complex USFX, you need to parse it. -->

    <div v-if="isSimpleText" v-html="sanitizedSimpleText()"></div>
    <div v-else class="complex-xml-placeholder">
      <!--
        Ideally, parse props.block.xml_content here and create a tree of Vue components
        or HTML elements based on the XML structure.
        Example of what you might do if you pre-process xml_content into a structured array:
        <template v-for="(item, index) in processedContent" :key="index">
          <span v-if="item.type === 'text'">{{ item.text }}</span>
          <span v-if="item.type === 'verseNumber'" class="verse-number-inline">{{ item.number }}</span>
          <span v-if="item.type === 'footnoteCaller'" @click="emitFootnote(item.data)">{{ item.caller }}</span>
        </template>
-->
      <p>[Rendering for block type '{{ props.block.block_type }}' with XML content needs to be implemented. Displaying
        plain
        text as fallback.]</p>
      <p>{{ props.block.plain_text_content }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
// import DOMPurify from 'dompurify'; // For sanitizing if using v-html

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['footnote-click']);

// Example: Determine if the block can be rendered as simple HTML (e.g., if it's already HTML or simple text)
const isSimpleText = computed(() => {
  // Add your logic here. For now, let's assume false unless it's a very specific block_type.
  return ['paragraph_standard_html_safe'].includes(props.block.block_type); // Example
});

function sanitizedSimpleText() {
  // if (props.block.already_safe_html_content) {
  //   return DOMPurify.sanitize(props.block.already_safe_html_content);
  // }
  return '';
}

// This function would be called if you parse the XML and find footnote markers
// function emitFootnote(footnoteDataFromXml) {
//   emit('footnote-click', footnoteDataFromXml);
// }

// For now, this component is mostly a placeholder for where you'd implement
// proper USFX/XML rendering logic for the various block.xml_content.
// A common approach is to transform USFX to a JSON structure during import,
// which is easier to iterate over and render in Vue.
</script>

<style scoped>
.verse-number-inline {
  font-weight: bold;
  font-size: 0.8em;
  vertical-align: super;
  margin-right: 0.2em;
  color: #555;
}

.footnote-caller {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}

.complex-xml-placeholder {
  border: 1px dashed #ccc;
  padding: 10px;
  margin: 5px 0;
  font-style: italic;
  color: #777;
}
</style>