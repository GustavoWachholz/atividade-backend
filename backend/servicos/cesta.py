from datetime import date, timedelta

from esquemas.cesta import CestaResposta
from repositorios import cesta as repositorio_cesta
from repositorios import estoque as repositorio_estoque
from seguranca import tem_permissao  # [NOVO · grupos]
from servicos.excecoes import CestaIncompleta, CestaNaoPedida, CestaNaoEmSeparacao, SemanaForaDoPedido

# A capacidade é regra de negócio e não uma coluna da tabela.
LIMITES = {"pequena": 5, "media": 8, "grande": 12}
# O nome de cada tamanho com acento, para a frase de recusa que aparece na tela.
NOMES = {"pequena": "pequena", "media": "média", "grande": "grande"}


# A segunda-feira da semana de uma data. weekday() vai de 0 (segunda) a 6 (domingo).
# Toda conta por semana passa por aqui, para uma cesta gravada numa quinta cair na semana certa.
def segunda_da_semana(data):
    return data - timedelta(days=data.weekday())


# Quanto da colheita da semana já está comprometido com as cestas aprovadas (em separação).
# O pedido não confere o estoque: o produtor decide na aprovação, e o estoque só trava na separação.
# Cada cesta aprovada reserva o limite inteiro do tamanho dela, e a conta serve de resumo para o produtor.
# Fica aqui, e não no serviço do estoque, porque usa os LIMITES; o servicos/estoque.py importa daqui,
# e assim os dois não se importam em círculo.
def itens_livres_na_semana(sessao, semana):
    semana = segunda_da_semana(semana)
    colhido = sum(item.quantidade for item in repositorio_estoque.listar_da_semana(sessao, semana))
    reservado = sum(LIMITES[cesta.tamanho] for cesta in repositorio_cesta.listar_da_semana(sessao, semana)
                    if cesta.situacao == "em_separacao")
    return colhido, reservado, colhido - reservado


# O dono da cesta vem do token: a rota já exigiu a permissão cestas:pedir com exigir_pedir_cesta.
# O pedido nasce como pedida e cai para o produtor aprovar, mesmo sem estoque lançado.
# A semana é gravada sempre na segunda-feira, como o estoque e como diz o DER,
# mesmo que a requisição mande outro dia daquela semana.
# O pedido só vale para a semana atual: semana passada ou futura é recusada (a rota responde 409).
def conferir_semana_do_pedido(semana):
    if segunda_da_semana(semana) != segunda_da_semana(date.today()):
        raise SemanaForaDoPedido("Só é possível pedir a cesta da semana atual.")


def criar(sessao, dados, usuario):
    conferir_semana_do_pedido(dados.semana)
    return repositorio_cesta.salvar(sessao, {
        "assinante_id": usuario.id,
        "semana": segunda_da_semana(dados.semana),
        "tamanho": dados.tamanho,
        "situacao": "pedida",
    })


# Quem pode ver todas as cestas (o produtor) usa o filtro por assinante. Os outros veem só as próprias.
# [NOVO · grupos] A decisão pergunta pela permissão cestas:ver_todas, e não mais pelo tipo do usuário.
# O filtro semana aceita qualquer dia e vira a segunda-feira daquela semana.
def listar(sessao, usuario, tamanho=None, assinante_id=None, pagina=1, semana=None):
    if semana is not None:
        semana = segunda_da_semana(semana)
    if not tem_permissao(usuario, "cestas:ver_todas"):
        return repositorio_cesta.listar(sessao, tamanho, usuario.id, pagina, semana)
    return repositorio_cesta.listar(sessao, tamanho, assinante_id, pagina, semana)


# Devolve o objeto do modelo, ou None para a rota responder 404.
def buscar_por_id(sessao, cesta_id):
    return repositorio_cesta.buscar_por_id(sessao, cesta_id)


# O produtor aprova o pedido: a cesta entra em separação. Só vale para cesta pedida.
def aprovar(sessao, cesta):
    if cesta.situacao != "pedida":
        raise CestaNaoPedida("Só é possível aprovar uma cesta que está pedida.")
    cesta.situacao = "em_separacao"
    return repositorio_cesta.atualizar(sessao, cesta)


# O produtor reprova o pedido: a cesta fica recusada e não recebe produtos. Só vale para cesta pedida.
def reprovar(sessao, cesta):
    if cesta.situacao != "pedida":
        raise CestaNaoPedida("Só é possível reprovar uma cesta que está pedida.")
    cesta.situacao = "recusada"
    return repositorio_cesta.atualizar(sessao, cesta)


# O produtor marca a cesta como concluída. Precisa estar em separação e cheia:
# a soma dos produtos tem de ser igual ao limite do tamanho (5, 8 ou 12).
def concluir(sessao, cesta):
    if cesta.situacao != "em_separacao":
        raise CestaNaoEmSeparacao("Só é possível concluir uma cesta que está em separação.")
    ocupado = sum(produto.quantidade for produto in cesta.produtos_separados)
    restante = LIMITES[cesta.tamanho] - ocupado
    if restante > 0:
        raise CestaIncompleta(f"A cesta ainda não está cheia. Faltam {restante} itens.")
    cesta.situacao = "concluida"
    return repositorio_cesta.atualizar(sessao, cesta)


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
