from datetime import date, datetime

from pydantic import BaseModel, Field

from esquemas.cesta import TamanhoCesta
from esquemas.estoque import ItemDoEstoque


# Quantas cestas da semana estão em cada situação.
class PedidosPorSituacao(BaseModel):
    pedida: int
    em_separacao: int
    concluida: int
    recusada: int
    cancelada: int


class CestaEmSeparacao(BaseModel):
    id: int
    nome_assinante: str
    tamanho: TamanhoCesta
    limite_itens: int
    quantidade_ocupada: int


# Uma cesta pedida que espera a decisão do produtor.
class CestaNaFila(BaseModel):
    id: int
    nome_assinante: str
    tamanho: TamanhoCesta
    criado_em: datetime


# As marcações das assinantes da semana para um produto, ao lado do que há no estoque.
class ProdutoNasPreferencias(BaseModel):
    produto_id: int
    nome_produto: str
    quer: int = Field(description="Assinantes da semana que marcaram Quero")
    nao_quer: int = Field(description="Assinantes da semana que marcaram Não quero")
    colhido_na_semana: bool
    disponivel: int = Field(description="O que ainda pode ir para uma cesta; 0 se não foi colhido")


class NumerosDaSemana(BaseModel):
    pedidos: int = Field(description="Cestas pedidas na semana, sem contar as canceladas")
    colhido: int
    separado: int


class PainelResposta(BaseModel):
    semana: date
    estoque: list[ItemDoEstoque]
    total_colhido: int
    pedidos: PedidosPorSituacao
    itens_previstos: int = Field(description="Soma dos limites das cestas em separação e concluídas")
    itens_das_pedidas: int = Field(description="Quantos itens sairiam a mais se todas as pedidas fossem aprovadas")
    itens_livres: int = Field(description="Colhido menos os itens previstos")
    pedidas_que_cabem: int = Field(description="Quantas pedidas cabem nos itens livres, das mais antigas para as novas")
    itens_separados: int = Field(description="O que já foi separado nas cestas em separação e concluídas")
    cestas_em_separacao: list[CestaEmSeparacao]
    fila: list[CestaNaFila] = Field(description="As cestas pedidas mais antigas, até cinco")
    assinantes_na_semana: int = Field(description="Assinantes com cesta pedida, em separação ou concluída")
    populares: list[ProdutoNasPreferencias]
    alertas_falta: list[ProdutoNasPreferencias] = Field(description="Mais Quero do que unidades disponíveis")
    alertas_sobra: list[ProdutoNasPreferencias] = Field(description="Colhido, com sobra e mais Não quero do que Quero")
    semana_atual: NumerosDaSemana
    semana_anterior: NumerosDaSemana
