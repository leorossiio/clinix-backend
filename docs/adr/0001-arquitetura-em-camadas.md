# Arquitetura em camadas com domínio isolado

As regras de negócio (24h para cancelar, 3 dias para reagendar, quem pode ver o quê) estavam espalhadas entre controllers e repositórios, misturadas a Express e Supabase, e sem nenhum teste. Adotamos quatro camadas com dependências apontando só para dentro: `domain` (entidades e regras puras, sem I/O), `application` (casos de uso que orquestram domínio e repositórios e aplicam autorização por dono), `infrastructure` (Supabase, bcrypt, JWT, memória) e `interfaces/http` (Express). As implementações concretas são escolhidas num único ponto, `src/container.js`.

## Consequências

- O domínio é testado sem banco e sem relógio real: tudo que depende de tempo recebe `agora` por parâmetro.
- Os repositórios são "portas": o Supabase e a versão em memória cumprem o mesmo contrato, verificado por `tests/contrato/`. A versão em memória viabiliza os testes da API e o modo `BANCO=memoria`.
- Autorização por **perfil** fica nas rotas (`permitir`); autorização por **dono** (paciente dono, médico responsável) fica na aplicação, porque exige carregar o recurso.
