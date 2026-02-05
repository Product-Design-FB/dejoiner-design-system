
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSettings() {
    console.log('🔌 Connecting to Supabase...');
    const updates = [
        { key: 'figma_access_token', value: 'figd_kG15Zn9R4q12CMn-7CL2bQXOpq2uEJFLR11Fu7Sr' },
        { key: 'figma_team_id', value: '1133445507023682143' },
    ];

    for (const update of updates) {
        const { error } = await supabase.from('settings').upsert(update, { onConflict: 'key' });
        if (error) console.error(`❌ Failed to update ${update.key}:`, error.message);
        else console.log(`✅ Updated ${update.key}`);
    }

    console.log('\n✅ Settings update complete. Please restart your dev server.');
}

updateSettings();
