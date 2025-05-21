import express from 'express';
import {
    listarConsultas,
    listarConsultasUsuario,
    obterConsultaPorId,
    criarConsulta,
    editarConsulta,
    excluirConsulta,
    agendarConsulta,
    listarConsultasAgendadas
} from '../controllers/consulta.controller.js';
import { autenticacao, autorizar } from '../middlewares/auth.middleware.js';
import { validarConsulta, validarConsultaUpdate, validarAgendamentoConsulta } from '../middlewares/validar.consulta.js';
import { tipoUsuario } from '../utils/enums/index.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Consultas
 *   description: Gerenciamento de consultas médicas
 */

/**
 * @swagger
 * /consultas:
 *   get:
 *     summary: Lista todas as consultas (apenas ADMIN/MEDICO)
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de consultas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Consulta'
 *       403:
 *         description: Acesso não autorizado
 */
router.get('/', autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), listarConsultas);

/**
 * @swagger
 * /consultas/{id_usuario}/agendadas:
 *   get:
 *     summary: Lista consultas agendadas por um usuário
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de consultas agendadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Consulta'
 *       403:
 *         description: Acesso não autorizado
 */
router.get('/:id/agendadas', autenticacao, autorizar([tipoUsuario.USUARIO]), listarConsultasAgendadas);

/**
 * @swagger
 * /consultas/usuario:
 *   get:
 *     summary: Lista consultas de um usuário com filtros
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *           description: 1-AGENDADA, 2-CONCLUIDA, 3-CANCELADA
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *           description: Data no formato YYYY-MM-DD
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *           description: Data no formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Lista de consultas filtradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Consulta'
 *       400:
 *         description: Parâmetros inválidos
 *       403:
 *         description: Acesso não autorizado
 */
router.get('/usuario', autenticacao, autorizar([tipoUsuario.USUARIO]), listarConsultasUsuario);

/**
 * @swagger
 * /consultas/{id_consulta}:
 *   get:
 *     summary: Obtém uma consulta pelo ID
 *     tags: [Consultas]
 *     parameters:
 *       - in: path
 *         name: id_consulta
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da consulta
 *     responses:
 *       200:
 *         description: Dados da consulta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consulta'
 *       404:
 *         description: Consulta não encontrada
 */
router.get('/:id', obterConsultaPorId);

/**
 * @swagger
 * /consultas:
 *   post:
 *     summary: Cria uma nova consulta (apenas ADMIN/MEDICO)
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consulta'
 *     responses:
 *       201:
 *         description: Consulta criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso não autorizado
 */
router.post('/', validarConsulta, autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), criarConsulta);

/**
 * @swagger
 * /consultas/{id_consulta}:
 *   put:
 *     summary: Atualiza uma consulta (apenas ADMIN/MEDICO)
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_consulta
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da consulta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consulta'
 *     responses:
 *       200:
 *         description: Consulta atualizada
 *       404:
 *         description: Consulta não encontrada
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso não autorizado
 */
router.put('/:id', validarConsultaUpdate, autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), editarConsulta);

/**
 * @swagger
 * /consultas/{id_consulta}:
 *   delete:
 *     summary: Remove uma consulta (apenas ADMIN/MEDICO)
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_consulta
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da consulta
 *     responses:
 *       204:
 *         description: Consulta removida
 *       404:
 *         description: Consulta não encontrada
 *       403:
 *         description: Acesso não autorizado
 */
router.delete('/:id', autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), excluirConsulta);

/**
 * @swagger
 * /consultas/{id_consulta}/agendar:
 *   put:
 *     summary: Agenda uma consulta (apenas USUARIO)
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_consulta
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da consulta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: string
 *                 format: uuid
 *                 description: ID do usuário que está agendando
 *             required:
 *               - id_usuario
 *     responses:
 *       200:
 *         description: Consulta agendada com sucesso
 *       400:
 *         description: Dados inválidos ou consulta indisponível
 *       404:
 *         description: Consulta não encontrada
 *       403:
 *         description: Acesso não autorizado
 */
router.put('/:id/agendar', validarAgendamentoConsulta, autenticacao, autorizar([tipoUsuario.USUARIO]), agendarConsulta);

export default router;