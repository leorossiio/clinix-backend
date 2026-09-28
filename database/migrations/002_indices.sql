-- 002 — Índices para as consultas mais frequentes da API (opcional, recomendado)
--
-- Puramente aditivo: não altera dados nem é exigido pelo código.

-- Listagem do paciente: horários disponíveis a partir de agora.
CREATE INDEX IF NOT EXISTS idx_consulta_status_data ON consulta (status, data);
-- Agenda do médico e consultas do paciente.
CREATE INDEX IF NOT EXISTS idx_consulta_medico ON consulta (id_medico);
CREATE INDEX IF NOT EXISTS idx_consulta_paciente ON consulta (id_usuario);
-- Lembretes por consulta.
CREATE INDEX IF NOT EXISTS idx_notificacao_consulta ON notificacao (id_consulta);
-- Login busca o e-mail sem diferenciar maiúsculas (ILIKE).
CREATE INDEX IF NOT EXISTS idx_usuario_email_lower ON usuario (lower(email));
