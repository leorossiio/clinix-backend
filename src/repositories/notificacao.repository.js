import supabase from '../supabase.js';

export const buscarTodasNotificacoes = async () => {
    return await supabase.from('notificacao').select('*');
};

export const adicionarNotificacao = async (dados) => {
    return await supabase.from('notificacao').insert([dados]);
};