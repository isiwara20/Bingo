/**
 * Type declarations for environment variables
 * This allows TypeScript/IDE to recognize @env imports
 */
declare module '@env' {
  export const API_BASE_URL: string;
  export const GEMINI_API_KEY: string;
  export const GEMINI_API_KEY_2: string;
}
