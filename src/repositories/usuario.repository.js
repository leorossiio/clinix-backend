import supabase from '../supabase.js';

export const buscarTodosUsuarios = async () => {
  return await supabase.from('usuario').select('*');
};

export const buscarUsuarioPorId = async (id_usuario) => {
  return await supabase.from('usuario').select('*').eq('id_usuario', id_usuario).single();
};

export const adicionarUsuario = async (usuario) => {
  return await supabase.from('usuario').insert([usuario]);
};

export const atualizarUsuario = async (id_usuario, dados) => {
  return await supabase.from('usuario').update(dados).eq('id_usuario', id_usuario);
};

export const deletarUsuario = async (id_usuario) => {
  return await supabase.from('usuario').delete().eq('id_usuario', id_usuario);
};
