import express from 'express';
import {
  listarUsuarios,
  obterUsuarioPorId,
  adicionarUsuario,
  editarUsuario,
  excluirUsuario
} from '../controllers/usuario.controller.js';
import { validarUsuarioUpdate } from '../middlewares/validar.usuario.atualizar.js';

const router = express.Router();

router.get('/', listarUsuarios);
router.get('/:id', obterUsuarioPorId);
router.post('/', adicionarUsuario);
router.put('/:id', validarUsuarioUpdate, editarUsuario);
router.delete('/:id', excluirUsuario);

export default router;
