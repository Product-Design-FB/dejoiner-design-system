// AI Summarization Service - Powered by Groq (Llama 3.1)

import { getAppSettings } from './config';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getApiKey = async () => {
    const settings = await getAppSettings();
    const apiKey = settings.groqApiKey;
    if (!apiKey) {
        console.warn("⚠️ Groq: No API key found in settings.");
        return null;
    }
    console.log("✅ Groq: API key detected: " + apiKey.slice(0, 4) + "...");
    return apiKey;
};

export const summarizeContent = async (text: string): Promise<string> => {
    console.log("🛠️ Groq: Generizing content summary...");
    const apiKey = await getApiKey();
    if (!apiKey) return text.split(' ').slice(0, 15).join(' ') + '...';

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a technical summarizer. Summarize the provided content (which matches a design resource or code repository) into ONE concise sentence (max 20 words) explaining its purpose.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: 60,
                temperature: 0.3,
            }),
        });

        if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || 'No summary available.';
    } catch (error) {
        console.error("❌ Groq Error:", error);
        return text.split(' ').slice(0, 15).join(' ') + '...';
    }
};

export const analyzeFigmaStructure = async (fileName: string, structure: any): Promise<any> => {
    console.log(`🛠️ Groq: Analyzing Figma file "${fileName}"...`);
    const apiKey = await getApiKey();
    if (!apiKey) return { summary: 'AI Analysis unavailable', keyFrames: [] };

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Design Systems Architect. Analyze the provided Figma file structure and return a JSON object with: "summary" (one sentence descriptive summary), "milestone" (the most important frame/status, e.g. "Draft", "Review", "Final"), and "keyFrames" (an array of the top 3 most important frame names based on design hierarchy).'
                    },
                    {
                        role: 'user',
                        content: `File Name: ${fileName}\nStructure Manifest: ${JSON.stringify(structure)}`
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 200,
                temperature: 0.2,
            }),
        });

        if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
        const data = await response.json();
        return JSON.parse(data.choices?.[0]?.message?.content || '{}');
    } catch (error) {
        console.error("❌ Groq Figma Analysis Error:", error);
        return { summary: 'Failed to analyze design.', milestone: 'Unknown', keyFrames: [] };
    }
};
