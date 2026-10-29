from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.estoque import EstoqueCriacao, EstoqueDaSemanaResposta, EstoqueResposta
# [NOVO · grupos] Uma exigir_ por permissão: estoque:cadastrar e estoque:ver.
from rotas.autenticacao import exigir_cadastrar_estoque, exigir_ver_estoque
from servicos import estoque as servico_estoque

router = APIRouter(prefix="/estoques", tags=["Estoque"])


# O produtor cadastra o que colheu na semana. Se o produto já está na semana, a quantidade soma.
@router.post("", response_model=EstoqueResposta, status_code=201,
             summary="Cadastrar a colheita da semana",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "O grupo de quem está logado não tem a permissão estoque:cadastrar"}})
def cadastrar_estoque(dados: EstoqueCriacao, usuario=Depends(exigir_cadastrar_estoque),  # [NOVO · grupos]
                      sessao: Session = Depends(obter_sessao)):
    """Cria o produto no estoque da semana, ou soma a quantidade se ele já foi cadastrado."""
    return servico_estoque.cadastrar(sessao, dados)


# semana: date é um parâmetro de consulta obrigatório (?semana=2026-10-19); data inválida dá 422.
@router.get("", response_model=EstoqueDaSemanaResposta,
            summary="Mostrar o estoque da semana",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão estoque:ver"}})
def consultar_estoque(semana: date, usuario=Depends(exigir_ver_estoque),  # [NOVO · grupos]
                      sessao: Session = Depends(obter_sessao)):
    """Lista os produtos colhidos com o disponível de cada um e os tamanhos de cesta liberados."""
    return servico_estoque.resumo_da_semana(sessao, semana)
