import supabase from '../supabase.js';
import { StatusConsulta } from '../utils/enums/index.js';

export const buscarTodasConsultas = async () => {
    return await supabase.from('consulta').select('*');
};

export const buscarTodasConsultasAgendadas = async (id_usuario) => {
    return await supabase.from('consulta').select('*').eq('id_usuario', id_usuario);
};

export const buscarTodasConsultasUsuario = async (idUsuario) => {
  return await supabase
    .from('consulta')
    .select('*')
    .or(`status.eq.${StatusConsulta.NAOAGENDADO},id_usuario.eq.${idUsuario}`);
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
  
export const consultaReagendamento = async (id_usuario) => {
  const { data, error } = await supabase
    .from('consulta')
    .select('*')
    .eq('status', StatusConsulta.CANCELADA)
    .eq('id_usuario', id_usuario)
    .order('data_cancelamento', { ascending: false }) // mais recente
    .limit(1);

  const consulta = data && data.length > 0 ? data[0] : null;

  if (!consulta) {
    return { data: null, error: null };
  }

  const dataCancelamento = new Date(consulta.data_cancelamento);

  const dataLimite = new Date(dataCancelamento);
  dataLimite.setDate(dataLimite.getDate() + 3);

  const agora = new Date();

  if (agora <= dataLimite) {
    return { data, error: null };
  }

  return { data: null, error: null };
  };
  