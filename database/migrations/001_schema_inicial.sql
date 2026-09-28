-- 001 — Schema inicial do Clinix (PostgreSQL / Supabase)
--
-- Reflete o schema que a aplicação espera. A versão anterior deste arquivo
-- tinha erros de sintaxe (vírgulas faltando/sobrando) e não incluía a coluna
-- consulta.data_cancelamento, adicionada depois direto no banco.
--
-- Idempotente: pode ser executado num banco novo ou num já existente.

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario    UUID PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  senha         VARCHAR(255) NOT NULL,  -- hash bcrypt (ver docs/adr/0002)
  tipo_usuario  INTEGER      NOT NULL,  -- 0 paciente · 1 médico · 2 administrador
  status        INTEGER      NOT NULL,  -- 0 ativo · 1 excluído
  especialidade INTEGER,                -- 0..4, ver src/domain/usuario/enums.js
  crm           VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS consulta (
  id_consulta         UUID PRIMARY KEY,
  id_usuario          UUID REFERENCES usuario (id_usuario),  -- o paciente
  id_medico           UUID NOT NULL REFERENCES usuario (id_usuario),
  data                TIMESTAMP NOT NULL,  -- horário local da clínica (ver docs/adr/0004)
  data_cancelamento   TIMESTAMP,           -- só em cancelamentos pelo paciente (ver docs/adr/0003)
  descricao           VARCHAR(255),
  motivo_cancelamento VARCHAR(255),
  status              INTEGER NOT NULL,    -- 0 disponível · 1 agendada · 2 concluída · 3 cancelada
  CONSTRAINT chk_paciente_medico CHECK (id_usuario <> id_medico)
);

CREATE TABLE IF NOT EXISTS notificacao (
  id_notificacao UUID PRIMARY KEY,
  id_consulta    UUID NOT NULL REFERENCES consulta (id_consulta),
  data           TIMESTAMP NOT NULL,
  lembrete       TEXT
);
