# Decisões

As linhas que terminam em `?` foram deduzidas do código e ainda precisam ser confirmadas.

## MySQL com SQLAlchemy 2 e `Column`
- Decisão: os dados ficam no MySQL, com o driver `mysql+mysqlconnector`, e os modelos usam `Column`.
- Por quê: é o banco e o estilo do curso, e os dados não somem quando o servidor reinicia.
- Ficou de fora: `Mapped`/`mapped_column` e qualquer outro banco.
- Onde está: `banco.py`, `modelos/`, `configuracao.py` (`URL_DO_BANCO`).

## Enum e `criado_em` nas tabelas
- Decisão: `tipo`, `tamanho` e `situacao` são `ENUM` no MySQL, e cada tabela tem `criado_em` com valor padrão.
- Por quê: o banco recusa valores fora da lista, mesmo que a validação falhe antes. ?
- Ficou de fora: tabela separada de tamanhos ou de situações.
- Onde está: `modelos/`, `docs/DER.md`.

## Migrations com Alembic, e o banco do zero com `create_all`
- Decisão: as mudanças em tabela que já existe entram por migration. Um banco novo usa `criar_tabelas.py` seguido de `alembic stamp head`.
- Por quê: preserva os dados de quem já tem o banco, sem obrigar o banco novo a refazer o histórico.
- Ficou de fora: `alembic downgrade` em banco com dados, e apagar tabelas.
- Onde está: `migracoes/versions/`, `criar_tabelas.py`.

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
- Por quê: uma coluna de ocupação poderia ficar diferente da soma real dos produtos. ?
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

## Dois perfis, uma função `exigir_` para cada
- Decisão: `exigir_assinante` em `POST /cestas` e `exigir_produtor` em `POST /cestas/{id}/produtos`. Os dois devolvem 403 para o perfil errado.
- Por quê: 401 é para quem não provou quem é, e 403 para quem provou mas não pode.
- Ficou de fora: escopos do OAuth2 e tabela de papéis e permissões.
- Onde está: `rotas/autenticacao.py`.

## A assinante só vê as próprias cestas
- Decisão: na lista, o serviço força o filtro pelo id da assinante, que não consegue escapar com `assinante_id`. No detalhe e nos produtos, `cesta_existente` devolve 404 e, depois disso, 403 para a cesta de outra pessoa.
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

## Paginação de 10 cestas, ordenadas por semana
- Decisão: `GET /cestas?pagina=` traz 10 por página, ordenadas por `semana` e `id`.
- Por quê: o desempate pelo `id` evita repetir ou pular cestas entre as páginas. ?
- Ficou de fora: escolher o tamanho da página.
- Onde está: `repositorios/cesta.py`.
