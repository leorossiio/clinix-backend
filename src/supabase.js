import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); 

const supabaseUrl = 'https://nyfgvjbksgggpjdkmhxv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    throw new Error('Supabase key não configurada.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;