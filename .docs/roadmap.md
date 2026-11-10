# Roadmap · Cesta do Vale

## Agora

- Cadastro com senha em hash Argon2, login com JWT de 60 minutos e `GET /usuarios/eu`.
- Dois perfis com permissões: a assinante pede e vê só as cestas dela, e o produtor vê todas e separa os produtos.
- A regra da cartilha: limite de 5, 8 ou 12 itens, recusa com 409, e o produtor aprova o pedido (`em_separacao`), separa e conclui (`concluida`), ou reprova (`recusada`).
- O estoque da semana: o produtor cadastra a colheita, o pedido não depende do estoque, e a separação recusa o produto que falta (409).
- MySQL com Alembic, e banco do zero com `criar_tabelas.py` e `alembic stamp head`.
- Front em React com login, a tela de cada perfil e o token em todo fetch.
- README de entrega e esta `.docs/`.
- Pré-preenchimento das cestas com IA, em rascunho (falta testar com a chave real).
- Catálogo de produtos: o produtor cadastra cada produto uma vez, e o estoque, a separação e a IA usam o id.

## Depois

- A assinante marcar no catálogo os produtos que quer ou não receber, e a separação e a IA respeitarem isso.
- Remover ou editar um produto já separado.
- Guardar o rascunho para ele sobreviver a uma recarga da página.
- Registrar quantas sugestões foram aceitas ou alteradas.
