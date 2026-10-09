from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.usuario import TipoUsuario, UsuarioCriacao, UsuarioResposta
from servicos import usuario as servico_usuario
from servicos.excecoes import EmailEmUso

router = APIRouter(tags=["Usuários"])


# Depends entrega a sessão da requisição; o serviço controla a criação do usuário.
@router.post("", response_model=UsuarioResposta, status_code=201)
def cadastrar_usuario(dados: UsuarioCriacao, sessao: Session = Depends(obter_sessao)):
    try:
        return servico_usuario.cadastrar(sessao, dados)
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro)) from erro


# O filtro por tipo facilita escolher um perfil na interface.
@router.get("", response_model=list[UsuarioResposta])
def listar_usuarios(tipo: TipoUsuario | None = None, sessao: Session = Depends(obter_sessao)):
    return servico_usuario.listar(sessao, tipo)
