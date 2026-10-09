# Regras do projeto para a IA

Atualizado até a **aula 7, página 10** da UC4. Salve na raiz do repositório da cartilha com o nome `REGRAS.md`,
por cima da versão anterior.

## O projeto

- Repositório só para a cartilha sorteada na aula 5. É o meu projeto até o fim do curso.
- Na raiz: `docs/`, `frontend/`, `backend/` e um `README.md` que diz como rodar o front e o back.
- `docs/` guarda o que não é código:
  - `CARTILHA.md`: a cartilha sorteada, sem alteração. É a fonte do que o sistema precisa fazer.
  - `BRIEFING.md`: o briefing, escrito por mim.
  - `marca/` e `styleguide/`, ou o link do Figma no `README.md`.
  - O DER das três entidades da cartilha, com o tipo e a restrição de cada coluna.
- `frontend/`: o React, com as quatro telas da cartilha.
- Estrutura do `backend/`, e nenhuma pasta além destas:
  - `alembic.ini` e `migracoes/`: gerados por `alembic init migracoes` na página 10.
    A pasta contém `env.py`, `script.py.mako`, `README` e `versions/` vazia.
    O INI mantém a URL fictícia e o `env.py` mantém `target_metadata = None` até a página 11.
  - `.env`: o que muda de máquina para máquina, inclusive o `URL_DO_BANCO` com a senha. Fica fora do Git.
  - `.env.exemplo`: as mesmas chaves, sem os valores. Esse vai para o Git.
  - `configuracao.py`: o único arquivo que lê o `.env`, com `load_dotenv()` e `os.getenv`.
  - `banco.py`: o `engine`, a fábrica `Sessao`, a classe `Base` e a função `obter_sessao`. Nada mais.
  - `criar_tabelas.py`: importa os três modelos e roda `Base.metadata.create_all(engine)`. Rodado à mão
    no terminal, com `python criar_tabelas.py`, e não pelo `main.py`.
  - `main.py`: cria o `app`, registra o CORS lendo a configuração e liga os routers
    com `include_router`. Nenhuma rota nele.
  - `rotas/<recurso>.py`, no plural: o `APIRouter`, as rotas do recurso e nada mais.
  - `servicos/<recurso>.py`, no singular: as decisões, as contas e a regra da cartilha.
  - `repositorios/<recurso>.py`, no singular: as funções que leem e gravam no banco. Recebem a sessão
    como primeiro parâmetro.
  - `esquemas/<recurso>.py`, no singular: os esquemas Pydantic de entrada e de saída.
  - `modelos/<recurso>.py`, no singular: o modelo SQLAlchemy, uma classe por tabela, para as três
    entidades da cartilha.
  - Um `__init__.py` vazio em cada uma dessas pastas.
- A chamada vai sempre na mesma direção: rota chama serviço, serviço chama repositório.
  A sessão nasce na rota, pelo `Depends(obter_sessao)`, e passa de mão em mão: rota, serviço,
  repositório. Só o repositório importa os modelos e chama métodos da sessão.
- **Esquema** é a classe Pydantic, em `esquemas/`. **Modelo** é a classe SQLAlchemy, em `modelos/`.
  Não troque uma palavra pela outra.
- Código, nomes de variáveis, comentários e respostas sempre em português do Brasil.
- Cartilha: escreva aqui o número e o nome, e em uma linha a pessoa, quem toca o negócio e a regra.

## O que já foi visto, e pode usar

- Alembic: instalar com `pip install alembic` e inicializar com
  `alembic init migracoes`. Nenhuma revisão é criada ou aplicada até a página 10.
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
- No React, tudo que veio da UC5, e o `fetch` com os três estados da tela, `resposta.ok`,
  `throw new Error`, `.catch` e o POST com `method`, `Content-Type` e `JSON.stringify`.
- MySQL: `CREATE DATABASE`, `SHOW DATABASES`, `DESCRIBE`, tipos `INT`, `VARCHAR(n)` e `DATE`,
  `PRIMARY KEY`, `AUTO_INCREMENT` e `NOT NULL`. O DER das entidades.
- SQLAlchemy 2, com o driver `mysql+mysqlconnector`:
  - `create_engine` com o endereço vindo da configuração, `sessionmaker` e `class Base(DeclarativeBase)`.
  - O endereço do banco pode vir inteiro, numa chave `URL_DO_BANCO`, ou em peças (`BANCO_USUARIO`,
    `BANCO_SENHA`, `BANCO_HOST`, `BANCO_PORTA`, `BANCO_NOME`) montadas com `URL.create` no `configuracao.py`.
    Use a forma que já estiver no meu projeto.
  - Modelo declarativo com `__tablename__` e `Column(Integer | String(n) | Date, primary_key=..., nullable=...)`.
  - `ForeignKey("tabela.coluna")` na filha, apontando para a principal, e `relationship("Classe")`
    na principal, para ler a filha com ponto (`tarefa.itens`).
  - O modelo que tem `ForeignKey` importa o modelo da tabela para onde a chave aponta.
  - Sessão por requisição: `obter_sessao` com `with Sessao() as sessao:` e `yield sessao`, entregue
    pela rota com `sessao=Depends(obter_sessao)`. O `with` e o `yield` foram vistos nesta aula.
  - `sessao.scalars(select(Modelo)).all()`, `sessao.get(Modelo, id)`, `sessao.add`, `sessao.commit`,
    `sessao.refresh` e `sessao.delete`. Atualizar é mudar o atributo do objeto e dar commit.
  - Consulta com `.where`, `.order_by`, `.limit`, `.offset` e `.join`, montada no repositório.
    Paginação com `pagina: int = Query(default=1, ge=1)` na rota.
  - Transação: a regra que muda mais de uma tabela grava tudo num commit só. Erro antes do commit
    desfaz tudo, porque fechar a sessão sem commit é `rollback`.
- O repositório devolve objeto do modelo, e o serviço lê com ponto: `registro.campo`, não `registro["campo"]`.

## O que ainda não foi visto, e não deve aparecer

- `try`/`except`. O rollback acontece porque a sessão fecha sem commit, e isso basta por enquanto.
- Função de repositório que abre a própria sessão com `Sessao()`. Toda sessão vem do `Depends`.
- `back_populates`, `backref`, `lazy=`, `joinedload`, `selectinload`, `cascade`. O `relationship` simples basta.
- Configurar a conexão do Alembic, gerar e aplicar migrations (após a página 10).
  As tabelas nascem do `criar_tabelas.py`. Se uma mudança precisar alterar uma
  tabela que já existe, como uma chave estrangeira nova na principal, **não apague a tabela e me avise**:
  isso é o assunto das próximas páginas da aula 7.
- SQL escrito à mão no código Python, `mysql.connector` direto, `text()` do SQLAlchemy.
- SQLite ou qualquer banco que não seja o MySQL.
- `orm_mode` e `class Config` do Pydantic 1. Se o esquema de saída precisar ler de objeto, o FastAPI
  já faz isso no `response_model`. `model_config = ConfigDict(from_attributes=True)` pode ficar, se
  você explicar em um comentário o que ele faz.
- `Mapped[...]` e `mapped_column`. Use `Column`, que é o que o curso mostrou. Se você preferir o outro
  estilo, avise antes e explique a diferença.
- Login, senha, hash, JWT, token, rota protegida. A tela da pessoa informa quem ela é na própria requisição.
- Exceção criada por mim, do tipo `class LimiteExcedido(Exception)`. Quando a regra da cartilha recusa,
  o serviço devolve algo que a rota consiga testar com `if`, e a rota escolhe o status.
- Regra de negócio que não está na cartilha.
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
- Antes de escrever uma função, diga em qual camada ela entra e por quê.
- No DER e no modelo, me pergunte o tamanho e a restrição de cada coluna antes de decidir por mim.
  Essas escolhas são avaliadas como minhas.
- Justifique cada decisão em uma linha. Eu preciso conseguir defender esse código na apresentação.

## Cartilha deste projeto

Cartilha 3 — Cesta do Vale, horta comunitária. Aline pede a cesta; Vanderlei separa os produtos. A soma das quantidades respeita os limites 5, 8 e 12 e a primeira separação muda a situação.

Os nomes e restrições das colunas já existentes foram preservados, incluindo Enum e criado_em, para evitar mudanças de tabela nesta aula. A conexão usa URL_DO_BANCO com mysql+mysqlconnector.

