import { v4 as uuidv4 } from 'uuid';
import {
  buscarTodosUsuarios,
  buscarTodosMedicos,
  buscarUsuarioPorId,
  adicionarNovoUsuario,
  atualizarUsuario,
  excluirUsuarioStatus,
  buscarUsuarioPorEmail
} from '../repositories/usuario.repository.js';
import { EspecialidadeMedica, StatusUsuario, tipoUsuario } from '../utils/enums/index.js';


export const listarUsuarios = async (req, res) => {
  const { data, error } = await buscarTodosUsuarios();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const listarMedicos = async (req, res) => {
  const { data, error } = await buscarTodosMedicos();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const obterUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await buscarUsuarioPorId(id);
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Usuário não encontrado' });

  res.json(data);
};

export const adicionarUsuario = async (req, res) => {
  const id_usuario = uuidv4();
  const {
    nome,
    email,
    senha,
    tipo_usuario = tipoUsuario.USUARIO,
    status = StatusUsuario.ATIVO,
    especialidade = null,
    crm = null
  } = req.body;

  if (![tipoUsuario.USUARIO, tipoUsuario.MEDICO, tipoUsuario.ADMIN].includes(tipo_usuario)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }

  if (especialidade !== null && !Object.keys(EspecialidadeMedica).includes(String(especialidade))) {
    return res.status(400).json({ error: 'Especialidade inválida.' });
  }

  const { data: usuarioExistente, error } = await buscarUsuarioPorEmail(email);
  if (error) return res.status(500).json({ error: 'Erro ao verificar e-mail existente.' });

  if (usuarioExistente) {
    if (usuarioExistente.status === StatusUsuario.DELETADO) {
      const { error: reativarError } = await atualizarUsuario(usuarioExistente.id_usuario, {
        nome,
        senha,
        tipo_usuario,
        status: StatusUsuario.ATIVO,
        especialidade,
        crm
      });

      if (reativarError) {
        return res.status(500).json({ error: 'Erro ao reativar usuário existente.' });
      }

      return res.status(200).json({ message: 'Usuário reativado com sucesso.' });
    }

    return res.status(400).json({ error: 'Já existe um usuário ativo com este e-mail.' });
  }

  const novoUsuario = {
    id_usuario,
    nome,
    email,
    senha,
    tipo_usuario,
    status,
    especialidade,
    crm
  };

  const { data, error: insertError } = await adicionarNovoUsuario(novoUsuario);
  if (insertError) return res.status(500).json({ error: insertError.message });

  res.status(201).json(data);
};

export const editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;

  const dadosParaAtualizar = {};
  if (nome) dadosParaAtualizar.nome = nome;
  if (email) dadosParaAtualizar.email = email;
  if (senha) dadosParaAtualizar.senha = senha;

  const { error } = await atualizarUsuario(id, dadosParaAtualizar);

  if (error) return res.status(500).json({ error: 'Erro ao atualizar usuário.' });

  res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
};

export const excluirUsuario = async (req, res) => {
  const { id } = req.params;

  const { data: existente, error: getError } = await buscarUsuarioPorId(id);
  if (getError || !existente) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { error } = await excluirUsuarioStatus(id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Usuário excluído com sucesso' });
};
