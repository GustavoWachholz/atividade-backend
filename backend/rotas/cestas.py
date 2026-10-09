from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.cesta import CestaCriacao, CestaDetalheResposta, CestaResposta, TamanhoCesta
from servicos import cesta as servico_cesta

router = APIRouter(prefix="/cestas", tags=["Cestas"])


# A rota traduz os resultados do serviço em respostas HTTP consistentes.
@router.post("", response_model=CestaResposta, status_code=201)
def criar_cesta(dados: CestaCriacao, sessao: Session = Depends(obter_sessao)):
    resultado = servico_cesta.criar(sessao, dados)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if isinstance(resultado, str):
        raise HTTPException(status_code=409, detail=resultado)
    return resultado


# Query(ge=1) recusa páginas menores que um; os filtros podem ser usados juntos.
@router.get("", response_model=list[CestaResposta])
def listar_cestas(tamanho: TamanhoCesta | None = None,
                  assinante_id: int | None = Query(default=None, gt=0),
                  pagina: int = Query(default=1, ge=1),
                  sessao: Session = Depends(obter_sessao)):
    return servico_cesta.listar(sessao, tamanho, assinante_id, pagina)


# O detalhe apresenta os cálculos necessários para acompanhar a capacidade.
@router.get("/{cesta_id}", response_model=CestaDetalheResposta)
def consultar_cesta(cesta_id: int, sessao: Session = Depends(obter_sessao)):
    resultado = servico_cesta.buscar_por_id(sessao, cesta_id)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Cesta não encontrada.")
    return resultado
