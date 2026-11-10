from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.produto import ProdutoCriacao, ProdutoEdicao, ProdutoResposta
# [NOVO · grupos] catalogo:ver para os dois grupos e catalogo:editar só para o produtor.
from rotas.autenticacao import exigir_editar_catalogo, exigir_ver_catalogo
from servicos import produto as servico_produto
from servicos.excecoes import ProdutoRepetido

router = APIRouter(prefix="/produtos", tags=["Catálogo de produtos"])


# ativos=true devolve só os ativos, para as listas de escolha. Sem o filtro, vem o catálogo inteiro.
@router.get("", response_model=list[ProdutoResposta],
            summary="Listar o catálogo de produtos",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão catalogo:ver"}})
def listar_produtos(ativos: bool = False, usuario=Depends(exigir_ver_catalogo),
                    sessao: Session = Depends(obter_sessao)):
    """Lista os produtos em ordem alfabética."""
    return servico_produto.listar(sessao, ativos)


@router.post("", response_model=ProdutoResposta, status_code=201,
             summary="Cadastrar um produto no catálogo",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "O grupo de quem está logado não tem a permissão catalogo:editar"},
                        409: {"description": "Já existe um produto com esse nome, sem contar maiúsculas"}})
def cadastrar_produto(dados: ProdutoCriacao, usuario=Depends(exigir_editar_catalogo),
                      sessao: Session = Depends(obter_sessao)):
    """Cria o produto, que passa a valer em todas as semanas."""
    try:
        return servico_produto.cadastrar(sessao, dados)
    except ProdutoRepetido as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# Não há DELETE: desativar ({"ativo": false}) preserva o histórico das cestas.
@router.patch("/{produto_id}", response_model=ProdutoResposta,
              summary="Renomear, desativar ou reativar um produto",
              responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                         403: {"description": "O grupo de quem está logado não tem a permissão catalogo:editar"},
                         404: {"description": "O produto não existe"},
                         409: {"description": "Já existe outro produto com esse nome"}})
def editar_produto(produto_id: int, dados: ProdutoEdicao, usuario=Depends(exigir_editar_catalogo),
                   sessao: Session = Depends(obter_sessao)):
    """Muda o nome ou a situação do produto em todas as semanas."""
    produto = servico_produto.buscar_por_id(sessao, produto_id)
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    try:
        return servico_produto.editar(sessao, produto, dados)
    except ProdutoRepetido as erro:
        raise HTTPException(status_code=409, detail=str(erro))
