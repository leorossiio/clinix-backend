import { buscarTodasNotificacoes, adicionarNotificacao } from '../repositories/notificacao.repository.js';

export const listarNotificacoes = async (req, res) => {
    const { data, error } = await buscarTodasNotificacoes();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const criarNotificacao = async (req, res) => {
    const { data, error } = await adicionarNotificacao(req.body);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
};
