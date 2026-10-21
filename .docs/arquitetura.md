# Arquitetura

O backend é organizado **por camada** (rotas, serviços, repositórios), e não por assunto. É o padrão do curso,
para estudar a responsabilidade de cada parte separadamente.

## As camadas do backend

| Pasta | O que guarda | Pode importar |
| --- | --- | --- |
| `rotas/` | os endpoints, o status de cada resposta, `cesta_existente` (404 e depois 403) | serviços, esquemas, `banco.obter_sessao` |
| `rotas/autenticacao.py` | `POST /login`, `obter_usuario_atual` (401), `exigir_assinante` e `exigir_produtor` (403) | serviço de usuário, `seguranca` |
| `servicos/` | a regra da cartilha e o que cada perfil vê. Recusa com exceção de `excecoes.py` | repositórios, `seguranca` |
| `repositorios/` | as consultas e gravações. Recebe a sessão como primeiro parâmetro | modelos |
| `esquemas/` | os esquemas Pydantic de entrada e de saída. A saída do usuário não tem senha nem hash | nada |
| `modelos/` | os modelos SQLAlchemy: `Usuario`, `Cesta`, `ProdutoSeparado` | `banco.Base` |
| `seguranca.py` | `gerar_hash`, `verificar_senha`, `criar_token`, `ler_token`. Não importa nada do FastAPI | `configuracao` |
| `configuracao.py` | o único arquivo que lê o `.env` | nada |

## Como uma requisição atravessa as camadas

`POST /cestas/7/produtos`, com o token do produtor:

1. `esquema_oauth` pega o token do cabeçalho, e `obter_usuario_atual` o lê e busca o usuário. Sem usuário, responde 401.
2. `exigir_produtor` confere o perfil. Se não for produtor, responde 403.
3. `cesta_existente` busca a cesta: 404 se ela não existe, e 403 se for de outra assinante (isso só vale para a assinante).
4. O esquema `ProdutoSeparadoCriacao` valida o corpo. Dados inválidos dão 422.
5. `servicos/produto_separado.separar` aplica a regra. Se passar do limite, levanta `LimiteDaCestaExcedido`, e a rota responde 409.
6. `repositorios/produto_separado.salvar` grava o produto e a situação da cesta num commit só. A resposta é 201.

A sessão nasce no `Depends(obter_sessao)` e é a mesma em todas as dependências da requisição.

## As telas do front (`frontend/src/App.jsx`)

| Tela | Perfil | Componente |
| --- | --- | --- |
| Login e cadastro | ninguém logado | `Login` |
| Início e Pedir a cesta (janela de confirmação) | assinante | `Inicio` e a `Janela` do pedido |
| Minhas cestas, com os produtos separados | assinante | `MinhasCestas` |
| A separação, com filtro por tamanho | produtor | `Separacao` |
| O fechamento (formulário que separa um produto) | produtor | `FormularioDeProduto`, numa `Janela` |

O `App` guarda o `token` no `localStorage`, chama `/usuarios/eu` e escolhe a tela com `if` pelo `tipo`.
Todo fetch protegido manda `Authorization: Bearer <token>`. Um 401 apaga o token e volta para o login.
