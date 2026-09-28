import { describe, it, expect } from 'vitest';
import { Usuario } from '../../../src/domain/usuario/Usuario.js';
import { TipoUsuario, StatusUsuario } from '../../../src/domain/usuario/enums.js';
import { ConflitoError, RegraDeNegocioError } from '../../../src/domain/erros.js';

const novoPaciente = () =>
  Usuario.registrarPaciente({ id: 'u1', nome: 'Ana', email: 'Ana@Clinix.com ', senhaHash: 'h1' });

describe('Usuário', () => {
  it('um auto-cadastro sempre gera um paciente ativo', () => {
    const usuario = novoPaciente();

    expect(usuario.tipo).toBe(TipoUsuario.PACIENTE);
    expect(usuario.estaAtivo).toBe(true);
  });

  it('guarda o e-mail normalizado (minúsculo e sem espaços)', () => {
    expect(novoPaciente().email).toBe('ana@clinix.com');
  });

  it('exige nome e e-mail', () => {
    expect(() =>
      Usuario.registrarPaciente({ id: 'u1', nome: ' ', email: 'a@a.com', senhaHash: 'h' }),
    ).toThrow(RegraDeNegocioError);
  });

  describe('exclusão e reativação', () => {
    it('a exclusão é lógica: o usuário deixa de estar ativo', () => {
      const usuario = novoPaciente();

      usuario.excluir();

      expect(usuario.status).toBe(StatusUsuario.EXCLUIDO);
    });

    it('um usuário excluído que se cadastra de novo é reativado como paciente', () => {
      const medico = Usuario.reconstituir({
        id: 'u2',
        nome: 'Dr. Beto',
        email: 'beto@clinix.com',
        senhaHash: 'antigo',
        tipo: TipoUsuario.MEDICO,
        status: StatusUsuario.EXCLUIDO,
        especialidade: 1,
        crm: '123',
      });

      medico.reativarComoPaciente({ nome: 'Beto', senhaHash: 'novo' });

      expect(medico.estaAtivo).toBe(true);
      expect(medico.tipo).toBe(TipoUsuario.PACIENTE);
      expect(medico.crm).toBeNull();
      expect(medico.senhaHash).toBe('novo');
    });

    it('não reativa um usuário que já está ativo (e-mail em uso)', () => {
      expect(() => novoPaciente().reativarComoPaciente({ nome: 'X', senhaHash: 'h' })).toThrow(
        ConflitoError,
      );
    });
  });

  it('atualiza apenas os dados informados', () => {
    const usuario = novoPaciente();

    usuario.atualizarDados({ nome: 'Ana Maria' });

    expect(usuario.nome).toBe('Ana Maria');
    expect(usuario.email).toBe('ana@clinix.com');
  });
});
