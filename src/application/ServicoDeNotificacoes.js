import { Notificacao } from '../domain/notificacao/Notificacao.js';
import { NaoEncontradoError } from '../domain/erros.js';
import { exigirGestaoDaConsulta } from './autorizacao.js';

/** Lembretes são geridos por quem gerencia a consulta (médico responsável ou admin). */
export class ServicoDeNotificacoes {
  #notificacoes;
  #consultas;
  #relogio;
  #gerarId;

  constructor({ notificacoes, consultas, relogio, gerarId }) {
    this.#notificacoes = notificacoes;
    this.#consultas = consultas;
    this.#relogio = relogio;
    this.#gerarId = gerarId;
  }

  async listarDaConsulta(idConsulta, solicitante) {
    await this.#carregarConsultaGerida(idConsulta, solicitante);
    return this.#notificacoes.listarPorConsulta(idConsulta);
  }

  async criar({ idConsulta, lembrete }, solicitante) {
    await this.#carregarConsultaGerida(idConsulta, solicitante);
    const notificacao = Notificacao.criar({
      id: this.#gerarId(),
      idConsulta,
      lembrete,
      data: this.#relogio.agora(),
    });
    await this.#notificacoes.inserir(notificacao);
    return notificacao;
  }

  async #carregarConsultaGerida(idConsulta, solicitante) {
    const consulta = await this.#consultas.buscarPorId(idConsulta);
    if (!consulta) throw new NaoEncontradoError('Consulta não encontrada.');
    exigirGestaoDaConsulta(solicitante, consulta);
    return consulta;
  }
}
