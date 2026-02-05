import { App } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

// 1. Web Client for general notifications (Next.js context)
export const getSlackWebClient = () => {
    return new WebClient(process.env.SLACK_BOT_TOKEN);
};

// 2. Bolt App for Socket Mode Bot (Sidecar context)
let appInstance: App | null = null;

export const getSlackBotApp = () => {
    if (appInstance) return appInstance;

    const token = process.env.SLACK_BOT_TOKEN;
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const appToken = process.env.SLACK_APP_TOKEN;

    console.log('🛡️ Slack Client: Initializing Bot App...');
    console.log(`- Bot Token: ${token ? '✅ ' + token.substring(0, 10) + '...' : '❌ Missing'}`);
    console.log(`- App Token: ${appToken ? '✅ ' + appToken.substring(0, 10) + '...' : '❌ Missing'}`);
    console.log(`- Signing Secret: ${signingSecret ? '✅ ' + signingSecret.substring(0, 5) + '...' : '❌ Missing'}`);

    appInstance = new App({
        token,
        signingSecret,
        socketMode: true,
        appToken,
    });
    return appInstance;
};
