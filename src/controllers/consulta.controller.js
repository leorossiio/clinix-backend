import {
    buscarTodasConsultas,
    buscarConsultaPorId,
    inserirConsulta,
    atualizarConsulta,
    deletarConsulta
} from '../repositories/consulta.repository.js';

import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';


const schemaId = Joi.string().uuid();

export const listarConsultas = async (req, res) => {
    const { data, error } = await buscarTodasConsultas();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const obterConsulta = async (req, res) => {
    const { id } = req.params;

    const { error } = schemaId.validate(id);
    if (error) return res.status(400).json({ error: 'ID inválido' });

    const { data, error: dbError } = await buscarConsultaPorId(id);
    if (dbError || !data) return res.status(404).json({ error: 'Consulta não encontrada.' });

    res.json(data);
};

export const criarConsulta = async (req, res) => {
    const novoId = uuidv4();

    // Checa se esse UUID já existe (raro, mas por segurança)
    const { data: consultaExistente } = await buscarConsultaPorId(novoId);
    if (consultaExistente) {
        return res.status(400).json({ error: 'ID gerado já está em uso. Tente novamente.' });
    }

    // Junta o id gerado com os dados do body
    const novaConsulta = {
        id: novoId,
        ...req.body
    };

    const { data, error } = await inserirConsulta(novaConsulta);
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
};

export const editarConsulta = async (req, res) => {
    const { id } = req.params;

    const { error } = schemaId.validate(id);
    if (error) return res.status(400).json({ error: 'ID inválido' });

    const { data, error: dbError } = await atualizarConsulta(id, req.body);
    if (dbError || !data) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const excluirConsulta = async (req, res) => {
    const { id } = req.params;

    const { error } = schemaId.validate(id);
    if (error) return res.status(400).json({ error: 'ID inválido' });

    const { data, error: dbError } = await deletarConsulta(id);
    if (dbError || !data) return res.status(500).json({ error: error.message });
    res.json({ mensagem: 'Consulta excluída com sucesso.', data });
};