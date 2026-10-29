from repositorios import estoque as repositorio_estoque
from repositorios import produto_separado as repositorio_produto
from servicos.cesta import LIMITES, segunda_da_semana
from servicos.estoque import disponivel_do_produto
from servicos.excecoes import CestaNaoEmSeparacao, EstoqueInsuficiente, LimiteDaCestaExcedido


# A cesta chega já conferida pela rota (existe e pode ser vista por quem pediu).
def listar_por_cesta(cesta):
    return cesta.produtos_separados


# A cesta precisa estar em separação, ou seja, já aprovada pelo produtor e ainda não concluída.
# A regra da cartilha: a soma das quantidades não passa do limite do tamanho.
# A situação não muda aqui: quem muda é a aprovação do pedido.
# A regra do estoque vem depois: o produto precisa ter sido colhido na semana da cesta,
# e a quantidade não pode passar do que sobrou dele depois das outras cestas.
# A trava da semana vem antes de somar os produtos: uma segunda separação simultânea espera
# esta gravar e só então lê a soma, já com o produto novo. Sem isso, a pequena chegava a 9 de 5.
def separar(sessao, cesta, dados):
    if cesta.situacao != "em_separacao":
        raise CestaNaoEmSeparacao("Só é possível separar produtos de uma cesta aprovada e em separação.")
    repositorio_estoque.travar_semana(sessao, segunda_da_semana(cesta.semana))
    produtos = cesta.produtos_separados
    ocupado = sum(produto.quantidade for produto in produtos)
    restante = LIMITES[cesta.tamanho] - ocupado
    if dados.quantidade > restante:
        raise LimiteDaCestaExcedido(
            f"A quantidade passa do limite da cesta. Cabem só mais {restante} itens.")
    estoque, disponivel = disponivel_do_produto(sessao, cesta.semana, dados.nome_produto)
    if estoque is None:
        raise EstoqueInsuficiente("Esse produto não foi colhido na semana desta cesta.")
    if dados.quantidade > disponivel:
        raise EstoqueInsuficiente(
            f"Não há {estoque.nome_produto} suficiente no estoque. Restam só {disponivel} unidades.")
    # O nome gravado é o do estoque, escrito igual ao cadastro, para as somas por produto baterem.
    return repositorio_produto.salvar(sessao, cesta.id,
                                      {**dados.model_dump(), "nome_produto": estoque.nome_produto})
