from sqlalchemy.exc import IntegrityError

from repositorios import usuario as repositorio_usuario
from security import gerar_hash
from servicos.excecoes import EmailEmUso


# O serviço entrega os perfis consultados pelo repositório à rota.
def listar(sessao, tipo=None):
    return repositorio_usuario.listar(sessao, tipo)


# A senha é convertida em hash antes de chegar ao repositório.
def cadastrar(sessao, dados):
    if repositorio_usuario.buscar_por_email(sessao, dados.email) is not None:
        raise EmailEmUso("Já existe um usuário com esse e-mail.")
    try:
        return repositorio_usuario.salvar(sessao, {
            "nome": dados.nome,
            "email": dados.email,
            "tipo": dados.tipo,
            "senha_hash": gerar_hash(dados.senha),
        })
    except IntegrityError as erro:
        if getattr(erro.orig, "errno", None) == 1062:
            raise EmailEmUso("Já existe um usuário com esse e-mail.") from erro
        raise
