// src/composables/useDelayedState.ts
import { ref, watch, type Ref, onUnmounted } from 'vue'

/**
 * Creates a ref that reflects the value of a source ref but only
 * becomes true after a specified delay. Resets immediately if the source becomes false.
 * @param sourceRef The source boolean ref (e.g., isLoading).
 * @param delayMs The delay in milliseconds before the returned ref becomes true.
 * @returns A ref that is true only if the sourceRef has been true for delayMs.
 */
export function useDelayedTrueState(sourceRef: Ref<boolean>, delayMs: number = 600): Ref<boolean> {
  const delayedState = ref(false)
  let timerId: ReturnType<typeof setTimeout> | null = null

  watch(
    sourceRef,
    (newValue) => {
      if (newValue) {
        // Source became true, start timer
        if (timerId === null) {
          // Prevent multiple timers
          timerId = setTimeout(() => {
            // Only set to true if source is STILL true after delay
            if (sourceRef.value) {
              delayedState.value = true
            }
            timerId = null // Timer finished
          }, delayMs)
        }
      } else {
        // Source became false, clear timer and reset state immediately
        if (timerId !== null) {
          clearTimeout(timerId)
          timerId = null
        }
        delayedState.value = false
      }
    },
    { immediate: true },
  ) // Check initial state

  // Cleanup timer on component unmount
  onUnmounted(() => {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
  })

  return delayedState
}
