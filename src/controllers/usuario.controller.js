import { v4 as uuidv4 } from 'uuid';
import {
  buscarTodosUsuarios,
  buscarUsuarioPorId,
  adicionarNovoUsuario,
  atualizarUsuario,
  deletarUsuario
} from '../repositories/usuario.repository.js';

// Enums
const STATUS = { ATIVO: 0, DELETADO: 1 };
const TIPO = { USUARIO: 0, MEDICO: 1, ADMIN: 2 };
const ESPECIALIDADES = {
  1: 'Cardiologia',
  2: 'Pediatria',
  3: 'Ortopedia',
  4: 'Dermatologia',
  5: 'Neurologia'
};

export const listarUsuarios = async (req, res) => {
  const { data, error } = await buscarTodosUsuarios();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const obterUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await getUsuarioById(id);
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Usuário não encontrado' });

  res.json(data);
};

export const adicionarUsuario = async (req, res) => {
  const id_usuario = uuidv4();
  const { nome, email, senha, tipo, status = STATUS.ATIVO, especialidade = null, crm = null } = req.body;

  if (![TIPO.USUARIO, TIPO.MEDICO, TIPO.ADMIN].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }

  if (especialidade !== null && !Object.keys(ESPECIALIDADES).includes(String(especialidade))) {
    return res.status(400).json({ error: 'Especialidade inválida.' });
  }

  const novoUsuario = {
    id_usuario,
    nome,
    email,
    senha,
    tipo,
    status,
    especialidade,
    crm
  };

  const { data, error } = await adicionarNovoUsuario(novoUsuario);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

export const editarUsuario = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: existente, error: getError } = await buscarUsuarioPorId(id);
  if (getError || !existente) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { data, error } = await atualizarUsuario(id, updates);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const excluirUsuario = async (req, res) => {
  const { id } = req.params;

  const { data: existente, error: getError } = await buscarUsuarioPorId(id);
  if (getError || !existente) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { error } = await deletarUsuario(id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Usuário excluído com sucesso' });
};
