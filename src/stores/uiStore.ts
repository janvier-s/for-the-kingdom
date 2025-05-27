// src/stores/uiStore.js
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    // For the new split right panel
    showRightPanel: false, // Simpler: just whether to show it or not
    rightPanelTitle: 'Details',
    rightPanelContent: null,
    rightPanelContentType: null, // e.g., 'footnotes', 'commentary'

    // You might want to store the last known size if you allow users to fully "close" it
    // and then re-open to the same size.
    rightPanelSize: 0.3, // Default size (30%) when shown, can be a string like '350px'
    minRightPanelSize: '50px', // Or a number like 0.1
    maxRightPanelSize: 0.7, // Or a string like '800px'
  }),
  actions: {
    showInRightPanel(title, content, type = 'generic') {
      this.rightPanelTitle = title
      this.rightPanelContent = content
      this.rightPanelContentType = type
      this.showRightPanel = true
      // If you want it to re-open to a default size if it was "closed" (size 0)
      if (this.rightPanelSize === 0 || this.rightPanelSize === '0px') {
        this.rightPanelSize = 0.3 // Or your preferred default string/number size
      }
    },
    hideRightPanel() {
      this.showRightPanel = false
      // Optionally, you could set this.rightPanelSize = 0 to "close" it via split size
      // and then showInRightPanel would reset it.
    },
    toggleRightPanel() {
      // This might mean toggle content visibility or "existence" of pane 2
      if (this.showRightPanel) {
        this.hideRightPanel()
      } else {
        // If toggling to show, but no content, what to do?
        // For now, assume showInRightPanel is the primary way to activate it with content.
        // If there's latent content, we can show it.
        if (this.rightPanelContent) {
          this.showRightPanel = true
        }
      }
    },
    updateRightPanelSize(newSize) {
      // Only update if the panel is meant to be shown,
      // to prevent storing '0' when it's programmatically hidden.
      if (this.showRightPanel) {
        this.rightPanelSize = newSize
      }
    },
  },
})
