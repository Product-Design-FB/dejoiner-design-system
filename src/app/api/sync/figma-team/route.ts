import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFigmaTeamProjects, getFigmaProjectFiles, getFigmaFileMeta, getFigmaThumbnail } from '@/lib/figma';

export async function POST(request: Request) {
    try {
        const { teamId } = await request.json();

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        const { projects, error: fetchError } = await getFigmaTeamProjects(teamId);
        if (fetchError) {
            return NextResponse.json({ success: false, message: fetchError });
        }

        let totalSynced = 0;
        let totalNew = 0;
        let totalUpdated = 0;

        for (const project of projects) {
            // 1. Sync Project to DB
            let dbProjectId = null;
            const { data: existingProject } = await supabase.from('projects').select('id').eq('name', project.name).single();

            if (existingProject) {
                dbProjectId = existingProject.id;
            } else {
                const { data: newProject, error } = await supabase.from('projects').insert([{
                    name: project.name,
                    status: 'Active',
                    lead_designer: 'Figma Linked'
                }]).select('id').single();
                if (!error && newProject) dbProjectId = newProject.id;
            }

            // 2. Fetch Files
            const files = await getFigmaProjectFiles(project.id);
            if (!files) continue;

            for (const file of files) {
                const fileKey = file.key;
                const fileName = file.name;
                const fileUrl = `https://www.figma.com/file/${fileKey}`;

                // Check if exists
                const { data: existing } = await supabase.from('resources').select('id, title').eq('url', fileUrl).single();

                let operation = 'none';

                if (existing) {
                    // Smart Upsert: Update title, time, and project linkage
                    await supabase.from('resources').update({
                        title: fileName,
                        last_edited_at: file.last_modified,
                        project_id: dbProjectId // Link to project
                    }).eq('id', existing.id);
                    operation = 'updated';
                    totalUpdated++;
                } else {
                    // New Insert
                    const figmaMeta = await getFigmaFileMeta(fileUrl);
                    const thumbnail = await getFigmaThumbnail(fileUrl);

                    let metadata: any = {};
                    if (figmaMeta) {
                        metadata = {
                            frames: figmaMeta.frames,
                            milestone: figmaMeta.milestone,
                            ai_summary: figmaMeta.summary
                        };
                    }

                    await supabase.from('resources').insert([{
                        url: fileUrl,
                        title: fileName,
                        type: 'figma',
                        version: 'New',
                        thumbnail_url: thumbnail || file.thumbnail_url,
                        metadata: metadata,
                        last_edited_at: file.last_modified,
                        author_name: 'Figma Team Sync',
                        author_avatar: 'https://static.figma.com/app/icon/1/favicon.png',
                        project_id: dbProjectId // Mapped Project ID
                    }]);
                    operation = 'new';
                    totalNew++;
                }
                totalSynced++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync Complete: ${totalNew} new files added, ${totalUpdated} updated.`,
            stats: { total: totalSynced, new: totalNew, updated: totalUpdated }
        });

    } catch (error: any) {
        console.error('Team Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
