"""Geração e verificação de hashes de senha com Argon2."""

from pwdlib import PasswordHash

hasher = PasswordHash.recommended()


def gerar_hash(senha: str) -> str:
    """Gera o hash que será armazenado no cadastro, com sal aleatório."""
    return hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Confere a senha informada usando o hash armazenado."""
    return hasher.verify(senha, senha_hash)
