from sqlalchemy import select

from modelos.cesta import Cesta


# O banco filtra antes de paginar; semana e id mantêm a ordem estável entre páginas.
def listar(sessao, tamanho=None, assinante_id=None, pagina=1):
    consulta = select(Cesta).order_by(Cesta.semana, Cesta.id)
    if tamanho is not None:
        consulta = consulta.where(Cesta.tamanho == tamanho)
    if assinante_id is not None:
        consulta = consulta.where(Cesta.assinante_id == assinante_id)
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
