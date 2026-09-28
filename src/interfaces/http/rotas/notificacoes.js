import { Router } from 'express';
import { TipoUsuario } from '../../../domain/usuario/enums.js';
import { esquemas } from '../esquemas.js';
import { permitir, validar } from '../middlewares.js';
import { apresentarNotificacao } from '../apresentadores.js';

export function rotasDeNotificacoes({ servicos, autenticado }) {
  const rotas = Router();

  rotas.use(autenticado, permitir(TipoUsuario.MEDICO, TipoUsuario.ADMIN));

  rotas.get('/', validar({ query: esquemas.filtroDeNotificacoes }), async (req, res) => {
    const lista = await servicos.notificacoes.listarDaConsulta(
      req.validado.query.id_consulta,
      req.solicitante,
    );
    res.json(lista.map(apresentarNotificacao));
  });

  rotas.post('/', validar({ body: esquemas.novaNotificacao }), async (req, res) => {
    const { id_consulta: idConsulta, lembrete } = req.validado.body;
    const notificacao = await servicos.notificacoes.criar(
      { idConsulta, lembrete },
      req.solicitante,
    );
    res.status(201).json(apresentarNotificacao(notificacao));
  });

  return rotas;
}
