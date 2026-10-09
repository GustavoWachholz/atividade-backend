"""Exceções de negócio dos serviços."""


class EmailEmUso(Exception):
    """O endereço de e-mail informado já pertence a um usuário."""
