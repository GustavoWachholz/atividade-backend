from esquemas.cesta import CestaResposta
from repositorios import cesta as repositorio_cesta
from repositorios import usuario as repositorio_usuario

# A capacidade é regra de negócio e não uma coluna da tabela.
LIMITES = {"pequena": 5, "media": 8, "grande": 12}


# A ausência retorna None; recusas retornam uma mensagem para a rota avaliar.
def criar(sessao, dados):
    assinante = repositorio_usuario.buscar_por_id(sessao, dados.assinante_id)
    if assinante is None:
        return None
    if assinante.tipo != "assinante":
        return "A cesta deve pertencer a um usuário do tipo assinante."
    return repositorio_cesta.salvar(sessao, {**dados.model_dump(), "situacao": "pedida"})


# O serviço encaminha os filtros sem acessar os dados diretamente.
def listar(sessao, tamanho=None, assinante_id=None, pagina=1):
    return repositorio_cesta.listar(sessao, tamanho, assinante_id, pagina)


# Os campos de capacidade são calculados a partir de todos os produtos da cesta.
def buscar_por_id(sessao, cesta_id):
    cesta = repositorio_cesta.buscar_por_id(sessao, cesta_id)
    if cesta is None:
        return None
    # relationship permite ler os produtos associados sem filtrar uma lista em memória.
    produtos = cesta.produtos_separados
    ocupado = sum(produto.quantidade for produto in produtos)
    limite = LIMITES[cesta.tamanho]
    return {
        **CestaResposta.model_validate(cesta).model_dump(),
        "limite_itens": limite,
        "quantidade_ocupada": ocupado,
        "quantidade_restante": limite - ocupado,
    }
