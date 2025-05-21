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

router.get('/', autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), listarConsultas); // admin ou medico
router.get('/:id/agendadas', autenticacao, autorizar([tipoUsuario.USUARIO]), listarConsultasAgendadas); // cliente
router.get('/usuario', autenticacao, autorizar([tipoUsuario.USUARIO]), listarConsultasUsuario); // cliente
router.get('/:id', obterConsultaPorId); // sem autenticação por enquanto
router.post('/', validarConsulta, autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), criarConsulta);
router.put('/:id', validarConsultaUpdate, autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), editarConsulta);
router.delete('/:id', autenticacao, autorizar([tipoUsuario.MEDICO, tipoUsuario.ADMIN]), excluirConsulta);
router.put('/:id/agendar', validarAgendamentoConsulta, autenticacao, autorizar([tipoUsuario.USUARIO]), agendarConsulta);

export default router;
