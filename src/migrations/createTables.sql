-- Tabela Usuario
CREATE TABLE usuario (
  id_usuario UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo_usuario INTEGER NOT NULL
  status INTEGER NOT NULL
  especialidade INTEGER,
  crm VARCHAR(255) UNIQUE,
);

-- Tabela Consulta
CREATE TABLE consulta (
  id_consulta UUID PRIMARY KEY,
  id_usuario UUID NOT NULL,
  id_medico UUID NOT NULL,
  data TIMESTAMP NOT NULL,
  descricao VARCHAR(255),
  status INTEGER NOT NULL

  CONSTRAINT fk_consulta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_consulta_medico FOREIGN KEY (id_medico) REFERENCES usuario(id_usuario),
  CONSTRAINT chk_paciente_medico CHECK (id_usuario <> id_medico)
);

-- Tabela Notificacao
CREATE TABLE Notificacao (
    id_notificacao UUID PRIMARY KEY,
    id_consulta UUID NOT NULL,       -- FK para Consulta
    data TIMESTAMP NOT NULL,
    lembrete TEXT,
    CONSTRAINT fk_notif_consulta FOREIGN KEY (id_consulta) REFERENCES Consulta(id_consulta)
);