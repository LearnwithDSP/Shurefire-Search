import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = 
    (typeof process !== "undefined" && process.env?.SUPABASE_URL) || 
    "https://your-supabase-project-id.supabase.co";
    
  const key = 
    (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) || 
    "YOUR_SUPABASE_ANON_KEY_HERE";

  return !(
    !url || 
    url.includes("YOUR_SUPABASE_URL_HERE") || 
    url.includes("your-supabase-project-id") || 
    url.includes("placeholder") ||
    !key || 
    key.includes("YOUR_SUPABASE_ANON_KEY_HERE") ||
    key.includes("placeholder")
  );
}

export function getSupabase(customUrl?: string, customKey?: string): SupabaseClient {
  if (customUrl && customKey) {
    supabaseInstance = createClient(customUrl, customKey);
    return supabaseInstance;
  }

  if (!supabaseInstance) {
    // Check environment variables, support both standard Node environment and Vite import.meta.env as fallbacks
    const url = 
      (typeof process !== "undefined" && process.env?.SUPABASE_URL) || 
      "https://your-supabase-project-id.supabase.co";
      
    const key = 
      (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) || 
      "YOUR_SUPABASE_ANON_KEY_HERE";

    if (
      !url || 
      url.includes("YOUR_SUPABASE_URL_HERE") || 
      url.includes("your-supabase-project-id") || 
      !key || 
      key.includes("YOUR_SUPABASE_ANON_KEY_HERE")
    ) {
      console.warn(
        "[Shurefire Supabase Backend] Supabase credentials are not configured or are placeholder values. App is running with fallback mechanisms."
      );
    }
    
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}
