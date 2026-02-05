import { getSlackBotApp } from './slack-client';
import { summarizeContent } from './gemini';
import { getFigmaThumbnail } from './figma';
import { supabase } from './supabase';
import { getFigmaFileMeta } from './figma';
import { getGithubMeta } from './github';

// Fuzzy matching helper (Levenshtein distance)
const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
};


const findSimilarTitles = (query: string, resources: any[]): any[] => {
    const queryLower = query.toLowerCase();
    const maxDistance = Math.max(3, Math.floor(query.length * 0.4)); // Dynamic threshold based on query length

    return resources
        .map(r => {
            const titleLower = (r.title || '').toLowerCase();
            const distance = levenshteinDistance(queryLower, titleLower);

            // Scoring system (lower is better)
            let score = distance;

            // Bonus for substring matches
            if (titleLower.includes(queryLower)) {
                score -= 10; // Strong bonus for containing the query
            }

            // Bonus for prefix matches
            if (titleLower.startsWith(queryLower.substring(0, 2))) {
                score -= 3; // Medium bonus for starting with same letters
            }

            // Bonus for word boundary matches
            const words = titleLower.split(/\s+/);
            if (words.some((word: string) => word.startsWith(queryLower.substring(0, 2)))) {
                score -= 2; // Small bonus for word starts
            }

            return { ...r, distance, score };
        })
        .filter(r => r.distance <= maxDistance || r.score < 0) // Include if within distance OR has bonus points
        .sort((a, b) => a.score - b.score) // Sort by final score
        .slice(0, 5); // Show top 5 suggestions (increased from 3)
};
import { getAppSettings } from './config';

const linkRegex = /(https?:\/\/[^\s>]+)/gi;

// Admin user IDs
const isAdmin = async (userId: string) => {
    const settings = await getAppSettings();
    return settings.adminUserIds?.includes(userId) || userId === 'U088P0Z9592';
};
const isDM = (channel: string) => channel.startsWith('D');

// Help texts
const PUBLIC_HELP = `*🎨 Dejoiner - Design Resource Hub*

*Slash Commands:*
• \`/find [keyword]\` - Quick search (top 3 results)
• \`/save [link] [context]\` - Index a link manually
• \`/showstatus [project]\` - Check project handoff status
• \`/help\` - Show this guide

*In Channels (Mention @Dejoiner):*
• \`search [query]\` - Search resources
• \`list\` - Show recent resources
• \`ping\` - Check if I'm alive

_I also automatically index Figma, GitHub, and Drive links shared in conversation._`;

const ADMIN_HELP = `\n\n*🔐 Admin Commands* (Available via mention):
• \`delete [id]\` - Delete a resource
• \`stats\` - Show statistics
• \`list all\` - List all resources with IDs`;

export const startSlackBot = async () => {
    const app = getSlackBotApp();

    const getUserName = async (client: any, userId: string) => {
        if (!userId) return "Unknown User";
        try {
            console.log(`👤 Fetching info for user: ${userId}`);
            const result = await client.users.info({ user: userId });
            if (result.ok && result.user) {
                const name = result.user.real_name || result.user.name || "Unknown User";
                console.log(`✅ User found: ${name}`);
                return name;
            } else {
                console.error(`❌ Slack API error for user ${userId}:`, result.error);
                return "Slack User";
            }
        } catch (e: any) {
            console.error(`❌ Error fetching user info for ${userId}:`, e.message);
            console.error(JSON.stringify(e));
            return "Slack User";
        }
    };

    // === SLASH COMMANDS ===

    app.command('/find', async ({ command, ack, respond }) => {
        await ack();
        const query = command.text.trim();
        if (!query) {
            await respond({ response_type: 'ephemeral', text: 'Usage: `/find [keyword]`' });
            return;
        }

        const { data, error } = await supabase
            .from('resources')
            .select('id, title, type, url, version')
            .or(`title.ilike.%${query}%,url.ilike.%${query}%`)
            .limit(3);

        if (error || !data || data.length === 0) {
            await respond({
                response_type: 'ephemeral',
                text: `No results for "${query}".`,
                blocks: [
                    { type: 'section', text: { type: 'mrkdwn', text: `🤷‍♂️ No results for "*${query}*".` } },
                    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open Dashboard' }, url: 'http://localhost:3000', action_id: 'open_dashboard_ephemeral' }] }
                ]
            });
            return;
        }

        const blocks: any[] = [{ type: 'section', text: { type: 'mrkdwn', text: `*🔍 Results for "${query}":*` } }];
        data.forEach((r: any) => {
            blocks.push({
                type: 'section',
                text: { type: 'mrkdwn', text: `*${r.title || 'Untitled'}* (${r.type}) - ${r.version || 'v1.0'}\n<${r.url}>` }
            });
        });
        await respond({ response_type: 'ephemeral', blocks });
    });

    app.command('/save', async ({ command, ack, respond, client }) => {
        await ack();
        const text = command.text.trim();
        const authorName = await getUserName(client, command.user_id);

        if (!text) {
            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'save_modal',
                    private_metadata: JSON.stringify({ authorName }),
                    title: { type: 'plain_text', text: 'Save Resource' },
                    submit: { type: 'plain_text', text: 'Save' },
                    blocks: [
                        { block_id: 'url_block', type: 'input', element: { action_id: 'url_input', type: 'plain_text_input', placeholder: { type: 'plain_text', text: 'https://figma.com/file/...' } }, label: { type: 'plain_text', text: 'Resource URL' } },
                        { block_id: 'title_block', type: 'input', optional: true, element: { action_id: 'title_input', type: 'plain_text_input', placeholder: { type: 'plain_text', text: 'Optional title' } }, label: { type: 'plain_text', text: 'Title' } },
                        { block_id: 'context_block', type: 'input', optional: true, element: { action_id: 'context_input', type: 'plain_text_input', multiline: true, placeholder: { type: 'plain_text', text: 'What is this for?' } }, label: { type: 'plain_text', text: 'Context' } }
                    ]
                }
            });
            return;
        }
        const links = text.match(linkRegex);
        if (!links) {
            await respond({ response_type: 'ephemeral', text: 'No valid URL found.' });
            return;
        }
        const url = links[0].replace(/[>]$/, '');
        const context = text.replace(url, '').trim();
        const type = url.includes('figma.com') ? 'figma' : url.includes('github.com') ? 'github' : 'drive';
        const { error } = await supabase.from('resources').insert([{
            url, type, title: context.slice(0, 50) || 'Saved via Slack', version: 'v1.0', author_name: authorName
        }]);
        if (error) await respond({ response_type: 'ephemeral', text: `❌ Error: ${error.message}` });
        else await respond({ response_type: 'ephemeral', text: `✅ Saved! "${context.slice(0, 30) || url.slice(0, 30)}..." indexed by ${authorName}.` });
    });

    app.command('/showstatus', async ({ command, ack, respond }) => {
        await ack();
        const projectName = command.text.trim();
        if (!projectName) {
            await respond({ response_type: 'ephemeral', text: 'Usage: `/showstatus [project name]`' });
            return;
        }
        const { data, error } = await supabase.from('resources').select('id, type, version, created_at, project:projects!inner(name)').ilike('project.name', `%${projectName}%`);
        if (error || !data || data.length === 0) {
            await respond({ response_type: 'ephemeral', text: `No resources found for project "${projectName}".` });
            return;
        }
        const status = data.filter((r: any) => r.version?.includes('v2') || r.version?.includes('final')).length > data.length / 2 ? '🟢 Ready for Dev' : '🟡 In Progress';
        await respond({ response_type: 'ephemeral', text: `*${projectName}* - ${status}\n\n📁 ${data.length} resources | 🎨 ${data.filter((r: any) => r.type === 'figma').length} Figma files` });
    });

    app.command('/help', async ({ command, ack, respond }) => {
        await ack();
        let helpText = PUBLIC_HELP;
        if (await isAdmin(command.user_id)) helpText += ADMIN_HELP;
        await respond({ response_type: 'ephemeral', text: helpText });
    });

    // === MODAL SUBMISSION ===
    app.view('save_modal', async ({ ack, view, body, client }) => {
        await ack();
        const url = (view.state.values.url_block.url_input as any).value || '';
        const title = (view.state.values.title_block.title_input as any).value || '';
        const context = (view.state.values.context_block.context_input as any).value || '';
        const privateMeta = JSON.parse(view.private_metadata || '{}');
        const authorName = privateMeta.authorName || await getUserName(client, body.user.id);

        let type = 'other';
        if (url.includes('figma.com/board/') || url.includes('figjam')) type = 'figjam';
        else if (url.includes('figma.com')) type = 'figma';
        else if (url.includes('github.com')) type = 'github';
        else type = 'drive';

        const purpose = context ? await summarizeContent(context) : 'Saved via Slack modal';

        let metadata = {};
        let lastEditedAt = new Date().toISOString();
        let finalTitle = title || url.split('/').pop()?.split('?')[0] || 'Saved Link';

        if (type === 'figma') {
            const figmaMeta = await getFigmaFileMeta(url);
            if (figmaMeta) {
                metadata = { frames: figmaMeta.frames, milestone: figmaMeta.milestone, ai_summary: figmaMeta.summary };
                lastEditedAt = figmaMeta.lastEditedAt || lastEditedAt;
                finalTitle = title || figmaMeta.fileName || finalTitle;
            }
        }

        await supabase.from('resources').insert([{
            url, type, title: finalTitle, version: 'v1.0', metadata, last_edited_at: lastEditedAt, author_name: authorName
        }]);
        await supabase.from('slack_context').insert([{ slack_text: context, gemini_summary: purpose, author_name: authorName }]);
    });

    // === INTERACTIVE ACTIONS ===
    app.action('confirm_index', async ({ ack, body, client }) => {
        await ack();
        const action = (body as any).actions[0];
        // Use stronger delimiter ||| to avoid conflict with URLs
        const parts = action.value.includes('|||') ? action.value.split('|||') : action.value.split('|');
        const [url, type, channelId, messageTs] = parts;

        const userId = (body as any).user.id;
        const authorName = await getUserName(client, userId);

        // Fetch author avatar
        let authorAvatar = '';
        try {
            const userInfo = await client.users.info({ user: userId });
            authorAvatar = (userInfo.user as any)?.profile?.image_48 || '';
        } catch (e) {
            console.error('Error fetching user avatar:', e);
        }

        // Capture conversation context
        let slackContext = '';
        try {
            if (messageTs) {
                // Fetch the original message + 2 previous ones
                const history = await client.conversations.history({
                    channel: channelId,
                    latest: messageTs,
                    inclusive: true, // Include the message with the link
                    limit: 3 // Get link message + 2 before
                });

                if (history.messages && history.messages.length > 0) {
                    slackContext = history.messages
                        .reverse() // Chronological order
                        // Filter out bot messages to avoid capturing "Indexed" status
                        .filter((m: any) => !m.bot_id && m.subtype !== 'bot_message')
                        .map((m: any) => `${m.user === userId ? authorName : 'Other'}: ${m.text}`)
                        .join('\n');

                    console.log(`📝 Captured Context for ${url}:\n${slackContext}`);
                }
            }
        } catch (e) {
            console.error('Error fetching conversation history:', e);
        }

        let metadata = {};
        let lastEditedAt = new Date().toISOString();
        let title = 'Untitled Resource';
        let thumbnailUrl = '';

        console.log(`\n========================================`);
        console.log(`🔗 INDEXING NEW FILE`);
        console.log(`   URL: ${url}`);
        console.log(`   Type: ${type}`);
        console.log(`   Channel: ${channelId}`);
        console.log(`   Author: ${authorName}`);
        console.log(`========================================`);

        if (type === 'figma') {
            console.log('🎨 [FIGMA] Fetching metadata from Figma API...');
            try {
                const figmaMeta = await getFigmaFileMeta(url);
                if (figmaMeta) {
                    console.log('✅ [FIGMA] Metadata received:');
                    console.log(`   - fileName: ${figmaMeta.fileName}`);
                    console.log(`   - frames: ${figmaMeta.frames?.length || 0} frames`);
                    console.log(`   - milestone: ${figmaMeta.milestone || 'none'}`);
                    console.log(`   - thumbnail: ${figmaMeta.thumbnailUrl ? 'YES' : 'NO'}`);
                    metadata = { frames: figmaMeta.frames, milestone: figmaMeta.milestone, ai_summary: figmaMeta.summary };
                    lastEditedAt = figmaMeta.lastEditedAt || lastEditedAt;
                    title = figmaMeta.fileName || 'Figma Design';
                    thumbnailUrl = figmaMeta.thumbnailUrl || '';
                } else {
                    console.log('❌ [FIGMA] getFigmaFileMeta returned null');
                    title = 'Figma Design';
                }
            } catch (figmaError) {
                console.error('❌ [FIGMA] Error:', figmaError);
                title = 'Figma Design';
            }
        } else if (type === 'docs') {
            console.log('📄 [DOCS] Processing Google Docs/Sheets URL...');
            const docMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (url.includes('document')) {
                title = docMatch ? `Google Doc (${docMatch[1].substring(0, 8)}...)` : 'Google Doc';
            } else if (url.includes('spreadsheets')) {
                title = docMatch ? `Google Sheet (${docMatch[1].substring(0, 8)}...)` : 'Google Sheet';
            } else {
                title = 'Google Document';
            }
            console.log(`   Generated title: ${title}`);
        } else if (type === 'github') {
            console.log('💻 [GITHUB] Extracting repo name...');
            const repoMatch = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
            title = repoMatch ? repoMatch[1] : 'GitHub Repository';
            console.log(`   Generated title: ${title}`);
        } else if (type === 'drive') {
            console.log('📁 [DRIVE] Using default title');
            title = 'Google Drive File';
        } else {
            console.log(`⚠️ [UNKNOWN] Unrecognized type: ${type}`);
        }

        console.log(`📌 FINAL TITLE: "${title}"`);
        console.log(`🖼️ THUMBNAIL: ${thumbnailUrl ? 'Available' : 'None'}`);
        console.log(`========================================\n`);

        // Generate AI Summary from Metadata (NOT Slack Context)
        let aiSummary = '';

        if (type === 'figma' && metadata && (metadata as any).ai_summary) {
            aiSummary = (metadata as any).ai_summary;
        } else if (type === 'github') {
            const ghMeta = await getGithubMeta(url);
            if (ghMeta) {
                aiSummary = ghMeta.summary;
                title = ghMeta.title || title;
                // Prefer GitHub description as title if generic
                if (title === 'GitHub Repository' && ghMeta.title) title = ghMeta.title;
            }
        }

        // If no metadata-based summary is available, we leave it empty.
        // We explicitly DO NOT use slackContext for aiSummary as per user request.

        const { data: resource, error: insertError } = await supabase.from('resources').insert([{
            url, type, title, version: 'v1.0', metadata, last_edited_at: lastEditedAt,
            author_name: authorName, author_avatar: authorAvatar, thumbnail_url: thumbnailUrl,
            slack_user_id: userId
        }]).select('id').single();

        // Store slack context if available
        if (resource && (slackContext || aiSummary)) {
            await supabase.from('slack_context').insert([{
                resource_id: resource.id,
                slack_text: slackContext,
                gemini_summary: aiSummary,
                author_name: authorName
            }]);
        }

        await client.chat.update({
            channel: (body as any).channel.id,
            ts: (body as any).message.ts,
            text: `✅ Indexed: ${url}`,
            blocks: [{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `✅ *Indexed:* <${url}>${slackContext ? `\n📝 _Context captured_` : ''}\n_Added by ${authorName}_`
                }
            }]
        });
    });

    app.action('ignore_index', async ({ ack, body, client }) => {
        await ack();
        await client.chat.update({ channel: (body as any).channel.id, ts: (body as any).message.ts, text: '❌ Ignored', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '❌ Link ignored.' } }] });
    });

    app.action('replace_context', async ({ ack, body, client }) => {
        await ack();
        const action = (body as any).actions[0];
        const [resourceId, newContext] = action.value.split('||');
        const userId = (body as any).user.id;
        const authorName = await getUserName(client, userId);

        // Update slack_context
        await supabase.from('slack_context').update({ slack_text: newContext, author_name: authorName })
            .eq('resource_id', resourceId);

        await client.chat.update({
            channel: (body as any).channel.id,
            ts: (body as any).message.ts,
            text: '✅ Context replaced',
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `✅ *Context updated* by ${authorName}` } }]
        });
    });

    app.action('keep_existing', async ({ ack, body, client }) => {
        await ack();
        await client.chat.update({
            channel: (body as any).channel.id,
            ts: (body as any).message.ts,
            text: '✅ Kept existing',
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '✅ Keeping existing file context.' } }]
        });
    });

    app.action('open_dashboard', async ({ ack }) => { await ack(); });
    app.action('open_dashboard_ephemeral', async ({ ack }) => { await ack(); });

    // === APP HOME ===
    app.event('app_home_opened', async ({ event, client }) => {
        const { data } = await supabase.from('resources').select('id, title, type, url, version, created_at').order('created_at', { ascending: false }).limit(5);
        const blocks: any[] = [{ type: 'section', text: { type: 'mrkdwn', text: '*🎨 Your Recent Resources*' } }, { type: 'divider' }];
        if (data && data.length > 0) {
            data.forEach((r: any) => {
                blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${r.title || 'Untitled'}* (${r.type})\n${r.version || 'v1.0'} • <${r.url}|Open>` } });
            });
        } else {
            blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '_No resources yet._' } });
        }
        await client.views.publish({ user_id: event.user, view: { type: 'home', blocks } });
    });

    // === SHARED MESSAGE PROCESSOR ===
    const processMessage = async (text: string, channel: string, user: string, say: any, messageTs?: string) => {
        if (!text) return;
        const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase();

        // 1. Ping
        if (cleanText === 'ping') {
            await say({ text: '*pong!* 🏓 Dejoiner is alive.' });
            return;
        }

        // 2. Help
        if (cleanText === 'help') {
            await say({ text: (await isAdmin(user)) ? PUBLIC_HELP + ADMIN_HELP : PUBLIC_HELP });
            return;
        }

        // 3. Search with "Did You Mean?"
        if (cleanText.startsWith('search ')) {
            const query = cleanText.replace('search ', '').trim();
            console.log(`🔍 Search query: "${query}"`);
            const { data } = await supabase.from('resources').select('id, title, type, url').or(`title.ilike.%${query}%,url.ilike.%${query}%`).limit(5);
            console.log(`📊 Exact matches found: ${data?.length || 0}`);

            if (!data || data.length === 0) {
                // Try fuzzy matching for suggestions
                const { data: allResources } = await supabase.from('resources').select('id, title, type, url').limit(50);
                console.log(`📚 Total resources for fuzzy search: ${allResources?.length || 0}`);
                const suggestions = allResources ? findSimilarTitles(query, allResources) : [];
                console.log(`💡 Fuzzy suggestions found: ${suggestions.length}`, suggestions.map(s => s.title));

                if (suggestions.length > 0) {
                    const suggestionText = suggestions.map((s: any, i: number) => `${i + 1}. *${s.title}* (${s.type})\n   <${s.url}>`).join('\n\n');
                    await say({
                        text: `No exact matches. Did you mean...?`,
                        blocks: [
                            { type: 'section', text: { type: 'mrkdwn', text: `🤷‍♂️ No exact matches for "*${query}*".\n\n💡 *Did you mean:*\n\n${suggestionText}` } },
                            { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open Dashboard' }, url: 'http://localhost:3000', action_id: 'open_dashboard' }] }
                        ]
                    });
                } else {
                    await say({
                        text: `No results for "${query}".`,
                        blocks: [
                            { type: 'section', text: { type: 'mrkdwn', text: `🤷‍♂️ No results found for "*${query}*".` } },
                            { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open Dashboard' }, url: 'http://localhost:3000', action_id: 'open_dashboard' }] }
                        ]
                    });
                }
            } else {
                const results = (data as any[]).map((r: any, i: number) => `${i + 1}. *${r.title || 'Untitled'}* (${r.type})\n   <${r.url}>`).join('\n\n');
                await say({ text: `*🔍 Results for "${query}":*\n\n${results}` });
            }
            return;
        }

        // 4. List
        if (cleanText === 'list') {
            const { data } = await supabase.from('resources').select('id, title, type, url').order('created_at', { ascending: false }).limit(5);
            if (!data || data.length === 0) {
                await say({ text: 'No resources found yet.' });
            } else {
                const results = (data as any[]).map((r: any, i: number) => `${i + 1}. *${r.title || 'Untitled'}* (${r.type})\n   <${r.url}>`).join('\n\n');
                await say({ text: `*📋 Recent Resources:*\n\n${results}` });
            }
            return;
        }

        // 5. Admin Commands
        if (await isAdmin(user)) {
            if (cleanText === 'commands' || cleanText === 'admin help') { await say({ text: ADMIN_HELP }); return; }
            if (cleanText === 'stats') {
                const { count } = await supabase.from('resources').select('*', { count: 'exact', head: true });
                await say({ text: `*📊 Stats*\nTotal Resources: *${count || 0}*` });
                return;
            }
            if (cleanText === 'list all') {
                const { data } = await supabase.from('resources').select('id, title, type').order('created_at', { ascending: false }).limit(20);
                if (!data || data.length === 0) { await say({ text: 'No resources found.' }); return; }
                const list = (data as any[]).map((r: any) => `\`${r.id.slice(0, 8)}\` - ${r.title || 'Untitled'} (${r.type})`).join('\n');
                await say({ text: `*📋 All Resources:*\n\n${list}\n\n_Use \`delete <id>\` to remove._` });
                return;
            }
            if (cleanText.startsWith('delete ')) {
                const idPrefix = cleanText.replace('delete ', '').trim();
                const { data: matches } = await supabase.from('resources').select('id, title').ilike('id', `${idPrefix}%`).limit(1);
                if (!matches || matches.length === 0) { await say({ text: `No resource found with ID \`${idPrefix}\`.` }); }
                else {
                    await supabase.from('resources').delete().eq('id', (matches as any[])[0].id);
                    await say({ text: `✅ Deleted: *${(matches as any[])[0].title || 'Untitled'}*` });
                }
                return;
            }
        }

        // 6. Link Detection with Duplicate Check
        const links = text.match(linkRegex);
        if (links) {
            for (const url of links) {
                const cleanUrl = url.replace(/[>]$/, '');

                // Determine type
                let type = 'other';
                let isSupported = false;

                if (cleanUrl.includes('figma.com/board/') || cleanUrl.includes('figjam')) {
                    type = 'figjam';
                    isSupported = true;
                } else if (cleanUrl.includes('figma.com')) {
                    type = 'figma';
                    isSupported = true;
                } else if (cleanUrl.includes('github.com')) {
                    type = 'github';
                    isSupported = true;
                } else if (cleanUrl.includes('docs.google.com/document') || cleanUrl.includes('docs.google.com/spreadsheets')) {
                    type = 'docs';
                    isSupported = true;
                } else if (cleanUrl.includes('drive.google.com')) {
                    type = 'drive';
                    isSupported = true;
                }

                if (isSupported) {
                    // Check for duplicates
                    let query = supabase.from('resources').select('id, title, author_name, url');

                    // Intelligent Duplicate Check
                    const figmaKey = (type === 'figma' || type === 'figjam') ?
                        cleanUrl.match(/(?:file|design|board)\/([a-zA-Z0-9]{22,})/)?.[1] : null;

                    if (figmaKey) {
                        // If it's Figma/FigJam, check if ANY resource contains this key
                        // We use a broader ILIKE check or regex if possible, but ILIKE %key% is safest
                        query = query.ilike('url', `%${figmaKey}%`);
                    } else {
                        // Exact match for others
                        query = query.eq('url', cleanUrl);
                    }

                    const { data: existingList } = await query.limit(1);
                    const existing = existingList?.[0];

                    if (existing) {
                        // Duplicate found - ask user
                        await say({
                            text: `This file already exists: ${existing.title}`,
                            blocks: [
                                { type: 'section', text: { type: 'mrkdwn', text: `🔄 *Duplicate Detected!*\\n\\nThis file is already indexed:\\n*${existing.title}*\\nAdded by: ${existing.author_name || 'Unknown'}\\n\\n<${cleanUrl}>` } },
                                {
                                    type: 'actions', elements: [
                                        { type: 'button', text: { type: 'plain_text', text: '🔄 Replace Context' }, style: 'primary', action_id: 'replace_context', value: `${existing.id}||${text}` },
                                        { type: 'button', text: { type: 'plain_text', text: '✅ Keep Existing' }, action_id: 'keep_existing' }
                                    ]
                                }
                            ]
                        });
                    } else {
                        // New file - prompt to index
                        await say({
                            text: `I detected a ${type} link. Index this?`,
                            blocks: [
                                { type: 'section', text: { type: 'mrkdwn', text: `🔗 I detected a *${type}* link:\\n<${cleanUrl}>` } },
                                {
                                    type: 'actions', elements: [
                                        { type: 'button', text: { type: 'plain_text', text: '✅ Yes, Index It' }, style: 'primary', action_id: 'confirm_index', value: `${cleanUrl}|||${type}|||${channel}|||${messageTs || ''}` },
                                        { type: 'button', text: { type: 'plain_text', text: '❌ Ignore' }, action_id: 'ignore_index' }
                                    ]
                                }
                            ]
                        });
                    }
                }
            }
        }
    };

    // Global event logger
    app.use(async ({ body, next }) => {
        console.log(`📥 Event: ${(body as any).event?.type || (body as any).type}`);
        await next();
    });

    app.event('app_mention', async ({ event, say }) => {
        await processMessage(event.text, event.channel, event.user || 'Unknown', say, event.ts);
    });

    app.message(async ({ message, say }) => {
        await processMessage((message as any).text, (message as any).channel, (message as any).user, say, (message as any).ts);
    });

    try {
        await app.start();
        console.log('⚡️ Dejoiner Slack Bot is running!');
    } catch (error) {
        console.error('Failed to start Slack Bot:', error);
    }
};
