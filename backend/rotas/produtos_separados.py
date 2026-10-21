from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.produto_separado import ProdutoSeparadoCriacao, ProdutoSeparadoResposta
from rotas.autenticacao import exigir_produtor
from rotas.cestas import cesta_existente
from servicos import produto_separado as servico_produto
from servicos.excecoes import LimiteDaCestaExcedido

router = APIRouter(prefix="/cestas", tags=["Produtos separados"])


# Só o produtor separa produtos. O exigir_produtor vem antes, então a assinante recebe 403
# mesmo que a cesta não exista. A regra recusa com exceção, e a rota traduz para 409.
@router.post("/{cesta_id}/produtos", response_model=ProdutoSeparadoResposta, status_code=201,
             summary="Separar um produto na cesta",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "Quem está logado não é produtor"},
                        404: {"description": "A cesta não existe"},
                        409: {"description": "A quantidade passa do limite da cesta"}})
def separar_produto(dados: ProdutoSeparadoCriacao, usuario=Depends(exigir_produtor),
                    cesta=Depends(cesta_existente),
                    sessao: Session = Depends(obter_sessao)):
    """Grava o produto e, se for o primeiro, muda a cesta para em separação."""
    try:
        return servico_produto.separar(sessao, cesta, dados)
    except LimiteDaCestaExcedido as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# O produtor vê os produtos de qualquer cesta; a assinante, só os da cesta dela.
@router.get("/{cesta_id}/produtos", response_model=list[ProdutoSeparadoResposta],
            summary="Listar os produtos separados de uma cesta",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "A cesta é de outra assinante"},
                       404: {"description": "A cesta não existe"}})
def listar_produtos(cesta=Depends(cesta_existente)):
    """Lista o que o produtor já separou na cesta."""
    return servico_produto.listar_por_cesta(cesta)
