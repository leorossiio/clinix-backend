import express from 'express';
import supabase from '../supabase.js';

const app = express();
app.use(express.json());

app.get('/testar-conexao', async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuario').select('*');
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json({ message: 'Conexão bem-sucedida!', data });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao conectar com o Supabase', details: err.message });
    }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
