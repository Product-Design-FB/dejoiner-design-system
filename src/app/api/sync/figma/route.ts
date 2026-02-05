import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFigmaProjectFiles, getFigmaFileMeta, getFigmaThumbnail } from '@/lib/figma';

export async function POST(request: Request) {
    try {
        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const files = await getFigmaProjectFiles(projectId);

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files found or API error.' });
        }

        let syncedCount = 0;
        const results = [];

        for (const file of files) {
            const fileKey = file.key;
            const fileName = file.name;
            const fileUrl = `https://www.figma.com/file/${fileKey}`;

            // Check if exists
            const { data: existing } = await supabase.from('resources').select('id').eq('url', fileUrl).single();
            if (existing) {
                results.push({ name: fileName, status: 'skipped' });
                continue;
            }

            // Fetch Meta & Thumbnail
            const figmaMeta = await getFigmaFileMeta(fileUrl);
            const thumbnailUrl = await getFigmaThumbnail(fileUrl);

            let metadata: any = {};
            let aiSummary = "";

            if (figmaMeta) {
                metadata = {
                    frames: figmaMeta.frames,
                    milestone: figmaMeta.milestone,
                    ai_summary: figmaMeta.summary
                };
                aiSummary = figmaMeta.summary || "";
            }

            // Insert
            const { error } = await supabase.from('resources').insert([{
                url: fileUrl,
                title: fileName,
                type: 'figma',
                version: 'v1.0',
                thumbnail_url: thumbnailUrl || file.thumbnail_url,
                metadata,
                last_edited_at: file.last_modified,
                author_name: 'Figma Sync'
            }]);

            if (!error) {
                syncedCount++;
                results.push({ name: fileName, status: 'synced' });
                // Optional: Add context
                if (aiSummary) {
                    // We need the ID of the inserted resource, but we didn't select it. 
                    // For bulk sync, skipping context insert to be faster or we can do it if needed.
                }
            } else {
                results.push({ name: fileName, status: 'error', error: error.message });
            }
        }

        return NextResponse.json({ success: true, count: syncedCount, results });
    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
