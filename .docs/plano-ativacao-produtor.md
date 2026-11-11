# Plano · Ativação do produtor por código no e-mail do administrador

## Objetivo
Trocar o código fixo do modo suporte (`CODIGO_DE_SUPORTE`) por um código novo a cada pedido, de uso único e com
validade, enviado por e-mail ao administrador. O produtor preenche os dados, pede o cadastro e só vira produtor
depois de digitar o código que o administrador recebeu.

## Decisões fechadas
- **Serviço de e-mail:** Resend, pela API HTTP, com o `httpx` que já está no `requirements.txt`. Sem domínio
  próprio, o Resend só envia para o e-mail dono da conta, que é o do administrador.
- **Acesso:** a aba **Produtor** continua aparecendo com 5 cliques no logo do login.
- **Código:** 6 dígitos, válido por 30 minutos, até 5 tentativas, uso único.
- **`CODIGO_DE_SUPORTE`:** removido, substituído pelo código por e-mail.
- **E-mail do administrador:** só na variável `EMAIL_DO_ADMIN` (`.env` e Vercel), nunca no código, porque o
  repositório é público.
- **Ordem:** commitar antes o cadastro só de assinante e o modo suporte; a ativação vem num branch próprio.

## Fluxo
1. 5 cliques no logo abrem a aba **Produtor**: nome, e-mail e senha, e o botão **Solicitar cadastro**.
2. O back grava uma solicitação pendente (sem criar usuário), gera o código e envia ao administrador um e-mail com
   o código, o nome e o e-mail de quem pediu e o prazo.
3. O front mostra **"Digite o código de ativação"**. O administrador confere quem pediu e passa o código.
4. Código certo: o back cria o produtor e o front faz o login. Errado: mostra as tentativas que restam.

## Etapa 1 · Banco
- `modelos/solicitacao_produtor.py`: tabela `solicitacoes_produtor` com `id` (texto aleatório,
  `secrets.token_urlsafe`, chave primária), `nome`, `email`, `senha_hash`, `codigo_hash`, `expira_em`,
  `tentativas` (padrão 0) e `criado_em`.
- Migration `0003_solicitacoes_produtor`: só cria a tabela (não mexe nos dados). `criar_tabelas.py` e
  `migracoes/env.py` importam o modelo.

## Etapa 2 · Back
- `configuracao.py`: `EMAIL_DO_ADMIN` e `CHAVE_DO_EMAIL` (chave do Resend); sai o `CODIGO_DE_SUPORTE`.
  Sem as duas variáveis, a solicitação responde 503 (cadastro de produtor desligado).
- `servicos/email.py`: `enviar_codigo_ao_admin(nome, email, codigo, expira_em)`, a única função que fala com o
  Resend. Falha vira `EmailIndisponivel`. O log não registra o código.
- `servicos/usuario.py`:
  - `solicitar_produtor`: recusa e-mail que já tem conta (409); apaga as solicitações vencidas; recusa se já há
    3 pendentes (429); gera o código com `secrets.randbelow`, grava só os hashes (senha e código) e envia o e-mail.
    Se o envio falhar, apaga a solicitação e responde 503.
  - `confirmar_produtor`: solicitação inexistente (404) ou vencida (410, e é apagada); código conferido pelo hash;
    errado soma uma tentativa (403, com as que restam) e, na 5ª, apaga; certo cria o produtor e apaga a
    solicitação, no mesmo commit. Confere de novo se o e-mail continua livre (409).
- `rotas/usuarios.py`, fora do `/docs`:
  - `POST /usuarios/produtor/solicitacoes` → 202 `{id, expira_em}`.
  - `POST /usuarios/produtor/solicitacoes/{id}/confirmar` com `{codigo}` → 201 com o produtor.
  - Sai a `POST /usuarios/produtor` do código fixo.
- `esquemas/usuario.py`: `SolicitacaoProdutorCriacao` (nome, e-mail, senha), `SolicitacaoProdutorResposta`
  (id, expira_em) e `CodigoDeAtivacao` (6 dígitos, `pattern`).

## Etapa 3 · Front
- Aba **Produtor**, passo 1: nome, e-mail e senha, botão **Solicitar cadastro**.
- Passo 2: campo do código (6 dígitos, `inputMode="numeric"`, `autoComplete="one-time-code"`), o prazo e as
  tentativas que restam; botões **Ativar** e **Voltar** (voltar exige pedir de novo).
- O `id` da solicitação fica no `sessionStorage`, para o passo 2 sobreviver a uma recarga.
- Mensagens para 403 (código errado), 410 (vencido), 429 (muitas solicitações) e 503 (e-mail fora do ar).

## Etapa 4 · Testes e documentação
- Testes, com o envio substituído por uma função falsa: a solicitação grava e envia; código certo cria o produtor
  e não vale uma segunda vez; 5 erros apagam; vencido dá 410; e-mail repetido dá 409; falha no envio dá 503 sem
  deixar solicitação; o limite de 3 pendentes; sem as variáveis, 503.
- README (passo a passo com o Resend), `decisoes.md` (a decisão do código fixo fica marcada como substituída),
  `arquitetura.md`, os dois `.env.exemplo` e o `docker-compose.yml`.

## O que o administrador faz na configuração
1. Cria a conta no Resend com o próprio e-mail e gera a chave.
2. Coloca `CHAVE_DO_EMAIL` e `EMAIL_DO_ADMIN` no `backend/.env` e nas variáveis do projeto do back no Vercel.
3. Aplica a migration `0003` no Supabase (`alembic upgrade head`).

## Situação (2026-11-10)
Etapas 1 a 4 feitas no branch `cadastro-de-produtor`. Os testes passam com SQLite e o envio de e-mail falso, e o
fluxo foi testado no navegador com a API local. Falta: a conta no Resend, as variáveis no Vercel, a migration
`0003` no Supabase e o primeiro envio de verdade.

## Fora deste plano
Limite de tentativas por IP, reenvio do mesmo código, painel para o administrador ver as solicitações e
confirmação do e-mail de quem pediu.
