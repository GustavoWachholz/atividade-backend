"""Geração e verificação de hashes de senha com Argon2, e criação/leitura de tokens JWT."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from configuracao import obter_configuracao

hasher = PasswordHash.recommended()
configuracao = obter_configuracao()


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
def ler_token(token: str):
    try:
        dados = jwt.decode(token, configuracao["chave_do_token"], algorithms=["HS256"])
    except jwt.InvalidTokenError:          # lacre falso, ou pulseira vencida
        return None
    return int(dados["sub"])                # o id de quem fez a requisição
