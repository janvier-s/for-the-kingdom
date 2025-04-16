/**
 * @file Language related utility functions.
 */
import supabase from '@/supabase'
import { DEFAULT_LANGUAGE_NAME } from '@/constants'

// Simple in-memory cache for language IDs
const languageIdCache: Record<string, number> = {}

/**
 * Retrieves the language ID for a given language name from Supabase.
 * Caches the result in memory to avoid redundant database calls.
 *
 * @param langName - The name of the language (e.g., "Français"). Defaults to DEFAULT_LANGUAGE_NAME.
 * @returns A promise that resolves with the language ID.
 * @throws If the language is not found or if there's a database error.
 * @example
 * const frenchId = await getLanguageId();
 * const englishId = await getLanguageId('English');
 */
export const getLanguageId = async (langName: string = DEFAULT_LANGUAGE_NAME): Promise<number> => {
  if (languageIdCache[langName]) {
    return languageIdCache[langName]
  }

  console.debug(`Fetching language ID for: ${langName}`)
  try {
    const { data, error } = await supabase
      .from('languages')
      .select('lang_id')
      .eq('lang', langName)
      .single()

    if (error) {
      console.error(`Supabase error fetching language ID for ${langName}:`, error)
      throw new Error(`Database error fetching language ID: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Language '${langName}' not found in the database.`)
    }

    console.debug(`Found language ID for ${langName}: ${data.lang_id}`)
    languageIdCache[langName] = data.lang_id
    return data.lang_id
  } catch (err) {
    console.error(`Error in getLanguageId for ${langName}:`, err)
    // Re-throw the specific error for better context upstream
    if (err instanceof Error) {
      throw err
    } else {
      throw new Error(`An unknown error occurred while fetching language ID for ${langName}.`)
    }
  }
}
