
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrate = async () => {
    console.log("🔄 Starting FigJam Migration...");

    // 1. Fetch all resources that look like FigJam files but aren't typed 'figjam'
    const { data: resources, error } = await supabase
        .from('resources')
        .select('id, url, title')
        .ilike('url', '%figma.com/board/%')
        .neq('type', 'figjam');

    if (error) {
        console.error("❌ Error fetching resources:", error);
        return;
    }

    if (!resources || resources.length === 0) {
        console.log("✅ No old FigJam records found needing migration.");
        return;
    }

    console.log(`🔍 Found ${resources.length} records to update.`);

    // 2. Update them
    for (const r of resources) {
        console.log(`   - Updating: ${r.title} (${r.id})`);
        const { error: updateError } = await supabase
            .from('resources')
            .update({ type: 'figjam' })
            .eq('id', r.id);

        if (updateError) {
            console.error(`     ❌ Failed to update ${r.id}:`, updateError);
        }
    }

    console.log("✅ Migration Complete!");
};

migrate();
