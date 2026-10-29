# IA · Cesta do Vale

As linhas que terminam em `?` ainda precisam ser confirmadas.

## Pré-preenchimento das cestas da semana · planejada

Combinada na aula 10 (2026-10-22). Nenhum código foi escrito: SDK, rota, serviço e chave ficam para o roadmap.

### Ficha

- **Perfil:** Vanderlei, produtor, no computador. A assinante não tem funcionalidade de IA nesta etapa.
- **Dor:** na quinta ele monta as cestas "no chute" e precisa saber o que já foi e quanto cabe, para não
  faltar nem sobrar (CARTILHA, "O negócio" e "Perfil B").
- **Benefício:** com a colheita da semana já no estoque, a IA distribui os produtos entre todas as cestas
  de uma vez. Ele só revisa e conclui.
- **Por que esta opção:** das três discutidas (montar todas as cestas, completar uma cesta, colheita em
  texto livre), é a que mais tira trabalho da rotina, mesmo sendo a mais complexa.
- **Tela:** A separação, com um botão "Pré-preencher com IA" na semana selecionada. ?

### Fluxo

O pedido agora passa pela aprovação do produtor (ver `decisoes.md`): a IA só atua nas cestas `em_separacao`,
isto é, aprovadas e ainda não concluídas. A situação `concluida` já existe e é a conferência humana.

1. O produtor cadastra a colheita da semana em **O estoque**, como já funciona hoje (unidades).
2. Na separação, clica em "Pré-preencher com IA".
3. O back monta a entrada do modelo: o disponível de cada produto do estoque da semana e as cestas
   `pedida`/`em_separacao` da semana, com id, tamanho, o que já foi separado e quanto ainda cabe.
4. O modelo devolve um JSON com os itens de cada cesta (`cesta_id`, `produto`, `quantidade`).
5. O serviço confere cada item: cabe no espaço livre (5/8/12), não passa do disponível no estoque,
   o produto está no estoque da semana e a cesta é da semana.
6. Se houver item inválido, o back faz **uma** chamada de correção, com os motivos e o disponível que
   sobrou, pedindo substitutos. O que continuar inválido é descartado, e o espaço fica vazio para o
   produtor preencher à mão.
7. O back grava os itens válidos, e a cesta vai para `em_separacao`.
8. O produtor revisa, ajusta o que precisar pela separação de sempre e marca a cesta como `concluida`.

### O que entra e o que sai

- **Entra no modelo:** nomes e quantidades do estoque, ids e tamanhos das cestas e os produtos já separados.
- **Não entra:** nome, e-mail ou id da assinante. A IA não precisa saber de quem é a cesta.
- **Sai do modelo:** só a sugestão em JSON. Quem confere e grava é o serviço, nunca o modelo.

### Quem confere

- O serviço confere o formato e as duas recusas que já existem: `LimiteDaCestaExcedido` e `EstoqueInsuficiente`.
- O produtor confere o conteúdo antes de marcar `concluida`.
- **A assinante só vê os produtos da cesta depois de `concluida`.** Antes disso ela vê a cesta e a
  situação, mas não a lista. Assim, nada do que a IA sugeriu chega a ela sem revisão.

### Quando a IA erra ou não responde

- Sem resposta, erro do provedor ou JSON fora do formato: nada é gravado, a tela mostra
  "Não foi possível gerar a sugestão. Você pode separar manualmente." e o botão pode ser usado de novo. ?
- Item inválido mesmo depois da correção: é descartado, e o espaço fica vazio.
- A separação manual continua funcionando igual. A IA é um atalho, não um caminho obrigatório.

### Processamento

- Uma chamada ao modelo mais no máximo uma chamada de correção. O código controla o processo.
- **Não é agente com ferramentas**: o modelo não consulta nem grava nada sozinho.
- **Não é multiagente**: é uma tarefa só, sobre os mesmos dados. A conferência do serviço faz o papel
  de revisor, de forma mais confiável.
- **Provedor:** a definir entre Claude, Gemini e OpenAI. Os três têm saída em JSON estruturado. Preço e
  uso gratuito devem ser conferidos na página oficial antes da escolha. ?

### O que muda além da cartilha (escolhas do autor)

| Mudança | Por quê | O que defender |
| --- | --- | --- |
| A IA usa o estoque da semana | já existe, e é o que o produtor colheu | o estoque já é uma tabela fora da cartilha (ver `decisoes.md`) |
| Situação `concluida` | marca que o produtor revisou a cesta | muda o `ENUM` `situacao_cesta` por migration |
| A sugestão é gravada direto | um clique a menos para o produtor | a regra do curso pede conferência antes de virar dado. A conferência é o `concluida`, e a assinante não vê os produtos antes dele |
| A assinante só vê os produtos depois de `concluida` | não mostrar sugestão não revisada | muda o que a cartilha descreve no Perfil A, item 3 |

### Integração prevista com o back

- Migration acrescentando `concluida` ao `ENUM` `situacao_cesta`.
- Rota do pré-preenchimento e rota de concluir a cesta, com permissões novas nos `GRUPOS`
  (ex.: `cestas:pre_preencher` e `cestas:concluir`, só no produtor). ?
- Serviço do pré-preenchimento: monta a entrada, chama o modelo, confere, faz a correção e grava num commit só. ?
- A listagem de produtos separados deixa de mostrar a lista para a assinante enquanto a cesta não for `concluida`.
- A chave da API no `.env`, com o nome no `.env.exemplo`, lida pelo `configuracao.py`.

### Em aberto

- **Conflito com o REGRAS:** "A IA nunca […] faz conta ou data que vira dado sem uma pessoa conferir". Neste plano,
  a sugestão é gravada em `produtos_separados` antes da conferência, e o `concluida` vem depois. Proposta, ainda não
  decidida: a sugestão volta só para a tela da separação como rascunho, o produtor ajusta e confirma, e só então o
  serviço confere e grava (num commit só). Assim o `concluida` e a regra de esconder os produtos da assinante deixam
  de ser necessários, e o Perfil A da cartilha não muda. ?

- Resolvido no fluxo do pedido: a cesta `concluida` não aceita produtos (409), só se conclui uma cesta
  `em_separacao` e cheia, e uma cesta `pedida` ou `recusada` não recebe produtos. O pré-preenchimento deve
  ignorar tudo que não é `em_separacao`. ?
- O que acontece se o estoque mudar depois do pré-preenchimento? ?
- O status das recusas novas (concluir uma cesta inválida, por exemplo) é escolhido na implementação.

### Pedido testado e testes

Ainda não feito. É a próxima etapa da aula 10 (prompt de construção e três casos de teste).
