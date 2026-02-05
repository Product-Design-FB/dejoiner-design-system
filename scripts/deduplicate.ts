
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const extractFigmaKey = (url: string) => {
    const match = url.match(/(?:file|design|board)\/([a-zA-Z0-9]{22,})/);
    return match ? match[1] : null;
};

const run = async () => {
    console.log("🧹 Starting Cleanup...");

    // 1. Fetch All Resources
    const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: true }); // Oldest first

    if (!resources) {
        console.log("❌ No resources found.");
        return;
    }

    console.log(`📊 Validating ${resources.length} resources...`);

    // 2. Normalize Types (Figma -> figma)
    for (const r of resources) {
        if (r.type && r.type !== r.type.toLowerCase()) {
            console.log(`   - Normalizing type: ${r.type} -> ${r.type.toLowerCase()} (${r.title})`);
            await supabase.from('resources').update({ type: r.type.toLowerCase() }).eq('id', r.id);
            r.type = r.type.toLowerCase(); // Update local object
        }
    }

    // 3. Deduplicate Figma/FigJam
    const figmaMap = new Map(); // Key -> Resource
    let deletedCount = 0;

    for (const r of resources) {
        if (r.type === 'figma' || r.type === 'figjam') {
            const key = extractFigmaKey(r.url);
            if (!key) continue;

            if (figmaMap.has(key)) {
                const existing = figmaMap.get(key);
                console.log(`   🗑️ Duplicate found: ${r.title} (${r.url})`);
                console.log(`      matches existing: ${existing.title} (${existing.url})`);

                // Determine which to delete (Prefer keeping the one with metadata or Slack User ID)
                // Since we sorted by oldest first, 'existing' is older.
                // We typically delete the NEW duplicate (r), unless r has better data?
                // For simplicity, delete the NEW one (r).

                await supabase.from('resources').delete().eq('id', r.id);
                deletedCount++;
            } else {
                figmaMap.set(key, r);
            }
        }
    }

    console.log(`✅ Deduplication Complete. Removed ${deletedCount} duplicates.`);
};

run();
