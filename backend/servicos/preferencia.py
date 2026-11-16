from repositorios import preferencia as repositorio_preferencia
from servicos.excecoes import ProdutoForaDasPreferencias

# Como a coluna quer vira a opção da tela, e o contrário.
OPCOES = {True: "quero", False: "nao_quero", None: "tanto_faz"}
VALORES = {opcao: valor for valor, opcao in OPCOES.items()}


# Todos os produtos do estoque, cada um com a marcação da assinante (tanto_faz quando não marcou).
def listar(sessao, assinante_id):
    marcados = {p.produto_id: p.quer
                for p in repositorio_preferencia.listar_de_assinantes(sessao, [assinante_id])}
    return [{"produto_id": produto.id, "nome_produto": produto.nome,
             "preferencia": OPCOES[marcados.get(produto.id)]}
            for produto in repositorio_preferencia.listar_produtos_do_estoque(sessao)]


# Só vale marcar um produto que está na lista da tela: ativo e já colhido em alguma semana.
def definir(sessao, assinante_id, produto_id, opcao):
    produtos = {produto.id for produto in repositorio_preferencia.listar_produtos_do_estoque(sessao)}
    if produto_id not in produtos:
        raise ProdutoForaDasPreferencias("Esse produto não está no estoque da horta.")
    repositorio_preferencia.gravar(sessao, assinante_id, produto_id, VALORES[opcao])
    return listar(sessao, assinante_id)


# As marcações de várias assinantes, para a montagem da cesta:
# {assinante_id: {"quer": {produto_id, ...}, "nao_quer": {produto_id, ...}}}.
def das_assinantes(sessao, assinante_ids):
    resultado = {assinante_id: {"quer": set(), "nao_quer": set()} for assinante_id in assinante_ids}
    for preferencia in repositorio_preferencia.listar_de_assinantes(sessao, list(assinante_ids)):
        chave = "quer" if preferencia.quer else "nao_quer"
        resultado[preferencia.assinante_id][chave].add(preferencia.produto_id)
    return resultado
