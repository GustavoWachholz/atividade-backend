from sqlalchemy import select

from modelos.estoque import Estoque


# Os produtos colhidos numa semana, em ordem alfabética para a lista da tela.
def listar_da_semana(sessao, semana):
    consulta = select(Estoque).where(Estoque.semana == semana).order_by(Estoque.nome_produto)
    return sessao.scalars(consulta).all()


# Trava as linhas do estoque da semana até o commit (ou até a sessão fechar sem commit).
# with_for_update() vira SELECT ... FOR UPDATE: outra requisição que tentar travar a mesma
# semana espera a primeira terminar. Assim dois pedidos, ou duas separações, ao mesmo tempo
# não leem o mesmo "cabe mais 3" e gravam juntos. order_by(id) trava sempre na mesma ordem.
def travar_semana(sessao, semana):
    consulta = select(Estoque).where(Estoque.semana == semana).order_by(Estoque.id).with_for_update()
    return sessao.scalars(consulta).all()


# Um produto da semana pelo nome, ou None. A comparação é feita pelo MySQL.
def buscar(sessao, semana, nome_produto):
    consulta = select(Estoque).where(Estoque.semana == semana,
                                     Estoque.nome_produto == nome_produto)
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
