import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Listar todas as consultas
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('consulta').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Criar nova consulta
router.post('/', async (req, res) => {
    const { data, error } = await supabase.from('consulta').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

export default router;