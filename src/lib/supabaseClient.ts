import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ityrvtsglaszhirogpig.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Xgu15PoWEk0ndO4zKJYGRA_u0dr2Bri";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
