# Briefing inicial — Cesta do Vale

> Rascunho para revisão do aluno. Os requisitos abaixo vêm de `CARTILHA_3.md`; as decisões pessoais registradas foram informadas pelo aluno.

## Identificação do projeto

- **Cartilha e nome da solução:** 3 — Cesta do Vale, horta comunitária.
- **Negócio:** horta comunitária que vende cestas semanais.
- **Pessoas atendidas:** Aline, assinante que usa principalmente o celular, e Vanderlei, produtor que usa principalmente o computador.
- **Regra central:** cada tamanho de cesta comporta uma quantidade máxima de itens; o produtor não pode separar além desse limite.

## Problema

Hoje os pedidos chegam por um grupo de mensagens. Assim, Aline não tem uma forma simples de acompanhar o pedido e saber o que foi separado, enquanto Vanderlei monta as cestas sem uma visão clara do conteúdo e da capacidade restante de cada uma.

## Objetivo da solução

Criar uma aplicação para pedir e acompanhar cestas semanais e apoiar o produtor na separação dos produtos, respeitando o limite de cada tamanho de cesta.

As experiências da assinante e do produtor têm a mesma prioridade: ambas precisam funcionar de maneira equivalente.

## Públicos e necessidades

- **Aline — assinante:** tem pouco tempo e quer pedir a cesta da semana em cerca de dois minutos, inclusive durante um trajeto de ônibus. Precisa escolher o tamanho, ver suas cestas e situações e consultar os produtos separados para planejar as refeições.
- **Vanderlei — produtor:** separa as cestas na quinta-feira. Precisa filtrar as cestas por tamanho, abrir cada uma, registrar os produtos e suas quantidades e conferir quantos itens ainda cabem.

## Funcionalidades iniciais

1. Pedir uma cesta semanal de tamanho pequeno, médio ou grande.
2. Listar cestas, com filtros por tamanho e por assinante.
3. Consultar uma cesta e sua situação.
4. Listar os produtos separados de uma cesta.
5. Separar um produto com sua quantidade, respeitando a capacidade da cesta.

## Quatro telas previstas

1. **Pedir a cesta:** formulário de escolha do tamanho, com atenção especial ao uso no celular.
2. **Minhas cestas:** lista das cestas da assinante, situações e produtos separados, com atenção especial ao uso no celular.
3. **A separação:** visão de todas as cestas com filtro por tamanho, com atenção especial ao uso no computador.
4. **O fechamento:** formulário para separar um produto em uma cesta, com atenção especial ao uso no computador.

As quatro telas devem funcionar tanto no celular quanto no computador.

## Dados principais

- **Usuário:** pessoa que usa o sistema, do tipo assinante ou produtor.
- **Cesta:** pertence a um assinante e registra a semana, o tamanho e a situação.
- **Produto separado:** pertence a uma cesta e registra o nome do produto e a quantidade.

## Regras do funcionamento

- A cesta começa na situação **pedida**.
- A capacidade considera a soma das quantidades dos produtos separados: **5 itens** na pequena, **8** na média e **12** na grande.
- Um produto que ultrapassaria a capacidade é recusado.
- Ao separar o primeiro produto, a situação muda para **em separação**.
- Nesta etapa, o perfil é escolhido em uma lista, sem senha. A tela da assinante informa quem ela é ao solicitar os próprios dados.

## Apresentação da capacidade

Na área do produtor, a capacidade de cada cesta será mostrada por uma **barra de progresso acompanhada de texto** com os números exatos. Exemplo para uma cesta pequena com quatro itens separados: **4 de 5 itens separados · cabe mais 1**. A barra representa a quantidade separada em relação ao limite da cesta; o texto permite conferir o espaço restante sem depender apenas da cor ou do preenchimento.

## Limites desta etapa

Não fazem parte da solução inicial: pagamento, rota de entrega, estoque em quilos, troca de produto e avisos por mensagem. Os dados ficam em memória nesta fase do curso.

## Evolução prevista pela cartilha

- **Ciclo 2:** dados passam da memória para MySQL.
- **Ciclo 4:** usuários recebem senha e o backend passa a conferir quem consulta as cestas.
- **Ciclo 5:** inclusão de um trecho de inteligência artificial.

## Decisões do aluno para revisar

- **Prioridade da experiência:** equilíbrio entre os dois perfis, sem privilegiar um deles.
- **Diferencial da solução em relação à do colega:** avaliar quando as duas soluções estiverem prontas; ainda não há informações para definir a comparação.
- **Nome da solução:** manter Cesta do Vale.
- **Identidade visual:** definir posteriormente.
- **Apresentação da capacidade restante:** barra de progresso acompanhada do total separado, do limite e da quantidade que ainda cabe.
- **Escolhas de caminhos, métodos e respostas da API:** [definir ao implementar o backend e justificar segundo o REST visto em aula].

**Fonte:** `docs/CARTILHA_3.md`, preservada sem alterações.
