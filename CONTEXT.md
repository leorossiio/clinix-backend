# Clinix — Agendamento de Consultas

Clínica que publica horários de atendimento dos seus médicos para que pacientes agendem, cancelem e reagendem consultas.

## Pessoas

**Usuário**:
Qualquer pessoa com acesso ao sistema, identificada pelo e-mail. Tem exatamente um perfil: Paciente, Médico ou Administrador.
_Evite_: conta, login

**Paciente**:
Usuário que agenda consultas para si. É o único perfil criado por auto-cadastro.
_Evite_: usuário (para se referir ao paciente), cliente

**Médico**:
Usuário que atende consultas; possui especialidade e CRM e gerencia a própria agenda.
_Evite_: doutor, profissional

**Administrador**:
Usuário da clínica que gerencia usuários e a agenda de qualquer médico.
_Evite_: admin (na interface), gestor

**Clínica**:
O Médico responsável por uma consulta ou um Administrador, quando agem em nome do estabelecimento.

**Exclusão de usuário**:
Desativação da conta; o registro permanece para preservar o histórico. Quem foi excluído pode se cadastrar de novo com o mesmo e-mail e volta como Paciente (**reativação**).
_Evite_: deletar, apagar

## Agenda

**Agenda**:
Conjunto das consultas de um Médico.

**Consulta**:
Um horário de atendimento de um Médico, do momento em que é aberto até ser concluído ou cancelado.
_Evite_: agendamento, atendimento, slot

**Horário disponível**:
Consulta aberta pela Clínica e ainda sem Paciente (status Disponível).
_Evite_: consulta não agendada, vaga

**Agendar**:
O Paciente reserva um Horário disponível para si.

**Cancelamento pelo paciente**:
O Paciente desiste de uma consulta agendada, informando o motivo, com no mínimo 24 horas de antecedência.

**Reagendar**:
Desfazer o cancelamento pelo paciente, devolvendo a consulta ao mesmo Paciente. Só vale para o cancelamento mais recente dele e até 3 dias depois de cancelar.
_Evite_: remarcar (não muda data nem médico)

**Remoção pela clínica**:
A Clínica retira uma consulta ativa da agenda. A consulta fica Cancelada e o Paciente não pode reagendá-la.
_Evite_: excluir consulta, deletar consulta

**Lembrete**:
Observação registrada pela Clínica para uma consulta (ex.: "trazer exames").
_Evite_: notificação (nome técnico da tabela), aviso
