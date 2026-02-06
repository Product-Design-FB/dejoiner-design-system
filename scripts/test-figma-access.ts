
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ⚠️ SECURITY: Use environment variable or Supabase settings
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || 'CONFIGURE_IN_ENV';
const TEAM_ID = '1133445507023682143';

async function testFigmaAccess() {
    console.log('🔍 Testing Figma Access...');

    // 1. Who am I?
    console.log('\n--- Step 1: verifying Identity (/v1/me) ---');
    try {
        const res = await fetch('https://api.figma.com/v1/me', {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`✅ Token is Valid! Logged in as: ${data.handle} (ID: ${data.id})`);
            console.log(`   Email: ${data.email}`);
        } else {
            console.log('❌ Token Validation Failed:', data);
        }
    } catch (e) {
        console.error('Network Error on /v1/me:', e);
    }

    // 2. Check Team Access
    console.log(`\n--- Step 2: Checking Team ${TEAM_ID} ---`);
    try {
        const res = await fetch(`https://api.figma.com/v1/teams/${TEAM_ID}/projects`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`✅ Team Found! Projects: ${data.projects?.length}`);
            data.projects?.forEach((p: any) => console.log(`   - ${p.name} (ID: ${p.id})`));
        } else {
            console.log(`❌ Team Access Failed: ${res.status} ${res.statusText}`);
            console.log('   Error Body:', JSON.stringify(data));
            console.log('   Note: "404 Not Found" usually means the user is not a member of this team or the ID is wrong.');
        }
    } catch (e) {
        console.error('Network Error on Team Fetch:', e);
    }
}

testFigmaAccess();
