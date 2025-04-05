import { buscarTodosUsuarios, adicionarUsuario } from '../repositories/usuario.repository.js';

export const listarUsuarios = async (req, res) => {
    const { data, error } = await buscarTodosUsuarios();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const criarUsuario = async (req, res) => {
    const { data, error } = await adicionarUsuario(req.body);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
};