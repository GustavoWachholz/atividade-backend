import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError

from repositorios import solicitacao_produtor as repositorio_solicitacao
from repositorios import usuario as repositorio_usuario
from seguranca import gerar_hash, ler_token, verificar_senha
from servicos import email as servico_email
from servicos.excecoes import (CodigoDeAtivacaoInvalido, EmailEmUso, MuitasSolicitacoes,
                               SolicitacaoInexistente, SolicitacaoVencida)

registro = logging.getLogger(__name__)


# A senha é convertida em hash antes de chegar ao repositório.
# O cadastro público cria sempre assinante; o produtor só entra pela ativação (solicitar_produtor).
def cadastrar(sessao, dados):
    return _gravar(sessao, dados, "assinante")


# A ativação do produtor: o código vale 30 minutos, aceita 5 tentativas e é usado uma vez só.
# No máximo 3 pedidos esperam ao mesmo tempo, para a rota pública não lotar o e-mail do administrador.
VALIDADE_DO_CODIGO = timedelta(minutes=30)
TENTATIVAS_DO_CODIGO = 5
PEDIDOS_PENDENTES = 3


# Agora em UTC, sem fuso, o mesmo formato da coluna expira_em.
def _agora():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Grava o pedido e manda o código ao administrador. Se o e-mail falhar, nada fica gravado.
# O código só existe aqui e no e-mail: o banco guarda o hash, e o log não o registra.
def solicitar_produtor(sessao, dados):
    if repositorio_usuario.buscar_por_email(sessao, dados.email) is not None:
        raise EmailEmUso("Já existe um usuário com esse e-mail.")
    agora = _agora()
    repositorio_solicitacao.limpar(sessao, agora, dados.email)
    if repositorio_solicitacao.contar_pendentes(sessao) >= PEDIDOS_PENDENTES:
        sessao.rollback()
        raise MuitasSolicitacoes("Há muitos pedidos de produtor esperando o código. Tente de novo mais tarde.")
    codigo = f"{secrets.randbelow(10 ** 6):06d}"
    solicitacao = repositorio_solicitacao.adicionar(sessao, {
        "id": secrets.token_urlsafe(24),
        "nome": dados.nome,
        "email": dados.email,
        "senha_hash": gerar_hash(dados.senha),
        "codigo_hash": gerar_hash(codigo),
        "expira_em": agora + VALIDADE_DO_CODIGO,
    })
    try:
        servico_email.enviar_codigo_ao_admin(dados.nome, dados.email, codigo, solicitacao.expira_em)
    except Exception:
        sessao.rollback()
        raise
    sessao.commit()
    registro.warning("Ativação de produtor: pedido criado, código enviado ao administrador.")
    return {"id": solicitacao.id, "expira_em": solicitacao.expira_em.replace(tzinfo=timezone.utc),
            "tentativas": TENTATIVAS_DO_CODIGO}


# Confere o código. Errado soma uma tentativa e, na última, cancela o pedido. Certo cria o produtor.
def confirmar_produtor(sessao, solicitacao_id, codigo):
    solicitacao = repositorio_solicitacao.buscar_para_confirmar(sessao, solicitacao_id)
    if solicitacao is None:
        raise SolicitacaoInexistente("Esse pedido não existe mais. Peça o cadastro de novo.")
    if solicitacao.expira_em < _agora():
        repositorio_solicitacao.apagar(sessao, solicitacao)
        raise SolicitacaoVencida("O código venceu. Peça o cadastro de novo.")
    if not verificar_senha(codigo, solicitacao.codigo_hash):
        solicitacao.tentativas += 1
        restantes = TENTATIVAS_DO_CODIGO - solicitacao.tentativas
        if restantes <= 0:
            repositorio_solicitacao.apagar(sessao, solicitacao)
            registro.warning("Ativação de produtor: pedido cancelado depois de %s erros.", TENTATIVAS_DO_CODIGO)
            raise CodigoDeAtivacaoInvalido("Código incorreto. O pedido foi cancelado: peça o cadastro de novo.")
        sessao.commit()
        raise CodigoDeAtivacaoInvalido(
            f"Código incorreto. {'Resta 1 tentativa' if restantes == 1 else f'Restam {restantes} tentativas'}.")
    if repositorio_usuario.buscar_por_email(sessao, solicitacao.email) is not None:
        repositorio_solicitacao.apagar(sessao, solicitacao)
        raise EmailEmUso("Já existe um usuário com esse e-mail.")
    produtor = repositorio_solicitacao.criar_produtor(sessao, solicitacao)
    registro.warning("Ativação de produtor: produtor %s criado.", produtor.id)
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
