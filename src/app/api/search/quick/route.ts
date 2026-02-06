import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface SearchResult {
    id: string;
    title: string;
    source: 'figma' | 'github' | 'drive';
    type: string;
    sourceUrl: string;
    thumbnailUrl?: string;
    lastEditedAt?: string;
    contentIndex?: any[];
    matchedIn?: {
        field: 'contentIndex' | 'title' | 'metadata';
        text: string;
        location: string;
        nodeId?: string;
    } | null;
}

/**
 * Quick Search API - Fast, lightweight endpoint for dropdown
 * GET /api/search/quick?q=maritimes&limit=6
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '6');

        if (!query || query.length === 0) {
            return NextResponse.json({ results: [], totalCount: 0 });
        }

        const startTime = Date.now();
        const searchLower = query.toLowerCase();

        // Fetch all resources (we'll filter in memory for speed)
        // For production, use PostgreSQL full-text search or pg_trgm
        const { data: resources, error } = await supabase
            .from('resources')
            .select('id, title, type, url, thumbnail_url, last_edited_at, metadata, content_index')
            .order('last_edited_at', { ascending: false })
            .limit(100); // Fetch top 100 recent, then filter

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        // Search & score results
        const scoredResults: Array<SearchResult & { score: number }> = [];

        for (const resource of resources || []) {
            let score = 0;
            let matchedIn: SearchResult['matchedIn'] = null;

            const titleLower = (resource.title || '').toLowerCase();

            // 1. Title exact match (highest priority)
            if (titleLower === searchLower) {
                score = 100;
            }
            // 2. Title starts with query
            else if (titleLower.startsWith(searchLower)) {
                score = 90;
            }
            // 3. Title contains query
            else if (titleLower.includes(searchLower)) {
                score = 70;
            }
            // 4. Search metadata.frames
            else if (resource.metadata?.frames) {
                const framesStr = JSON.stringify(resource.metadata.frames).toLowerCase();
                if (framesStr.includes(searchLower)) {
                    score = 50;
                    matchedIn = {
                        field: 'metadata',
                        text: 'Found in frames',
                        location: 'Frames'
                    };
                }
            }
            // 5. Search metadata.ai_summary
            else if (resource.metadata?.ai_summary) {
                const summaryLower = resource.metadata.ai_summary.toLowerCase();
                if (summaryLower.includes(searchLower)) {
                    score = 40;
                    matchedIn = {
                        field: 'metadata',
                        text: resource.metadata.ai_summary.substring(0, 60) + '...',
                        location: 'Summary'
                    };
                }
            }
            // 6. Search content_index (deep search)
            else if (resource.content_index && Array.isArray(resource.content_index)) {
                for (const entry of resource.content_index) {
                    const entryTextLower = (entry.text || '').toLowerCase();
                    if (entryTextLower.includes(searchLower)) {
                        score = 30;
                        matchedIn = {
                            field: 'contentIndex',
                            text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
                            location: entry.location || 'Unknown location',
                            nodeId: entry.nodeId
                        };
                        break; // Use first match
                    }
                }
            }

            if (score > 0) {
                scoredResults.push({
                    id: resource.id,
                    title: resource.title || 'Untitled',
                    source: resource.type as any,
                    type: resource.type,
                    sourceUrl: resource.url,
                    thumbnailUrl: resource.thumbnail_url,
                    lastEditedAt: resource.last_edited_at,
                    contentIndex: resource.content_index,
                    matchedIn,
                    score
                });
            }
        }

        // Sort by score (descending), limit results
        scoredResults.sort((a, b) => b.score - a.score);
        const topResults = scoredResults.slice(0, limit).map(({ score, ...rest }) => rest);

        const queryTime = Date.now() - startTime;

        return NextResponse.json({
            results: topResults,
            totalCount: scoredResults.length,
            queryTime,
            query
        });

    } catch (error: any) {
        console.error('Quick search error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
