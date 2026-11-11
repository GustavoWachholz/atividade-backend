"""Exceções de negócio dos serviços."""


class EmailEmUso(Exception):
    """O endereço de e-mail informado já pertence a um usuário."""


class EmailIndisponivel(Exception):
    """O envio de e-mail não está configurado, ou o serviço de e-mail falhou."""


class MuitasSolicitacoes(Exception):
    """Já há o máximo de pedidos de cadastro de produtor esperando o código."""


class SolicitacaoInexistente(Exception):
    """O pedido de cadastro de produtor não existe, já foi usado ou foi cancelado."""


class SolicitacaoVencida(Exception):
    """O código de ativação passou do prazo."""


class CodigoDeAtivacaoInvalido(Exception):
    """O código de ativação não confere."""


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


class ProdutoRepetido(Exception):
    """Já existe no catálogo um produto com esse nome, sem contar maiúsculas."""


class ProdutoIndisponivel(Exception):
    """O produto não está no catálogo, ou está desativado."""


class SemanaForaDoPedido(Exception):
    """O pedido só vale para a semana atual."""


class IaIndisponivel(Exception):
    """O modelo não respondeu, a resposta veio fora do formato ou falta a chave."""


class NadaParaPreencher(Exception):
    """A semana não tem cesta aprovada com espaço, ou não tem estoque disponível."""


class ConfirmacaoRecusada(Exception):
    """Um item do rascunho conflita com a cesta ou com o estoque, e nada foi gravado."""
