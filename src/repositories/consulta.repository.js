import supabase from '../supabase.js';

export const buscarTodasConsultas = async () => {
    return await supabase.from('consulta').select('*');
};

export const buscarConsultaPorId = async (id) => {
    return await supabase.from('consulta').select('*').eq('id', id).single();
};

export const adicionarConsulta = async (dados) => {
    return await supabase.from('consulta').insert([dados]);
};

export const atualizarConsulta = async (id, dados) => {
    return await supabase.from('consulta').update(dados).eq('id', id);
};

export const deletarConsulta = async (id) => {
    return await supabase.from('consulta').delete().eq('id', id);
};