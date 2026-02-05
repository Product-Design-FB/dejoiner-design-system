
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
// import fetch from 'node-fetch'; // Using native fetch

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

const extractFigmaKey = (url: string) => {
    const match = url.match(/(?:file|design|board)\/([a-zA-Z0-9]{22,})/);
    return match ? match[1] : null;
};

const run = async () => {
    if (!FIGMA_TOKEN) {
        console.error("❌ Missing FIGMA_ACCESS_TOKEN in .env.local");
        return;
    }

    console.log("🛠️ Starting API-based FigJam Repair...");

    // 1. Fetch all resources currently typed as 'figma'
    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('type', 'figma');

    if (!resources || resources.length === 0) {
        console.log("✅ No 'figma' resources found to check.");
        return;
    }

    console.log(`🔍 Checking ${resources.length} resources against Figma API...`);

    let updatedCount = 0;

    for (const r of resources) {
        const key = extractFigmaKey(r.url);
        if (!key) continue;

        try {
            const res = await fetch(`https://api.figma.com/v1/files/${key}?depth=1`, {
                headers: { 'X-Figma-Token': FIGMA_TOKEN }
            });

            if (!res.ok) {
                console.warn(`   ⚠️ API Error for ${r.title} (${key}): ${res.status}`);
                continue;
            }

            const data: any = await res.json();
            const realType = data.editorType; // 'figma' or 'figjam'

            if (realType === 'figjam') {
                console.log(`   🟣 Found Mismatch! '${r.title}' is FigJam but saved as Figma. Fixing...`);
                await supabase.from('resources').update({ type: 'figjam' }).eq('id', r.id);
                updatedCount++;
            } else if (realType === 'figma') {
                // Correctly tagged
                // console.log(`   ✅ ${r.title} is verified Figma.`);
            } else {
                console.log(`   ❓ Unknown editorType: ${realType} for ${r.title}`);
            }

        } catch (e) {
            console.error(`   ❌ Error checking ${r.title}:`, e);
        }
    }

    console.log(`✅ Repair Complete. Updated ${updatedCount} resources to FigJam.`);
};

run();
