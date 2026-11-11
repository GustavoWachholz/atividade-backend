from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.usuario import ProdutorCriacao, UsuarioCriacao, UsuarioResposta
from rotas.autenticacao import exigir_ver_conta  # [NOVO · grupos] substitui obter_usuario_atual
from servicos import usuario as servico_usuario
from servicos.excecoes import CodigoDeSuporteInvalido, EmailEmUso

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


# O modo suporte: cria um produtor quando o código bate com o CODIGO_DE_SUPORTE do .env.
# Os 5 cliques no logo da tela de login só mostram o formulário; quem protege é este código.
# include_in_schema=False tira a rota do /docs, para ela não aparecer para quem só está olhando.
@router.post("/produtor", response_model=UsuarioResposta, status_code=201, include_in_schema=False)
def cadastrar_produtor(dados: ProdutorCriacao, sessao: Session = Depends(obter_sessao)):
    try:
        return servico_usuario.cadastrar_produtor(sessao, dados)
    except CodigoDeSuporteInvalido as erro:
        raise HTTPException(status_code=403, detail=str(erro))
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# Mostra quem está logado; o Swagger exibe o cadeado para esta rota.
@router.get("/eu", response_model=UsuarioResposta,
            summary="Mostrar quem está logado",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão conta:ver"}})
def perfil_atual(usuario=Depends(exigir_ver_conta)):  # [NOVO · grupos]
    """O front usa o tipo devolvido aqui para escolher a tela de cada perfil."""
    return usuario
