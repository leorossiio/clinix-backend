import { randomUUID } from 'node:crypto';
import { ServicoDeAutenticacao } from './application/ServicoDeAutenticacao.js';
import { ServicoDeConsultas } from './application/ServicoDeConsultas.js';
import { ServicoDeNotificacoes } from './application/ServicoDeNotificacoes.js';
import { ServicoDeUsuarios } from './application/ServicoDeUsuarios.js';
import { criarRepositoriosEmMemoria } from './infrastructure/memoria/repositorios.js';
import { criarHasherDeSenha } from './infrastructure/seguranca/hasherDeSenha.js';
import { criarServicoDeTokens } from './infrastructure/seguranca/servicoDeTokens.js';
import { criarClienteSupabase } from './infrastructure/supabase/cliente.js';
import { criarRepositoriosSupabase } from './infrastructure/supabase/repositorios.js';

const relogioDoSistema = { agora: () => new Date() };

/**
 * Raiz de composição: o ÚNICO lugar que escolhe implementações concretas e
 * as injeta. Trocar Supabase por outro banco, ou o relógio real por um fixo
 * nos testes, é uma mudança só aqui.
 */
export function montarDependencias(
  config,
  { relogio = relogioDoSistema, gerarId = randomUUID } = {},
) {
  const repositorios =
    config.banco === 'memoria'
      ? criarRepositoriosEmMemoria()
      : criarRepositoriosSupabase(
          criarClienteSupabase({ url: config.supabaseUrl, chave: config.supabaseChave }),
          { fusoHorario: config.fusoHorario },
        );
  const hasher = criarHasherDeSenha({ custo: config.custoBcrypt });
  const tokens = criarServicoDeTokens({
    segredo: config.jwtSegredo,
    expiracao: config.jwtExpiracao,
  });
  const { usuarios, consultas, notificacoes } = repositorios;

  return {
    repositorios,
    hasher,
    relogio,
    servicos: {
      autenticacao: new ServicoDeAutenticacao({ usuarios, hasher, tokens }),
      usuarios: new ServicoDeUsuarios({ usuarios, hasher, gerarId }),
      consultas: new ServicoDeConsultas({ consultas, usuarios, relogio, gerarId }),
      notificacoes: new ServicoDeNotificacoes({ notificacoes, consultas, relogio, gerarId }),
    },
  };
}
