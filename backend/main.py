from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from configuracao import ORIGEM_FRONTEND
from rotas import cestas, produtos_separados, usuarios

# O ponto de entrada somente cria o aplicativo, configura CORS e liga os routers.
app = FastAPI(title="Cesta do Vale")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ORIGEM_FRONTEND],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(usuarios.router, prefix="/usuarios")
app.include_router(cestas.router)
app.include_router(produtos_separados.router)
