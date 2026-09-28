/**
 * Erros que expressam situações do negócio, independentes de HTTP.
 *
 * A camada HTTP traduz cada classe para um status (ver tratamentoDeErros.js),
 * então o domínio nunca precisa conhecer códigos como 404 ou 422.
 */
export class ErroDeDominio extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = this.constructor.name;
  }
}

/** Uma regra de negócio impede a operação (ex.: cancelar com menos de 24h). */
export class RegraDeNegocioError extends ErroDeDominio {}

/** O recurso pedido não existe (ou não está visível para quem pediu). */
export class NaoEncontradoError extends ErroDeDominio {}

/** Quem pediu está autenticado, mas não tem permissão para esta operação. */
export class AcessoNegadoError extends ErroDeDominio {}

/** O estado mudou entre a leitura e a escrita, ou há duplicidade (ex.: e-mail). */
export class ConflitoError extends ErroDeDominio {}

/** Falha de autenticação. A mensagem é propositalmente genérica. */
export class CredenciaisInvalidasError extends ErroDeDominio {
  constructor() {
    super('E-mail ou senha inválidos.');
  }
}
