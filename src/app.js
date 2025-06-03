import express from 'express';
import cors from 'cors';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';

import usuarioRoutes from './routes/usuario.routes.js';
import consultaRoutes from './routes/consulta.routes.js';
import notificacaoRoutes from './routes/notificacao.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

const swaggerDocument = YAML.load('./src/swagger.yaml');

app.use(cors());
app.use(express.json());

app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      tryItOutEnabled: true,      
      persistAuthorization: true,  
      docExpansion: 'none',       
      filter: true,               
      displayRequestDuration: true 
    },
    customSiteTitle: "Clinix API Documentation", 
    customCss: '.swagger-ui .topbar { display: none }' 
  })
);

app.get('/env-check', (req, res) => {
  res.json({
    SUPABASE_KEY: process.env.SUPABASE_KEY ? '✔️ definida' : '❌ não definida',
    JWT_SECRET: process.env.JWT_SECRET ? '✔️ definida' : '❌ não definida'
  });
});

app.use('/usuarios', usuarioRoutes);
app.use('/consultas', consultaRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API Clinix está funcionando. Acesse <a href="/api-docs">/api-docs</a> para a documentação interativa.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📄 Documentação Swagger em http://localhost:${PORT}/api-docs`);
});