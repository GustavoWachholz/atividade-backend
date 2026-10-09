from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.produto_separado import ProdutoSeparadoCriacao, ProdutoSeparadoResposta
from servicos import produto_separado as servico_produto

router = APIRouter(prefix="/cestas", tags=["Produtos separados"])


# A rota informa a recusa sem inserir dados quando a capacidade seria excedida.
@router.post("/{cesta_id}/produtos", response_model=ProdutoSeparadoResposta, status_code=201)
def separar_produto(cesta_id: int, dados: ProdutoSeparadoCriacao,
                    sessao: Session = Depends(obter_sessao)):
    resultado = servico_produto.separar(sessao, cesta_id, dados)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Cesta não encontrada.")
    if isinstance(resultado, str):
        raise HTTPException(status_code=409, detail=resultado)
    return resultado


# Uma cesta vazia retorna lista vazia; uma cesta ausente retorna 404.
@router.get("/{cesta_id}/produtos", response_model=list[ProdutoSeparadoResposta])
def listar_produtos(cesta_id: int, sessao: Session = Depends(obter_sessao)):
    resultado = servico_produto.listar_por_cesta(sessao, cesta_id)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Cesta não encontrada.")
    return resultado
