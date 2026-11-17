from datetime import timedelta

from repositorios import cesta as repositorio_cesta
from repositorios import estoque as repositorio_estoque
from repositorios import preferencia as repositorio_preferencia
from repositorios import produto_separado as repositorio_produto
from servicos.cesta import LIMITES, RESERVAM, segunda_da_semana

SITUACOES = ["pedida", "em_separacao", "concluida", "recusada", "cancelada"]
# As assinantes que ainda contam na semana: pediram e não foram recusadas nem cancelaram.
ATIVAS = {"pedida", "em_separacao", "concluida"}
# Quantas cestas pedidas a fila mostra, das mais antigas para as mais novas.
TAMANHO_DA_FILA = 5


# Os números de uma semana que se comparam com a semana anterior. Nada aqui é coluna:
# tudo sai das cestas, do estoque e dos produtos separados daquela semana.
def _numeros(sessao, semana):
    cestas = repositorio_cesta.listar_da_semana(sessao, semana)
    return {
        "pedidos": sum(1 for cesta in cestas if cesta.situacao != "cancelada"),
        "colhido": sum(item.quantidade for item in repositorio_estoque.listar_da_semana(sessao, semana)),
        "separado": sum(p.quantidade for p in repositorio_produto.listar_da_semana(sessao, semana)),
    }


# Quantas das cestas pedidas cabem nos itens livres, aprovando das mais antigas para as mais novas.
# É uma conta de apoio: o produtor continua livre para aprovar em outra ordem.
def _pedidas_que_cabem(pedidas, livres):
    cabem = 0
    for cesta in pedidas:
        if LIMITES[cesta.tamanho] > livres:
            break
        livres -= LIMITES[cesta.tamanho]
        cabem += 1
    return cabem


# Por produto: quantas assinantes da semana marcaram quero e não quero, e o disponível no estoque.
# A falta é quando há mais "quero" do que unidades livres; a sobra é um produto colhido que ninguém
# quer, ou que tem mais "não quero" do que "quero".
def _preferencias(sessao, assinantes, estoque):
    contagem = {}
    for preferencia in repositorio_preferencia.listar_de_assinantes(sessao, list(assinantes)):
        if not preferencia.produto.ativo:
            continue
        item = contagem.setdefault(preferencia.produto_id, {
            "produto_id": preferencia.produto_id, "nome_produto": preferencia.produto.nome,
            "quer": 0, "nao_quer": 0})
        item["quer" if preferencia.quer else "nao_quer"] += 1
    for item in contagem.values():
        colhido = estoque.get(item["produto_id"])
        item["colhido_na_semana"] = colhido is not None
        item["disponivel"] = colhido["disponivel"] if colhido else 0
    populares = sorted(contagem.values(), key=lambda i: (-i["quer"], i["nao_quer"], i["nome_produto"]))

    falta = [i for i in populares if i["quer"] > i["disponivel"]]
    sobra = []
    for produto_id, colhido in estoque.items():
        marcas = contagem.get(produto_id, {"quer": 0, "nao_quer": 0})
        if colhido["disponivel"] > 0 and marcas["nao_quer"] > marcas["quer"]:
            sobra.append({"produto_id": produto_id, "nome_produto": colhido["nome_produto"],
                          "quer": marcas["quer"], "nao_quer": marcas["nao_quer"],
                          "colhido_na_semana": True, "disponivel": colhido["disponivel"]})
    sobra.sort(key=lambda i: (i["quer"] - i["nao_quer"], i["nome_produto"]))
    return populares, falta, sobra


# O painel do produtor: o resumo da semana em um GET só, para a tela inicial não fazer dez buscas.
def da_semana(sessao, semana):
    semana = segunda_da_semana(semana)
    cestas = repositorio_cesta.listar_da_semana(sessao, semana)
    separados = repositorio_produto.listar_da_semana(sessao, semana)

    estoque = {}
    for linha in repositorio_estoque.listar_da_semana(sessao, semana):
        separado = sum(p.quantidade for p in separados if p.produto_id == linha.produto_id)
        estoque[linha.produto_id] = {
            "produto_id": linha.produto_id, "nome_produto": linha.nome_produto,
            "colhido": linha.quantidade, "separado": separado, "disponivel": linha.quantidade - separado}
    colhido = sum(item["colhido"] for item in estoque.values())

    saem = [cesta for cesta in cestas if cesta.situacao in RESERVAM]
    previstos = sum(LIMITES[cesta.tamanho] for cesta in saem)
    # Concluídas já tiraram os itens do estoque; em separação reservam o limite inteiro do tamanho.
    livres = max(colhido - previstos, 0)
    pedidas = sorted((c for c in cestas if c.situacao == "pedida"), key=lambda c: (c.criado_em, c.id))

    em_separacao = []
    for cesta in sorted((c for c in cestas if c.situacao == "em_separacao"), key=lambda c: c.id):
        ocupado = sum(p.quantidade for p in cesta.produtos_separados)
        em_separacao.append({"id": cesta.id, "nome_assinante": cesta.assinante.nome, "tamanho": cesta.tamanho,
                             "limite_itens": LIMITES[cesta.tamanho], "quantidade_ocupada": ocupado})

    assinantes = {cesta.assinante_id for cesta in cestas if cesta.situacao in ATIVAS}
    populares, falta, sobra = _preferencias(sessao, assinantes, estoque)

    return {
        "semana": semana,
        "estoque": sorted(estoque.values(), key=lambda i: i["nome_produto"].lower()),
        "total_colhido": colhido,
        "pedidos": {situacao: sum(1 for c in cestas if c.situacao == situacao) for situacao in SITUACOES},
        "itens_previstos": previstos,
        "itens_das_pedidas": sum(LIMITES[cesta.tamanho] for cesta in pedidas),
        "itens_livres": livres,
        "pedidas_que_cabem": _pedidas_que_cabem(pedidas, livres),
        "itens_separados": sum(p.quantidade for cesta in saem for p in cesta.produtos_separados),
        "cestas_em_separacao": em_separacao,
        "fila": [{"id": c.id, "nome_assinante": c.assinante.nome, "tamanho": c.tamanho, "criado_em": c.criado_em}
                 for c in pedidas[:TAMANHO_DA_FILA]],
        "assinantes_na_semana": len(assinantes),
        "populares": populares,
        "alertas_falta": falta,
        "alertas_sobra": sobra,
        "semana_atual": _numeros(sessao, semana),
        "semana_anterior": _numeros(sessao, semana - timedelta(days=7)),
    }
