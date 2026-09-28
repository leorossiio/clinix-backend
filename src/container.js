import { randomUUID } from 'node:crypto';
import { ServicoDeAutenticacao } from './application/ServicoDeAutenticacao.js';
import { ServicoDeConsultas } from './application/ServicoDeConsultas.js';
import { ServicoDeNotificacoes } from './application/ServicoDeNotificacoes.js';
import { ServicoDeUsuarios } from './application/ServicoDeUsuarios.js';
import { criarRepositoriosEmMemoria } from './infrastructure/memoria/repositorios.js';
import { criarLogger } from './infrastructure/observabilidade/logger.js';
import { criarPublicadorDeEventos } from './infrastructure/observabilidade/publicadorDeEventos.js';
import { migrar } from './infrastructure/postgres/migrador.js';
import { criarPoolPostgres } from './infrastructure/postgres/pool.js';
import { criarRepositoriosPostgres } from './infrastructure/postgres/repositorios.js';
import { criarHasherDeSenha } from './infrastructure/seguranca/hasherDeSenha.js';
import { criarServicoDeTokens } from './infrastructure/seguranca/servicoDeTokens.js';
import { criarClienteSupabase } from './infrastructure/supabase/cliente.js';
import { criarRepositoriosSupabase } from './infrastructure/supabase/repositorios.js';

const relogioDoSistema = { agora: () => new Date() };

/**
 * Raiz de composição: o ÚNICO lugar que escolhe implementações concretas e
 * as injeta. Trocar o banco, ou o relógio real por um fixo nos testes, é
 * uma mudança só aqui.
 */
export function montarDependencias(
  config,
  { relogio = relogioDoSistema, gerarId = randomUUID, eventos } = {},
) {
  const logger = criarLogger({ nivel: config.nivelDeLog });
  const banco = montarBanco(config);
  const { usuarios, consultas, notificacoes } = banco.repositorios;
  const hasher = criarHasherDeSenha({ custo: config.custoBcrypt });
  const tokens = criarServicoDeTokens({
    segredo: config.jwtSegredo,
    expiracao: config.jwtExpiracao,
  });
  const publicador = eventos ?? criarPublicadorDeEventos({ logger });

  return {
    repositorios: banco.repositorios,
    hasher,
    relogio,
    logger,
    verificarConexao: banco.repositorios.verificarConexao,
    prepararBanco: banco.preparar,
    encerrar: banco.encerrar,
    servicos: {
      autenticacao: new ServicoDeAutenticacao({ usuarios, hasher, tokens, eventos: publicador }),
      usuarios: new ServicoDeUsuarios({ usuarios, hasher, gerarId, eventos: publicador }),
      consultas: new ServicoDeConsultas({
        consultas,
        usuarios,
        relogio,
        gerarId,
        eventos: publicador,
      }),
      notificacoes: new ServicoDeNotificacoes({ notificacoes, consultas, relogio, gerarId }),
    },
  };
}

/** Repositórios do banco escolhido, mais como prepará-lo (migrations) e encerrá-lo. */
function montarBanco(config) {
  const nada = async () => [];
  switch (config.banco) {
    case 'memoria':
      return { repositorios: criarRepositoriosEmMemoria(), preparar: nada, encerrar: nada };
    case 'postgres': {
      const pool = criarPoolPostgres(config.urlDoPostgres);
      return {
        repositorios: criarRepositoriosPostgres(pool, { fusoHorario: config.fusoHorario }),
        preparar: () => migrar(pool),
        encerrar: () => pool.end(),
      };
    }
    default: {
      const cliente = criarClienteSupabase({
        url: config.supabaseUrl,
        chave: config.supabaseChave,
      });
      return {
        // No Supabase o schema é gerenciado pelo painel do projeto.
        repositorios: criarRepositoriosSupabase(cliente, { fusoHorario: config.fusoHorario }),
        preparar: nada,
        encerrar: nada,
      };
    }
  }
}
