import express from 'express';
import { listarNotificacoes, criarNotificacao } from '../controllers/notificacao.controller.js';
import { validarNotificacao } from '../middlewares/validar.notificacao.js';

const router = express.Router();

router.get('/', listarNotificacoes);
router.post('/', validarNotificacao, criarNotificacao);

export default router;
