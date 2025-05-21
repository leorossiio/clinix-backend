import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import usuarioRoutes from './routes/usuario.routes.js';
import consultaRoutes from './routes/consulta.routes.js';
import notificacaoRoutes from './routes/notificacao.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinix API',
      version: '1.0.0',
      description: 'Documentação da API do sistema Clinix - Gestão de consultas médicas',
      contact: {
        name: "Suporte Clinix",
        email: "suporte@clinix.com"
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Servidor de desenvolvimento"
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id_usuario: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            nome: {
              type: 'string',
              example: 'Dr. João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@clinix.com'
            },
            senha: {
              type: 'string',
              example: 'senha123'
            },
            tipo_usuario: {
              type: 'integer',
              description: '1-USUARIO, 2-MEDICO, 3-ADMIN',
              example: 2
            },
            status: {
              type: 'integer',
              description: '0-INATIVO, 1-ATIVO',
              example: 1
            },
            especialidade: {
              type: 'integer',
              nullable: true,
              example: 1
            },
            crm: {
              type: 'string',
              nullable: true,
              example: 'CRM/SP 123456'
            }
          },
          required: ['id_usuario', 'nome', 'email', 'senha', 'tipo_usuario', 'status']
        },
        Consulta: {
          type: 'object',
          properties: {
            id_consulta: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            id_usuario: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            id_medico: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            data: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T14:30:00Z'
            },
            descricao: {
              type: 'string',
              example: 'Consulta de rotina'
            },
            status: {
              type: 'integer',
              description: '1-AGENDADA, 2-CONCLUIDA, 3-CANCELADA',
              example: 1
            }
          },
          required: ['id_consulta', 'id_medico', 'data', 'status']
        },
        Notificacao: {
          type: 'object',
          properties: {
            id_notificacao: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            id_consulta: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            data: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-15T14:30:00Z'
            },
            lembrete: {
              type: 'string',
              example: 'Lembrete da consulta'
            }
          },
          required: ['id_notificacao', 'id_consulta', 'data']
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            usuario: {
              $ref: '#/components/schemas/Usuario'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da aplicação
app.use('/usuarios', usuarioRoutes);
app.use('/consultas', consultaRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API da Clinix ok.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando: http://localhost:${PORT}`);
  console.log(`📄 Documentação Swagger: http://localhost:${PORT}/api-docs`);
});