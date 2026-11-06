from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from esquemas.cesta import TamanhoCesta


# O produtor escolhe a semana; qualquer dia dela serve, e o serviço converte para a segunda-feira.
class PrePreenchimentoPedido(BaseModel):
    model_config = ConfigDict(extra="forbid")
    semana: date = Field(description="Um dia da semana que será pré-preenchida", examples=["2026-11-02"])


# O formato que o modelo precisa devolver. Sem restrição de valor de propósito: quem confere
# quantidade, cesta e produto é o serviço, porque a resposta do modelo não é confiável.
class ItemSugerido(BaseModel):
    cesta_id: int
    produto: str
    quantidade: int


class SugestaoDoModelo(BaseModel):
    itens: list[ItemSugerido]


# Um produto do rascunho, já dentro da cesta dele.
class ItemDoRascunho(BaseModel):
    produto: str
    quantidade: int


# A cesta do rascunho. O nome da assinante é só para a tela: ele nunca vai para o modelo.
class CestaDoRascunho(BaseModel):
    cesta_id: int
    tamanho: TamanhoCesta
    assinante: str
    espaco_livre: int = Field(description="Quanto cabe além do que já foi gravado na cesta")
    itens: list[ItemDoRascunho]


class ProdutoDoRascunho(BaseModel):
    nome_produto: str
    disponivel: int = Field(description="O que ainda não foi gravado em nenhuma cesta")


# Item que o serviço recusou mesmo depois da correção, com o motivo para a tela.
class ItemDescartado(BaseModel):
    cesta_id: int
    produto: str
    quantidade: int
    motivo: str


# Nada disto está gravado: é o rascunho que o produtor vai revisar.
class RascunhoResposta(BaseModel):
    semana: date
    cestas: list[CestaDoRascunho]
    estoque: list[ProdutoDoRascunho]
    descartados: list[ItemDescartado]
    cestas_pedidas: int = Field(description="Cestas ainda não aprovadas, que ficaram fora da sugestão")


# Um item revisado pelo produtor. strict=True recusa 1.5, "2" e True.
class ItemConfirmado(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    cesta_id: int = Field(gt=0)
    produto: str = Field(min_length=1, max_length=100)
    quantidade: int = Field(gt=0, strict=True)


class ConfirmacaoDoRascunho(BaseModel):
    model_config = ConfigDict(extra="forbid")
    semana: date
    itens: list[ItemConfirmado] = Field(min_length=1)


class ConfirmacaoResposta(BaseModel):
    itens_gravados: int
    cestas_atualizadas: int
