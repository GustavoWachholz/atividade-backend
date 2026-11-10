from datetime import timedelta

from sqlalchemy import select

from modelos.cesta import Cesta
from modelos.produto_separado import ProdutoSeparado


# Os produtos já separados nas cestas de uma semana. O .join liga cada produto à cesta dele
# pela chave estrangeira, para filtrar pela semana, que é coluna da cesta. semana é a segunda-feira.
def listar_da_semana(sessao, semana):
    consulta = select(ProdutoSeparado).join(Cesta).where(
        Cesta.semana >= semana, Cesta.semana < semana + timedelta(days=7))
    return sessao.scalars(consulta).all()


# Grava vários produtos num commit só. Se algo falhar, nenhum fica gravado, e a trava da semana
# só é solta no fim. O salvar abaixo não serve aqui, porque dá um commit por produto.
def salvar_varios(sessao, itens):
    for item in itens:
        sessao.add(ProdutoSeparado(cesta_id=item["cesta_id"], nome_produto=item["produto"],
                                   quantidade=item["quantidade"]))
    sessao.commit()


# Um commit grava o produto e a situação alterada na mesma sessão pelo serviço.
def salvar(sessao, cesta_id, dados):
    produto = ProdutoSeparado(cesta_id=cesta_id, **dados)
    sessao.add(produto)
    sessao.commit()
    sessao.refresh(produto)
    return produto
