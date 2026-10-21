from repositorios import produto_separado as repositorio_produto
from servicos.cesta import LIMITES
from servicos.excecoes import LimiteDaCestaExcedido


# A cesta chega já conferida pela rota (existe e pode ser vista por quem pediu).
def listar_por_cesta(cesta):
    return cesta.produtos_separados


# A regra da cartilha: a soma das quantidades não passa do limite do tamanho,
# e o primeiro produto muda a situação. O repositório grava cesta e produto num commit só.
def separar(sessao, cesta, dados):
    produtos = cesta.produtos_separados
    ocupado = sum(produto.quantidade for produto in produtos)
    restante = LIMITES[cesta.tamanho] - ocupado
    if dados.quantidade > restante:
        raise LimiteDaCestaExcedido(
            f"A quantidade passa do limite da cesta. Cabem só mais {restante} itens.")
    if not produtos and cesta.situacao == "pedida":
        cesta.situacao = "em_separacao"
    return repositorio_produto.salvar(sessao, cesta.id, dados.model_dump())
