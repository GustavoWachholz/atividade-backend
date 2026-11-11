from sqlalchemy import delete, func, select

from modelos.solicitacao_produtor import SolicitacaoProdutor
from modelos.usuario import Usuario


# Apaga os pedidos vencidos e o pedido anterior do mesmo e-mail (pedir de novo substitui o antigo).
# Não dá commit: o serviço grava tudo junto com o pedido novo.
def limpar(sessao, agora, email):
    sessao.execute(delete(SolicitacaoProdutor).where(
        (SolicitacaoProdutor.expira_em < agora) | (SolicitacaoProdutor.email == email)))


def contar_pendentes(sessao):
    return sessao.scalar(select(func.count()).select_from(SolicitacaoProdutor))


def adicionar(sessao, dados):
    solicitacao = SolicitacaoProdutor(**dados)
    sessao.add(solicitacao)
    sessao.flush()
    return solicitacao


# with_for_update trava o pedido: duas confirmações ao mesmo tempo não contam a mesma tentativa nem criam
# dois produtores. O SQLite dos testes ignora a trava.
def buscar_para_confirmar(sessao, solicitacao_id):
    consulta = select(SolicitacaoProdutor).where(SolicitacaoProdutor.id == solicitacao_id).with_for_update()
    return sessao.scalar(consulta)


def apagar(sessao, solicitacao):
    sessao.delete(solicitacao)
    sessao.commit()


# O código certo cria o produtor e apaga o pedido no mesmo commit: o código não vale uma segunda vez.
def criar_produtor(sessao, solicitacao):
    usuario = Usuario(nome=solicitacao.nome, email=solicitacao.email, tipo="produtor",
                      senha_hash=solicitacao.senha_hash)
    sessao.add(usuario)
    sessao.delete(solicitacao)
    sessao.commit()
    sessao.refresh(usuario)
    return usuario
