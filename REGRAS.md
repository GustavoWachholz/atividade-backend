# Regras do projeto para a IA

Atualizado até a **aula 9** da UC4. Salve na raiz do repositório da cartilha com o nome `REGRAS.md`,
por cima da versão anterior.

## O projeto

- Repositório só para a cartilha sorteada na aula 5. É o meu projeto até o fim do curso.
- Na raiz: `docs/`, `frontend/`, `backend/` e um `README.md` que diz como rodar o front e o back,
  como montar o banco do zero, quais rotas a API tem, quem pode usar cada uma e como a regra da
  cartilha recusa.
- `.docs/` é o diário de obra do projeto, para mim e para você, a IA. Tem cinco arquivos:
  `README.md` (o projeto em dez linhas), `arquitetura.md`, `decisoes.md`, `proximos-passos.md` e
  `roadmap.md`. Você lê a `.docs/` antes de qualquer tarefa, e atualiza antes de terminar.
- `docs/` guarda o que não é código:
  - `CARTILHA.md`: a cartilha sorteada, sem alteração. É a fonte do que o sistema precisa fazer.
  - `BRIEFING.md`: o briefing, escrito por mim.
  - `marca/` e `styleguide/`, ou o link do Figma no `README.md`.
  - O DER das três entidades da cartilha, com o tipo e a restrição de cada coluna.
- `frontend/`: o React, com as quatro telas da cartilha e a tela de login. Cada perfil cai na sua tela.
- Estrutura do `backend/`, e nenhuma pasta além destas:
  - `.env`: o que muda de máquina para máquina, inclusive o `URL_DO_BANCO` com a senha e a
    `CHAVE_DO_TOKEN`, que assina os tokens. Fica fora do Git.
  - `.env.exemplo`: as mesmas chaves, sem os valores. Esse vai para o Git.
  - `configuracao.py`: o único arquivo que lê o `.env`, com `load_dotenv()` e `os.getenv`.
  - `banco.py`: o `engine`, a fábrica `Sessao`, a classe `Base` e a função `obter_sessao`. Nada mais.
  - `seguranca.py`: `gerar_hash` e `verificar_senha`, com o `pwdlib`, e `criar_token` e `ler_token`,
    com o PyJWT. Não importa nada do FastAPI.
  - `criar_tabelas.py`: importa os três modelos e roda `Base.metadata.create_all(engine)`. Rodado à mão
    no terminal, com `python criar_tabelas.py`, e não pelo `main.py`. Serve para o banco vazio.
  - `alembic.ini` e `migracoes/`: a configuração do Alembic, o `env.py` e as migrations em
    `migracoes/versions/`. Toda mudança numa tabela que já existe é uma migration.
  - `main.py`: cria o `app`, registra o CORS lendo a configuração, liga os routers
    com `include_router` e pode ter os `exception_handler` das exceções da regra. Nenhuma rota nele.
  - `rotas/<recurso>.py`, no plural: o `APIRouter`, as rotas do recurso e nada mais.
  - `rotas/usuarios.py`: o cadastro, `POST /usuarios`, e o `GET /usuarios/eu`.
  - `rotas/autenticacao.py`: o `POST /login`, o `OAuth2PasswordBearer`, o `obter_usuario_atual` e uma
    função `exigir_<perfil>` para cada perfil da cartilha.
  - `servicos/<recurso>.py`, no singular: as decisões, as contas e a regra da cartilha, numa função
    com o nome da regra.
  - `servicos/excecoes.py`: uma classe por motivo de recusa da regra, herdando de `Exception`.
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
- O serviço recusa com `raise` de uma exceção de `servicos/excecoes.py`, com uma frase para a tela.
  Ele não importa `HTTPException` e não escreve número de status. Quem escolhe o status é a rota,
  com `try`/`except`, ou o `main.py`, com `exception_handler`.
- A senha nunca vai para o banco, para a resposta, para o log nem para o token. O banco guarda só
  o `senha_hash`, e o esquema de saída do usuário não tem senha nem hash.
- Quem é o dono de um registro vem do token, pelo `obter_usuario_atual`, e nunca do corpo da requisição.
- Cartilha: 3 · Cesta do Vale, horta comunitária. Aline (assinante) pede a cesta da semana; Vanderlei
  (produtor) separa os produtos. A soma das quantidades respeita os limites 5, 8 e 12, e o primeiro
  produto separado muda a situação de `pedida` para `em_separacao`.

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
- Alembic: `alembic init migracoes`, o `env.py` com `target_metadata = Base.metadata` e
  `connectable = engine`, `ForeignKey(..., name="...")` para a chave entrar numa tabela que já existe,
  `alembic revision --autogenerate -m "..."`, `alembic upgrade head`, `alembic current`,
  `alembic history` e, para o banco do zero, `python criar_tabelas.py` seguido de `alembic stamp head`.
- O repositório devolve objeto do modelo, e o serviço lê com ponto: `registro.campo`, não `registro["campo"]`.
- `try`/`except ... as erro`, `raise` e exceção própria com `class Motivo(Exception): pass`.
- Exceção de domínio traduzida para status: `except Motivo as erro:` seguido de
  `raise HTTPException(status_code=..., detail=str(erro))` na rota, ou
  `@app.exception_handler(Motivo)` com `def` e `JSONResponse` no `main.py`.
- Senha: `pwdlib` com `PasswordHash.recommended()` (argon2), `hash` no cadastro e `verify` no login.
  As colunas novas do usuário entram por migration.
- Token: PyJWT com `jwt.encode` e `jwt.decode`, `HS256`, `sub` com o id em texto e `exp` com
  `datetime.now(timezone.utc) + timedelta(...)`. A chave vem do `.env`, gerada com `secrets.token_hex(32)`.
- `OAuth2PasswordRequestForm = Depends()` no `/login`, que lê `username` e `password` de um formulário.
  O `username` é o e-mail. Resposta `{"access_token": ..., "token_type": "bearer"}`.
- `OAuth2PasswordBearer(tokenUrl="login")` e uma dependência `obter_usuario_atual`, que devolve o
  usuário ou levanta `401`. Uma dependência `exigir_<perfil>` por perfil, que levanta `403`.
  Conferência do dono do registro, com `403` para quem não é dono.
- Status `401` para quem não provou quem é, e `403` para quem provou e não pode.
- No React: `URLSearchParams` no corpo do login, `localStorage` para guardar e apagar o token,
  o cabeçalho `Authorization: "Bearer " + token` em todo fetch protegido, e o `App` escolhendo a tela
  pelo `tipo` que volta do `/usuarios/eu`.
- Documentação no `/docs`: `summary=` e `responses={status: {"description": ...}}` no decorador,
  docstring na função da rota, `Field(description=..., examples=[...])` no esquema.

## O que ainda não foi visto, e não deve aparecer

- `finally`, `else` no `try` e `except Exception` genérico. Pegue só a exceção da regra, pelo nome.
- Função de repositório que abre a própria sessão com `Sessao()`. Toda sessão vem do `Depends`.
- `back_populates`, `backref`, `lazy=`, `joinedload`, `selectinload`, `cascade`. O `relationship` simples basta.
- Migration escrita à mão, `op.execute` com SQL, `bulk_insert`, `alembic downgrade` em banco que tem
  dado de verdade. Se o autogenerate não gerar o que você esperava, pare e me avise. Nunca apague tabela.
- SQL escrito à mão no código Python, `mysql.connector` direto, `text()` do SQLAlchemy.
- SQLite ou qualquer banco que não seja o MySQL.
- `orm_mode` e `class Config` do Pydantic 1. Se o esquema de saída precisar ler de objeto, o FastAPI
  já faz isso no `response_model`. `model_config = ConfigDict(from_attributes=True)` pode ficar, se
  você explicar em um comentário o que ele faz.
- `Mapped[...]` e `mapped_column`. Use `Column`, que é o que o curso mostrou. Se você preferir o outro
  estilo, avise antes e explique a diferença.
- `passlib`, `bcrypt` direto, `hashlib`, MD5, SHA-256 ou criptografia reversível para senha. O hash
  é o do `pwdlib`.
- `python-jose`, refresh token, token em cookie, sessão no servidor, OAuth com Google ou outro provedor.
- Escopos do OAuth2 (`scopes`, `Security`), tabela de papéis e permissões, função que devolve função
  para checar perfil. Uma função `exigir_` por perfil basta.
- Biblioteca de rotas ou de autenticação no front. O `App` escolhe a tela com `if`.
- Hierarquia de exceções, exceção com `__init__` próprio ou com atributos. A classe vazia basta.
- `HTTPException` dentro do serviço ou do repositório.
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

## Como manter a .docs/

- No começo de toda conversa, leia a `.docs/` inteira antes de abrir qualquer outro arquivo. Se ela
  não existir, me avise e não invente o que deveria estar lá.
- Trabalhe na tarefa que está no topo do `proximos-passos.md`, ou na que eu pedir. Uma por vez.
- Antes de encerrar uma tarefa, atualize a `.docs/`:
  - `proximos-passos.md`: tire o que foi feito, e deixe o que ficou pela metade com uma linha de onde parou.
  - `decisoes.md`: uma entrada para cada escolha nova, com a decisão, o porquê, o que ficou de fora e
    onde está no código. Só o que eu aprovei.
  - `arquitetura.md`: só se mudou pasta, arquivo ou camada.
- Escreva curto e com certeza. O que você deduziu sem ver no código leva `?` no fim da linha.
- Nunca escreva senha, chave do `.env` ou token na `.docs/` nem no README.

## Como responder

- Uma coisa por vez. Não adiante etapa que eu não pedi.
- Se a tarefa exigir algo da lista de cima, avise antes de escrever código e proponha a versão simples.
- Antes de escrever uma função, diga em qual camada ela entra e por quê.
- No DER e no modelo, me pergunte o tamanho e a restrição de cada coluna antes de decidir por mim.
  Essas escolhas são avaliadas como minhas.
- Antes de escolher o status de uma recusa, me diga as opções e por que uma serve melhor. A escolha é minha.
- Na documentação, marque com `?` tudo que você deduziu sem ver no código, e não liste status que a rota
  não devolve.
- Justifique cada decisão em uma linha. Eu preciso conseguir defender esse código na apresentação.

## Cartilha deste projeto

Os nomes e restrições das colunas já existentes foram preservados, incluindo Enum e criado_em, para evitar
mudanças de tabela. A conexão usa URL_DO_BANCO com mysql+mysqlconnector.
