import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseRedirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son obligatorias.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        redirectTo: supabaseRedirectUrl || window.location.origin
    }
});