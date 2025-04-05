import express from 'express';
import {
    listarConsultas,
    obterConsulta,
    criarConsulta,
    editarConsulta,
    excluirConsulta
} from '../controllers/consulta.controller.js';

import { validarConsulta } from '../middlewares/validar.consulta.js';

const router = express.Router();

router.get('/', listarConsultas);               // Lista todas
router.get('/:id', obterConsulta);              // Busca por ID
router.post('/', validarConsulta, criarConsulta); // Cria nova
router.put('/:id', validarConsulta, editarConsulta); // Edita
router.delete('/:id', excluirConsulta);          // Deleta

export default router;