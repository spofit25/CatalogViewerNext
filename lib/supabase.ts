// Supabase browser client.
// Uses NEXT_PUBLIC_ prefixed env vars so they are available in the client bundle.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn (do not throw) so builds/prerender never crash on a missing env file.
  console.warn(
    'Supabase: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.local.example to .env.local and fill in your project credentials.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseAnonKey || 'public-anon-key'
);
