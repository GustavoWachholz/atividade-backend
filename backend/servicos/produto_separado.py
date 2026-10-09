from repositorios import cesta as repositorio_cesta
from repositorios import produto_separado as repositorio_produto
from servicos.cesta import LIMITES


# Diferencia uma cesta inexistente de uma cesta existente sem produtos.
def listar_por_cesta(sessao, cesta_id):
    cesta = repositorio_cesta.buscar_por_id(sessao, cesta_id)
    if cesta is None:
        return None
    return cesta.produtos_separados


# A regra muda o objeto sem gravar; o repositório confirma cesta e produto juntos.
def separar(sessao, cesta_id, dados):
    cesta = repositorio_cesta.buscar_por_id(sessao, cesta_id)
    if cesta is None:
        return None
    produtos = cesta.produtos_separados
    ocupado = sum(produto.quantidade for produto in produtos)
    if ocupado + dados.quantidade > LIMITES[cesta.tamanho]:
        return "A quantidade informada ultrapassa o limite da cesta."
    if not produtos and cesta.situacao == "pedida":
        cesta.situacao = "em_separacao"
    return repositorio_produto.salvar(sessao, cesta_id, dados.model_dump())
