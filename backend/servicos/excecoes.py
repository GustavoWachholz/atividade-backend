"""Exceções de negócio dos serviços."""


class EmailEmUso(Exception):
    """O endereço de e-mail informado já pertence a um usuário."""


class LimiteDaCestaExcedido(Exception):
    """O produto separado faria a soma das quantidades passar do limite do tamanho da cesta."""


class CestaNaoPedida(Exception):
    """Só uma cesta pedida pode ser aprovada ou reprovada."""


class CestaNaoEmSeparacao(Exception):
    """Só uma cesta em separação recebe produtos ou pode ser concluída."""


class CestaIncompleta(Exception):
    """A cesta só é concluída quando a soma dos produtos chega ao limite do tamanho."""


class EstoqueInsuficiente(Exception):
    """O produto não está no estoque da semana da cesta, ou a quantidade passa do que sobrou dele."""


class SemanaForaDoPedido(Exception):
    """O pedido só vale para a semana atual."""
