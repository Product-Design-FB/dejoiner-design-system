
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySettings() {
    console.log('🔍 Checking current database settings...\n');

    const { data, error } = await supabase.from('settings').select('*');

    if (error) {
        console.error('❌ Error fetching settings:', error.message);
        return;
    }

    console.log('Current settings in database:');
    data?.forEach((setting: any) => {
        const displayValue = setting.key.includes('token') || setting.key.includes('key')
            ? `${setting.value.substring(0, 10)}...${setting.value.slice(-4)}`
            : setting.value;
        console.log(`  ${setting.key}: ${displayValue}`);
    });

    console.log('\n--- Checking specific values ---');
    const tokenSetting = data?.find((s: any) => s.key === 'figma_access_token');
    const teamSetting = data?.find((s: any) => s.key === 'figma_team_id');

    if (tokenSetting) {
        console.log(`✓ Figma Token exists: ${tokenSetting.value.substring(0, 10)}...${tokenSetting.value.slice(-4)}`);
        console.log(`  Expected: figd_kG15Z...r11Fu7Sr`);
        console.log(`  Match: ${tokenSetting.value === 'figd_kG15Zn9R4q12CMn-7CL2bQXOpq2uEJFLR11Fu7Sr' ? '✅ YES' : '❌ NO'}`);
    } else {
        console.log('❌ Figma Token NOT FOUND in database');
    }

    if (teamSetting) {
        console.log(`✓ Team ID exists: ${teamSetting.value}`);
        console.log(`  Expected: 1133445507023682143`);
        console.log(`  Match: ${teamSetting.value === '1133445507023682143' ? '✅ YES' : '❌ NO'}`);
    } else {
        console.log('❌ Team ID NOT FOUND in database');
    }
}

verifySettings();
