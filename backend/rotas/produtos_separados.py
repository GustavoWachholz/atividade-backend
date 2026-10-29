from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.produto_separado import ProdutoSeparadoCriacao, ProdutoSeparadoResposta
from rotas.autenticacao import exigir_separar_produto  # [NOVO · grupos] substitui exigir_produtor
from rotas.cestas import cesta_existente
from servicos import produto_separado as servico_produto
from servicos.excecoes import CestaNaoEmSeparacao, EstoqueInsuficiente, LimiteDaCestaExcedido

router = APIRouter(prefix="/cestas", tags=["Produtos separados"])


# Só o grupo produtor separa produtos. [NOVO · grupos] O exigir_separar_produto vem antes,
# então quem não tem a permissão produtos:separar recebe 403 mesmo que a cesta não exista.
# A regra recusa com exceção, e a rota traduz para 409: o limite da cesta e a falta no estoque.
@router.post("/{cesta_id}/produtos", response_model=ProdutoSeparadoResposta, status_code=201,
             summary="Separar um produto na cesta",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "O grupo de quem está logado não tem a permissão produtos:separar"},
                        404: {"description": "A cesta não existe"},
                        409: {"description": "A cesta não está em separação, a quantidade passa do limite dela, ou do que sobrou do produto no estoque da semana"}})
def separar_produto(dados: ProdutoSeparadoCriacao, usuario=Depends(exigir_separar_produto),
                    cesta=Depends(cesta_existente),
                    sessao: Session = Depends(obter_sessao)):
    """Grava o produto numa cesta já aprovada e em separação."""
    try:
        return servico_produto.separar(sessao, cesta, dados)
    except CestaNaoEmSeparacao as erro:
        raise HTTPException(status_code=409, detail=str(erro))
    except LimiteDaCestaExcedido as erro:
        raise HTTPException(status_code=409, detail=str(erro))
    except EstoqueInsuficiente as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# O produtor vê os produtos de qualquer cesta; a assinante, só os da cesta dela.
@router.get("/{cesta_id}/produtos", response_model=list[ProdutoSeparadoResposta],
            summary="Listar os produtos separados de uma cesta",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "Sem a permissão cestas:ver, ou a cesta é de outra assinante"},
                       404: {"description": "A cesta não existe"}})
def listar_produtos(cesta=Depends(cesta_existente)):
    """Lista o que o produtor já separou na cesta."""
    return servico_produto.listar_por_cesta(cesta)
