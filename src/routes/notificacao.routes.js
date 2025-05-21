import express from 'express';
import { listarNotificacoes, criarNotificacao } from '../controllers/notificacao.controller.js';
import { validarNotificacao } from '../middlewares/validar.notificacao.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notificações
 *   description: Gerenciamento de notificações do sistema
 */

/**
 * @swagger
 * /notificacoes:
 *   get:
 *     summary: Lista todas as notificações
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_consulta
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de consulta
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de notificações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacao'
 *       400:
 *         description: Parâmetros de filtro inválidos
 */
router.get('/', listarNotificacoes);

/**
 * @swagger
 * /notificacoes:
 *   post:
 *     summary: Cria uma nova notificação
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_consulta:
 *                 type: string
 *                 format: uuid
 *                 example: '123e4567-e89b-12d3-a456-426614174000'
 *               lembrete:
 *                 type: string
 *                 example: 'Consulta marcada para amanhã às 14h'
 *             required:
 *               - id_consulta
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notificacao'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Consulta não encontrada
 */
router.post('/', validarNotificacao, criarNotificacao);

export default router;