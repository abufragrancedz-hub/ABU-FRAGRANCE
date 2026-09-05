import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function keepAlive() {
    console.log('Sending keep-alive ping to Supabase...');

    // A simple query to keep the project active
    const { data, error } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error pinging Supabase:', error.message);
        process.exit(1);
    }

    console.log('Successfully pinged Supabase. Project should remain active.');
}

keepAlive();
