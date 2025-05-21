import express from 'express';
import {
  listarUsuarios,
  listarMedicos,
  obterUsuarioPorId,
  adicionarUsuario,
  editarUsuario,
  excluirUsuario
} from '../controllers/usuario.controller.js';
import { validarUsuario, validarUsuarioUpdate } from '../middlewares/validar.usuario.js'
import { autenticacao, autorizar } from '../middlewares/auth.middleware.js';
import { tipoUsuario } from '../utils/enums/index.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Gerenciamento de usuários do sistema
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários (apenas ADMIN/MEDICO)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       403:
 *         description: Acesso não autorizado
 */
router.get('/', autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), listarUsuarios);

/**
 * @swagger
 * /usuarios/medicos:
 *   get:
 *     summary: Lista todos os médicos
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Lista de médicos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
router.get('/medicos', listarMedicos);

/**
 * @swagger
 * /usuarios/{id_usuario}:
 *   get:
 *     summary: Obtém um usuário pelo ID
 *     tags: [Usuários]
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
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', obterUsuarioPorId);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', validarUsuario, adicionarUsuario);

/**
 * @swagger
 * /usuarios/{id_usuario}:
 *   put:
 *     summary: Atualiza um usuário
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Dados inválidos
 */
router.put('/:id', validarUsuarioUpdate, editarUsuario);

/**
 * @swagger
 * /usuarios/{id_usuario}:
 *   delete:
 *     summary: Remove um usuário
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       204:
 *         description: Usuário removido
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id', excluirUsuario);

export default router;