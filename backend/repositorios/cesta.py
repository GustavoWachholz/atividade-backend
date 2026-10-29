from datetime import timedelta

from sqlalchemy import select

from modelos.cesta import Cesta


# O banco filtra antes de paginar. A semana mais recente vem primeiro (.desc() inverte a ordem),
# para o pedido novo e a semana atual aparecerem na primeira página; o id desempata entre páginas.
# semana chega já como a segunda-feira (o serviço converte) e pega a semana inteira, até domingo.
def listar(sessao, tamanho=None, assinante_id=None, pagina=1, semana=None):
    consulta = select(Cesta).order_by(Cesta.semana.desc(), Cesta.id.desc())
    if tamanho is not None:
        consulta = consulta.where(Cesta.tamanho == tamanho)
    if assinante_id is not None:
        consulta = consulta.where(Cesta.assinante_id == assinante_id)
    if semana is not None:
        consulta = consulta.where(Cesta.semana >= semana, Cesta.semana < semana + timedelta(days=7))
    # limit traz dez cestas; offset pula os registros das páginas anteriores.
    consulta = consulta.limit(10).offset((pagina - 1) * 10)
    return sessao.scalars(consulta).all()


# get consulta a chave primária e devolve None quando a cesta não existe.
def buscar_por_id(sessao, cesta_id):
    return sessao.get(Cesta, cesta_id)


# A situação inicial é definida internamente e não vem da requisição.
def salvar(sessao, dados):
    cesta = Cesta(**dados)
    sessao.add(cesta)
    sessao.commit()
    sessao.refresh(cesta)
    return cesta


# Grava a mudança de situação que o serviço já fez no objeto (aprovar, reprovar ou concluir).
def atualizar(sessao, cesta):
    sessao.commit()
    sessao.refresh(cesta)
    return cesta


# Todas as cestas de uma semana, sem paginar: o serviço soma os limites das que estão em separação.
# semana é a segunda-feira; >= e < pegam de segunda a domingo, mesmo se a cesta guardou outro dia.
def listar_da_semana(sessao, semana):
    consulta = select(Cesta).where(Cesta.semana >= semana, Cesta.semana < semana + timedelta(days=7))
    return sessao.scalars(consulta).all()
