from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.usuario import UsuarioCriacao, UsuarioResposta
from rotas.autenticacao import exigir_ver_conta  # [NOVO · grupos] substitui obter_usuario_atual
from servicos import usuario as servico_usuario
from servicos.excecoes import EmailEmUso

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


# Depends entrega a sessão da requisição; o serviço transforma a senha em hash.
@router.post("", response_model=UsuarioResposta, status_code=201,
             summary="Cadastrar um usuário",
             responses={409: {"description": "Já existe um usuário com esse e-mail"}})
def cadastrar_usuario(dados: UsuarioCriacao, sessao: Session = Depends(obter_sessao)):
    """Rota pública: cria a assinante ou o produtor. A resposta não traz senha nem hash."""
    try:
        return servico_usuario.cadastrar(sessao, dados)
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
