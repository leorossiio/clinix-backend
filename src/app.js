import express from 'express';
import usuarioRoutes from './routes/usuario.routes.js';
import consultaRoutes from './routes/consulta.routes.js';
import notificacaoRoutes from './routes/notificacao.routes.js';

const app = express();
app.use(express.json());

app.use('/usuarios', usuarioRoutes);
app.use('/consultas', consultaRoutes);
app.use('/notificacoes', notificacaoRoutes);

// Rota de teste
app.get('/', (req, res) => {
    res.send('API da Clinix ok.');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando: http://localhost:${PORT}`);
});