"""Base para as futuras rotas de autenticação.

Os endpoints serão adicionados quando a autenticação for implementada.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Autenticação"])
