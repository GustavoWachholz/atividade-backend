# Regras do projeto para a IA

Atualizado até a **aula 5** da UC4. Salve na raiz do **repositório novo, o da cartilha**, com o nome
`REGRAS.md`. Deste ponto em diante ele vale para esse repositório, e é nele que as próximas versões
são gravadas por cima.

## O projeto

- Repositório novo, só para a cartilha sorteada na aula 5. É o meu projeto até o fim do curso.
- Na raiz: `docs/`, `frontend/`, `backend/` e um `README.md` que diz como rodar o front e o back.
- `docs/` guarda o que não é código:
  - `CARTILHA.md`: a cartilha sorteada, sem alteração. É a fonte do que o sistema precisa fazer.
  - `BRIEFING.md`: o briefing, escrito por mim.
  - `marca/`: o logo e as versões dele.
  - `styleguide/`: o styleguide, ou o link do Figma no `README.md`.
- `frontend/`: o React, com as quatro telas da cartilha.
- Estrutura do `backend/`, e nenhuma pasta além destas:
  - `.env`: o que muda de máquina para máquina. Fica fora do Git.
  - `.env.exemplo`: as mesmas chaves, sem os valores. Esse vai para o Git.
  - `configuracao.py`: o único arquivo que lê o `.env`, com `load_dotenv()` e `os.getenv`.
  - `main.py`: cria o `app`, registra o CORS lendo a configuração e liga os routers
    com `include_router`. Nenhuma rota nele.
  - `rotas/<recurso>.py`, no plural: o `APIRouter`, as rotas do recurso e nada mais.
  - `servicos/<recurso>.py`, no singular: as decisões, as contas e a regra da cartilha.
  - `repositorios/<recurso>.py`, no singular: a lista em memória e as funções que leem e gravam.
  - `esquemas/<recurso>.py`, no singular: os esquemas Pydantic de entrada e de saída.
  - Um `__init__.py` vazio em cada uma dessas pastas.
- A chamada vai sempre na mesma direção: rota chama serviço, serviço chama repositório.
  Nunca o contrário, e nunca uma rota importando outra rota.
- Código, nomes de variáveis, comentários e respostas sempre em português do Brasil.
- Cartilha: escreva aqui o número e o nome, e em uma linha a pessoa, quem toca o negócio e a regra.

## O que já foi visto, e pode usar

- `venv`, `fastapi dev main.py`, `/docs`, rotas com `def` comum.
- Os quatro métodos, status 200, 201, 404 e 422, `HTTPException`, `APIRouter`.
- Parâmetro de caminho e de consulta, com tipo declarado, e mais de um filtro opcional na consulta.
- Filtro de lista com laço `for` e `append`, ou com compreensão de lista. `isinstance`.
- Pydantic: `BaseModel`, `Field` com restrições, esquema de entrada diferente do de saída,
  `model_dump()` e `**`, `response_model`, `status_code=201`.
- CORS liberado apenas para o endereço exato do meu front, lido da configuração.
- Separação em três camadas, `__init__.py`, import de módulo com `as`.
- `load_dotenv()`, `os.getenv`, `.env` e `.env.exemplo`.
- `Depends` com uma função comum, para o que se repete em várias rotas.
- No React, tudo que veio da UC5: componentes, `useState`, `useEffect`, CSS responsivo.
- No `fetch`: os três estados da tela (carregando, erro e pronto), `resposta.ok`,
  `throw new Error` dentro do `.then`, `.catch`, e o POST com `method`, o cabeçalho
  `Content-Type: application/json` e `JSON.stringify`.

## O que ainda não foi visto, e não deve aparecer

- Banco de dados, SQL, SQLAlchemy ou qualquer ORM. Os dados ficam em lista na memória,
  dentro do repositório.
- Migrations, relacionamento entre tabelas, paginação, ordenação.
- Login, senha, hash, JWT, token, rota protegida. O perfil é escolhido numa lista na tela, sem senha,
  e a tela da pessoa informa quem ela é na própria requisição.
- Exceção criada por mim, do tipo `class LimiteExcedido(Exception)`, e `try`/`except` no Python.
  Quando a regra da cartilha recusa, o serviço **não** levanta `HTTPException`: ele devolve algo que a
  rota consiga testar com `if` (por exemplo `None`, ou o texto do motivo), e a rota escolhe o status.
- Regra de negócio que não está na cartilha. O serviço faz só o que a cartilha manda.
- `allow_origins=["*"]`. Isso é erro, e foi apresentado como erro em aula.
- `pydantic-settings`, `BaseSettings`, classe de configuração.
- `async def` no Python. Use `def` normal.
- Biblioteca nova no front para buscar dados, como axios ou React Query. O `fetch` resolve.

## Como escrever o código

- Todo código que você gerar vem comentado em português. Um comentário curto acima de cada rota,
  função ou bloco, dizendo o que ele faz e por que está ali.
- O comentário explica a intenção. Não repita o que a linha já diz: `# retorna a lista` em cima
  de `return lista` não ensina nada.
- Na primeira vez que aparecer algo novo para mim (um decorador, um tipo, um parâmetro), explique
  em uma linha, no próprio comentário.
- Os comentários ficam no código que eu entrego. É por eles que eu estudo antes da apresentação.
- Depois do código, escreva um resumo curto: quais arquivos você criou ou alterou, o que mudou em
  cada um e como eu testo, com a URL ou o comando e o que deve aparecer na tela.

## Como responder

- Uma coisa por vez. Não adiante etapa que eu não pedi.
- Se a tarefa exigir algo da lista de cima, avise antes de escrever código e proponha a versão simples.
- Antes de escrever uma função, diga em qual das três camadas ela entra e por quê.
- No briefing, na marca e no styleguide, me ajude com perguntas e com revisão antes de propor texto
  pronto. Essas escolhas são avaliadas como minhas, e o meu colega de cartilha vai fazer as dele.
- Justifique cada decisão em uma linha. Eu preciso conseguir defender esse código na apresentação.
