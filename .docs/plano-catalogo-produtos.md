# Plano · Catálogo de produtos

## Objetivo
Trocar o nome digitado a cada semana por uma lista de produtos cadastrada uma vez pelo produtor e usada em todas as
semanas. O estoque, a separação e a IA passam a apontar para o produto pelo `id`. Isso prepara a próxima etapa: a
assinante marcar quais produtos quer ou não receber na cesta.

## Decisões fechadas
- **Banco do zero.** Os dados atuais não são migrados: as tabelas são apagadas e recriadas no Supabase, e os usuários
  se cadastram de novo. A migration nova não tem passo de cópia de dados.
- **Campos do catálogo:** só `nome` e `ativo`. Categoria e unidade ficam para depois; tudo continua contado em unidades.
- **Sem exclusão.** O produto é desativado: some das listas novas e continua no histórico das cestas.
- **Um catálogo só da horta**, sem `produtor_id`, como o estoque.
- **O nome é único sem diferenciar maiúscula** (índice em `lower(nome)`). Resolve o item 5 dos próximos passos.

## Etapa 1 · Banco
- `modelos/produto.py`: tabela `produtos` (`id`, `nome VARCHAR(100)`, `ativo BOOLEAN` padrão true, `criado_em`),
  com índice único em `lower(nome)`.
- `modelos/estoque.py`: `produto_id` (FK `produtos.id`, NOT NULL) no lugar de `nome_produto`;
  `UNIQUE(semana, produto_id)`; `relationship` para ler o nome.
- `modelos/produto_separado.py`: `produto_id` (FK, NOT NULL) no lugar de `nome_produto`; `relationship` para o nome.
- `criar_tabelas.py` importa o modelo novo.
- Migration `0002_catalogo_de_produtos` (sem cópia de dados: só vale para tabelas vazias).
- Recriar o banco: apagar as tabelas no Supabase, `python criar_tabelas.py` e `alembic stamp head`
  (passo destrutivo, feito só com a confirmação do autor).

## Etapa 2 · Back do catálogo
- `esquemas/produto.py`: `ProdutoCriacao` (nome), `ProdutoEdicao` (nome e/ou ativo), `ProdutoResposta`.
- `repositorios/produto.py` e `servicos/produto.py`: listar (filtro `ativos`), cadastrar, editar.
  Nome repetido (sem diferenciar maiúscula) → exceção `ProdutoRepetido` → 409.
- `rotas/produtos.py`: `GET /produtos`, `POST /produtos`, `PATCH /produtos/{id}`.
- `seguranca.py`: `catalogo:ver` (os dois grupos) e `catalogo:editar` (produtor), com as `exigir_` em
  `rotas/autenticacao.py`.

## Etapa 3 · Estoque, separação e IA pelo `produto_id`
- `POST /estoques` recebe `produto_id`; produto inexistente ou desativado → 409.
  A resposta traz `produto_id` e `nome_produto` (lido do catálogo).
- `GET /estoques`: cada item ganha `produto_id`; a soma do separado passa a ser por id.
- `POST /cestas/{id}/produtos` recebe `produto_id`; `disponivel_do_produto` busca por id.
  A resposta dos produtos separados mantém `nome_produto` para a tela.
- IA: o modelo recebe `{id, nome}` de cada produto e devolve `produto_id`. A conferência, a correção e a
  confirmação (`ItemConfirmado`) usam o id.

## Etapa 4 · Front
- Tela "Produtos" do produtor: listar, cadastrar, renomear, desativar e reativar. Link no cabeçalho e no rodapé.
- Tela Estoque: `<select>` com os produtos ativos no lugar do campo de texto, com atalho para a tela Produtos
  quando a lista estiver vazia.
- Separação (`FormularioDeProduto`) e rascunho da IA: o valor do `<select>` passa a ser o `produto_id`.

## Etapa 5 · Testes e documentação
- `testar_backend.py`: o ajudante `cadastrar_estoque` cria o produto antes; testes novos do catálogo
  (nome repetido, desativado fora do estoque, permissões).
- Atualizar `docs/DER.md`, `.docs/decisoes.md`, `.docs/roadmap.md`, `.docs/proximos-passos.md` (item 5 resolvido)
  e o `README.md`.

## Situação (2026-11-10)
Etapas 1 a 5 feitas. O back passou nos testes com SQLite, e o front foi testado no navegador com a API num SQLite
local. Falta recriar o banco do Supabase e rodar os testes no Postgres.
Mudança em relação ao plano: a separação **não** recusa o produto desativado que ainda tem estoque na semana; só o
cadastro de colheita nova recusa (ver `decisoes.md`, "Desativar em vez de excluir").

## Fora deste plano
A tabela de preferências da assinante (`assinante_id`, `produto_id`, `recebe`), a tela dela e o uso das preferências
na separação e na IA.
