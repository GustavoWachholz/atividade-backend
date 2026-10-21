"""Rotas de autenticação: o /login, quem está logado e as funções de perfil."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from banco import obter_sessao
from esquemas.usuario import Token
from seguranca import criar_token
from servicos import usuario as servico_usuario

router = APIRouter(tags=["Autenticação"])

# esquema_oauth procura o cabeçalho Authorization: Bearer e entrega o token.
esquema_oauth = OAuth2PasswordBearer(tokenUrl="login")


# O formulário OAuth2 usa username e password; o username é o e-mail do usuário.
@router.post("/login", response_model=Token,
             summary="Entrar com e-mail e senha",
             responses={401: {"description": "E-mail ou senha incorretos"}})
def login(formulario: OAuth2PasswordRequestForm = Depends(),
          sessao=Depends(obter_sessao)):
    """Devolve o token JWT, válido por 60 minutos. No campo username vai o e-mail."""
    usuario = servico_usuario.autenticar(sessao, formulario.username,
                                        formulario.password)
    if usuario is None:                             # e-mail ou senha: a mesma resposta
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {"access_token": criar_token(usuario.id), "token_type": "bearer"}


# Depends encadeia: o esquema_oauth extrai o token, e esta função confere no banco.
def obter_usuario_atual(token: str = Depends(esquema_oauth),
                        sessao=Depends(obter_sessao)):
    usuario = servico_usuario.usuario_do_token(sessao, token)
    if usuario is None:
        raise HTTPException(status_code=401, detail="Token inválido ou vencido")
    return usuario


# Depende da obter_usuario_atual; devolve 403 se o tipo não for assinante.
def exigir_assinante(usuario=Depends(obter_usuario_atual)):
    if usuario.tipo != "assinante":
        raise HTTPException(status_code=403, detail="Só o assinante pode fazer isso")
    return usuario


# Depende da obter_usuario_atual; devolve 403 se o tipo não for produtor.
def exigir_produtor(usuario=Depends(obter_usuario_atual)):
    if usuario.tipo != "produtor":
        raise HTTPException(status_code=403, detail="Só o produtor pode fazer isso")
    return usuario
