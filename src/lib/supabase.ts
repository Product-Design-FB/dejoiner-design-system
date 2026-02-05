import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    console.log('Initializing Supabase with URL:', supabaseUrl);

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Key is missing. Check your .env.local file.');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
};

// For backward compatibility with existing imports
export const supabase = {
    from: (table: string) => getSupabase().from(table),
    // Add other methods as needed or just use getSupabase()
} as any;
