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

router.get('/', autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), listarUsuarios);
router.get('/medicos', listarMedicos);
router.get('/:id', obterUsuarioPorId);
router.post('/', validarUsuario, adicionarUsuario);
router.put('/:id', validarUsuarioUpdate, editarUsuario);
router.delete('/:id', excluirUsuario);

export default router;
