# Cartilha 3 · Cesta do Vale, horta comunitária

**Esta cartilha foi sorteada para dois alunos.** Vocês receberam o mesmo problema e vão entregar
soluções diferentes. Não combinem marca, paleta, telas nem nomes de rota. Na apresentação, cada
um explica as escolhas que fez e por que não fez as do colega.

## O negócio

Uma horta comunitária que vende cestas semanais. O assinante escolhe o tamanho, e o produtor
monta a cesta com o que colheu naquela semana. Hoje os pedidos chegam num grupo de mensagens, e o
produtor monta as cestas no chute.

## Perfil A · Aline, a assinante. Usa no celular.

Aline tem 37 anos, dois filhos e pouco tempo. Quer pedir a cesta da semana em dois minutos, no
ônibus, e saber o que vai chegar antes de planejar o jantar.

O que ela faz:

1. Pede a cesta da semana, escolhendo o tamanho: pequena, média ou grande.
2. Vê as cestas dela e a situação de cada uma.
3. Abre uma cesta e vê os produtos que o produtor separou.

## Perfil B · Vanderlei, o produtor. Usa no computador.

Vanderlei planta e colhe. Na quinta ele separa as cestas da semana e precisa saber, cesta por
cesta, o que já foi e quanto ainda cabe, para não faltar nem sobrar na entrega.

O que ele faz:

1. Vê as cestas, filtradas por tamanho.
2. Abre uma cesta e separa um produto, com a quantidade.
3. Confere quantos itens ainda cabem na cesta.

## As três entidades

- **O usuário.** Quem entra no sistema. Tem um tipo: assinante ou produtor.
- **A cesta.** Pertence a um assinante. Guarda a semana, o tamanho e a situação.
- **O produto separado.** Pertence a uma cesta. Guarda o nome do produto e a quantidade.

## As quatro telas

Da pessoa, pensadas para o celular:

1. **Pedir a cesta.** O formulário em que a Aline escolhe o tamanho da semana.
2. **Minhas cestas.** As cestas dela, com a situação, e o que foi separado em cada uma.

Da gestão, pensadas para o computador:

3. **A separação.** Todas as cestas, com o filtro por tamanho.
4. **O fechamento.** O formulário que separa um produto numa cesta.

Todas as telas funcionam nos dois tamanhos. O aparelho de cada perfil diz onde a tela precisa
estar impecável.

## O que o back precisa oferecer

1. Listar as cestas, com filtro por tamanho e por assinante.
2. Mostrar uma cesta.
3. Pedir uma cesta nova.
4. Listar os produtos separados de uma cesta.
5. Separar um produto numa cesta, aplicando a regra abaixo.

Os caminhos, os métodos, os nomes e os status são decisão sua. A régua é o REST da aula 2, e na
apresentação você defende cada escolha.

## A regra que o serviço cuida

A cesta nova começa como **pedida**. O tamanho define o limite de itens, contando a quantidade:
pequena 5, média 8, grande 12. O serviço recusa o produto que passaria do limite. O primeiro produto
separado muda a situação para **em separação**.

## Antes do login

Enquanto o login não chega, o front deixa escolher o perfil numa lista, sem senha. A tela da
pessoa pede ao back só o que é dela, informando quem ela é na própria requisição.

## O que não faz parte

Pagamento, entrega com rota, estoque em quilos, troca de produto e aviso por mensagem.

## O que vem depois

No ciclo 2 esses dados saem da memória e vão para o MySQL. No ciclo 4 o usuário ganha senha, e
Aline passa a ver só as cestas dela, porque o back confere quem está pedindo. No ciclo 5
entra um trecho de IA. A cartilha foi desenhada para aguentar as três coisas: não troque de ideia
no meio do caminho.
