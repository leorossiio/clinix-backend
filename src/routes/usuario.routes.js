import express from 'express';
import { listarUsuarios, criarUsuario } from '../controllers/usuario.controller.js';
import { validarUsuario } from '../middlewares/validar.usuario.js';

const router = express.Router();

router.get('/', listarUsuarios);
router.post('/', validarUsuario, criarUsuario);

export default router;
