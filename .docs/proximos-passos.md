# Próximos passos

1. **Testar a IA com uma chave real** (ver `ia.md`). Crie a chave no Google AI Studio, coloque `CHAVE_DA_IA` no
   `backend/.env` e no projeto do Vercel, e confira a qualidade da sugestão. Depois, publique e teste o `maxDuration`.
2. **Fechar o cadastro aberto ao perfil produtor.** Hoje qualquer pessoa vira produtor e vê as cestas com o nome das
   assinantes, e a API já está publicada.
3. **Testar o fluxo do pedido de ponta a ponta** (back e front prontos; o build do front compila, mas as telas não
   foram abertas no navegador). Roteiro: assinante pede sem estoque, produtor aprova, cadastra a colheita, separa até
   encher e conclui; outro pedido é reprovado.
4. **Rodar os 20 testes de banco no Postgres.** A `URL_DO_BANCO_TESTE` está vazia no `.env`: ela precisa de um banco vazio com
   sufixo `_teste`. Eles passaram com SQLite, mas ainda não rodaram no Postgres.
5. **Decidir como comparar os nomes no estoque.** No Postgres, a comparação diferencia acento e maiúscula: "alface" e
   "Alface" viram produtos diferentes. ?
6. **Atualizar o `README.md` e o `.docs/` para o Supabase.** Os passos de instalação ainda falam em MySQL.
7. **Testar o README num clone limpo.** Rode `git clone <link> teste-readme` e siga o `README.md` sem pular passo:
   back, banco do zero, front e login com os dois perfis. Corrija o README onde travar.
8. **Conferir as telas nos dois tamanhos:** no navegador, F12 e modo celular. As telas da assinante no celular, e a
   separação no computador. Confira também o logo com 240 px no cabeçalho em 320 px de largura, o filtro por assinante
   e a previsão no fechamento.
9. **Testar o acesso indevido** no `/docs`, tentando abrir cestas de outra pessoa e rotas de outro perfil.
