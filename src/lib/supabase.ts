import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    console.log('🔧 Supabase Initialization:');
    console.log('  - URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING');
    console.log('  - Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ MISSING');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase configuration error: Missing environment variables');
        console.error('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ NOT SET');
        console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌ NOT SET');
        console.error('  ⚠️ If deploying to Vercel, ensure these are set in Project Settings → Environment Variables');
        throw new Error('Supabase URL or Key is missing. Check your environment variables configuration.');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
    return supabaseInstance;
};

// For backward compatibility with existing imports
export const supabase = {
    from: (table: string) => getSupabase().from(table),
    // Add other methods as needed or just use getSupabase()
} as any;
