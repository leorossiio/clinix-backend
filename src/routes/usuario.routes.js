import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

// Listar todos os usuários
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('usuario').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Criar novo usuário
router.post('/', async (req, res) => {
    const { data, error } = await supabase.from('usuario').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

export default router;