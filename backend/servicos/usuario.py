import hmac
import logging

from sqlalchemy.exc import IntegrityError

import configuracao
from repositorios import usuario as repositorio_usuario
from seguranca import gerar_hash, ler_token, verificar_senha
from servicos.excecoes import CodigoDeSuporteInvalido, EmailEmUso

registro = logging.getLogger(__name__)


# A senha é convertida em hash antes de chegar ao repositório.
# O cadastro público cria sempre assinante; o produtor só entra pelo modo suporte (cadastrar_produtor).
def cadastrar(sessao, dados):
    return _gravar(sessao, dados, "assinante")


# O modo suporte: o código precisa bater com o CODIGO_DE_SUPORTE do .env.
# Com a variável vazia, a rota fica desligada e recusa sempre.
# hmac.compare_digest compara no mesmo tempo, acertando ou não, para o tempo da resposta não dar pistas.
# O log guarda só o resultado: nem o código nem o e-mail vão para lá.
def cadastrar_produtor(sessao, dados):
    codigo = configuracao.CODIGO_DE_SUPORTE
    if not codigo or not hmac.compare_digest(dados.codigo_suporte.encode(), codigo.encode()):
        registro.warning("Modo suporte: código recusado no cadastro de produtor.")
        raise CodigoDeSuporteInvalido("Código de suporte inválido.")
    produtor = _gravar(sessao, dados, "produtor")
    registro.warning("Modo suporte: produtor %s cadastrado.", produtor.id)
    return produtor


def _gravar(sessao, dados, tipo):
    if repositorio_usuario.buscar_por_email(sessao, dados.email) is not None:
        raise EmailEmUso("Já existe um usuário com esse e-mail.")
    try:
        return repositorio_usuario.salvar(sessao, {
            "nome": dados.nome,
            "email": dados.email,
            "tipo": tipo,
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
