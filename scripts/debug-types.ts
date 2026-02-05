
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const debug = async () => {
    // 1. Check distinct types
    const { data: types } = await supabase.from('resources').select('type');
    const distinctTypes = [...new Set(types?.map(t => t.type))];
    console.log("📊 Distinct Types:", distinctTypes);

    // 2. Check Docs URLs
    const { data: docs } = await supabase.from('resources').select('url, type').or('type.eq.docs,type.eq.drive').limit(10);
    console.log("\n📄 Sample Docs/Drive:", docs);

    // 3. Check FigJam candidates (candidates for migration)
    const { data: figjamCandidates } = await supabase.from('resources')
        .select('url, type')
        .or('url.ilike.%figma.com/board/%,url.ilike.%figjam.com%')
        .neq('type', 'figjam');

    console.log(`\n🟣 Found ${figjamCandidates?.length} FigJam files still needing migration.`);
    if (figjamCandidates && figjamCandidates.length > 0) {
        console.log("   Sample:", figjamCandidates[0].url);
    }
};

debug();
