import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://flkjwkzpcifawwywbyeq.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_6H3eblga3dHPtUKzjOYv_g_OV3kujdF";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
