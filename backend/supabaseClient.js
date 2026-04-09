// Supabase client for backend (server-side with service role or anon key)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase URL or Key not set. Database persistence disabled.');
}

// Server-side client using anon key (respects RLS with user tokens)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a client scoped to a specific user's JWT token
function createUserClient(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

module.exports = { supabase, createUserClient };
