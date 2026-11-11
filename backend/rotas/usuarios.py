from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.usuario import CodigoDeAtivacao, SolicitacaoProdutorResposta, UsuarioCriacao, UsuarioResposta
from rotas.autenticacao import exigir_ver_conta  # [NOVO · grupos] substitui obter_usuario_atual
from servicos import usuario as servico_usuario
from servicos.excecoes import (CodigoDeAtivacaoInvalido, EmailEmUso, EmailIndisponivel, MuitasSolicitacoes,
                               SolicitacaoInexistente, SolicitacaoVencida)

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


# Depends entrega a sessão da requisição; o serviço transforma a senha em hash.
@router.post("", response_model=UsuarioResposta, status_code=201,
             summary="Cadastrar uma assinante",
             responses={409: {"description": "Já existe um usuário com esse e-mail"},
                        422: {"description": "Dados inválidos, ou um campo a mais, como o tipo"}})
def cadastrar_usuario(dados: UsuarioCriacao, sessao: Session = Depends(obter_sessao)):
    """Rota pública: cria sempre uma assinante. A resposta não traz senha nem hash."""
    try:
        return servico_usuario.cadastrar(sessao, dados)
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# A ativação do produtor, em dois passos. Os 5 cliques no logo da tela de login só mostram o formulário;
# quem protege é o código que vai para o e-mail do administrador.
# include_in_schema=False tira as rotas do /docs, para elas não aparecerem para quem só está olhando.
# 202: o pedido foi aceito, mas o produtor ainda não existe.
@router.post("/produtor/solicitacoes", response_model=SolicitacaoProdutorResposta, status_code=202,
             include_in_schema=False)
def solicitar_produtor(dados: UsuarioCriacao, sessao: Session = Depends(obter_sessao)):
    try:
        return servico_usuario.solicitar_produtor(sessao, dados)
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro))
    except MuitasSolicitacoes as erro:
        raise HTTPException(status_code=429, detail=str(erro))
    except EmailIndisponivel as erro:
        raise HTTPException(status_code=503, detail=str(erro))


# 403 código errado · 404 pedido inexistente ou já usado · 409 e-mail ocupado · 410 código vencido.
@router.post("/produtor/solicitacoes/{solicitacao_id}/confirmar", response_model=UsuarioResposta,
             status_code=201, include_in_schema=False)
def confirmar_produtor(solicitacao_id: str, dados: CodigoDeAtivacao, sessao: Session = Depends(obter_sessao)):
    try:
        return servico_usuario.confirmar_produtor(sessao, solicitacao_id, dados.codigo)
    except CodigoDeAtivacaoInvalido as erro:
        raise HTTPException(status_code=403, detail=str(erro))
    except SolicitacaoInexistente as erro:
        raise HTTPException(status_code=404, detail=str(erro))
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro))
    except SolicitacaoVencida as erro:
        raise HTTPException(status_code=410, detail=str(erro))


# Mostra quem está logado; o Swagger exibe o cadeado para esta rota.
@router.get("/eu", response_model=UsuarioResposta,
            summary="Mostrar quem está logado",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão conta:ver"}})
def perfil_atual(usuario=Depends(exigir_ver_conta)):  # [NOVO · grupos]
    """O front usa o tipo devolvido aqui para escolher a tela de cada perfil."""
    return usuario
