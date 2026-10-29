# Arquitetura

O backend é organizado **por camada** (rotas, serviços, repositórios), e não por assunto. É o padrão do curso,
para estudar a responsabilidade de cada parte separadamente.

## As camadas do backend

| Pasta | O que guarda | Pode importar |
| --- | --- | --- |
| `rotas/` | os endpoints, o status de cada resposta, `cesta_existente` (404 e depois 403) | serviços, esquemas, `banco.obter_sessao` |
| `rotas/autenticacao.py` | `POST /login`, `obter_usuario_atual` (401) e uma `exigir_<permissão>` por permissão de grupo (403) | serviço de usuário, `seguranca` |
| `servicos/` | a regra da cartilha e o que cada grupo vê. Recusa com exceção de `excecoes.py` | repositórios, `seguranca` e o esquema de saída (`CestaResposta`, no `detalhar`) |
| `repositorios/` | as consultas e gravações. Recebe a sessão como primeiro parâmetro | modelos |
| `esquemas/` | os esquemas Pydantic de entrada e de saída. A saída do usuário não tem senha nem hash | nada |
| `modelos/` | os modelos SQLAlchemy: `Usuario`, `Cesta`, `ProdutoSeparado` e `Estoque` (a quarta tabela, fora da cartilha) | `banco.Base` |
| `seguranca.py` | `gerar_hash`, `verificar_senha`, `criar_token`, `ler_token`, e a tabela `GRUPOS` com `tem_permissao`. Não importa nada do FastAPI | `configuracao` |
| `configuracao.py` | o único arquivo que lê o `.env` | nada |

## Como uma requisição atravessa as camadas

`POST /cestas/7/produtos`, com o token do produtor:

1. `esquema_oauth` pega o token do cabeçalho, e `obter_usuario_atual` o lê e busca o usuário. Sem usuário, responde 401.
2. `exigir_separar_produto` confere em `GRUPOS` se o grupo tem `produtos:separar`. Se não tiver, responde 403.
3. `cesta_existente` (que exige `cestas:ver`) busca a cesta: 404 se ela não existe, e 403 se for de outra pessoa e o grupo não tiver `cestas:ver_todas`.
4. O esquema `ProdutoSeparadoCriacao` valida o corpo. Dados inválidos dão 422.
5. `servicos/produto_separado.separar` recusa a cesta que não está `em_separacao` (`CestaNaoEmSeparacao`), trava a semana (`repositorios/estoque.travar_semana`, um `SELECT ... FOR UPDATE`) e aplica a regra. Se passar do limite, levanta `LimiteDaCestaExcedido`, e a rota responde 409.
6. `repositorios/produto_separado.salvar` grava o produto. A resposta é 201.

A sessão nasce no `Depends(obter_sessao)` e é a mesma em todas as dependências da requisição.
O `engine` usa `READ COMMITTED`: depois de esperar a trava, a requisição enxerga o que a anterior gravou.
A trava é solta no commit, ou quando a sessão fecha sem commit (recusa).

## Grupos e permissões (assunto novo, `# [NOVO · grupos]`)

| Permissão | Rotas | assinante | produtor |
| --- | --- | --- | --- |
| `conta:ver` | `GET /usuarios/eu` | sim | sim |
| `cestas:pedir` | `POST /cestas` | sim | não |
| `cestas:ver` | `GET /cestas`, `GET /cestas/{id}`, `GET /cestas/{id}/produtos` | sim | sim |
| `cestas:ver_todas` | vê as cestas de qualquer assinante | não | sim |
| `cestas:aprovar` | `PATCH /cestas/{id}/aprovar` e `/reprovar` | não | sim |
| `cestas:concluir` | `PATCH /cestas/{id}/concluir` | não | sim |
| `produtos:separar` | `POST /cestas/{id}/produtos` | não | sim |
| `estoque:cadastrar` | `POST /estoques` | não | sim |
| `estoque:ver` | `GET /estoques` | sim | sim |

O grupo é o valor de `usuarios.tipo`. As permissões ficam em `GRUPOS`, no `seguranca.py`.

## O estoque da semana

| Camada | Arquivo | O que faz |
| --- | --- | --- |
| rota | `rotas/estoques.py` | `POST /estoques` (cadastra ou soma) e `GET /estoques?semana=` (o resumo) |
| serviço | `servicos/estoque.py` | `cadastrar`, `resumo_da_semana` e `disponivel_do_produto` |
| serviço | `servicos/cesta.py` | `itens_livres_na_semana` (soma só as cestas `em_separacao`, para o resumo) e as decisões do pedido: `aprovar`, `reprovar` e `concluir`. Ficam aqui por usar os `LIMITES`, e o serviço do estoque importa daqui, sem import circular |
| serviço | `servicos/produto_separado.py` | `separar` confere o limite da cesta e depois o estoque do produto |
| repositório | `repositorios/estoque.py`, e `listar_da_semana` em `cesta.py` e `produto_separado.py` | as consultas por semana, e o `travar_semana`, chamado no começo da separação |
| exceções | `servicos/excecoes.py` | `EstoqueInsuficiente` (separação) e as do fluxo do pedido: `CestaNaoPedida`, `CestaNaoEmSeparacao` e `CestaIncompleta`. Todas viram 409 na rota |

## As telas do front (`frontend/src/App.jsx`)

| Tela | Perfil | Componente |
| --- | --- | --- |
| Login e cadastro | ninguém logado | `Login` |
| Início e Pedir a cesta (janela de confirmação) | assinante | `Inicio` e a `Janela` do pedido |
| Minhas cestas, com os produtos separados | assinante | `MinhasCestas` |
| A separação, com seletor de semana, filtro por tamanho e por assinante (pelo nome na cesta) | produtor | `Separacao`, com o `SeletorDeSemana` |
| O fechamento (formulário que separa um produto, escolhido do estoque da semana da cesta, com a previsão da capacidade) | produtor | `FormularioDeProduto`, numa `Janela` |
| O estoque (cadastro da colheita, semana a semana) | produtor | `Estoque`, com o `SeletorDeSemana` |

A janela do pedido busca `GET /estoques` da semana atual só para listar os produtos colhidos; nenhum tamanho é bloqueado.
A `Separacao` mostra, por situação: `pedida` com Aprovar e Reprovar; `em_separacao` com Separar produto e Concluir cesta (ligado só com a cesta cheia); `concluida` e `recusada` sem ação.
`MinhasCestas` mostra a situação em `SituacaoDaCesta` e só lista os produtos de cesta `em_separacao` ou `concluida`. O PATCH fica em `decidirCesta`.
O `FormularioDeProduto` e a tela `Estoque` usam o mesmo `buscarEstoque`.
`MinhasCestas` e `Separacao` buscam os produtos das cestas da página ao mesmo tempo, com `buscarProdutosDasCestas` (`Promise.all`).

O `App` guarda o `token` no `localStorage`, chama `/usuarios/eu` e escolhe a tela com `if` pelo `tipo`.
Todo fetch protegido manda `Authorization: Bearer <token>`. Um 401 apaga o token e volta para o login.
