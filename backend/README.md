# Backend · Cesta do Vale

As instruções para rodar, o banco do zero, as rotas e a regra estão no [README da raiz](../README.md).
As camadas e as decisões do projeto estão na [.docs/](../.docs/README.md), e as tabelas no [DER](../docs/DER.md).

## Por que hash, e não criptografia?

- **A criptografia é reversível:** quem tem a chave abre o cofre. Se a chave vazar, todas as senhas vazam juntas.
- **O hash vai num sentido só:** não existe chave para voltar à senha. No login, a senha digitada passa pela
  mesma função, e o resultado é comparado com o `senha_hash` guardado.
- **Por que o Argon2 (`pwdlib[argon2]`):** ele é lento de propósito e gasta memória, o que atrapalha quem tenta
  adivinhar a senha por força bruta. Também põe um sal aleatório em cada hash, então duas senhas iguais
  geram hashes diferentes. O hash começa com `$argon2id$`.

## Por que token, e não senha em toda requisição?

O HTTP não lembra quem fez login. Mandar a senha em toda chamada obrigaria o front a guardá-la, e o Argon2
atrasaria cada requisição. Por isso o `/login` confere a senha uma vez e devolve um JWT com o `sub` (o id) e
o `exp` (60 minutos), assinado com a `CHAVE_DO_TOKEN` do `.env`. Nas outras rotas, o
`obter_usuario_atual` lê o token. O dono de uma cesta vem desse token, e nunca do corpo da requisição.

## Testes

```powershell
python testar_backend.py
```

Os testes de banco precisam de `URL_DO_BANCO_TESTE` apontando para um MySQL **vazio** com nome terminado em
`_teste`. Sem essa variável, eles são pulados e os outros rodam sem conexão.
