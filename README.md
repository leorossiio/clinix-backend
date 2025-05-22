# `clinix-backend/README.md`

---

# Clinix Backend

API RESTful do sistema Clinix, construída com [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) e [TypeScript](https://www.typescriptlang.org/). 
Responsável pelo gerenciamento de usuários, autenticação com JWT, agendamento de consultas e conexão com o banco PostgreSQL pelo SUPABASE.


# Repositório Frontend

[Clinix Frontend](https://github.com/leorossiio/clinix-frontend)

---

# Tecnologias Utilizadas

  - Node.js
  - Express
  - TypeScript
  - Prisma ORM
  - PostgreSQL
  - JWT (autenticação)
  - Zod (validação de dados)
  - Dotenv

---

# Execução do Projeto

```prompt
# Clonar o repositório
git clone https://github.com/leorossiio/clinix-backend.git
cd clinix-backend

# Instalar as dependências
npm install

# Executar o servidor em modo dev (deve estar dentro da pasta '\clinix-backend')
npm run start <- A API ficará disponível em: http://localhost:3000
```

---

# Variáveis de Ambiente

Crie um arquivo .env com o seguinte conteúdo:

SUPABASE_KEY="chave-supabase-aqui"
JWT_SECRET='token'

---

# Padrões de Projeto Implementados

  - Padrão MVC: Separação entre controllers, services, routes.
  - RESTful API: Endpoints organizados por entidades (/usuarios, /consultas).
  - Autenticação com JWT: Proteção de rotas com verificação de token.
  - Middleware global de erros: Tratamento centralizado.

---

# Estrutura de pastas
```Pastas
  src/
├── controllers/      # Controladores de rotas
├── middlewares/      # Autenticação, erros
├── migrations/       # Banco de dados
├── repositories/     # logica do sistema
├── routes/           # Definição das rotas
└── server.ts         # Inicialização do servidor
```

---

# Planejamento no Jira
O projeto foi planejado com sprints no Jira, com tarefas por funcionalidade:

  - Login com autenticação JWT e redirecionamento por perfil
  - Listagem e cadastro de usuários
  - Cadastro de consultas com associação entre médico e paciente
  - Proteção de rotas com guards de autenticação
  - Separação de perfis para Admin, Médico e Paciente

---

# Itens não implementados criados no Jira: (21/05)
Abaixo estão os itens que ainda não foram implementados na sprint atual. Eles estão registrados na coluna "Aguardando Dev" no board do Jira e serão replanejados para a próxima sprint, conforme alinhamento da equipe:

| Tarefa                                                    | Código        | Pontos | Responsável | Justificativa                                                                                                                           |
| --------------------------------------------------------- | ------------- | ------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Integrar filtro com a tabela/lista de resultados**      | `CLINIXSM-39` | 5      | GM          | Depende da finalização do componente de exibição e consolidação das regras definidas no RF3. Priorizou-se estruturar os dados primeiro. |
| **Adicionar loading enquanto carrega filtros**            | `CLINIXSM-41` | 2      | JG          | O carregamento já está mapeado, mas o componente visual de loading aguarda definição final do padrão de UX.                             |
| **Garantir que filtros não sejam reiniciados ao navegar** | `CLINIXSM-43` | 3      | JG          | Exige persistência de estado entre rotas. A estrutura de navegação ainda está em ajuste.                                                |
| **Validar disponibilidade do médico e horário**           | `CLINIXSM-45` | 5      | TT          | Requer a conclusão da camada de verificação no back-end, que está sendo ajustada para múltiplos agendamentos.                           |
| **Aplicar regras de negócio no agendamento**              | `CLINIXSM-46` | 3      | TT          | Depende da validação final do documento de regras (RF4), especialmente quanto a bloqueios e limites de agendamento.                     |
| **Validar cancelamento com mais de 24h de antecedência**  | `CLINIXSM-50` | 2      | GM          | A lógica de cancelamento está em desenvolvimento, mas a checagem do tempo mínimo ainda precisa ser integrada.                           |
