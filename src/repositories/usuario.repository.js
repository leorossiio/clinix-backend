import supabase from '../supabase.js';

export const buscarTodosUsuarios = async () => {
    return await supabase.from('usuario').select('*');
};

export const adicionarUsuario = async (dados) => {
    return await supabase.from('usuario').insert([dados]);
};