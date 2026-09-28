import { createClient } from '@supabase/supabase-js';

/** Cliente para uso exclusivo no servidor: sem sessão persistida nem refresh de token. */
export function criarClienteSupabase({ url, chave }) {
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
