from sqlalchemy import exists, select

from modelos.estoque import Estoque
from modelos.preferencia import Preferencia
from modelos.produto import Produto


# Os produtos que a assinante pode marcar: os ativos do catálogo que já entraram no estoque
# em alguma semana. Um produto cadastrado e nunca colhido ainda não aparece.
def listar_produtos_do_estoque(sessao):
    colhido = exists().where(Estoque.produto_id == Produto.id)
    consulta = select(Produto).where(Produto.ativo.is_(True), colhido).order_by(Produto.nome)
    return sessao.scalars(consulta).all()


# As marcações de uma assinante, ou de várias de uma vez (a montagem da semana usa as de todas).
def listar_de_assinantes(sessao, assinante_ids):
    if not assinante_ids:
        return []
    consulta = select(Preferencia).where(Preferencia.assinante_id.in_(assinante_ids))
    return sessao.scalars(consulta).all()


def buscar(sessao, assinante_id, produto_id):
    consulta = select(Preferencia).where(Preferencia.assinante_id == assinante_id,
                                         Preferencia.produto_id == produto_id)
    return sessao.scalar(consulta)


# Grava a marcação nova, ou troca a que já existe. quer=None apaga: o produto volta a "tanto faz".
def gravar(sessao, assinante_id, produto_id, quer):
    preferencia = buscar(sessao, assinante_id, produto_id)
    if quer is None:
        if preferencia is not None:
            sessao.delete(preferencia)
    elif preferencia is None:
        sessao.add(Preferencia(assinante_id=assinante_id, produto_id=produto_id, quer=quer))
    else:
        preferencia.quer = quer
    sessao.commit()
