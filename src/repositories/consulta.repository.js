import supabase from '../supabase.js';
import { StatusConsulta } from '../utils/enums/index.js';

export const buscarTodasConsultas = async () => {
    return await supabase.from('consulta').select('*').neq('status', StatusConsulta.CANCELADA);
};

export const buscarTodasConsultasAgendadas = async (id_usuario) => {
    return await supabase.from('consulta').select('*').eq('id_usuario', id_usuario);
};

export const buscarTodasConsultasUsuario = async () => {
    return await supabase.from('consulta').select('*').eq('status', StatusConsulta.NAOAGENDADO);
};

export const buscarConsultaPorId = async (id_consulta) => {
    return await supabase.from('consulta').select('*').eq('id_consulta', id_consulta).single();
};

export const adicionarConsulta = async (dados) => {
    return await supabase.from('consulta').insert([dados]);
};

export const atualizarConsulta = async (id_consulta, dados) => {
    return await supabase.from('consulta').update(dados).eq('id_consulta', id_consulta).select().single();
};

export const deletarConsulta = async (id_consulta) => {
    return await supabase.from('consulta').delete().eq('id_consulta', id_consulta);
};

export const excluirConsultaStatus = async (id_consulta) => {
    return await supabase
      .from('consulta')
      .update({ status: StatusConsulta.CANCELADA })
      .eq('id_consulta', id_consulta)
      .select()
      .maybeSingle();
  };

export const buscarConsultaPorMedicoComStatus = async (id_medico) => {
    const { data, error } = await supabase
      .from('consulta')
      .select('*')
      .eq('id_medico', id_medico)
      .eq('status', StatusConsulta.CANCELADA)
      .maybeSingle();
  
    return { data, error };
  };
  