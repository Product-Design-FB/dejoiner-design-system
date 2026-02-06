import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFigmaTeamProjects, getFigmaProjectFiles, getFigmaFileMeta, getFigmaThumbnail } from '@/lib/figma';

// Vercel serverless function timeout is 10 seconds
// We'll stop processing at 8 seconds to have time to return response
const MAX_EXECUTION_TIME_MS = 8000;
const MAX_FILES_PER_REQUEST = 50; // Safety limit

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        const { teamId } = await request.json();

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        console.log(`🔄 Starting Figma team sync for team: ${teamId}`);
        const { projects, error: fetchError } = await getFigmaTeamProjects(teamId);
        if (fetchError) {
            return NextResponse.json({ success: false, message: fetchError });
        }

        let totalSynced = 0;
        let totalNew = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let timedOut = false;

        projectLoop: for (const project of projects) {
            // Check timeout before processing each project
            if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
                console.warn('⏱️ Approaching timeout limit, stopping sync early');
                timedOut = true;
                break projectLoop;
            }

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
                // Check file limit
                if (totalSynced >= MAX_FILES_PER_REQUEST) {
                    console.warn(`📦 Reached file limit (${MAX_FILES_PER_REQUEST}), stopping`);
                    timedOut = true;
                    break projectLoop;
                }

                // Check timeout
                if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
                    console.warn('⏱️ Approaching timeout limit, stopping sync early');
                    timedOut = true;
                    break projectLoop;
                }

                const fileKey = file.key;
                const fileName = file.name;
                const fileUrl = `https://www.figma.com/file/${fileKey}`;

                // Check if exists
                const { data: existing } = await supabase.from('resources').select('id, title').eq('url', fileUrl).single();

                if (existing) {
                    // OPTIMIZATION: For existing files, just update metadata - skip heavy API calls
                    await supabase.from('resources').update({
                        title: fileName,
                        last_edited_at: file.last_modified,
                        project_id: dbProjectId
                    }).eq('id', existing.id);
                    totalUpdated++;
                } else {
                    // NEW FILE: Fetch full metadata (this is slower but only for new files)
                    try {
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
                            project_id: dbProjectId
                        }]);
                        totalNew++;
                    } catch (fileError) {
                        console.error(`❌ Error processing file ${fileName}:`, fileError);
                        totalSkipped++;
                        continue; // Skip this file and continue with others
                    }
                }
                totalSynced++;
            }
        }

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const message = timedOut
            ? `⚠️ Partial sync (${elapsedTime}s): ${totalNew} new, ${totalUpdated} updated, ${totalSkipped} skipped. Run again to continue.`
            : `✅ Complete sync (${elapsedTime}s): ${totalNew} new, ${totalUpdated} updated.`;

        console.log(message);

        return NextResponse.json({
            success: true,
            message,
            stats: {
                total: totalSynced,
                new: totalNew,
                updated: totalUpdated,
                skipped: totalSkipped,
                timedOut,
                elapsedSeconds: parseFloat(elapsedTime)
            }
        });

    } catch (error: any) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Team Sync Error after ${elapsedTime}s:`, error);
        return NextResponse.json({
            error: error.message,
            elapsedSeconds: parseFloat(elapsedTime)
        }, { status: 500 });
    }
}
