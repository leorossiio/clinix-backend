import {
    buscarTodasConsultas,
    buscarTodasConsultasUsuario,
    buscarConsultaPorId,
    adicionarConsulta,
    atualizarConsulta,
    excluirConsultaStatus,
    buscarConsultaPorMedicoComStatus
} from '../repositories/consulta.repository.js';
import { StatusConsulta, tipoUsuario } from '../utils/enums/index.js';

import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';


const schemaId = Joi.string().uuid();

export const listarConsultas = async (req, res) => {
  if (![tipoUsuario.MEDICO, tipoUsuario.ADMIN].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

    const { data, error } = await buscarTodasConsultas();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const listarConsultasUsuario = async (req, res) => {
  if (![tipoUsuario.USUARIO].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

    const { data, error } = await buscarTodasConsultasUsuario();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const obterConsultaPorId = async (req, res) => {
    const { id } = req.params;

    const { error } = schemaId.validate(id);
    if (error) return res.status(400).json({ error: 'ID inválido' });

    const { data, error: dbError } = await buscarConsultaPorId(id);
    if (dbError || !data) return res.status(404).json({ error: 'Consulta não encontrada.' });

    res.json(data);
};

export const criarConsulta = async (req, res) => {
  if (![tipoUsuario.MEDICO, tipoUsuario.ADMIN].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

    const { id_medico, id_usuario, data, descricao, status = StatusConsulta.NAOAGENDADO } = req.body;
  
    // Validação de UUIDs
    const validaIdMedico = schemaId.validate(id_medico);
    const validaIdUsuario = schemaId.validate(id_usuario);
    if (validaIdMedico.error || validaIdUsuario.error) {
      return res.status(400).json({ error: 'ID de médico ou paciente inválido.' });
    }
  
    // Impede que médico e paciente sejam o mesmo
    if (id_usuario === id_medico) {
      return res.status(400).json({ error: 'O médico e o paciente não podem ser a mesma pessoa.' });
    }
  
    // Verifica se já existe uma consulta excluída com o mesmo médico
    const { data: consultaExistente, error: buscaError } = await buscarConsultaPorMedicoComStatus(id_medico);
  
    if (buscaError) return res.status(500).json({ error: 'Erro ao buscar consulta existente.' });
  
    if (consultaExistente) {
      // Reativa consulta
      const dadosAtualizados = {
        id_usuario,
        data,
        descricao,
        status: StatusConsulta.NAOAGENDADO // Ativa a consulta
      };
  
      const { error: erroReativar } = await atualizarConsulta(consultaExistente.id_consulta, dadosAtualizados);
      if (erroReativar) {
        return res.status(500).json({ error: 'Erro ao reativar consulta existente.' });
      }
  
      return res.status(200).json({ message: 'Consulta reativada com sucesso.' });
    }
  
    // Criação de nova consulta
    const novaConsulta = {
      id_consulta: uuidv4(),
      id_usuario,
      id_medico,
      data,
      descricao,
      status
    };
  
    const { data: nova, error: erroInserir } = await adicionarConsulta(novaConsulta);
    if (erroInserir) return res.status(500).json({ error: erroInserir.message });
  
    res.status(201).json(nova);
  };

export const editarConsulta = async (req, res) => {
  if (![tipoUsuario.MEDICO, tipoUsuario.ADMIN].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

  //TODO: deixar apenas alterar os valores de data, descrição e id_medico.
  //irá criar outro endpoint para agendar um usuario a uma consulta

  const { id } = req.params;

  const { error } = schemaId.validate(id);
  if (error) return res.status(400).json({ error: 'ID inválido' });

    const { data, error: dbError } = await atualizarConsulta(id, req.body);
    if (dbError || !data) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const excluirConsulta = async (req, res) => {
  if (![tipoUsuario.MEDICO, tipoUsuario.ADMIN].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

    const { id } = req.params;
  
    const { data: existente, error: getError } = await buscarConsultaPorId(id);
      if (getError || !existente) return res.status(404).json({ error: 'Consulta não encontrada.' });
    
      const { error } = await excluirConsultaStatus(id);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ message: 'Consulta excluída com sucesso.' });
};