from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.painel import PainelResposta
from rotas.autenticacao import exigir_ver_painel
from servicos import painel as servico_painel

router = APIRouter(prefix="/painel", tags=["Painel do produtor"])


# semana aceita qualquer dia e vira a segunda-feira, como no estoque e nas cestas.
@router.get("", response_model=PainelResposta,
            summary="Resumo da semana para a tela inicial do produtor",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão painel:ver"}})
def ver_painel(semana: date, usuario=Depends(exigir_ver_painel), sessao: Session = Depends(obter_sessao)):
    """Estoque, pedidos por situação, itens previstos, fila, separação, preferências e a semana anterior."""
    return servico_painel.da_semana(sessao, semana)
