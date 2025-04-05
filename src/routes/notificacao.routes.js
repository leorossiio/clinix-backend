import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Listar notificações
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('notificacao').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Criar nova notificação
router.post('/', async (req, res) => {
    const { data, error } = await supabase.from('notificacao').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

export default router;