from sqlalchemy.exc import IntegrityError

from repositorios import produto as repositorio_produto
from servicos.excecoes import ProdutoIndisponivel, ProdutoRepetido


def listar(sessao, somente_ativos=False):
    return repositorio_produto.listar(sessao, somente_ativos)


# Devolve o objeto do modelo, ou None para a rota responder 404.
def buscar_por_id(sessao, produto_id):
    return repositorio_produto.buscar_por_id(sessao, produto_id)


# O serviço confere o nome antes, para dar uma frase clara. O índice único do banco segura o caso de
# dois cadastros iguais ao mesmo tempo: o IntegrityError vira a mesma recusa.
def _gravar(sessao, gravar, nome):
    try:
        return gravar()
    except IntegrityError:
        sessao.rollback()
        raise ProdutoRepetido(f"Já existe um produto chamado {nome}.")


def cadastrar(sessao, dados):
    existente = repositorio_produto.buscar_por_nome(sessao, dados.nome)
    if existente is not None:
        raise ProdutoRepetido(f"Já existe um produto chamado {existente.nome}.")
    return _gravar(sessao, lambda: repositorio_produto.salvar(sessao, {"nome": dados.nome}), dados.nome)


# Renomear muda o nome em todas as semanas, porque o estoque e as cestas guardam só o id.
# Desativar tira o produto das listas novas; o que já foi colhido ou separado continua valendo.
def editar(sessao, produto, dados):
    if dados.nome is not None:
        existente = repositorio_produto.buscar_por_nome(sessao, dados.nome)
        if existente is not None and existente.id != produto.id:
            raise ProdutoRepetido(f"Já existe um produto chamado {existente.nome}.")
        produto.nome = dados.nome
    if dados.ativo is not None:
        produto.ativo = dados.ativo
    return _gravar(sessao, lambda: repositorio_produto.atualizar(sessao, produto), produto.nome)


# Usado pelo estoque: só um produto que existe e está ativo entra numa colheita nova.
def buscar_ativo(sessao, produto_id):
    produto = repositorio_produto.buscar_por_id(sessao, produto_id)
    if produto is None:
        raise ProdutoIndisponivel("Esse produto não está no catálogo.")
    if not produto.ativo:
        raise ProdutoIndisponivel(f"{produto.nome} está desativado no catálogo.")
    return produto
