from modelos.produto_separado import ProdutoSeparado


# Um commit grava o produto e a situação alterada na mesma sessão pelo serviço.
def salvar(sessao, cesta_id, dados):
    produto = ProdutoSeparado(cesta_id=cesta_id, **dados)
    sessao.add(produto)
    sessao.commit()
    sessao.refresh(produto)
    return produto
