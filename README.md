# Cesta do Vale · horta comunitária

Projeto da **UC4 · Back-end de Projetos Web** (Senac Blumenau), Cartilha 3.

## O que é

A horta vende cestas semanais, e hoje os pedidos chegam por grupo de mensagens e as cestas são montadas
no chute. O sistema organiza o pedido e a separação, respeitando o limite de itens de cada tamanho.

| Perfil | Quem é | O que faz | Onde usa |
| --- | --- | --- | --- |
| `assinante` | Aline | pede a cesta da semana, vê as cestas dela e o que foi separado | celular |
| `produtor` | Vanderlei | vê todas as cestas com filtro por tamanho e separa os produtos | computador |

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

O `criar_tabelas.py` cria as três tabelas já na versão final, e o `alembic stamp head` avisa o Alembic que
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
3. Testes automatizados: `python testar_backend.py`, dentro de `backend/`. Os testes de banco só rodam
   com `URL_DO_BANCO_TESTE` preenchida, e os outros rodam sem MySQL.

## As rotas

Todas as rotas, menos o cadastro e o login, exigem o cabeçalho `Authorization: Bearer <token>`.
Sem ele, ou com o token inválido ou vencido (60 minutos), a resposta é **401**.

| Método | Caminho | O que faz | Quem pode | Sucesso | Recusas |
| --- | --- | --- | --- | --- | --- |
| POST | `/usuarios` | cadastra um usuário, com a senha em hash | qualquer pessoa | 201 | 409 e-mail já cadastrado · 422 dados inválidos |
| POST | `/login` | troca e-mail e senha por um token JWT | qualquer pessoa | 200 | 401 e-mail ou senha incorretos · 422 formulário incompleto |
| GET | `/usuarios/eu` | mostra quem está logado | logado | 200 | 401 |
| POST | `/cestas` | pede a cesta da semana. O dono vem do token | assinante | 201 | 401 · 403 não é assinante · 422 dados inválidos |
| GET | `/cestas` | lista as cestas, com filtros `tamanho`, `assinante_id` e `pagina` | logado: a assinante vê só as dela, e o produtor vê todas | 200 | 401 · 422 filtro inválido |
| GET | `/cestas/{cesta_id}` | mostra a cesta, com o limite e quanto ainda cabe | produtor, ou a assinante dona | 200 | 401 · 403 cesta de outra pessoa · 404 cesta não existe |
| GET | `/cestas/{cesta_id}/produtos` | lista os produtos separados da cesta | produtor, ou a assinante dona | 200 | 401 · 403 cesta de outra pessoa · 404 cesta não existe |
| POST | `/cestas/{cesta_id}/produtos` | separa um produto na cesta, aplicando a regra | produtor | 201 | 401 · 403 não é produtor · 404 cesta não existe · 409 passa do limite · 422 dados inválidos |

**401 ou 403?** O 401 responde "quem é você?": falta o token, ou ele não vale. O 403 responde "você pode fazer isto?":
o usuário foi identificado, mas o perfil não permite, ou a cesta não é dele.

## A regra

- A cesta nova começa como **pedida**.
- O tamanho define o limite de itens, somando as quantidades: pequena **5**, média **8**, grande **12**.
- O produto que faria a soma passar do limite é recusado com **409**, e a mensagem diz quantos itens ainda cabem.
- O primeiro produto separado muda a situação para **em separação**. A mudança e o produto são gravados no mesmo commit.

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
└── modelos/             os modelos SQLAlchemy das três tabelas
frontend/                o React: login, telas da assinante e do produtor
docs/                    cartilha, briefing, DER, styleguide e marca
.docs/                   o diário do projeto: arquitetura, decisões e próximos passos
```

Para entender as camadas e o porquê de cada escolha, leia a [.docs/](.docs/README.md).
