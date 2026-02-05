import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyNewResource } from '@/lib/slack';
import { getFigmaFileMeta, getFigmaThumbnail } from '@/lib/figma';

export async function POST(request: Request) {
    try {
        const { url, title, type, authorName } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Check for duplicates
        const { data: existingResource } = await supabase
            .from('resources')
            .select('id, title, author_name, created_at')
            .eq('url', url)
            .single();

        if (existingResource) {
            return NextResponse.json({
                error: 'Duplicate file detected',
                duplicate: true,
                existing: existingResource
            }, { status: 409 }); // 409 Conflict
        }

        let metadata: any = {};
        let lastEditedAt = new Date().toISOString();
        let thumbnailUrl = type === 'figma'
            ? "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80"
            : "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80";
        let finalTitle = title || 'New Resource';
        let aiSummary = "";

        // Fetch Figma Meta if applicable
        if (type === 'figma') {
            console.log('🎨 Fetching Figma metadata for:', url);
            const figmaMeta = await getFigmaFileMeta(url);
            console.log('📊 Figma metadata received:', figmaMeta ? 'Success' : 'Failed');

            if (figmaMeta) {
                metadata = {
                    frames: figmaMeta.frames,
                    milestone: figmaMeta.milestone,
                    ai_summary: figmaMeta.summary
                };
                lastEditedAt = figmaMeta.lastEditedAt || lastEditedAt;

                // Auto-Rename: Use Figma filename if title is missing or generic
                const isGenericTitle = !title || title === 'New Resource' || title === 'Saved Link' || title === 'Confirmed via Slack';
                finalTitle = (isGenericTitle && figmaMeta.fileName) ? figmaMeta.fileName : (title || figmaMeta.fileName || 'Figma Design');
                aiSummary = figmaMeta.summary || "";

                console.log('✅ Final title:', finalTitle);
                console.log('📝 AI Summary:', aiSummary ? 'Generated' : 'None');
            } else {
                console.log('❌ Failed to fetch Figma metadata');
            }
            thumbnailUrl = await getFigmaThumbnail(url);
        }

        // 1. Save to Supabase (with author info)
        const { data: resource, error } = await supabase
            .from('resources')
            .insert([{
                url,
                title: finalTitle,
                type,
                version: 'v1.0',
                thumbnail_url: thumbnailUrl,
                metadata,
                last_edited_at: lastEditedAt,
                author_name: authorName || 'Dashboard Upload' // Use provided name or default
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. Add AI Analysis to slack_context if it's a Figma file
        if (aiSummary) {
            await supabase.from('slack_context').insert([{
                resource_id: resource.id,
                slack_text: "Automated design analysis via Groq AI",
                gemini_summary: aiSummary,
                author_name: "Dejoiner AI"
            }]);
        }

        // 3. Trigger Slack Notification
        const mockProject = { name: 'Dashboard Upload' };
        await notifyNewResource(resource, mockProject);

        return NextResponse.json({ success: true, resource });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
