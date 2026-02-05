import { getSlackWebClient } from './slack-client';
import { getAppSettings } from './config';

export const notifyNewResource = async (resource: any, project: any) => {
    const settings = await getAppSettings();
    const channelId = settings.slackNotifyChannel;

    if (!channelId || channelId.startsWith('C0...')) {
        console.warn('⚠️ Slack: No valid SLACK_NOTIFY_CHANNEL found in .env.local. Skipping notification.');
        return;
    }

    const client = getSlackWebClient();
    console.log(`📡 Slack: Attempting to notify channel ${channelId}...`);

    try {
        await client.chat.postMessage({
            channel: channelId,
            text: `🎨 A new asset was added to *${project.name}*`,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `🎨 *New Resource Added*\nDesigner added a new asset to *${project.name}*`
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*Type:*\n${resource.type.toUpperCase()}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*Status:*\n${resource.status}`
                        }
                    ]
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "View in Dejoiner",
                                emoji: true
                            },
                            url: resource.url,
                            action_id: "view_resource"
                        }
                    ]
                }
            ]
        });
        console.log('✅ Slack: Notification sent successfully.');
    } catch (error) {
        console.error('❌ Slack: Error sending notification:', error);
    }
};
