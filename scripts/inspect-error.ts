
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const check = async () => {
    // Check for the specific key from the logs
    // Key: u8oJQVTWJ1aIEerw71tG1l (from 'roasting with AI')
    // We search by URL containing this key
    const { data } = await supabase.from('resources')
        .select('id, title, url')
        .ilike('url', '%u8oJQVTWJ1aIEerw71tG1l%')
        .single();

    if (data) {
        console.log("🔍 Found Failing Resource:");
        console.log("   Title:", data.title);
        console.log("   URL:", data.url);
    } else {
        console.log("❌ Could not find resource with key u8oJQVTWJ1aIEerw71tG1l");
    }
};

check();
