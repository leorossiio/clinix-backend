import supabase from '../supabase.js';
import { StatusUsuario, tipoUsuario } from '../utils/enums/index.js';

export const buscarTodosUsuarios = async () => {
  return await supabase.from('usuario').select('*').eq('status', StatusUsuario.ATIVO);
};

export const buscarTodosMedicos = async () => {
  return await supabase.from('usuario').select('*').eq('status', StatusUsuario.ATIVO).eq('tipo_usuario', tipoUsuario.MEDICO);
};

export const buscarUsuarioPorId = async (id_usuario) => {
  return await supabase.from('usuario').select('*').eq('id_usuario', id_usuario).single();
};

export const adicionarNovoUsuario = async (usuario) => {
  return await supabase.from('usuario').insert([usuario]);
};

export const atualizarUsuario = async (id_usuario, dados) => {
  return await supabase.from('usuario').update(dados).eq('id_usuario', id_usuario);
};

export const deletarUsuario = async (id_usuario) => {
  return await supabase.from('usuario').delete().eq('id_usuario', id_usuario);
};

export const excluirUsuarioStatus = async (id_usuario) => {
  const { data, error } = await supabase
    .from('usuario')
    .update({ status: StatusUsuario.DELETADO })
    .eq('id_usuario', id_usuario);

  return { data, error };
};

export const buscarUsuarioPorEmail = async (email) => {
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('email', email)
    .maybeSingle(); // retorna null se não encontrar

  return { data, error };
};