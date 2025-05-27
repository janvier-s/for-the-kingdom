// src/directives/prefetch.ts
import { type Directive, inject } from 'vue'
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query'
import type { PrefetchOptions } from '@tanstack/vue-query'

// Helper to check if the value is valid (basic check)
function isValidBindingValue(value: any): value is PrefetchOptions {
  return (
    value &&
    typeof value === 'object' &&
    Array.isArray(value.queryKey) &&
    typeof value.queryFn === 'function'
  )
}

export const vPrefetch: Directive<HTMLElement, PrefetchOptions | undefined> = {
  mounted(el, binding) {
    // --- Inject Client HERE in mounted ---
    const queryClient = inject<QueryClient>(VUE_QUERY_CLIENT)

    // --- Critical Check: Ensure client was injected ---
    if (!queryClient) {
      console.warn(
        'v-prefetch mounted: QueryClient not available via inject(). Directive will not function.',
      )
      // Store a flag or null to indicate failure, preventing handler execution
      ;(el as any).__vuePrefetchFailedInject__ = true
      return // Stop setup if client cannot be injected
    }
    // Store the successfully injected client instance on the element
    ;(el as any).__vueQueryClient__ = queryClient

    // --- Validate and Store Initial Options ---
    if (!isValidBindingValue(binding.value)) {
      console.warn('v-prefetch mounted: Initial binding value is invalid.', binding.value)
      // Store null options to prevent handler running with bad initial data
      ;(el as any).__vuePrefetchOptions__ = null
    } else {
      // Store initial options if valid
      ;(el as any).__vuePrefetchOptions__ = binding.value
    }

    // --- Define the Handler ---
    const prefetchHandler = () => {
      // --- Retrieve Client and Options from the element ---
      // Check the failure flag first
      if ((el as any).__vuePrefetchFailedInject__) {
        // console.warn('v-prefetch handler: Aborting, QueryClient injection failed during mount.');
        return
      }
      const client = (el as any).__vueQueryClient__ as QueryClient // Cast should be safe due to check above
      const options = (el as any).__vuePrefetchOptions__ as PrefetchOptions | null

      // Check if options are valid *at the time of execution*
      if (!options || !isValidBindingValue(options)) {
        console.warn(
          'v-prefetch handler: Prefetch options not found or invalid on element at execution time.',
        )
        return
      }
      // --- End Retrieval & Validation ---

      // console.debug('[v-prefetch handler] Triggered. Using queryClient from element:', client);
      // console.debug('[v-prefetch handler] Prefetching options:', options);

      // Use the retrieved 'client' instance
      client.prefetchQuery(options).catch((err) => {
        console.error('v-prefetch failed:', err)
      })
    }

    // Store handler on the element to remove it later
    ;(el as any).__vuePrefetchHandler__ = prefetchHandler

    // Add listeners
    el.addEventListener('mouseenter', prefetchHandler)
    el.addEventListener('focus', prefetchHandler)
  },

  updated(el, binding) {
    // Update stored options if they change and are valid
    if (isValidBindingValue(binding.value)) {
      ;(el as any).__vuePrefetchOptions__ = binding.value
    } else {
      // If updated options are invalid, store null to prevent handler execution
      console.warn('v-prefetch updated: New binding value is invalid.', binding.value)
      ;(el as any).__vuePrefetchOptions__ = null
    }
    // We assume the queryClient instance doesn't change after mount.
  },

  beforeUnmount(el) {
    const handler = (el as any).__vuePrefetchHandler__
    if (handler) {
      el.removeEventListener('mouseenter', handler)
      el.removeEventListener('focus', handler)
      // Clean up stored properties
      delete (el as any).__vuePrefetchHandler__
      delete (el as any).__vuePrefetchOptions__
      delete (el as any).__vueQueryClient__
      delete (el as any).__vuePrefetchFailedInject__ // Clean up flag
    }
  },
}
