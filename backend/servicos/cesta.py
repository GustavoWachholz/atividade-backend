from esquemas.cesta import CestaResposta
from repositorios import cesta as repositorio_cesta

# A capacidade é regra de negócio e não uma coluna da tabela.
LIMITES = {"pequena": 5, "media": 8, "grande": 12}


# O dono da cesta vem do token: a rota já exigiu o perfil assinante com exigir_assinante.
def criar(sessao, dados, usuario):
    return repositorio_cesta.salvar(sessao, {
        "assinante_id": usuario.id,
        "semana": dados.semana,
        "tamanho": dados.tamanho,
        "situacao": "pedida",
    })


# A assinante vê só as cestas dela; o produtor vê todas e pode filtrar por assinante.
def listar(sessao, usuario, tamanho=None, assinante_id=None, pagina=1):
    if usuario.tipo == "assinante":
        return repositorio_cesta.listar(sessao, tamanho, usuario.id, pagina)
    return repositorio_cesta.listar(sessao, tamanho, assinante_id, pagina)


# Devolve o objeto do modelo, ou None para a rota responder 404.
def buscar_por_id(sessao, cesta_id):
    return repositorio_cesta.buscar_por_id(sessao, cesta_id)


# Os campos de capacidade são calculados a partir de todos os produtos da cesta.
def detalhar(cesta):
    ocupado = sum(produto.quantidade for produto in cesta.produtos_separados)
    limite = LIMITES[cesta.tamanho]
    return {
        **CestaResposta.model_validate(cesta).model_dump(),
        "limite_itens": limite,
        "quantidade_ocupada": ocupado,
        "quantidade_restante": limite - ocupado,
    }
