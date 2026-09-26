import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// WARNING: Using Service Key in frontend is ONLY for this local testing "Fake Login" bypass.
// In production, real Auth should be used and Service Key should NOT be exposed.
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
