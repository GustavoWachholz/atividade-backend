# IA · Cesta do Vale

As linhas que terminam em `?` ainda precisam ser confirmadas.

## Pré-preenchimento das cestas da semana · implementada

Combinada em 2026-10-22, implementada em 2026-11-05 e publicada em 2026-11-10, com rascunho e Gemini Flash-Lite.

### Ficha

- **Perfil:** produtor, no computador. A assinante não tem funcionalidade de IA nesta etapa.
- **Dor:** na quinta ele monta as cestas "no chute" e precisa saber o que já foi e quanto cabe, para não
  faltar nem sobrar.
- **Benefício:** com a colheita da semana já no estoque, a IA sugere a distribuição dos produtos entre todas
  as cestas de uma vez. Ele só revisa e confirma.
- **Por que esta opção:** das três discutidas (montar todas as cestas, completar uma cesta, colheita em
  texto livre), é a que mais tira trabalho da rotina, mesmo sendo a mais complexa.
- **Tela:** A separação, com um botão "Pré-preencher com IA" na semana selecionada.

### Fluxo

A IA só atua nas cestas `em_separacao`, isto é, aprovadas e ainda não concluídas. Nada é gravado antes de o
produtor confirmar.

1. O produtor aprova os pedidos e cadastra a colheita da semana em **O estoque**, como já funciona hoje (unidades).
2. Na separação, clica em "Pré-preencher com IA". A tela avisa quantas cestas ainda `pedida` ficam de fora.
3. O back monta a entrada do modelo: o disponível de cada produto do estoque da semana e as cestas `em_separacao`
   da semana que ainda têm espaço, com id, tamanho, o que já foi separado e quanto ainda cabe.
4. O modelo devolve um JSON com os itens de cada cesta (`cesta_id`, `produto_id`, `quantidade`).
5. O serviço confere cada item, somando os itens da própria sugestão: a cesta é da semana e está `em_separacao`,
   cabe no espaço livre (5/8/12), o produto está no estoque da semana e a quantidade não passa do disponível.
6. Se houver item inválido e ainda houver espaço e estoque, o back faz **uma** chamada de correção, com os motivos e
   o disponível que sobrou, pedindo substitutos. O que continuar inválido é descartado, e o espaço fica vazio.
7. O back devolve a sugestão para a tela, **sem gravar nada**.
8. O produtor vê o rascunho, ajusta quantidades, tira ou acrescenta itens e clica em "Confirmar".
9. O back trava a semana, confere tudo de novo e grava os itens num commit só. As cestas continuam `em_separacao`.
10. Com a cesta cheia, o produtor marca `concluida`, como já funciona hoje.

### O que entra e o que sai

- **Entra no modelo:** o id, o nome e o disponível de cada produto do estoque, ids e tamanhos das cestas e os produtos já separados.
- **Não entra:** nome, e-mail ou id da assinante. A IA não precisa saber de quem é a cesta.
- **Sai do modelo:** só a sugestão em JSON. Quem confere e grava é o serviço, nunca o modelo.

### Quem confere

- O serviço confere o formato e as regras do limite e do estoque, na sugestão e de novo na confirmação.
- O produtor confere o conteúdo antes de confirmar. Esse clique é a conferência humana.
- A assinante continua vendo os produtos como hoje, porque só o que foi confirmado vira dado.

### Quando a IA erra ou não responde

- Sem resposta, erro do provedor, chave ausente ou JSON fora do formato: nada muda, a tela mostra
  "Não foi possível gerar a sugestão. Você pode separar manualmente." e o botão pode ser usado de novo.
- Item inválido mesmo depois da correção: é descartado, e o espaço fica vazio.
- Sem cesta aprovada ou sem estoque: o serviço recusa antes de chamar o modelo.
- A separação manual continua funcionando igual. A IA é um atalho, não um caminho obrigatório.

### Se algo mudar antes da confirmação

- Se o estoque ou uma cesta mudar enquanto o rascunho está aberto, a confirmação recusa tudo, com o motivo, e
  nada é gravado. O rascunho continua na tela para o produtor ajustar.
- Recarregar a página perde o rascunho, e o produtor pede a sugestão de novo.

### Processamento

- Uma chamada ao modelo mais no máximo uma chamada de correção. O código controla o processo.
- **Não é agente com ferramentas**: o modelo não consulta nem grava nada sozinho.
- **Não é multiagente**: é uma tarefa só, sobre os mesmos dados. A conferência do serviço faz o papel
  de revisor, de forma mais confiável.
- A sugestão não trava o estoque nem prende a conexão com o banco durante a chamada ao modelo. Só a confirmação trava.
- **Provedor:** Gemini, no nível gratuito, pelo SDK `google-genai`. Foi escolhido por ter uso gratuito sem
  conta de cobrança. Nesse nível o Google usa o conteúdo para melhorar os produtos, por isso nada da assinante é enviado.
- **Modelos:** `MODELOS_DA_IA` lista os modelos em ordem (padrão: `gemini-3.5-flash-lite`, depois `gemini-3.1-flash-lite`).
  Se um estiver sobrecarregado ou demorar mais de 30 s, o seguinte é tentado. A primeira sugestão tem até 60 s, e o
  processo inteiro até 100 s; a correção só acontece se sobrar ao menos 15 s.
- **Por que não o 3.8 Flash:** em 2026-11-10 ele estourou os 50 s em produção e levou 83 s numa semana de 10 cestas,
  mesmo com raciocínio baixo. Os Flash-Lite responderam em 3 a 24 s, mas às vezes devolvem 503 por excesso de demanda.

### Integração

- `POST /cestas/pre-preenchimento`: devolve a sugestão e não grava. Permissão `cestas:pre_preencher`, só no produtor.
- `POST /cestas/pre-preenchimento/confirmar`: confere e grava em lote. Usa a permissão `produtos:separar`.
- `servicos/pre_preenchimento.py`: monta a entrada, chama o modelo, faz a correção e confere os itens.
- `salvar_varios`, em `repositorios/produto_separado.py`, grava num commit só, porque o `salvar` faz um commit por
  item e soltaria a trava da semana.
- Exceções `IaIndisponivel` (503), `NadaParaPreencher` (409) e `ConfirmacaoRecusada` (409), em `servicos/excecoes.py`.
- `RascunhoDaIa`, na tela `Separacao`, em `frontend/src/App.jsx`.
- `CHAVE_DA_IA` no `.env`, com o nome nos `.env.exemplo` e no `docker-compose.yml`, lida pelo `configuracao.py`.
  Falta criá-la no projeto do Vercel. A API sobe mesmo sem ela: só o botão falha.
- `maxDuration` de 120 segundos em `backend/vercel.json`, ainda não testado em deploy. ?

### Em aberto

- O que é uma boa cesta: o pedido usa variedade de produtos e cestas do mesmo tamanho parecidas entre si. Confirmar
  com o produtor depois dos primeiros usos. ?

### Pedido e testes

O pedido ao modelo está em `INSTRUCOES`, no `servicos/pre_preenchimento.py`.

- **Automatizados:** o `testar_backend.py` cobre a conferência, a correção, o descarte, as recusas e as permissões, sempre
  com modelo falso. Em 2026-11-05 os 70 testes passaram com um SQLite temporário, e não no Postgres.
- **No navegador:** a tela foi testada com as rotas reais, SQLite e modelo falso: rascunho, ajustes, confirmação, conflito,
  falha da IA e tela de celular.
- **Contra a API real do Gemini:** só as falhas foram testadas (chave inválida e timeout). **A qualidade da sugestão ainda não
  foi testada**, porque falta a chave.
