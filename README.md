# Cesta do Vale

Atualizado conforme os [slides da aula 06](https://dannbeckersenac.github.io/SlidesPJP/aulas/aula-06.html):
três entidades persistidas no MySQL, sessão por requisição, relacionamento simples,
gravação conjunta da regra e lista filtrada, ordenada e paginada pelo banco.
Veja o [DER](docs/DER.md) e as [regras atualizadas](REGRAS.md).

O cadastro de usuários recebe e-mail e senha e armazena somente o hash Argon2.
Consulte [backend/README.md](backend/README.md) para o contrato de cadastro e
para atualizar bancos existentes com Alembic. Login ainda não foi implementado.

## Como rodar o backend

Consulte [backend/README.md](backend/README.md) para configurar o ambiente, instalar as
dependências e preencher a conexão MySQL. Depois, de dentro de `backend/`:

```powershell
cd backend
# Banco existente: python -m alembic upgrade head
# Banco novo: python criar_tabelas.py e python -m alembic stamp head
fastapi dev main.py
```

## Como rodar o frontend

```powershell
cd frontend
npm install
npm run dev
```

O frontend foi desenvolvido com React e mantém dados de demonstração em memória. O backend
oferece uma API FastAPI com persistência MySQL; a integração com o frontend é uma etapa posterior.
