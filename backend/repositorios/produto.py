from sqlalchemy import func, select

from modelos.produto import Produto


# O catálogo em ordem alfabética. somente_ativos serve às listas de escolha do estoque.
def listar(sessao, somente_ativos=False):
    consulta = select(Produto).order_by(Produto.nome)
    if somente_ativos:
        consulta = consulta.where(Produto.ativo.is_(True))
    return sessao.scalars(consulta).all()


# get consulta a chave primária e devolve None quando o produto não existe.
def buscar_por_id(sessao, produto_id):
    return sessao.get(Produto, produto_id)


# Procura pelo nome sem diferenciar maiúscula, a mesma regra do índice único uq_produtos_nome.
def buscar_por_nome(sessao, nome):
    consulta = select(Produto).where(func.lower(Produto.nome) == nome.lower())
    return sessao.scalar(consulta)


def salvar(sessao, dados):
    produto = Produto(**dados)
    sessao.add(produto)
    sessao.commit()
    sessao.refresh(produto)
    return produto


# O serviço já mudou o objeto: atualizar é só dar commit.
def atualizar(sessao, produto):
    sessao.commit()
    sessao.refresh(produto)
    return produto
