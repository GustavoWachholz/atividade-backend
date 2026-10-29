"""Hash de senha com Argon2, criação/leitura de tokens JWT e os grupos de usuário com suas permissões."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from configuracao import obter_configuracao

hasher = PasswordHash.recommended()
configuracao = obter_configuracao()

# Sem a chave, o /login quebraria com erro 500. Parar logo na subida, como o banco.py faz com a URL.
if not configuracao["chave_do_token"]:
    raise RuntimeError("Preencha CHAVE_DO_TOKEN no backend/.env antes de iniciar a API.")


def gerar_hash(senha: str) -> str:
    """Gera o hash que será armazenado no cadastro, com sal aleatório."""
    return hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Confere a senha informada usando o hash armazenado."""
    return hasher.verify(senha, senha_hash)


# Fabricar a pulseira: o token leva o id do usuário e uma validade de uma hora.
def criar_token(usuario_id: int):
    validade = datetime.now(timezone.utc) + timedelta(minutes=60)  # agora mais uma hora
    dados = {"sub": str(usuario_id), "exp": validade}              # quem é, e quando vence
    return jwt.encode(dados, configuracao["chave_do_token"], algorithm="HS256")


# Conferir a pulseira: devolve o id do usuário ou None se o token for inválido.
# options={"require": [...]} recusa o token sem sub ou sem exp com InvalidTokenError, e o
# ValueError pega o sub que não é um número. Os dois casos davam erro 500, e não 401.
def ler_token(token: str):
    try:
        dados = jwt.decode(token, configuracao["chave_do_token"], algorithms=["HS256"],
                           options={"require": ["sub", "exp"]})
        return int(dados["sub"])            # o id de quem fez a requisição
    except jwt.InvalidTokenError:          # lacre falso, pulseira vencida ou sem sub
        return None
    except ValueError:                      # sub que não é um número
        return None


# ─── [NOVO · grupos] ─────────────────────────────────────────────────────────────────────
# Assunto novo, fora das aulas: grupos de usuário com permissões.
# Cada persona da cartilha é um GRUPO, e cada grupo tem um conjunto de PERMISSÕES.
# Antes a rota perguntava "qual é o seu tipo?". Agora ela pergunta "o seu grupo tem esta permissão?".
# Se um dia o produtor precisar de algo novo, muda só esta tabela, e não cada rota.
# O nome do grupo é o valor da coluna `tipo` do usuário (assinante ou produtor),
# por isso não precisou de tabela nova nem de migration.

# [NOVO · grupos] As permissões usam o formato "recurso:ação" e dizem o que cada uma libera:
#   conta:ver          GET /usuarios/eu
#   cestas:pedir       POST /cestas
#   cestas:ver         GET /cestas, GET /cestas/{id} e GET /cestas/{id}/produtos
#   cestas:ver_todas   ver as cestas de qualquer assinante. Sem ela, vê só as próprias
#   cestas:aprovar     PATCH /cestas/{id}/aprovar e /reprovar (decidir o pedido)
#   cestas:concluir    PATCH /cestas/{id}/concluir
#   produtos:separar   POST /cestas/{id}/produtos
#   estoque:cadastrar  POST /estoques (a colheita da semana)
#   estoque:ver        GET /estoques (o que há na semana, e quais tamanhos estão liberados)
# `{...}` com valores soltos é um set (conjunto): não repete itens e responde rápido ao `in`.
GRUPOS = {
    # Aline: pede a cesta e acompanha só as dela.
    # Ela também vê o estoque, para saber o que vem na semana, mas não cadastra.
    "assinante": {"conta:ver", "cestas:pedir", "cestas:ver", "estoque:ver"},
    # Vanderlei: vê todas as cestas, separa os produtos e cadastra a colheita.
    "produtor": {"conta:ver", "cestas:ver", "cestas:ver_todas", "cestas:aprovar", "cestas:concluir",
                 "produtos:separar", "estoque:cadastrar", "estoque:ver"},
}


# [NOVO · grupos] Confere se o grupo do usuário tem a permissão.
# `.get(..., set())` devolve um conjunto vazio para um grupo que não está na tabela,
# então quem não tem grupo conhecido não tem permissão nenhuma (negar por padrão).
def tem_permissao(usuario, permissao: str) -> bool:
    return permissao in GRUPOS.get(usuario.tipo, set())
# ─── [FIM NOVO · grupos] ─────────────────────────────────────────────────────────────────
