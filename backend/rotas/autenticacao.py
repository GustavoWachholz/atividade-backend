"""Rotas de autenticação: o /login, quem está logado e as funções exigir_ de cada permissão de grupo."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from banco import obter_sessao
from esquemas.usuario import Token
from seguranca import criar_token, tem_permissao  # [NOVO · grupos] tem_permissao
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


# ─── [NOVO · grupos] ─────────────────────────────────────────────────────────────────────
# Uma função exigir_ por PERMISSÃO, no lugar das antigas exigir_assinante e exigir_produtor.
# Cada uma depende da obter_usuario_atual (sem token, 401) e consulta a tabela GRUPOS do
# seguranca.py. Se o grupo não tem a permissão, devolve 403: a pessoa provou quem é, mas não pode.
# Usamos uma função por permissão, e não uma "fábrica" exigir(permissao), para seguir o molde
# do curso: o REGRAS veta função que devolve função.

# [NOVO · grupos] GET /usuarios/eu: os dois grupos podem ver a própria conta.
def exigir_ver_conta(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "conta:ver"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode ver a conta")
    return usuario


# [NOVO · grupos] POST /cestas: só o grupo assinante pede cesta.
def exigir_pedir_cesta(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "cestas:pedir"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode pedir cestas")
    return usuario


# [NOVO · grupos] Rotas de leitura de cestas e produtos: os dois grupos podem ver.
# Quais cestas cada um vê é outra pergunta, respondida pela permissão cestas:ver_todas.
def exigir_ver_cestas(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "cestas:ver"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode ver cestas")
    return usuario


# [NOVO · grupos] POST /cestas/{id}/produtos: só o grupo produtor separa produtos.
def exigir_separar_produto(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "produtos:separar"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode separar produtos")
    return usuario


# [NOVO · grupos] PATCH /cestas/{id}/aprovar e /reprovar: só o produtor decide o pedido.
def exigir_aprovar_cesta(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "cestas:aprovar"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode aprovar ou reprovar pedidos")
    return usuario


# [NOVO · grupos] PATCH /cestas/{id}/concluir: só o produtor conclui a cesta.
def exigir_concluir_cesta(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "cestas:concluir"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode concluir cestas")
    return usuario


# [NOVO · grupos] POST /estoques: só o grupo produtor cadastra a colheita.
def exigir_cadastrar_estoque(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "estoque:cadastrar"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode cadastrar o estoque")
    return usuario


# [NOVO · grupos] GET /estoques: os dois grupos veem o estoque da semana.
def exigir_ver_estoque(usuario=Depends(obter_usuario_atual)):
    if not tem_permissao(usuario, "estoque:ver"):
        raise HTTPException(status_code=403, detail="Seu grupo não pode ver o estoque")
    return usuario
# ─── [FIM NOVO · grupos] ─────────────────────────────────────────────────────────────────
