# Próximos passos

Em ordem. A IA trabalha no item do topo, um por vez.

1. **Testar o fluxo do pedido de ponta a ponta** (back e front prontos, migration aplicada; o build do front compila,
   mas as telas não foram abertas no navegador). Roteiro: assinante pede sem estoque, produtor aprova, cadastra a
   colheita, separa até encher e conclui; outro pedido é reprovado. Depois, rodar os 16 testes de MySQL: a
   `URL_DO_BANCO_TESTE` está vazia no `.env` (precisa de um banco vazio com sufixo `_teste`).
2. **Decidir os acentos no estoque.** Hoje "Maca" soma na linha de "Maçã": a collation padrão do MySQL
   (`utf8mb4_0900_ai_ci`) compara sem acento, inclusive no `UNIQUE(semana, nome_produto)`. A correção é a coluna
   `estoques.nome_produto` com `utf8mb4_0900_as_ci` (respeita acento, ignora maiúscula). O `--autogenerate` não
   detecta mudança de collation e gerou uma migration vazia, então a tentativa foi desfeita.
   Escolher: aceitar e deixar registrado (já está no DER), ou aprovar uma migration com `op.alter_column` escrita
   à mão (hoje vetada pelo REGRAS).
2. **Revisar o conflito do plano de IA com o REGRAS** (ver "Em aberto" no `ia.md`): a sugestão é gravada antes de
   uma pessoa conferir.
3. **Testar o README num clone limpo.** Rode `git clone <link> teste-readme` e siga o `README.md` sem pular passo:
   back, banco do zero, front e login com os dois perfis. Corrija o README onde travar.
4. **Conferir as telas nos dois tamanhos** (exigência da cartilha): no navegador, F12 e modo celular.
   As telas da assinante precisam estar impecáveis no celular, e a separação no computador. Confira também o
   logo com 240 px no cabeçalho em 320 px de largura, o filtro por assinante e a previsão no fechamento.
5. **Reler o `decisoes.md`** e ensaiar o porquê de cada decisão. É o que o professor vai perguntar. (Os `?` já foram confirmados.)
6. **Rodar o prompt de teste de acesso** (`aula-08-ataque`) e executar cada tentativa no `/docs`. Anote o que passar.
7. **Ensaiar as respostas da apresentação:** por que 403 e não 401, por que 409 na regra, e o que alguém consegue fazer com a `CHAVE_DO_TOKEN`.
   Inclua os grupos (assunto novo): por que um dicionário em código e não uma tabela, e o que significa "negar por padrão".
   Inclua a trava da semana: o que acontecia com duas separações ao mesmo tempo, e por que `READ COMMITTED`.
   E o cadastro aberto ao perfil produtor: qualquer pessoa vira produtor e vê as cestas com o nome das assinantes.
8. **Aula 10:** a ideia já foi escolhida e registrada em `.docs/ia.md` (pré-preenchimento das cestas, planejada).
   Parou em: construir o prompt com a IA e testar três casos num chat, registrando em `.docs/ia.md`.
   Depois, atualizar o `docs/BRIEFING.md` e, por último, o `roadmap.md`. Sem código do módulo de IA.

Para começar: decida os acentos no estoque (item 1).
