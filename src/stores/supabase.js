// stores/supabase.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '../supabase'

export const useSupabaseStore = defineStore('supabase', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const session = ref(null)

  // Computed properties
  const isLoggedIn = computed(() => !!user.value)

  // Set error and clear it after a delay
  function setError(errorMessage) {
    error.value = errorMessage
    // Automatically clear error after 5 seconds
    setTimeout(() => {
      error.value = null
    }, 5000)
  }

  // Initialize the store and set up auth listener
  async function init() {
    isLoading.value = true

    try {
      // Get the current session
      const { data, error: sessionError } = await supabase.auth.getSession() // Renamed error to sessionError
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        throw sessionError // Throw the error to be caught by the outer catch block
      }
      session.value = data.session

      if (data.session) {
        user.value = data.session.user
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null
      })
    } catch (err) {
      setError(err.message || 'Failed to initialize authentication')
      console.error('Auth initialization error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Sign in with email and password
  async function signInWithEmail(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        // Renamed error to authError
        email,
        password,
      })

      if (authError) {
        console.error('Sign-in error:', authError)
        throw authError // Throw the error
      }

      user.value = data.user
      session.value = data.session
      return { success: true, data }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
      console.error('Sign in error:', err)
      return { success: false, error: err }
    } finally {
      isLoading.value = false
    }
  }

  // Sign up with email and password
  async function signUpWithEmail(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        // Renamed error to authError
        email,
        password,
      })

      if (authError) {
        console.error('Sign-up error:', authError)
        throw authError // Throw the error
      }

      return { success: true, data }
    } catch (err) {
      setError(err.message || 'Failed to sign up')
      console.error('Sign up error:', err)
      return { success: false, error: err }
    } finally {
      isLoading.value = false
    }
  }

  // Sign out
  async function signOut() {
    isLoading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signOut() // Renamed error to authError

      if (authError) {
        console.error('Sign-out error:', authError)
        throw authError // Throw the error
      }

      user.value = null
      session.value = null
      return { success: true }
    } catch (err) {
      setError(err.message || 'Failed to sign out')
      console.error('Sign out error:', err)
      return { success: false, error: err }
    } finally {
      isLoading.value = false
    }
  }

  // Get current user
  function getCurrentUser() {
    return user.value
  }

  return {
    user,
    isLoading,
    error,
    session,
    isLoggedIn,
    init,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getCurrentUser,
  }
})
