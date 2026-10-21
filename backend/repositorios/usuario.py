from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from modelos.usuario import Usuario


# A ausência é representada por None para o serviço decidir o resultado.
def buscar_por_id(sessao, usuario_id):
    return sessao.get(Usuario, usuario_id)


# Usada no cadastro, para recusar e-mail repetido, e no login, para achar quem entra.
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
