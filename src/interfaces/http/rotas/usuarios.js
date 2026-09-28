import { Router } from 'express';
import { TipoUsuario } from '../../../domain/usuario/enums.js';
import { esquemas } from '../esquemas.js';
import { permitir, validar } from '../middlewares.js';
import { apresentarUsuario } from '../apresentadores.js';

export function rotasDeUsuarios({ servicos, autenticado }) {
  const rotas = Router();
  const comId = validar({ params: esquemas.paramId });

  // Cadastro público de pacientes. Reativa a conta se o e-mail pertencer a um usuário excluído.
  rotas.post('/', validar({ body: esquemas.cadastroDePaciente }), async (req, res) => {
    const { usuario, reativado } = await servicos.usuarios.registrarPaciente(req.validado.body);
    res.status(reativado ? 200 : 201).json(apresentarUsuario(usuario));
  });

  rotas.get('/', autenticado, permitir(TipoUsuario.ADMIN), async (_req, res) => {
    res.json((await servicos.usuarios.listarAtivos()).map(apresentarUsuario));
  });

  // Declarada antes de "/:id" para que "medicos" não seja interpretado como id.
  rotas.get('/medicos', autenticado, async (_req, res) => {
    res.json((await servicos.usuarios.listarMedicos()).map(apresentarUsuario));
  });

  rotas.get('/:id', autenticado, comId, async (req, res) => {
    res.json(
      apresentarUsuario(await servicos.usuarios.obter(req.validado.params.id, req.solicitante)),
    );
  });

  rotas.put(
    '/:id',
    autenticado,
    validar({ params: esquemas.paramId, body: esquemas.atualizacaoDeUsuario }),
    async (req, res) => {
      const { params, body } = req.validado;
      res.json(
        apresentarUsuario(await servicos.usuarios.atualizar(params.id, body, req.solicitante)),
      );
    },
  );

  rotas.delete('/:id', autenticado, permitir(TipoUsuario.ADMIN), comId, async (req, res) => {
    await servicos.usuarios.excluir(req.validado.params.id, req.solicitante);
    res.status(204).end();
  });

  return rotas;
}
