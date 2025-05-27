import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    isRightDrawerActive: false,
    rightDrawerContent: null, // To hold footnote data, etc.
  }),
  actions: {
    openRightDrawer(content = null) {
      this.rightDrawerContent = content
      this.isRightDrawerActive = true
    },
    closeRightDrawer() {
      this.isRightDrawerActive = false
      this.rightDrawerContent = null
    },
    toggleRightDrawer() {
      this.isRightDrawerActive = !this.isRightDrawerActive
      if (!this.isRightDrawerActive) {
        this.rightDrawerContent = null
      }
    },
  },
})
