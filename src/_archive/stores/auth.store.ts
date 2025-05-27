/**
 * @file Pinia store for managing Supabase authentication state and actions.
 */
import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import supabase from '@/supabase'
import type {
  AuthError,
  Session,
  User,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js'

// Define the state structure with explicit types
interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user: Ref<User | null> = ref(null)
  const session: Ref<Session | null> = ref(null)
  const isLoading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  // --- Getters ---
  const isLoggedIn = computed<boolean>(() => !!user.value)
  const userId = computed<string | undefined>(() => user.value?.id)

  // --- Internal Actions ---

  /**
   * Sets the error message and clears it after a delay.
   * @param errorMessage - The error message string.
   * @param timeoutMs - Duration in milliseconds before clearing the error. Defaults to 5000.
   */
  function setError(errorMessage: string | null, timeoutMs = 5000): void {
    error.value = errorMessage
    if (errorMessage !== null) {
      setTimeout(() => {
        if (error.value === errorMessage) {
          // Clear only if it hasn't been overwritten
          error.value = null
        }
      }, timeoutMs)
    }
  }

  /**
   * Centralized loading state management.
   * @param loading - Boolean indicating the loading state.
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  /**
   * Updates the user and session state.
   * @param newSession - The new session object from Supabase, or null.
   */
  function updateAuthState(newSession: Session | null): void {
    session.value = newSession
    user.value = newSession?.user ?? null
    console.debug('Auth state updated:', event, newSession)
  }

  // --- Actions ---

  /**
   * Initializes the auth state by fetching the current session and setting up the listener.
   * Should be called once when the application starts.
   */
  async function init(): Promise<void> {
    setLoading(true)
    setError(null)
    console.debug('Initializing auth store...')
    try {
      // Attempt to get the initial session
      const { data: initialSessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Error getting initial session:', sessionError)
        // Don't throw here, allow app to load, but log the error
        setError(`Failed to retrieve initial session: ${sessionError.message}`)
      } else {
        updateAuthState(initialSessionData.session)
      }

      // Set up listener for subsequent auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
        updateAuthState(newSession)
      })

      // Consider storing the subscription to unsubscribe on app teardown if needed
      // E.g., store `authListener.subscription` and call `unsubscribe()` later.
      console.debug('Auth listener attached.')
    } catch (err) {
      console.error('Critical error during auth initialization:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred during auth setup.')
      // Update state to reflect failure
      updateAuthState(null)
    } finally {
      setLoading(false)
      console.debug('Auth store initialization complete.')
    }
  }

  /**
   * Signs in a user using email and password.
   * @param credentials - Object containing email and password.
   * @returns A promise resolving to an object indicating success or failure.
   */
  async function signInWithEmail(
    credentials: SignInWithPasswordCredentials,
  ): Promise<{ success: boolean; error?: AuthError }> {
    setLoading(true)
    setError(null)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(credentials)

      if (authError) {
        console.error('Sign-in error:', authError)
        throw authError // Throw to be caught below
      }

      // Auth state will be updated by the onAuthStateChange listener
      // updateAuthState(data.session); // Avoid redundant update if listener works reliably
      return { success: true }
    } catch (err) {
      const authError = err as AuthError
      setError(authError.message || 'Failed to sign in.')
      console.error('Sign in action failed:', authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Signs up a new user using email and password.
   * @param credentials - Object containing email and password.
   * @returns A promise resolving to an object indicating success or failure.
   */
  async function signUpWithEmail(
    credentials: SignUpWithPasswordCredentials,
  ): Promise<{ success: boolean; error?: AuthError }> {
    setLoading(true)
    setError(null)
    try {
      // Note: Supabase might require email confirmation depending on settings.
      // The user object in the response might be null until confirmed.
      const { data, error: authError } = await supabase.auth.signUp(credentials)

      if (authError) {
        console.error('Sign-up error:', authError)
        throw authError
      }

      // User might need to confirm email. State might not update immediately.
      console.log('Sign-up successful (check email for confirmation if enabled). User:', data.user)
      return { success: true }
    } catch (err) {
      const authError = err as AuthError
      setError(authError.message || 'Failed to sign up.')
      console.error('Sign up action failed:', authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Signs out the current user.
   * @returns A promise resolving to an object indicating success or failure.
   */
  async function signOut(): Promise<{ success: boolean; error?: AuthError }> {
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        console.error('Sign-out error:', authError)
        throw authError
      }

      // Auth state will be updated by the onAuthStateChange listener
      // updateAuthState(null); // Avoid redundant update
      return { success: true }
    } catch (err) {
      const authError = err as AuthError
      setError(authError.message || 'Failed to sign out.')
      console.error('Sign out action failed:', authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  // --- Return Store API ---
  return {
    // State refs (read-only recommended for direct use in components)
    user: computed(() => user.value), // Expose as computed for read-only access
    session: computed(() => session.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Getters
    isLoggedIn,
    userId,

    // Actions
    init,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
})
