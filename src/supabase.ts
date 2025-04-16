/**
 * @file Initializes and exports the Supabase client instance.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage =
    'Supabase environment variables are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  console.error(errorMessage)
  // In a real app, you might want to show this error to the user or halt initialization gracefully.
  throw new Error('Supabase configuration is incomplete.')
}

// Initialize the Supabase client with generated types for better type safety
const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey)

export default supabase
