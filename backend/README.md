# Backend — Cesta do Vale

Implementação da [aula 06](https://dannbeckersenac.github.io/SlidesPJP/aulas/aula-06.html)
para a cartilha 3, com preparação adicional para autenticação. Python 3.10 ou
superior, SQLAlchemy 2 e MySQL com InnoDB. O [DER](../docs/DER.md) registra as três
entidades. Login ainda não foi implementado.

## Preparação

No MySQL, crie o banco antes de executar o Python:

```sql
CREATE DATABASE IF NOT EXISTS cesta_do_vale CHARACTER SET utf8mb4;
```

No terminal, de dentro de `backend/`:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Preencha `backend/.env`, usando as chaves de `.env.exemplo`:

```dotenv
URL_DO_BANCO=mysql+mysqlconnector://usuario:senha@localhost:3306/cesta_do_vale
ORIGEM_FRONTEND=http://localhost:5173
URL_DO_BANCO_TESTE=
```

O driver é `mysql-connector-python`, como nos slides. A antiga chave `DATABASE_URL`
foi renomeada para `URL_DO_BANCO`; o endereço deve começar com `mysql+mysqlconnector://`.
Use as credenciais da sua máquina; caracteres especiais da senha precisam ser
codificados para uma URL. `.env` e `venv/` ficam fora do Git.

Nesta máquina, `backend/.env` está configurado para `cesta_do_vale` em
`localhost:3306`, com usuário e senha `root`, conforme solicitado.

```powershell
python criar_tabelas.py
python -m alembic stamp head
fastapi dev main.py
```

Esses comandos são para um banco novo e vazio. Para o banco existente, use
`python -m alembic upgrade head`, como descrito abaixo.

O primeiro comando cria apenas tabelas ausentes. Não cria o banco, não insere usuários
nem altera tabelas existentes. O servidor não cria tabelas automaticamente.
Abra `http://127.0.0.1:8000/docs`.

## Estrutura criada pelo ORM

Os modelos em `modelos/` são a definição das tabelas; `criar_tabelas.py` registra
os três modelos e chama `Base.metadata.create_all`. O comando deve listar
`usuarios`, `cestas` e `produtos_separados`, nesta ordem de dependência.

| Tabela | Dados armazenados | Relacionamento |
| --- | --- | --- |
| `usuarios` | ID, nome de até 100 caracteres, tipo assinante/produtor e data de criação | Um assinante pode ter várias cestas |
| `cestas` | ID, assinante, semana, tamanho, situação e data de criação | `assinante_id` referencia `usuarios.id` |
| `produtos_separados` | ID, cesta, nome de até 100 caracteres, quantidade e data de criação | `cesta_id` referencia `cestas.id` |

As colunas originais são obrigatórias; email e senha_hash permitem NULL nesta etapa.
Cada ID é chave primária com incremento automático;
as tabelas usam InnoDB para manter as chaves estrangeiras. O [DER](../docs/DER.md)
detalha os tipos e valores permitidos em cada coluna.

A capacidade de 5, 8 ou 12 itens depende do tamanho. Ocupação e restante são
calculados com a soma das quantidades, evitando armazenar totais que poderiam
ficar desatualizados. A validação de quantidade positiva fica nos esquemas;
o limite e a mudança para `em_separacao` ficam no serviço. O perfil assinante
também é validado pelo serviço: a chave estrangeira garante apenas que o usuário existe.

Para conferir no MySQL após rodar o script:

```sql
USE cesta_do_vale;
SHOW TABLES;
DESCRIBE usuarios;
DESCRIBE cestas;
DESCRIBE produtos_separados;
SHOW CREATE TABLE cestas;
SHOW CREATE TABLE produtos_separados;
```

Os dois últimos comandos mostram as referências entre as tabelas. Reexecutar o
script preserva as tabelas e os dados existentes; diferenças de estrutura exigem
uma alteração posterior, pois `create_all` não atualiza tabelas já criadas.

## Preparação para autenticação (07/10/2026)

A tabela `usuarios` agora possui `email VARCHAR(100)` (único) e
`senha_hash VARCHAR(255)` (reservado para um hash, nunca texto puro).
Ambos permitem NULL para preservar os cadastros existentes. Não foram inventados
endereços ou senhas para os usuários de demonstração.

`POST /usuarios` exige `nome` (2 a 100 caracteres), `email` válido (até 100
caracteres), `senha` (8 a 72 caracteres) e `tipo` (`assinante` ou `produtor`).
O e-mail é normalizado para letras minúsculas. A senha é preservada como digitada
e convertida em hash Argon2 antes de chegar ao repositório. Um e-mail já cadastrado
retorna 409; entradas inválidas retornam 422. A exceção de negócio é `EmailEmUso`,
definida em `servicos/excecoes.py` e traduzida pela rota.

O esquema de saída continua sem senha e sem hash, inclusive na listagem. Os
usuários antigos com credenciais NULL continuam no banco e nas consultas.

Os passos 3, 4 e 5 da aula 08 estão implementados: `security.py` fornece
`gerar_hash` e `verificar_senha`, usando Argon2 por meio de `pwdlib[argon2]`;
o serviço `cadastrar` grava somente o hash; a rota devolve 201 e é conectada
no `main.py` com prefixo `/usuarios`. Ainda não há login, tokens, sessões de
autenticação ou proteção de rotas.
Cadastros com credenciais ausentes deverão ser tratados nesse fluxo futuro.

### Atualizar um banco já existente

O Alembic usa o engine configurado em `.env` e os modelos do projeto. A primeira
revisão parte das três tabelas originais, criadas anteriormente por `criar_tabelas.py`.
Pare a API antes de aplicar a mudança:

```powershell
python -m pip install -r requirements.txt
python -m alembic upgrade head
python -m alembic current
fastapi dev main.py
```

A revisão `20261007_01` adiciona as colunas e a restrição `uq_usuarios_email`,
preservando os dados. Não execute `stamp head` no banco antigo: isso apenas
marcaria a versão, sem adicionar as colunas.

A revisão seguinte, `9b5b85bd0880`, completa o passo 2 da aula 08:
renomeia `senha` para `senha_hash` sem apagar seu conteúdo e ajusta o e-mail
para 100 caracteres. A migração recusa a redução se houver endereços maiores
que esse limite. As duas colunas continuam aceitando NULL.

### Preparar um banco novo e vazio

Após criar o banco no MySQL e configurar `.env`, o script de criação já usa os
modelos atuais. Nesse caso, marque a estrutura como atualizada após criá-la:

```powershell
python criar_tabelas.py
python -m alembic stamp head
fastapi dev main.py
```

`create_all` não altera tabelas existentes. Para essas tabelas, use a migração.
O downgrade desta revisão remove os campos e descarta seu conteúdo; não é parte
da preparação ou da inicialização normal.

## Endpoints

| Método | Caminho | Entrada ou filtros |
| --- | --- | --- |
| POST | `/usuarios` | `nome`, `tipo`, `email`, `senha` |
| GET | `/usuarios` | `tipo` opcional |
| POST | `/cestas` | `assinante_id`, `semana`, `tamanho` |
| GET | `/cestas` | `tamanho`, `assinante_id` opcionais e `pagina` (padrão 1) |
| GET | `/cestas/{cesta_id}` | Detalhe com limite, ocupação e restante |
| POST | `/cestas/{cesta_id}/produtos` | `nome_produto`, `quantidade` |
| GET | `/cestas/{cesta_id}/produtos` | Produtos relacionados à cesta |

Criações retornam 201; consultas, 200; registros ausentes, 404;
recusas de negócio, 409; entradas inválidas, 422. Mensagens de negócio são em português.
Campos extras são recusados, incluindo `situacao` no pedido de cesta.

## Filtro, ordem e página

`GET /cestas?tamanho=media&assinante_id=1&pagina=2` combina os filtros e retorna
até dez cestas. O repositório monta `where`, `order_by`, `limit` e `offset`.
O serviço apenas repassa os parâmetros. Filtrar no banco evita carregar todas as
cestas para depois descartar a maioria no Python; somente a página solicitada chega à API.

A ordem é semana crescente, equivalente ao prazo do exemplo dos slides. O ID resolve
empates para manter as páginas estáveis. A página 2 pula dez registros; uma página
sem registros retorna `[]`. `pagina=0`, negativa ou não inteira retorna 422 pela
validação `Query(default=1, ge=1)`.

## Sessão, regra e rollback

Uma sessão nasce em `obter_sessao`, com `with Sessao() as sessao` e `yield`.
`Depends` entrega essa sessão à rota, que passa ao serviço e ao repositório.
Nenhum repositório abre ou fecha sessão; somente os repositórios chamam seus métodos.

O serviço soma as quantidades de `cesta.produtos_separados`. Se ultrapassar o limite
(5, 8 ou 12), devolve uma mensagem sem gravar. Na primeira separação, muda a situação
do objeto para `em_separacao`, e o repositório adiciona o produto e executa **um commit**.
Esse commit confirma tanto o produto quanto a situação; não há commit intermediário.

Se ocorrer erro depois da mudança e antes do commit, a sessão fecha ao sair da requisição.
Fechar sem commit desfaz a transação: nenhum produto fica salvo e a cesta continua
`pedida`. Não é necessário `try`/`except`. Um erro depois do commit não desfaz uma
gravação já confirmada.

Esta versão segue o fluxo simples da aula, para requisições sequenciais. O bloqueio
`FOR UPDATE` da versão anterior foi removido; duas separações simultâneas podem
validar a mesma capacidade antes de gravar. A transação garante gravação conjunta,
mas não resolve sozinha essa concorrência.

## Conferência no /docs

1. Crie um usuário com `nome: Aline`, `tipo: assinante`, um e-mail ainda não cadastrado e uma senha de 8 a 72 caracteres.
2. Use o ID retornado para criar uma cesta `pequena`, semana `2026-10-05`.
3. Separe um produto com quantidade 2, e outro com quantidade 2.
4. Consulte o detalhe: ocupação 4, restante 1 e situação `em_separacao`.
5. Uma nova separação com quantidade 2 retorna 409 e preserva os dados.
6. Reinicie a API. A cesta e seus produtos continuam nas consultas.
7. Crie mais de dez cestas e consulte `pagina=1` e `pagina=2`: dez na primeira,
   restantes na segunda, em ordem de semana. Confira também `pagina=0`: 422.

Para reproduzir o exercício de rollback, coloque temporariamente
`raise ValueError("teste do rollback")` antes do `return repositorio_produto.salvar`
em `servicos/produto_separado.py`. Use uma cesta nova: a separação retorna 500,
mas o GET continua mostrando `pedida` e produtos `[]`. Remova a linha depois.

## Testes automáticos

```powershell
python testar_backend.py
```

As verificações de consulta MySQL e validação de página não precisam conectar ao banco.
Os testes de persistência, capacidade, relacionamentos e rollback usam **MySQL**;
sem `URL_DO_BANCO_TESTE` configurada, aparecem como ignorados, não como aprovados.

Para esses testes, crie um banco vazio separado:

```sql
CREATE DATABASE cesta_do_vale_teste CHARACTER SET utf8mb4;
```

Defina `URL_DO_BANCO_TESTE=mysql+mysqlconnector://usuario:senha@localhost:3306/cesta_do_vale_teste`
no `.env`. O programa exige o sufixo `_teste`, endereço diferente do banco principal
e ausência de tabelas. Cada cenário cria suas tabelas e remove somente as tabelas
que criou. Nunca use o banco do projeto nesse campo. Falhas de conexão são erros de teste.

As colunas existentes `Enum` e `criado_em` foram preservadas para evitar mudanças
de tabela. `func.current_timestamp()` mantém o padrão de data já definido, sem SQL
escrito à mão. O relacionamento agora é simples, sem `back_populates`.
