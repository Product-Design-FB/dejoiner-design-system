import { createClient } from '@supabase/supabase-js';
import { getFigmaThumbnail } from '../src/lib/figma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshFigmaThumbnails() {
    console.log('🔄 Starting thumbnail refresh for existing Figma resources...\n');

    try {
        // Fetch all Figma resources
        const { data: resources, error } = await supabase
            .from('resources')
            .select('id, url, title, thumbnail_url')
            .eq('type', 'figma');

        if (error) {
            console.error('❌ Error fetching resources:', error);
            return;
        }

        if (!resources || resources.length === 0) {
            console.log('ℹ️ No Figma resources found.');
            return;
        }

        console.log(`📊 Found ${resources.length} Figma resources to process\n`);

        let updated = 0;
        let failed = 0;
        let skipped = 0;

        for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            const progress = `[${i + 1}/${resources.length}]`;

            try {
                console.log(`${progress} Processing: ${resource.title}`);

                // Fetch new cover image
                const newThumbnail = await getFigmaThumbnail(resource.url);

                if (!newThumbnail || newThumbnail.includes('unsplash.com')) {
                    console.log(`  ⚠️ Skipped - no valid thumbnail from Figma`);
                    skipped++;
                    continue;
                }

                // Check if it's different from current
                if (resource.thumbnail_url === newThumbnail) {
                    console.log(`  ℹ️ Skipped - thumbnail unchanged`);
                    skipped++;
                    continue;
                }

                // Update in database
                const { error: updateError } = await supabase
                    .from('resources')
                    .update({ thumbnail_url: newThumbnail })
                    .eq('id', resource.id);

                if (updateError) {
                    console.log(`  ❌ Failed to update: ${updateError.message}`);
                    failed++;
                } else {
                    console.log(`  ✅ Updated successfully`);
                    updated++;
                }

                // Rate limiting - wait 500ms between requests
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err: any) {
                console.log(`  ❌ Error: ${err.message}`);
                failed++;
            }

            console.log(''); // Empty line for readability
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Summary:');
        console.log(`  ✅ Updated: ${updated}`);
        console.log(`  ⚠️ Skipped: ${skipped}`);
        console.log(`  ❌ Failed: ${failed}`);
        console.log(`  📦 Total: ${resources.length}`);
        console.log('='.repeat(50));

    } catch (error: any) {
        console.error('💥 Fatal error:', error.message);
    }
}

// Run the script
refreshFigmaThumbnails()
    .then(() => {
        console.log('\n✨ Script completed');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Script failed:', err);
        process.exit(1);
    });
