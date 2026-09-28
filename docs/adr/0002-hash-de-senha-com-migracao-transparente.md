# Senhas com bcrypt e migração transparente das senhas legadas

A versão anterior gravava e comparava senhas em texto puro, e as devolvia em todas as respostas da API. Passamos a gravar hash bcrypt, mas o banco de produção já tem senhas em texto puro e não temos como convertê-las sem conhecê-las. Por isso, no login, se o valor armazenado não tem o formato de um hash bcrypt, a senha é comparada em tempo constante e — se estiver correta — o hash é gravado na hora (`precisaRehash`). Cada conta legada fica protegida no primeiro login, sem exigir troca de senha.

## Consequências

- Enquanto houver contas que ainda não fizeram login, existirão senhas em texto puro no banco. Quando a base estiver migrada (nenhum valor de `usuario.senha` fora do padrão `$2a$`/`$2b$`), remova o ramo legado de `hasherDeSenha.js`. Para acompanhar: `select count(*) from usuario where senha not like '$2%';`
- Como as senhas vazaram pela API antiga, recomenda-se pedir a troca de senha a todos os usuários.
