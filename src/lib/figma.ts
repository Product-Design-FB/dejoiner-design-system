import { analyzeFigmaStructure } from './gemini';
import { getAppSettings } from './config';

export const getFigmaThumbnail = async (url: string): Promise<string> => {
    try {
        const settings = await getAppSettings();
        const figmaToken = settings.figmaAccessToken;
        if (!figmaToken) throw new Error("Figma token missing");

        const matches = url.match(/figma\.com\/file\/([^/?#]+)/);
        if (!matches) return "";
        const fileKey = matches[1];

        console.log(`🖼️ Fetching Figma cover image for file: ${fileKey}`);

        // Use the main file endpoint to get thumbnailUrl (actual cover image)
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
            headers: { "X-Figma-Token": figmaToken }
        });

        if (!response.ok) {
            console.error("Figma API error:", response.status);
            throw new Error("Figma API error");
        }

        const data = await response.json();
        const thumbnailUrl = data.thumbnailUrl;

        if (thumbnailUrl) {
            console.log(`✅ Got Figma cover image: ${thumbnailUrl.substring(0, 50)}...`);
            return thumbnailUrl;
        }

        console.warn("⚠️ No thumbnailUrl in response, using fallback");
        return `https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80`;
    } catch (error) {
        console.error("Figma Thumbnail Error:", error);
        return "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80";
    }
};

export const getFigmaFileMeta = async (url: string) => {
    try {
        const settings = await getAppSettings();
        const figmaToken = settings.figmaAccessToken;
        if (!figmaToken) return null;

        const matches = url.match(/figma\.com\/file\/([^/?#]+)/);
        if (!matches) return null;
        const fileKey = matches[1];

        // Fetch structure with depth 2 to see pages and their top-level layers
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=2`, {
            headers: { "X-Figma-Token": figmaToken }
        });

        if (!response.ok) return null;
        const data = await response.json();

        // 1. Extract raw data
        const fileName = data.name;
        const lastEditedAt = data.lastModified;
        const thumbnailUrl = data.thumbnailUrl; // Figma provides this directly

        // 2. Prepare a "Manifest" for AI analysis (simplified tree)
        const manifest: any[] = [];
        if (data.document && data.document.children) {
            data.document.children.forEach((page: any) => {
                const pageInfo = {
                    name: page.name,
                    frames: (page.children || [])
                        .filter((n: any) => n.type === 'FRAME')
                        .map((n: any) => n.name)
                        .slice(0, 5) // Limit to top 5 frames per page
                };
                manifest.push(pageInfo);
            });
        }

        // 3. Delegate "Sorting it out" to Groq AI
        console.log("🛠️ Figma: Sending manifest to AI ->", JSON.stringify(manifest).slice(0, 200) + "...");
        const aiAnalysis = await analyzeFigmaStructure(fileName, manifest);
        console.log("✨ Figma: AI Analysis Result ->", aiAnalysis);

        return {
            fileName,
            lastEditedAt,
            thumbnailUrl,
            frames: aiAnalysis.keyFrames || [],
            summary: aiAnalysis.summary,
            milestone: aiAnalysis.milestone,
            rawManifest: manifest
        };
    } catch (error) {
        console.error("Figma Meta AI Error:", error);
        return null;
    }
};

export const getFigmaProjectFiles = async (projectId: string) => {
    try {
        const settings = await getAppSettings();
        const figmaToken = settings.figmaAccessToken;
        if (!figmaToken) return null;

        console.log(`🛠️ Figma: Fetching project ${projectId}...`);
        const response = await fetch(`https://api.figma.com/v1/projects/${projectId}/files`, {
            headers: { "X-Figma-Token": figmaToken }
        });

        if (!response.ok) {
            console.error("Figma Project API Error:", response.status, await response.text());
            return null;
        }

        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error("Figma Project Sync Error:", error);
        return null;
    }
};

// Helper to extract team ID from URL or return the ID directly
const extractTeamId = (input: string): string => {
    // If it's a URL, extract the team ID
    if (input.includes('figma.com')) {
        const match = input.match(/team\/(\d+)/);
        return match ? match[1] : input;
    }
    // Otherwise assume it's already a team ID
    return input;
};

export const getFigmaTeamProjects = async (teamIdInput: string): Promise<{ projects: any[], error?: string }> => {
    try {
        const teamId = extractTeamId(teamIdInput);
        const settings = await getAppSettings();
        const figmaToken = settings.figmaAccessToken;
        if (!figmaToken) return { projects: [], error: 'Missing Figma Access Token' };

        console.log(`🛠️ Figma: Fetching team ${teamId} (extracted from: ${teamIdInput}) with token ending in ...${figmaToken.slice(-4)}`);
        const response = await fetch(`https://api.figma.com/v1/teams/${teamId}/projects`, {
            headers: { "X-Figma-Token": figmaToken }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Figma Team API Error:", response.status, errText);
            return { projects: [], error: `Figma API Error ${response.status}: ${errText}` };
        }

        const data = await response.json();
        return { projects: data.projects || [] };
    } catch (error: any) {
        console.error("Figma Team Sync Error:", error);
        return { projects: [], error: `Network/Code Error: ${error.message}` };
    }
};
