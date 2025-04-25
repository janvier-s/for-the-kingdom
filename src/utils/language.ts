// src/utils/language.ts
import supabase from '@/supabase'
import { DEFAULT_LANGUAGE_NAME } from '@/constants'

const languageIdCache: Record<string, number> = {}

export const getLanguageId = async (langName: string = DEFAULT_LANGUAGE_NAME): Promise<number> => {
  if (languageIdCache[langName]) {
    return languageIdCache[langName]
  }

  console.debug(`Fetching language ID for: ${langName}`)
  try {
    const { data, error } = await supabase
      .from('languages')
      .select('id')
      .eq('lang', langName)
      .single()

    if (error) {
      console.error(`Supabase error fetching language ID for ${langName}:`, error)
      throw new Error(`Database error fetching language ID: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Language '${langName}' not found in the database.`)
    }

    console.debug(`Found language ID for ${langName}: ${data.id}`)
    languageIdCache[langName] = data.id
    return data.id
  } catch (err) {
    console.error(`Error in getLanguageId for ${langName}:`, err)
    if (err instanceof Error) {
      throw err
    } else {
      throw new Error(`An unknown error occurred while fetching language ID for ${langName}.`)
    }
  }
}
