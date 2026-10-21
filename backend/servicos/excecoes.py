"""Exceções de negócio dos serviços."""


class EmailEmUso(Exception):
    """O endereço de e-mail informado já pertence a um usuário."""


class LimiteDaCestaExcedido(Exception):
    """O produto separado faria a soma das quantidades passar do limite do tamanho da cesta."""
