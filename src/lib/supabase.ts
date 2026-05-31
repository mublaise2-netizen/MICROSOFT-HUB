import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://niolfvgquvkmeetqerah.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GobyhxRAZ-7TL5pDWKIebA_2UQ5_IXO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
