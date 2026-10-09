# Cesta do Vale — Styleguide

**Versão:** 1.0 · **Status:** identidade visual inicial aprovada para orientar o projeto  
**Referências:** `BRIEFING.md` e a última versão da logomarca aprovada (`logo_cesta_do_vale_em_estilo_cartum.png`).

> **Nota de implementação:** os códigos de cores e as famílias tipográficas abaixo são uma proposta de padronização a partir da arte aprovada, não uma extração vetorial exata de suas cores ou a identificação da fonte usada na imagem gerada. A logomarca PNG é a referência visual definitiva até existir um arquivo vetorial validado.

## 1. Essência da marca

**Nome:** Cesta do Vale  
**Atividade:** horta comunitária com pedidos de cestas semanais.  
**Personalidade:** próxima, acolhedora, alegre, orgânica e descomplicada.  
**Ideia visual:** alimentos frescos, comunidade e cuidado, com ilustração leve de aparência cartoon.

A identidade deve funcionar com a mesma qualidade nas duas experiências previstas no briefing: **assinante**, que usa principalmente o celular e precisa pedir a cesta rapidamente, e **produtor**, que usa principalmente o computador e precisa separar produtos com clareza. O tom divertido da marca **não** deve prejudicar a leitura de dados, campos ou controles.

## 2. Logomarca oficial

**Arquivo de referência:** `logo_cesta_do_vale_em_estilo_cartum.png`.

A marca é um lettering horizontal, com letras grossas, arredondadas, expressivas e aspecto cartoon:

- **“Cesta”** em marrom terroso;
- **“do”** em branco;
- **“Vale”** em verde mais escuro;
- **contorno preto espesso** em todas as letras;
- pequeno **galho marrom** atrás do início de “Vale”, com **duas folhas verdes aumentadas**, abertas lateralmente, sugerindo a parte superior de um coração **sem fechar o desenho**;
- brilhos discretos nas letras e folhas para reforçar o aspecto cartoon.

O galho representa **um broto com duas folhas**, não uma árvore, bananeira ou coqueiro. Preserve essa silhueta ao redesenhar ou vetorizar.

### Usos permitidos

1. **Principal:** arte integral sobre fundo branco ou creme claro, com respiro amplo.
2. **Em superfícies coloridas:** usar somente após verificar que o contorno, as folhas e o “do” permanecem visualmente distintos; se necessário, aplicar uma *placa clara* atrás da marca inteira.
3. **Em espaços reduzidos:** preferir a marca completa apenas quando o nome continuar legível. Para favicon e ícones muito pequenos, desenhar e aprovar futuramente uma versão simplificada do broto; **não** cortar o broto da imagem atual sem revisão.

### Restrições

- Não modificar as cores das três palavras, alterar o texto ou remover o contorno.
- Não trocar as duas folhas por uma copa de árvore nem fechar o broto em um coração literal.
- Não esticar, girar ou adicionar sombras intensas à arte.
- Não colocar a marca diretamente sobre fotos movimentadas.
- Não recriar a marca com uma fonte comum: usar a arte aprovada até existir uma versão vetorial.

**Área de proteção sugerida:** deixar espaço livre equivalente à altura da letra minúscula “o” em volta de toda a arte, incluindo as folhas.  
**Largura mínima inicial recomendada:** 240 px em interfaces digitais. Abaixo disso, validar manualmente a leitura antes de usar.

## 3. Paleta de cores

Os tons da interface abaixo são **tokens de projeto propostos** para acompanhar a logomarca, sem pretender reproduzir exatamente cada pixel da arte.

| Token | Cor | Hex | Aplicação |
|---|---|---|---|
| `brand.brown` | Marrom Cesta | `#91430F` | Elementos de apoio e títulos decorativos |
| `brand.green` | Verde Vale | `#287A0B` | Identidade, ícones decorativos e destaques |
| `brand.leaf` | Verde Folha | `#3E970F` | Folhagens e detalhes ilustrativos |
| `brand.ink` | Preto contorno | `#0B0B0B` | Contorno da logomarca; detalhes gráficos |
| `surface.base` | Branco | `#FFFFFF` | Cards, formulários e área interna |
| `surface.warm` | Creme claro | `#FFF8ED` | Fundo geral e seções acolhedoras |
| `surface.softGreen` | Verde suave | `#EDF5E6` | Destaques e superfícies secundárias |
| `text.primary` | Grafite | `#252822` | Textos corridos, valores e rótulos |
| `text.secondary` | Cinza escuro | `#565C51` | Descrições e informações secundárias |
| `border.default` | Cinza quente | `#D8DED2` | Divisórias e bordas de campos |
| `action.primary` | Verde profundo | `#205D15` | Botões principais e links sobre fundo claro |
| `feedback.error` | Vermelho profundo | `#A52920` | Validação e erros |
| `feedback.warning` | Âmbar escuro | `#845200` | Avisos e cuidados |

**Proporção sugerida:** predominância de branco e creme; verde como ação/destaque; marrom como apoio. Preto espesso é um traço característico **da logomarca**, não uma obrigação para todas as bordas da interface.

### Acessibilidade de cor

- Para textos de leitura normal, buscar contraste **mínimo de 4,5:1**; para texto grande, **3:1**.
- Testar todas as combinações reais de texto/fundo antes da entrega. Não presumir que verde da marca ou marrom da marca funcionam como texto pequeno em qualquer superfície.
- Nunca comunicar status apenas por cor: acompanhar por palavras, ícones e/ou valores.
- Estados de foco devem ser bem visíveis independentemente de hover.

## 4. Tipografia

**A marca usa o lettering da arte aprovada**, não uma fonte de interface. Para o aplicativo:

| Papel | Fonte sugerida | Peso | Uso |
|---|---|---|---|
| Títulos de maior destaque | **Fredoka** | 500–600 | Cabeçalhos curtos e chamadas amigáveis |
| Corpo, formulários e navegação | **Nunito Sans** | 400–700 | Textos, botões, filtros, tabelas e números |
| Substituta de sistema | `system-ui, sans-serif` | Conforme contexto | Falha no carregamento das fontes |

**Escala inicial:** título de página 28–32 px; título de seção 22–24 px; subtítulo 18–20 px; corpo 16 px; legendas 14 px. Evitar corpo abaixo de 14 px. Altura de linha: aproximadamente 1,4–1,6 em blocos de texto.

A fonte expressiva é reservada para títulos e comunicação da marca. Na tela de separação do produtor, números, filtros, quantidades e estados devem privilegiar legibilidade em vez de ornamentação.

## 5. Formas, ilustrações e ícones

- **Formato:** curvas arredondadas e orgânicas, com geometria simples e amigável.
- **Cards:** cantos arredondados de 16–20 px; fundo branco ou creme, borda leve e sombra discreta opcional.
- **Botões e campos:** cantos de 12–14 px; superfícies limpas; estados claramente identificáveis.
- **Ícones:** traço arredondado e consistente, com espessura uniforme. A linguagem cartoon da marca aparece em ilustrações, chamadas e estados vazios; ícones operacionais continuam objetivos.
- **Ilustrações:** verduras, cestas e folhas com formas simples e volumes suaves; evitar desenhos hiper-realistas e palmeiras/coqueiros associados ao broto da marca.
- **Fotografia, se utilizada futuramente:** hortaliças e produção comunitária reais, bem iluminadas, em composições limpas.

## 6. Interface e componentes

### Navegação e estrutura

- Usar layouts **responsivos**: as quatro telas funcionam tanto no celular quanto no desktop.
- Manter cabeçalhos consistentes com logomarca legível, título da área e identificação de perfil quando aplicável.
- Preferir uma ação principal evidente por etapa. Evitar excesso de elementos decorativos junto a formulários e listas.
- Espaçamento-base: **8 px**, usando múltiplos de 8 para separação geral e de 4 para ajustes finos.

### Botões

- **Primário:** fundo `action.primary`, texto branco, tipografia em negrito, altura-alvo mínima de 44 px.
- **Secundário:** fundo branco, borda verde profunda, texto verde profundo.
- **Destrutivo/erro:** vermelho profundo somente quando a ação exigir essa semântica; nunca usar marrom apenas por ser uma cor da marca.
- Exibir visualmente estados **normal, hover, foco, pressionado, desabilitado e carregando**.

### Formulários

- Rótulos persistentes acima dos campos; placeholders apenas como exemplo complementar.
- Indicar erros em texto próximo ao campo, explicando o que precisa ser corrigido.
- Não apagar informações preenchidas após validação ou recusa de capacidade.
- Alvos de toque com pelo menos 44 × 44 px em controles importantes.

### Cards de cesta

Exibir **semana**, **tamanho**, **situação** e ação para consultar detalhes. Na visão do produtor, incluir **assinante**, **quantidade separada**, **limite** e **capacidade restante**. Dar mais destaque à informação do que à decoração.

### Situações da cesta

- **Pedida:** texto “Pedida”; aspecto neutro.
- **Em separação:** texto “Em separação”; ícone ou indicação visual complementar.
- Outras situações só devem ser incluídas quando forem definidas como requisito; não inventar um fluxo de status novo a partir do styleguide.

### Barra de capacidade — componente prioritário

A capacidade representa **a soma das quantidades dos produtos separados**, e não o número de tipos distintos de produto.

| Tamanho | Limite |
|---|---:|
| Pequena | 5 itens |
| Média | 8 itens |
| Grande | 12 itens |

**Padrão de exibição:** barra de progresso + texto exato, por exemplo **“4 de 5 itens separados · cabe mais 1”**. A largura preenchida corresponde a `itensSeparados / limite × 100%`. Usar um valor semântico de progresso (`<progress>` ou `role="progressbar"` com nome e valores acessíveis), mantendo a informação textual visível.

Quando a cesta estiver cheia, apresentar **“5 de 5 itens separados · cesta cheia”**, por exemplo. Ao tentar registrar um produto que ultrapasse o limite, manter os dados anteriores e explicar a recusa com uma mensagem objetiva. A cor da barra, sozinha, não indica lotação ou erro.

## 7. Aplicação às quatro telas do briefing

| Tela | Prioridade visual | Orientação |
|---|---|---|
| **Pedir a cesta** | Escolha rápida no celular | Três cards claros: Pequena (5), Média (8), Grande (12); CTA inequívoco |
| **Minhas cestas** | Consulta imediata no celular | Cards por semana, situação em texto e acesso aos produtos separados |
| **A separação** | Visão operacional no desktop | Lista escaneável com filtro por tamanho, opção de filtro por assinante e capacidade visível |
| **O fechamento** | Registro seguro no desktop | Nome do produto, quantidade, capacidade atual e previsão do espaço após inclusão |

Nenhuma das áreas deve ser tratada como “secundária”: a experiência da assinante e a do produtor têm igual prioridade. A tela **Pedir a cesta** deve favorecer uma solicitação simples, compatível com a meta do briefing de aproximadamente dois minutos.

## 8. Microtexto e tom de voz

**Tom:** próximo, simples, respeitoso e direto. Pode ser levemente alegre em mensagens de sucesso, sem infantilizar ações operacionais.

| Contexto | Exemplo |
|---|---|
| Ação | “Pedir minha cesta” |
| Confirmação | “Sua cesta da semana foi pedida!” |
| Consulta | “Veja o que já foi separado” |
| Limite | “Esta cesta comporta até 5 itens. Ainda cabem 2.” |
| Erro | “Não foi possível adicionar essa quantidade: ela ultrapassa a capacidade da cesta.” |
| Estado vazio | “Você ainda não pediu uma cesta para esta semana.” |

Não prometer entregas, pagamentos, notificações ou funcionalidades que não façam parte desta etapa.

## 9. Tokens iniciais para implementação

```css
:root {
  /* Marca — aproximações da arte aprovada */
  --brand-brown: #91430f;
  --brand-green: #287a0b;
  --brand-leaf: #3e970f;
  --brand-ink: #0b0b0b;

  /* Interface */
  --surface-base: #ffffff;
  --surface-warm: #fff8ed;
  --surface-soft-green: #edf5e6;
  --text-primary: #252822;
  --text-secondary: #565c51;
  --border-default: #d8ded2;
  --action-primary: #205d15;
  --feedback-error: #a52920;
  --feedback-warning: #845200;

  /* Componentes */
  --font-heading: 'Fredoka', system-ui, sans-serif;
  --font-body: 'Nunito Sans', system-ui, sans-serif;
  --radius-field: 12px;
  --radius-button: 14px;
  --radius-card: 18px;
  --space-unit: 8px;
  --focus-ring: 0 0 0 3px #b6d8a8;
}
```

> A disponibilidade/licença das fontes deve ser confirmada ao integrá-las ao projeto. Os tokens dão um ponto de partida; combinações de cores, contraste e comportamento responsivo precisam ser validados nas telas reais.

## 10. Checklist de consistência

- [ ] Usar a versão cartoon aprovada da logomarca; preservar cores por palavra e contornos pretos.
- [ ] Manter duas folhas e galho pequeno com sugestão de coração aberto.
- [ ] Usar Fredoka somente onde sua expressividade não comprometa a leitura; manter dados com Nunito Sans.
- [ ] Garantir consistência de espaçamento, botões, campos, cards, foco e mensagens.
- [ ] Testar contraste e leitura do “do” branco em cada fundo onde a logomarca aparecer.
- [ ] Mostrar capacidade sempre com barra **e** texto com quantidades exatas.
- [ ] Validar o impedimento de separar produtos acima da capacidade da cesta.
- [ ] Testar as quatro telas no celular e no desktop.
- [ ] Não apresentar funcionalidades ainda fora do escopo inicial como se estivessem prontas.

---

**Arquivos relacionados:** `BRIEFING.md` (requisitos e escopo) e `logo_cesta_do_vale_em_estilo_cartum.png` (arte visual aprovada). Quando houver vetor final e especificação cromática conferida, atualizar esta versão para substituir as aproximações.
