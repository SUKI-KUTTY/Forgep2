import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
);

export const ADMIN_EMAIL = (
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || 'admin@kaverisilks.in'
).toLowerCase();

export const BOUTIQUE_UPI_ID =
  (import.meta.env.VITE_BOUTIQUE_UPI_ID as string | undefined) || 'kaverisilks@okicici';

export const BOUTIQUE_WHATSAPP =
  (import.meta.env.VITE_BOUTIQUE_WHATSAPP as string | undefined) || '919840012345';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
