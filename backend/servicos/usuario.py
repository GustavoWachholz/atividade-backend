from sqlalchemy.exc import IntegrityError

from repositorios import usuario as repositorio_usuario
from seguranca import gerar_hash, ler_token, verificar_senha
from servicos.excecoes import EmailEmUso


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


# Confere o e-mail e a senha; devolve o usuário ou None.
def autenticar(sessao, email, senha):
    usuario = repositorio_usuario.buscar_por_email(sessao, email)
    if usuario is None:
        return None
    if usuario.senha_hash is None:
        return None
    if not verificar_senha(senha, usuario.senha_hash):
        return None
    return usuario


# Lê o token e busca o usuário no banco; devolve None se o token for inválido.
def usuario_do_token(sessao, token: str):
    usuario_id = ler_token(token)
    if usuario_id is None:
        return None
    return repositorio_usuario.buscar_por_id(sessao, usuario_id)
