# Remoção pela clínica é distinguida pela ausência de data de cancelamento

O paciente pode desfazer o próprio cancelamento em até 3 dias, mas não deve poder "reagendar" uma consulta que a clínica removeu. O schema não tem coluna dizendo quem cancelou, e não temos acesso para migrar o banco de produção com segurança. Decidimos que `data_cancelamento` só é gravada no cancelamento **pelo paciente**; a remoção pela clínica deixa a coluna nula e grava o motivo "Cancelada pela clínica.". A entidade expõe isso explicitamente em `Consulta.foiCanceladaPeloPaciente`.

## Opções consideradas

- **Nova coluna `cancelado_por`**: mais explícita, mas exige migração coordenada com o deploy — se o código subir antes da coluna, todo cancelamento quebra.
- **Inferir pelo texto do motivo**: frágil; qualquer mudança de texto quebraria a regra.

Se o schema puder ser migrado no futuro, a coluna explícita é o caminho preferível; a troca fica restrita a `Consulta.js` e ao repositório.
