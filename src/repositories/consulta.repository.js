import supabase from '../supabase.js';
import { StatusConsulta } from '../utils/enums/index.js';

export const buscarTodasConsultas = async () => {
    return await supabase.from('consulta').select('*').neq('status', StatusConsulta.CANCELADA);
};

export const buscarTodasConsultasUsuario = async () => {
    return await supabase.from('consulta').select('*').eq('status', StatusConsulta.NAOAGENDADO);
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

export const excluirConsultaStatus = async (id) => {
    return await supabase
      .from('consulta')
      .update({ status: StatusConsulta.CANCELADA })
      .eq('id_consulta', id)
      .select()
      .maybeSingle();
  };

export const buscarConsultaPorMedicoComStatus = async (id_medico) => {
    const { data, error } = await supabase
      .from('consulta')
      .select('*')
      .eq('id_medico', id_medico)
      .eq('status', StatusConsulta.CANCELADA)
      .maybeSingle(); // retorna null se não tiver
  
    return { data, error };
  };
  