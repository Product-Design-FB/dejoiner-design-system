import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

console.log('Dotenv Configuration Result:', result.error ? 'Error' : 'Success');
if (result.error) console.error('Dotenv Error:', result.error);
console.log('Looking for .env.local at:', envPath);

import { startSlackBot } from '../src/lib/slack-bot';

console.log("Starting Dejoiner Slack Bot...");
startSlackBot();
