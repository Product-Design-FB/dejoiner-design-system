
import { supabase } from './supabase';

interface AppSettings {
    slackToken?: string;
    slackSigningSecret?: string;
    slackAppToken?: string;
    slackNotifyChannel?: string;
    figmaAccessToken?: string;
    figmaTeamId?: string;
    groqApiKey?: string;
    adminUserIds?: string[];
}

let cachedSettings: AppSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getAppSettings = async (): Promise<AppSettings> => {
    const now = Date.now();
    if (cachedSettings && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedSettings;
    }

    const settingsMap = new Map<string, string>();
    try {
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data) {
            data.forEach((item: any) => settingsMap.set(item.key, item.value));
        }
    } catch (e) {
        console.error("Config fetch error:", e);
    }

    cachedSettings = {
        slackToken: settingsMap.get('slack_bot_token') || process.env.SLACK_BOT_TOKEN,
        slackSigningSecret: settingsMap.get('slack_signing_secret') || process.env.SLACK_SIGNING_SECRET,
        slackAppToken: settingsMap.get('slack_app_token') || process.env.SLACK_APP_TOKEN,
        slackNotifyChannel: settingsMap.get('slack_notify_channel') || process.env.SLACK_NOTIFY_CHANNEL,
        figmaAccessToken: settingsMap.get('figma_access_token') || process.env.FIGMA_ACCESS_TOKEN,
        figmaTeamId: settingsMap.get('figma_team_id') || process.env.FIGMA_TEAM_ID,
        groqApiKey: settingsMap.get('groq_api_key') || process.env.GROQ_API_KEY,
        adminUserIds: ['U088P0Z9592', ...(settingsMap.get('admin_user_ids')?.split(',') || [])]
    };

    lastFetchTime = now;
    return cachedSettings;
};
