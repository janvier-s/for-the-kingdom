/**
 * @file Composable to easily access the auth store state and actions.
 * Provides a cleaner interface for components compared to directly importing the store.
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import type {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const authStore = useAuthStore()

  // Expose state and getters as computed refs for reactivity
  const user = computed(() => authStore.user)
  const session = computed(() => authStore.session)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const userId = computed(() => authStore.userId)

  // Expose actions directly
  const { init, signInWithEmail, signUpWithEmail, signOut } = authStore

  return {
    // State & Getters (as computed refs)
    user,
    session,
    isLoading,
    error,
    isLoggedIn,
    userId,

    // Actions (as functions)
    init,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
