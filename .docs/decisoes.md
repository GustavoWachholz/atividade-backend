# Decisões

## MySQL com SQLAlchemy 2 e `Column`
- Decisão: os dados ficam no MySQL, com o driver `mysql+mysqlconnector`, e os modelos usam `Column`.
- Por quê: é o banco e o estilo do curso, e os dados não somem quando o servidor reinicia.
- Ficou de fora: `Mapped`/`mapped_column` e qualquer outro banco.
- Onde está: `banco.py`, `modelos/`, `configuracao.py` (`URL_DO_BANCO`).

## Enum e `criado_em` nas tabelas
- Decisão: `tipo`, `tamanho` e `situacao` são `ENUM` no MySQL, e cada tabela tem `criado_em` com valor padrão.
- Por quê: o banco recusa valores fora da lista, mesmo que a validação falhe antes.
- Ficou de fora: tabela separada de tamanhos ou de situações.
- Onde está: `modelos/`, `docs/DER.md`.

## Migrations com Alembic, e o banco do zero com `create_all`
- Decisão: as mudanças em tabela que já existe entram por migration. Um banco novo usa `criar_tabelas.py` seguido de `alembic stamp head`.
- Por quê: preserva os dados de quem já tem o banco, sem obrigar o banco novo a refazer o histórico.
- Ficou de fora: `alembic downgrade` em banco com dados, e apagar tabelas.
- Onde está: `migracoes/versions/`, `criar_tabelas.py`.

## Na migration do estoque, `sa.func.current_timestamp()` no lugar do `sa.text`
- Decisão: na `9ba02dc0bbc4`, o `server_default=sa.text('CURRENT_TIMESTAMP')` escrito pelo autogenerate virou `sa.func.current_timestamp()`. O id e a operação são os mesmos.
- Por quê: o `text()` está na lista do que não deve aparecer, como na `9b5b85bd0880`. Os dois geram o mesmo `DEFAULT CURRENT_TIMESTAMP`, e a migration já aplicada não precisa rodar de novo (`alembic check` não acusa diferença).
- Ficou de fora: refazer a migration com `downgrade`.
- Onde está: `migracoes/versions/9ba02dc0bbc4_estoque_da_semana.py`.

## As duas migrations existentes ficam como estão
- Decisão: a `20261007_01` (escrita à mão, a base da cadeia) foi mantida. Na `9b5b85bd0880`, só a checagem com `sa.text` foi retirada. Ids e operações continuam iguais.
- Por quê: as duas já foram aplicadas, e o banco do zero não roda nenhuma delas (usa `stamp head`). Refazê-las exigiria `downgrade` num banco com dados. O `text()` com SQL está na lista do que não deve aparecer.
- Ficou de fora: regerar a cadeia com `--autogenerate`.
- Onde está: `migracoes/versions/`.

## A regra recusa com exceção, e a rota escolhe o 409
- Decisão: o serviço levanta `LimiteDaCestaExcedido` com a frase para a tela, e a rota traduz para 409.
- Por quê: o pedido é válido no formato (não é 422), mas entra em conflito com o estado da cesta. O serviço não conhece HTTP.
- Ficou de fora: `HTTPException` no serviço e `exception_handler` no `main.py`.
- Onde está: `servicos/produto_separado.py`, `servicos/excecoes.py`, `rotas/produtos_separados.py`.

## Capacidade calculada, sem coluna
- Decisão: o limite, o ocupado e o que ainda cabe são calculados a cada consulta, a partir dos produtos.
- Por quê: uma coluna de ocupação poderia ficar diferente da soma real dos produtos.
- Ficou de fora: guardar a ocupação na tabela `cestas`.
- Onde está: `servicos/cesta.py` (`LIMITES`, `detalhar`).

## Senha com hash Argon2 (`pwdlib`)
- Decisão: o banco guarda só o `senha_hash`, e a resposta da API nunca mostra senha nem hash.
- Por quê: o hash não tem volta. Argon2 é lento de propósito e usa sal por senha.
- Ficou de fora: criptografia reversível, MD5, SHA-256, `passlib`.
- Onde está: `seguranca.py`, `servicos/usuario.py`, `esquemas/usuario.py`.

## Login com token JWT, e não sessão guardada no servidor
- Decisão: o `/login` devolve um JWT (HS256, `sub` com o id, `exp` de 60 minutos), e o front manda o token em todo fetch.
- Por quê: a API não guarda quem entrou, e o mesmo token serve no React e no `/docs`.
- Ficou de fora: renovar o token sozinho (refresh token) e token em cookie. Quando vence, a pessoa entra de novo.
- Onde está: `seguranca.py`, `rotas/autenticacao.py`, `CHAVE_DO_TOKEN` no `.env`.

## Token sem `sub` dá 401, e a API não sobe sem a chave
- Decisão: o `ler_token` exige `sub` e `exp` (`options={"require": [...]}`) e devolve `None` também para o `sub` que não é número (`ValueError`). O `seguranca.py` levanta `RuntimeError` na subida se a `CHAVE_DO_TOKEN` estiver vazia.
- Por quê: os dois tokens davam erro 500, e não 401. Sem a chave, o `/login` dava 500 em vez de avisar o que falta, ao contrário do que o `banco.py` já faz com a `URL_DO_BANCO`.
- Ficou de fora: `except Exception`. As duas exceções são pegas pelo nome.
- Onde está: `seguranca.py`, `test_token_adulterado_retorna_401`.

## Mesma mensagem para e-mail errado e senha errada
- Decisão: o login responde 401 "E-mail ou senha incorretos" nos dois casos.
- Por quê: não revelar quais e-mails estão cadastrados.
- Ficou de fora: mensagens diferentes para cada erro.
- Onde está: `rotas/autenticacao.py`.

## O dono da cesta vem do token
- Decisão: o `CestaCriacao` não tem `assinante_id`. O serviço usa `usuario.id` do token, e um `assinante_id` enviado no corpo é ignorado.
- Por quê: o corpo pode ser alterado por quem faz a requisição. O token é conferido pela assinatura.
- Ficou de fora: pedir cesta em nome de outra pessoa.
- Onde está: `esquemas/cesta.py`, `servicos/cesta.py`.

## Grupos de usuário com permissões (assunto novo, marcado `# [NOVO · grupos]`)
- Decisão: cada persona é um grupo, e a tabela `GRUPOS` liga o grupo às permissões (`conta:ver`, `cestas:pedir`, `cestas:ver`, `cestas:ver_todas`, `produtos:separar`). Toda rota protegida usa uma `exigir_<permissão>` (`exigir_ver_conta`, `exigir_pedir_cesta`, `exigir_ver_cestas`, `exigir_separar_produto`), que devolve 403. Elas substituem `exigir_assinante` e `exigir_produtor`.
- Por quê: a rota pergunta "o seu grupo pode?", e não "qual é o seu tipo?". Mudar o que um grupo faz é mexer só na tabela. Um grupo fora da tabela não pode nada (negar por padrão). 401 continua sendo para quem não provou quem é, e 403 para quem provou mas não pode.
- Ficou de fora: tabelas `grupos` e `permissoes` no banco (o REGRAS veta tabela de papéis, e o DER teria que mudar), escopos do OAuth2, uma fábrica `exigir(permissao)` (função que devolve função) e usuário em mais de um grupo.
- Onde está: `seguranca.py` (`GRUPOS`, `tem_permissao`), `rotas/autenticacao.py` (as `exigir_`), `rotas/cestas.py`, `servicos/cesta.listar`.

## A assinante só vê as próprias cestas
- Decisão: quem não tem a permissão `cestas:ver_todas` (o grupo assinante) só vê as próprias cestas. Na lista, o serviço força o filtro pelo id, que não dá para escapar com `assinante_id`. No detalhe e nos produtos, `cesta_existente` devolve 404 e, depois disso, 403 para a cesta de outra pessoa.
- Por quê: a cartilha diz que, com o login, a Aline vê só as cestas dela.
- Ficou de fora: esconder a existência da cesta com 404 no lugar do 403.
- Onde está: `servicos/cesta.listar`, `rotas/cestas.cesta_existente`.

## A lista pública de usuários foi retirada
- Decisão: `GET /usuarios` deixou de existir. Ficam só `POST /usuarios` e `GET /usuarios/eu`.
- Por quê: ela era pública e mostrava o e-mail de todos, que é o `username` do login. Servia para escolher o perfil antes do login, e nenhuma tela usa mais.
- Ficou de fora: uma lista protegida para o produtor, porque nenhuma tela precisa dela.
- Onde está: `rotas/usuarios.py`.

## O cadastro deixa escolher o perfil
- Decisão: `POST /usuarios` aceita `tipo` assinante ou produtor, inclusive pela tela de cadastro do front.
- Por quê: a cartilha tem só dois perfis, e o teste precisa criar um de cada. O slide da aula 9 aceita isso no exemplo.
- Ficou de fora: um administrador para atribuir o perfil de produtor, que seria o certo num sistema real. Ele exigiria um terceiro perfil, que a cartilha não tem.
- Onde está: `esquemas/usuario.py`, `rotas/usuarios.py`, `Login` em `frontend/src/App.jsx`.

## CORS só para o endereço do front
- Decisão: `allow_origins` lê `ORIGEM_FRONTEND` do `.env`, que vale `http://localhost:5173` por padrão.
- Por quê: `"*"` deixaria qualquer site chamar a API pelo navegador.
- Ficou de fora: `allow_origins=["*"]`.
- Onde está: `main.py`, `configuracao.py`.

## Paginação de 10 cestas, da semana mais recente para a mais antiga
- Decisão: `GET /cestas?pagina=` traz 10 por página, ordenadas por `semana` e `id` decrescentes. As duas telas do front têm botões "Anterior" e "Próxima".
- Por quê: sem os botões, o front mostrava só as 10 primeiras cestas, e a cartilha pede "todas as cestas". A semana mais recente vem primeiro para o pedido novo e a semana atual aparecerem na primeira página. O desempate pelo `id` evita repetir ou pular cestas entre as páginas.
- Ficou de fora: o total de páginas (a resposta é só a lista; o front deduz que há próxima quando a página vem cheia) e escolher o tamanho da página.
- Onde está: `repositorios/cesta.py`, `Paginacao` em `frontend/src/App.jsx`.

## A semana da cesta é a segunda-feira daquela semana
- Decisão: o front envia a segunda-feira da semana atual, calculada no horário local, e mostra a semana como "19/10 a 25/10". O back grava a cesta sempre na segunda-feira (`segunda_da_semana` no `servicos/cesta.criar`), mesmo que receba outro dia da semana, como já fazia com o estoque.
- Por quê: a cartilha fala em "cesta da semana", e o DER diz que a semana é a segunda-feira. Antes o front enviava a data do dia em UTC, e um pedido feito depois das 21h era gravado no dia seguinte. Pelo `/docs`, uma quinta era gravada como quinta.
- Ficou de fora: recusar a data que não é segunda-feira (o back converte, não recusa) e corrigir as cestas antigas já gravadas num dia que não é segunda.
- Onde está: `segundaDaSemana`, `dataISO` e `textoDaSemana` em `frontend/src/App.jsx`, `servicos/cesta.criar`.

## O pedido vale só para a semana atual
- Decisão: `POST /cestas` recusa com **409** ("Só é possível pedir a cesta da semana atual.") qualquer semana que não seja a de hoje, passada ou futura. O front já manda a semana atual.
- Por quê: o pedido é da semana que está acontecendo; uma cesta para semana passada não pode mais ser separada nem entregue. A recusa é 409 porque o formato está certo e é a regra que barra, como nas demais.
- Ficou de fora: escolher a semana no pedido. O filtro `semana` das listas continua aceitando qualquer semana, para consultar o histórico.
- Onde está: `servicos/cesta.conferir_semana_do_pedido`, `rotas/cestas.criar_cesta`.

## A cesta mostra o nome de quem pediu
- Decisão: a resposta da cesta traz `assinante: {id, nome}`, lido por `Cesta.assinante = relationship("Usuario")`.
- Por quê: na tela da separação, o produtor precisa saber de quem é a cesta, e o número do id não diz isso.
- Ficou de fora: o e-mail da assinante nessa resposta, e qualquer coluna nova.
- Onde está: `modelos/cesta.py`, `esquemas/cesta.py` (`AssinanteResumo`).

## Estoque da semana, em unidades (pedido do autor, fora da cartilha)
- Decisão: uma quarta tabela, `estoques` (semana, nome_produto, quantidade), cadastrada pelo produtor. Ela limita o pedido e a separação.
- Por quê: o produtor montava as cestas no chute, e a assinante pedia sem saber se havia colheita. A cartilha deixa de fora o estoque **em quilos**; este conta unidades, a mesma medida da cesta.
- Ficou de fora: estoque em quilos, editar ou apagar uma linha do estoque, sobra passando de uma semana para a outra, e a assinante escolher os produtos.
- Onde está: `modelos/estoque.py`, `servicos/estoque.py`, `rotas/estoques.py`, migration `9ba02dc0bbc4`.

## Cada cesta aprovada reserva o limite inteiro do tamanho (substitui a reserva no pedido)
- Decisão: itens livres = total colhido na semana − soma dos limites das cestas `em_separacao`. É só um resumo para o produtor: nada recusa o pedido nem a aprovação por causa dele.
- Por quê: antes, o pedido era recusado sem estoque, e a assinante ficava sem poder pedir antes de a colheita ser lançada. Agora o produtor decide na aprovação.
- Ficou de fora: recusar a aprovação sem estoque, e liberar a reserva de uma cesta que não é concluída.
- Onde está: `servicos/cesta.py` (`itens_livres_na_semana`).

## Separações da mesma semana entram uma de cada vez (o pedido não trava mais)
- Decisão: a separação começa com `repositorios/estoque.travar_semana`, que faz `SELECT ... FOR UPDATE` nas linhas do estoque da semana (`.with_for_update()`). O `engine` passou a usar `isolation_level="READ COMMITTED"`.
- Por quê: num teste com requisições simultâneas, uma cesta pequena ficou com 9 de 5 itens, e 12 itens colhidos reservaram 60. A trava faz a segunda requisição esperar a primeira gravar. O `READ COMMITTED` faz ela ler a soma já com o produto novo, porque no padrão do MySQL (`REPEATABLE READ`) ela continuaria vendo a foto de antes. Depois da mudança: 3 de 5 e 12 de 12, sem erro 500 nem deadlock.
- Ficou de fora: travar só a linha da cesta (não protege o estoque, que é dividido entre cestas) e travar o cadastro do estoque (cadastrar mais só aumenta o disponível). `with_for_update` e `isolation_level` não foram vistos em aula: aprovados por mim.
- Onde está: `banco.py`, `repositorios/estoque.travar_semana`, `servicos/produto_separado.separar`. O pedido deixou de travar a semana porque não confere mais o estoque.

## O produto separado se liga ao estoque pelo nome, sem chave estrangeira
- Decisão: o `produtos_separados` não mudou. O serviço procura o produto no estoque da semana da cesta pelo nome e grava o nome escrito como está no estoque.
- Por quê: evita migration numa tabela que já tem dados e mantém o DER das entidades da cartilha. Gravar o nome do estoque faz as somas por produto baterem.
- Ficou de fora: a coluna `estoque_id` (FK) no produto separado.
- Onde está: `servicos/produto_separado.separar`, `servicos/estoque.disponivel_do_produto`.

## O mesmo produto na mesma semana soma, com UNIQUE no banco
- Decisão: `UNIQUE(semana, nome_produto)`, e cadastrar de novo um produto que já está na semana soma a quantidade. A resposta é 201 nos dois casos.
- Por quê: a lista fica com uma linha por produto, e o banco impede a linha repetida mesmo se o serviço falhar.
- Ficou de fora: recusar o segundo cadastro com 409 e guardar uma linha por colheita.
- Onde está: `modelos/estoque.py`, `servicos/estoque.cadastrar`.

## As recusas do estoque são 409
- Decisão: `EstoqueInsuficiente` (produto fora do estoque, ou quantidade maior que o disponível, na separação) vira 409 na rota. A `TamanhoSemEstoque` foi retirada junto com a conferência no pedido.
- Por quê: o pedido está certo no formato (não é 422), mas conflita com o estado atual do estoque. É o mesmo raciocínio do `LimiteDaCestaExcedido`.
- Ficou de fora: 422 para essas recusas.
- Onde está: `servicos/excecoes.py`, `rotas/produtos_separados.py`.

## O pedido passa pela aprovação do produtor (pedido do autor, fora da cartilha)
- Decisão: a cesta segue `pedida` → (produtor aprova) `em_separacao` → (produtor conclui) `concluida`, ou `pedida` → (produtor reprova) `recusada`. O pedido e a aprovação não conferem o estoque. Só a cesta `em_separacao` recebe produtos, e concluir exige a cesta cheia (soma igual ao limite). Rotas `PATCH /cestas/{id}/aprovar`, `/reprovar` e `/concluir`, com as permissões `cestas:aprovar` e `cestas:concluir`, só do produtor.
- Por quê: a assinante não conseguia pedir porque o estoque ainda não tinha sido lançado. Como num app de entrega, o estabelecimento recebe o pedido e decide. O estoque passa a valer onde o produto de fato sai: na separação.
- Status: as recusas de estado (aprovar ou reprovar cesta não pedida, concluir fora de `em_separacao`, concluir cesta incompleta, separar fora de `em_separacao`) são 409, pelo mesmo motivo do limite da cesta: o pedido está certo no formato, mas conflita com o estado atual. Escolha aprovada por mim.
- Ficou de fora: motivo da recusa (seria coluna nova), desfazer aprovação ou recusa, bloquear a aprovação sem estoque, e a IA entre a aprovação e a conclusão (continua no roadmap, ver `ia.md`). A cartilha dizia que o primeiro produto muda a situação; agora quem muda é a aprovação.
- Onde está: `modelos/cesta.py`, `servicos/cesta.py` (`aprovar`, `reprovar`, `concluir`), `servicos/produto_separado.py`, `rotas/cestas.py`, `servicos/excecoes.py`, `seguranca.py`.

## Migration do ENUM escrita à mão (exceção aprovada)
- Decisão: a `a1c4e7d20f35` usa só `op.alter_column` para acrescentar `concluida` e `recusada` ao `ENUM` `situacao_cesta`, no fim da lista.
- Por quê: o autogenerate não detecta valores novos de `ENUM` no MySQL e geraria uma migration vazia, e o banco recusaria os valores novos com erro 500. No fim da lista, as cestas gravadas continuam válidas. Depois de aplicada, o `alembic check` não acusa diferença.
- Ficou de fora: `op.execute`, `text()`, recriar a tabela e rodar o `downgrade` em banco com dados (cestas `concluida` ou `recusada` não cabem no `ENUM` antigo).
- Onde está: `migracoes/versions/a1c4e7d20f35_situacoes_do_pedido.py`.

## Permissões do estoque (assunto novo, marcado `# [NOVO · grupos]`)
- Decisão: `estoque:cadastrar` só para o produtor, e `estoque:ver` para os dois grupos, com `exigir_cadastrar_estoque` e `exigir_ver_estoque`.
- Por quê: só quem colhe registra a colheita. A assinante precisa ver o estoque para saber o que vem e quais tamanhos estão liberados.
- Ficou de fora: esconder da assinante as quantidades. A API devolve colhido e separado para os dois grupos, e o front da assinante mostra só os nomes.
- Onde está: `seguranca.py` (`GRUPOS`), `rotas/autenticacao.py`, `rotas/estoques.py`.

## A semana vai de segunda a domingo em toda conta do back
- Decisão: `segunda_da_semana` (em `servicos/cesta.py`) converte qualquer data na segunda-feira, e os repositórios buscam por semana com `>= segunda` e `< segunda + 7 dias`. O estoque é gravado sempre na segunda-feira. `GET /cestas` ganhou o filtro opcional `semana`.
- Por quê: cestas antigas guardaram o dia do pedido (ex.: a quinta 2026-10-22), e a comparação exata não achava o estoque da segunda 2026-10-19. O formulário de separação mostrava "nenhum produto disponível".
- Ficou de fora: corrigir a data gravada nas cestas antigas, e recusar no back a cesta que não vem numa segunda-feira.
- Onde está: `servicos/cesta.py`, `servicos/estoque.py`, `repositorios/cesta.py`, `repositorios/produto_separado.py`, `rotas/cestas.py`.

## A separação mostra uma semana por vez
- Decisão: a tela da separação começa na semana atual e troca de semana com as mesmas setas do estoque (`SeletorDeSemana`), mandando `&semana=` no `GET /cestas`.
- Por quê: o produtor monta as cestas com a colheita de uma semana, então vê as cestas dessa semana, ao lado do estoque dela.
- Ficou de fora: uma opção "todas as semanas" na separação.
- Onde está: `Separacao` e `SeletorDeSemana` em `frontend/src/App.jsx`.

## O filtro por assinante nasce do nome na cesta
- Decisão: na separação, cada cesta tem o botão "ver só as cestas de <nome>", que manda `&assinante_id=` no `GET /cestas`. Um selo mostra o filtro ativo, com o botão de tirar.
- Por quê: o styleguide pede o filtro por assinante na separação, e o back já o oferece. A lista de usuários foi retirada da API, então não há de onde montar um `select`.
- Ficou de fora: uma lista de assinantes para escolher (exigiria uma rota nova).
- Onde está: `Separacao` em `frontend/src/App.jsx`, `.filter-chip` em `frontend/styles.css`.

## O fechamento mostra a previsão da capacidade
- Decisão: abaixo da quantidade, o formulário de separação mostra "Depois de registrar: 7 de 8 itens separados · cabe mais 1". A quantidade precisa ser inteira (`Number.isInteger`), como na tela do estoque.
- Por quê: o styleguide pede a "previsão do espaço após inclusão" no fechamento. Antes, 1,5 chegava ao back, que respondia 422 com uma mensagem genérica.
- Ficou de fora: prever também o estoque do produto depois da inclusão (o select já mostra o disponível).
- Onde está: `FormularioDeProduto` e `textoCapacidade` em `frontend/src/App.jsx`.

## A IA pré-preenche as cestas da semana (planejada, aula 10)
- Decisão: o produtor pede uma sugestão de montagem de todas as cestas da semana, a partir do estoque. O serviço confere e grava os itens válidos, e o produtor revisa e marca a cesta como `concluida`. A assinante só vê os produtos depois disso.
- Por quê: é a opção que mais tira o "no chute" da rotina de quinta. As recusas que já existem continuam no serviço, e o `concluida` é a conferência humana.
- Ficou de fora: agente com ferramentas e multiagente (basta uma chamada e uma correção), IA para a assinante e rascunho só na tela.
- Onde está: planejamento em `.docs/ia.md`. Ainda não há código.

## O .env.production tem só /api
- Decisão: `frontend/.env.production` guarda apenas `VITE_URL_DA_API=/api`. O front lê o endereço em `src/api.js`.
- Por quê: em produção o Caddy serve o build e repassa `/api` à API na mesma origem (porta 8080), então basta o caminho relativo, sem host nem porta, e sem CORS. Variáveis `VITE_` vão para o JavaScript do navegador, então não podem ter segredo.
- Ficou de fora: domínio e HTTPS (próxima aula). O `.env.development` também vale `/api`, pois o proxy do Vite já repassa ao backend.
- Onde está: `frontend/.env.*`, `frontend/src/api.js`, `Caddyfile`, `.docs/infra.md`.
