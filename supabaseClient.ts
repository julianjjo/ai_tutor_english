import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son obligatorias.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);