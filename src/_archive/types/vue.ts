/**
 * @file Common Vue related type definitions (Props, Emits).
 */

// Example Prop Type (adjust as needed per component)
export interface ExampleComponentProps {
  message: string
  count?: number
}

// Example Emit Type (adjust as needed per component)
export type ExampleComponentEmits = {
  update: [value: string] // Emits 'update' with a string payload
  close: [] // Emits 'close' with no payload
}
