/* ============================================
   db.js — Supabase Database Client
   ============================================ */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ [Supabase] Missing credentials. Ensure SUPABASE_URL and SUPABASE_KEY are in your .env file.');
}

// Instantiate authoritative Supabase client for Global Service
const supabase = createClient(
    supabaseUrl || 'https://your-project.supabase.co', 
    supabaseKey || 'your-anon-key'
);

console.log('🟢 [Supabase] Authorization Client successfully instantiated.');

module.exports = supabase;
