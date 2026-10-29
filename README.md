# Cesta do Vale · horta comunitária

Projeto da **UC4 · Back-end de Projetos Web** (Senac Blumenau), Cartilha 3.

## O que é

A horta vende cestas semanais, e hoje os pedidos chegam por grupo de mensagens e as cestas são montadas
no chute. O sistema organiza o pedido e a separação, respeitando o limite de itens de cada tamanho.

| Perfil | Quem é | O que faz | Onde usa |
| --- | --- | --- | --- |
| `assinante` | Aline | pede a cesta da semana, vê o que foi colhido, as cestas dela e o que foi separado | celular |
| `produtor` | Vanderlei | cadastra a colheita da semana, vê todas as cestas com filtro por tamanho e separa os produtos | computador |

## Como rodar o back

Pré-requisitos: Python 3.10 ou mais novo e MySQL rodando na porta 3306.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.exemplo .env
```

Preencha o `.env`:

| Chave | O que vai nela |
| --- | --- |
| `URL_DO_BANCO` | `mysql+mysqlconnector://usuario:senha@localhost:3306/cesta_do_vale` |
| `ORIGEM_FRONTEND` | o endereço exato do front: `http://localhost:5173` |
| `CHAVE_DO_TOKEN` | a chave que assina os tokens. Gere com `python -c "import secrets; print(secrets.token_hex(32))"` |
| `URL_DO_BANCO_TESTE` | opcional: um banco vazio terminado em `_teste`, só para o `testar_backend.py` |

Depois, monte o banco (próxima seção) e suba a API:

```powershell
fastapi dev main.py
```

A API abre em `http://127.0.0.1:8000`, e a documentação com o cadeado de login fica em `http://127.0.0.1:8000/docs`.

## Banco do zero

No MySQL:

```sql
CREATE DATABASE cesta_do_vale;
```

No terminal, dentro de `backend/` e com o `venv` ativo:

```powershell
python criar_tabelas.py
alembic stamp head
```

O `criar_tabelas.py` cria as quatro tabelas já na versão final (as três da cartilha e o `estoques`), e o `alembic stamp head` avisa o Alembic que
o banco está na última migration. Quem já tem o banco de uma versão anterior roda só `alembic upgrade head`.
Para conferir: `alembic current` deve terminar em `(head)`.

## Como rodar o front

```powershell
cd frontend
npm install
npm run dev
```

O front abre em `http://localhost:5173`. O back precisa estar rodando.

## Para testar

Um banco novo não tem usuários. Cadastre um de cada perfil no `/docs`, em `POST /usuarios`, com dados só de teste:

```json
{ "nome": "Aline", "tipo": "assinante", "email": "aline@teste.com", "senha": "teste1234" }
{ "nome": "Vanderlei", "tipo": "produtor", "email": "vanderlei@teste.com", "senha": "teste1234" }
```

A tela de login do front também tem a opção de cadastro. Depois:

1. No `/docs`, clique em **Authorize**: o e-mail em `username` e a senha em `password`.
2. No front, entre com cada perfil. A assinante cai em **Minhas cestas**, e o produtor em **A separação**.
   Antes de pedir uma cesta, entre como produtor e cadastre a colheita da semana em **O estoque**:
   sem estoque, nenhum tamanho fica liberado.
3. Testes automatizados: `python testar_backend.py`, dentro de `backend/`. Os testes de banco só rodam
   com `URL_DO_BANCO_TESTE` preenchida, e os outros rodam sem MySQL.

## As rotas

Todas as rotas, menos o cadastro e o login, exigem o cabeçalho `Authorization: Bearer <token>`.
Sem ele, ou com o token inválido ou vencido (60 minutos), a resposta é **401**.

| Método | Caminho | O que faz | Quem pode | Sucesso | Recusas |
| --- | --- | --- | --- | --- | --- |
| POST | `/usuarios` | cadastra um usuário, com a senha em hash | qualquer pessoa | 201 | 409 e-mail já cadastrado · 422 dados inválidos |
| POST | `/login` | troca e-mail e senha por um token JWT | qualquer pessoa | 200 | 401 e-mail ou senha incorretos · 422 formulário incompleto |
| GET | `/usuarios/eu` | mostra quem está logado | grupos com `conta:ver`: assinante e produtor | 200 | 401 · 403 sem permissão |
| POST | `/cestas` | pede a cesta da semana. O dono vem do token | grupo com `cestas:pedir`: assinante | 201 | 401 · 403 sem permissão · 409 semana que não é a atual · 422 dados inválidos |
| GET | `/cestas` | lista as cestas, 10 por página e da semana mais recente para a mais antiga, com filtros `tamanho`, `assinante_id`, `pagina` e `semana` (qualquer dia; traz a semana de segunda a domingo) | grupos com `cestas:ver`. Sem `cestas:ver_todas`, a assinante vê só as dela | 200 | 401 · 403 sem permissão · 422 filtro inválido |
| GET | `/cestas/{cesta_id}` | mostra a cesta, com o limite e quanto ainda cabe | produtor, ou a assinante dona | 200 | 401 · 403 sem permissão ou cesta de outra pessoa · 404 cesta não existe |
| GET | `/cestas/{cesta_id}/produtos` | lista os produtos separados da cesta | produtor, ou a assinante dona | 200 | 401 · 403 sem permissão ou cesta de outra pessoa · 404 cesta não existe |
| POST | `/cestas/{cesta_id}/produtos` | separa um produto na cesta, aplicando a regra | grupo com `produtos:separar`: produtor | 201 | 401 · 403 sem permissão · 404 cesta não existe · 409 cesta fora de separação, passa do limite, produto fora do estoque ou estoque insuficiente · 422 dados inválidos |
| PATCH | `/cestas/{cesta_id}/aprovar` | aprova o pedido: a cesta pedida passa para `em_separacao` | grupo com `cestas:aprovar`: produtor | 200 | 401 · 403 sem permissão · 404 cesta não existe · 409 a cesta não está pedida |
| PATCH | `/cestas/{cesta_id}/reprovar` | reprova o pedido: a cesta pedida passa para `recusada` | grupo com `cestas:aprovar`: produtor | 200 | 401 · 403 sem permissão · 404 cesta não existe · 409 a cesta não está pedida |
| PATCH | `/cestas/{cesta_id}/concluir` | conclui a cesta em separação, quando está cheia | grupo com `cestas:concluir`: produtor | 200 | 401 · 403 sem permissão · 404 cesta não existe · 409 não está em separação, ou não está cheia |
| POST | `/estoques` | cadastra um produto colhido na semana. Se ele já está na semana, soma a quantidade | grupo com `estoque:cadastrar`: produtor | 201 | 401 · 403 sem permissão · 422 dados inválidos |
| GET | `/estoques?semana=` | mostra o estoque da semana: colhido, separado e disponível de cada produto, e os tamanhos liberados | grupos com `estoque:ver`: assinante e produtor | 200 | 401 · 403 sem permissão · 422 semana ausente ou inválida |

**401 ou 403?** O 401 responde "quem é você?": falta o token, ou ele não vale. O 403 responde "você pode fazer isto?":
o usuário foi identificado, mas o grupo dele não tem a permissão, ou a cesta não é dele.

**Grupos:** cada persona é um grupo (o `tipo` do usuário), com um conjunto de permissões definido em `GRUPOS`, no
`backend/seguranca.py`. A tabela completa está em [.docs/arquitetura.md](.docs/arquitetura.md).

## A regra

- O pedido funciona como num app de entrega: a assinante pede, o produtor **aprova** ou **reprova**, e só a cesta aprovada
  entra em separação. Fluxo: `pedida` → `em_separacao` → `concluida`, ou `pedida` → `recusada`.
- O pedido vale só para a **semana atual**: outra semana, passada ou futura, responde **409**.
- A cesta nova começa como **pedida**, mesmo sem estoque lançado: o pedido não confere o estoque.
- O tamanho define o limite de itens, somando as quantidades: pequena **5**, média **8**, grande **12**.
- O produto que faria a soma passar do limite é recusado com **409**, e a mensagem diz quantos itens ainda cabem.
- Só a cesta **em separação** (aprovada) recebe produtos. Pedida, recusada ou concluída respondem **409**.
- O produtor **conclui** a cesta quando a soma chega ao limite do tamanho. Cesta pela metade responde **409**.
- Duas separações da mesma semana, ao mesmo tempo, entram uma de cada vez: a segunda espera a primeira gravar e só
  então confere o limite e o estoque.

### O estoque (pedido do autor, fora da cartilha)

- O produtor cadastra quantas **unidades** de cada produto colheu na semana (a cartilha deixa de fora o estoque em quilos).
- **No pedido e na aprovação:** o estoque não é conferido. O produtor pode aprovar contando com a colheita que ainda
  vai lançar. O resumo do estoque mostra, só como informação, o total colhido e o reservado pelas cestas em separação.
- **Na separação:** o produto precisa ter sido colhido na semana da cesta, e a quantidade não pode passar do que
  sobrou dele depois das outras cestas. Se passar, a resposta é **409**.
- A assinante vê os produtos colhidos na semana ao pedir, só para consulta: quem escolhe os produtos é o produtor.

## Estrutura

```
backend/
├── main.py              cria o app, o CORS e liga os routers
├── configuracao.py      o único arquivo que lê o .env
├── banco.py             engine, Sessao, Base e obter_sessao
├── seguranca.py         hash da senha (pwdlib) e token (PyJWT)
├── criar_tabelas.py     cria as tabelas num banco vazio
├── migracoes/           as migrations do Alembic
├── rotas/               os endpoints, o /login e as dependências de perfil
├── servicos/            as regras e as exceções de recusa
├── repositorios/        as consultas ao banco
├── esquemas/            os esquemas Pydantic de entrada e de saída
└── modelos/             os modelos SQLAlchemy das quatro tabelas
frontend/                o React: login, telas da assinante e do produtor (separação e estoque)
docs/                    cartilha, briefing, DER, styleguide e marca
.docs/                   o diário do projeto: arquitetura, decisões e próximos passos
```

Para entender as camadas e o porquê de cada escolha, leia a [.docs/](.docs/README.md).
