from repositorios import estoque as repositorio_estoque
from repositorios import produto_separado as repositorio_produto
from servicos.cesta import LIMITES, itens_livres_na_semana, segunda_da_semana
from servicos.produto import buscar_ativo


# O produtor cadastra a colheita de um produto do catálogo, que precisa existir e estar ativo
# (senão ProdutoIndisponivel, que a rota traduz para 409). Se o produto já está na semana, a quantidade nova soma
# na linha que existe (a UniqueConstraint do modelo não deixa repetir semana e produto).
# O estoque é guardado sempre na segunda-feira, mesmo se a data enviada for outro dia da semana.
def cadastrar(sessao, dados):
    semana = segunda_da_semana(dados.semana)
    buscar_ativo(sessao, dados.produto_id)
    existente = repositorio_estoque.buscar(sessao, semana, dados.produto_id)
    if existente is not None:
        existente.quantidade = existente.quantidade + dados.quantidade
        return repositorio_estoque.atualizar(sessao, existente)
    return repositorio_estoque.salvar(sessao, {**dados.model_dump(), "semana": semana})


# O resumo da semana: por produto, o colhido, o já separado e o disponível,
# e no total, quantos itens ainda aceitam pedido e quais tamanhos estão liberados.
def resumo_da_semana(sessao, semana):
    semana = segunda_da_semana(semana)
    separados = repositorio_produto.listar_da_semana(sessao, semana)
    itens = []
    for estoque in repositorio_estoque.listar_da_semana(sessao, semana):
        separado = sum(p.quantidade for p in separados if p.produto_id == estoque.produto_id)
        itens.append({
            "produto_id": estoque.produto_id,
            "nome_produto": estoque.nome_produto,
            "colhido": estoque.quantidade,
            "separado": separado,
            "disponivel": estoque.quantidade - separado,
        })
    colhido, reservado, livres = itens_livres_na_semana(sessao, semana)
    return {
        "semana": semana,
        "itens": itens,
        "total_colhido": colhido,
        "total_reservado": reservado,
        "itens_livres": max(livres, 0),
        "tamanhos_liberados": [tamanho for tamanho, limite in LIMITES.items() if limite <= livres],
    }


# Quanto ainda sobra de um produto na semana. Devolve o objeto do estoque e o que sobrou,
# ou None e 0 quando o produto (pelo id do catálogo) não foi colhido naquela semana. A semana da cesta pode ser
# qualquer dia (cestas antigas guardaram o dia do pedido), por isso vira a segunda-feira.
def disponivel_do_produto(sessao, semana, produto_id):
    semana = segunda_da_semana(semana)
    estoque = repositorio_estoque.buscar(sessao, semana, produto_id)
    if estoque is None:
        return None, 0
    separado = sum(p.quantidade for p in repositorio_produto.listar_da_semana(sessao, semana)
                   if p.produto_id == produto_id)
    return estoque, estoque.quantidade - separado
