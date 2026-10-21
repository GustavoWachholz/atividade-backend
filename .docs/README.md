# Cesta do Vale · o projeto em dez linhas

- **O que é:** pedido e separação de cestas semanais de uma horta comunitária (Cartilha 3, em `docs/CARTILHA.md`).
- **Perfis:** `assinante` (Aline, no celular) pede e acompanha as cestas. `produtor` (Vanderlei, no computador) separa os produtos.
- **Regra:** limite de 5, 8 ou 12 itens por tamanho. O primeiro produto muda a cesta de `pedida` para `em_separacao`.
- **Back:** FastAPI, SQLAlchemy 2 e MySQL, Alembic, `pwdlib` (Argon2) e PyJWT. Em `backend/`, rode `fastapi dev main.py`.
- **Front:** React com Vite. Em `frontend/`, rode `npm run dev`, que abre em `http://localhost:5173`.
- **Banco do zero:** `python criar_tabelas.py` e depois `alembic stamp head`. O passo a passo completo está no `README.md` da raiz.
- **Onde está cada coisa:** camadas em `arquitetura.md`, escolhas em `decisoes.md`, pendências em `proximos-passos.md`, fases em `roadmap.md`.
- **Para a IA:** leia esta pasta antes de qualquer tarefa e atualize antes de terminar. As regras estão no `REGRAS.md`.
