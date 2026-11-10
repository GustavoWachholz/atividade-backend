from sqlalchemy import select

from modelos.estoque import Estoque
from modelos.produto import Produto


# Os produtos colhidos numa semana, em ordem alfabética para a lista da tela.
# O nome está no catálogo: o join com produtos permite ordenar por ele.
def listar_da_semana(sessao, semana):
    consulta = (select(Estoque).join(Estoque.produto).where(Estoque.semana == semana)
                .order_by(Produto.nome))
    return sessao.scalars(consulta).all()


# Trava as linhas do estoque da semana até o commit (ou até a sessão fechar sem commit).
# with_for_update() vira SELECT ... FOR UPDATE: outra requisição que tentar travar a mesma
# semana espera a primeira terminar. Assim dois pedidos, ou duas separações, ao mesmo tempo
# não leem o mesmo "cabe mais 3" e gravam juntos. order_by(id) trava sempre na mesma ordem.
# of=Estoque trava só as linhas do estoque, e não os produtos do catálogo que vêm no mesmo SELECT.
def travar_semana(sessao, semana):
    consulta = (select(Estoque).where(Estoque.semana == semana).order_by(Estoque.id)
                .with_for_update(of=Estoque))
    return sessao.scalars(consulta).all()


# Um produto da semana pelo id do catálogo, ou None.
def buscar(sessao, semana, produto_id):
    consulta = select(Estoque).where(Estoque.semana == semana, Estoque.produto_id == produto_id)
    return sessao.scalar(consulta)


# Grava um produto novo no estoque da semana.
def salvar(sessao, dados):
    estoque = Estoque(**dados)
    sessao.add(estoque)
    sessao.commit()
    sessao.refresh(estoque)
    return estoque


# O serviço já mudou a quantidade no objeto: atualizar é só dar commit.
def atualizar(sessao, estoque):
    sessao.commit()
    sessao.refresh(estoque)
    return estoque
