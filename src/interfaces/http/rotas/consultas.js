import { Router } from 'express';
import { TipoUsuario } from '../../../domain/usuario/enums.js';
import { esquemas } from '../esquemas.js';
import { permitir, validar } from '../middlewares.js';
import { apresentarConsulta } from '../apresentadores.js';

const { PACIENTE, MEDICO, ADMIN } = TipoUsuario;

export function rotasDeConsultas({ servicos, autenticado }) {
  const rotas = Router();
  const consultas = servicos.consultas;
  const comId = validar({ params: esquemas.paramId });
  const clinica = permitir(MEDICO, ADMIN);
  const paciente = permitir(PACIENTE);

  rotas.use(autenticado);

  // O recorte depende do perfil: ver ServicoDeConsultas.listar.
  rotas.get('/', async (req, res) => {
    res.json((await consultas.listar(req.solicitante)).map(apresentarConsulta));
  });

  rotas.get('/:id', comId, async (req, res) => {
    res.json(apresentarConsulta(await consultas.obter(req.validado.params.id, req.solicitante)));
  });

  rotas.post('/', clinica, validar({ body: esquemas.novaConsulta }), async (req, res) => {
    const { id_medico: idMedico, data, descricao } = req.validado.body;
    const visao = await consultas.abrirHorario({ idMedico, data, descricao }, req.solicitante);
    res.status(201).json(apresentarConsulta(visao));
  });

  rotas.put(
    '/:id',
    clinica,
    validar({ params: esquemas.paramId, body: esquemas.edicaoDeConsulta }),
    async (req, res) => {
      const { params, body } = req.validado;
      res.json(apresentarConsulta(await consultas.editar(params.id, body, req.solicitante)));
    },
  );

  // "Excluir" é lógico: a consulta vira CANCELADA pela clínica e o histórico é mantido.
  rotas.delete('/:id', clinica, comId, async (req, res) => {
    res.json(apresentarConsulta(await consultas.remover(req.validado.params.id, req.solicitante)));
  });

  rotas.put('/:id/agendar', paciente, comId, async (req, res) => {
    res.json(apresentarConsulta(await consultas.agendar(req.validado.params.id, req.solicitante)));
  });

  rotas.put(
    '/:id/cancelar',
    paciente,
    validar({ params: esquemas.paramId, body: esquemas.cancelamento }),
    async (req, res) => {
      const { params, body } = req.validado;
      const visao = await consultas.cancelar(params.id, body.motivo_cancelamento, req.solicitante);
      res.json(apresentarConsulta(visao));
    },
  );

  rotas.put('/:id/reagendar', paciente, comId, async (req, res) => {
    res.json(
      apresentarConsulta(await consultas.reagendar(req.validado.params.id, req.solicitante)),
    );
  });

  return rotas;
}
