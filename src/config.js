/**
 * Lê e valida a configuração UMA vez, na inicialização. Se algo obrigatório
 * faltar, o processo não sobe — é melhor falhar no deploy do que em produção,
 * no meio de um login (a versão anterior assinava tokens com segredo undefined).
 *
 * Referência de todas as variáveis: .env.example
 */

const BANCOS_SUPORTADOS = ['supabase', 'memoria'];
const TAMANHO_MINIMO_SEGREDO_JWT = 32;

export function carregarConfiguracao(env = process.env) {
  const banco = env.BANCO ?? 'supabase';
  if (!BANCOS_SUPORTADOS.includes(banco)) {
    throw new Error(`BANCO deve ser um de: ${BANCOS_SUPORTADOS.join(', ')}.`);
  }

  const obrigatorias = [
    'JWT_SECRET',
    ...(banco === 'supabase' ? ['SUPABASE_URL', 'SUPABASE_KEY'] : []),
  ];
  const ausentes = obrigatorias.filter((nome) => !env[nome]);
  if (ausentes.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${ausentes.join(', ')}.`);
  }
  if (env.JWT_SECRET.length < TAMANHO_MINIMO_SEGREDO_JWT) {
    throw new Error(`JWT_SECRET deve ter pelo menos ${TAMANHO_MINIMO_SEGREDO_JWT} caracteres.`);
  }

  const fusoHorario = env.TZ_CLINICA ?? 'America/Sao_Paulo';
  validarFuso(fusoHorario);

  return Object.freeze({
    ambiente: env.NODE_ENV ?? 'development',
    porta: Number(env.PORT ?? 3000),
    banco,
    supabaseUrl: env.SUPABASE_URL,
    supabaseChave: env.SUPABASE_KEY,
    jwtSegredo: env.JWT_SECRET,
    jwtExpiracao: env.JWT_EXPIRES_IN ?? '8h',
    custoBcrypt: Number(env.BCRYPT_COST ?? 10),
    origensCors: lerOrigensCors(env.CORS_ORIGINS),
    // Azure App Service, Vercel, Render etc. ficam atrás de 1 proxy reverso.
    proxiesConfiaveis: Number(env.TRUST_PROXY ?? 1),
    tentativasDeLoginPor15Min: Number(env.LOGIN_RATE_LIMIT ?? 20),
    fusoHorario,
  });
}

function lerOrigensCors(valor) {
  if (!valor || valor.trim() === '*') return '*';
  return valor
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);
}

function validarFuso(fuso) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: fuso });
  } catch {
    throw new Error(`TZ_CLINICA inválido: "${fuso}". Use um nome IANA, ex.: America/Sao_Paulo.`);
  }
}
