from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from modelos.usuario import Usuario


# O filtro opcional permite selecionar o perfil sem autenticação.
def listar(sessao, tipo=None):
    consulta = select(Usuario)
    if tipo is not None:
        consulta = consulta.where(Usuario.tipo == tipo)
    return sessao.scalars(consulta.order_by(Usuario.id)).all()


# A ausência é representada por None para o serviço decidir o resultado.
def buscar_por_id(sessao, usuario_id):
    return sessao.get(Usuario, usuario_id)


# Disponível para o cadastro e para a futura autenticação.
def buscar_por_email(sessao, email):
    consulta = select(Usuario).where(Usuario.email == email.strip().lower())
    return sessao.scalar(consulta)


# commit confirma o cadastro e refresh busca os valores gerados pelo banco.
def salvar(sessao, dados):
    usuario = Usuario(**dados)
    sessao.add(usuario)
    try:
        sessao.commit()
    except SQLAlchemyError:
        sessao.rollback()
        raise
    sessao.refresh(usuario)
    return usuario
