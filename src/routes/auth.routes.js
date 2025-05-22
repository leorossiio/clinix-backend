import express from 'express';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Operações de autenticação de usuários
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Authorization:
 *             schema:
 *               type: string
 *             description: Token JWT para autenticação
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 * 
 *     x-code-samples:
 *       - lang: 'curl'
 *         source: |
 *           curl -X POST "http://localhost:3000/auth/login" \
 *           -H "Content-Type: application/json" \
 *           -d '{"email":"medico@clinix.com","senha":"senha123"}'
 */
router.post('/login', login);

export default router;