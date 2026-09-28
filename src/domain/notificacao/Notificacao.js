import { RegraDeNegocioError } from '../erros.js';

/** Lembrete registrado pela clínica para uma consulta. */
export class Notificacao {
  #props;

  constructor(props) {
    this.#props = { ...props };
  }

  static reconstituir(props) {
    return new Notificacao(props);
  }

  static criar({ id, idConsulta, lembrete, data }) {
    if (!lembrete?.trim()) throw new RegraDeNegocioError('Informe o texto do lembrete.');
    return new Notificacao({ id, idConsulta, lembrete: lembrete.trim(), data });
  }

  paraObjeto() {
    return { ...this.#props };
  }

  get id() {
    return this.#props.id;
  }
  get idConsulta() {
    return this.#props.idConsulta;
  }
  get lembrete() {
    return this.#props.lembrete;
  }
  get data() {
    return this.#props.data;
  }
}
