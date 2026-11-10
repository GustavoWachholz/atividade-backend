from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from esquemas.cesta import TamanhoCesta


# O produtor informa a semana, o produto do catálogo e quantas unidades colheu.
# extra="forbid" recusa campos a mais, como um nome_produto digitado.
class EstoqueCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    semana: date = Field(description="Segunda-feira da semana da colheita", examples=["2026-10-19"])
    produto_id: int = Field(gt=0, strict=True, description="O id do produto no catálogo", examples=[1])
    # strict=True recusa 1.5, "2" e True, como na quantidade do produto separado.
    quantidade: int = Field(gt=0, strict=True, description="Unidades colhidas", examples=[10])


# from_attributes lê o objeto SQLAlchemy Estoque na resposta do cadastro.
# O nome_produto vem do catálogo (a propriedade do modelo), e não de uma coluna do estoque.
class EstoqueResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    semana: date
    produto_id: int
    nome_produto: str
    quantidade: int
    criado_em: datetime


# Um produto do estoque com as contas da semana. Nada disso é coluna: o serviço calcula.
class ItemDoEstoque(BaseModel):
    produto_id: int
    nome_produto: str
    colhido: int = Field(description="Total colhido na semana")
    separado: int = Field(description="Quanto já foi separado nas cestas da semana")
    disponivel: int = Field(description="O que ainda pode ir para uma cesta")


# O resumo da semana: a lista que a assinante vê no pedido e o produtor vê na separação.
class EstoqueDaSemanaResposta(BaseModel):
    semana: date
    itens: list[ItemDoEstoque]
    total_colhido: int
    total_reservado: int = Field(description="Soma dos limites das cestas já pedidas na semana")
    itens_livres: int = Field(description="Colhido menos reservado: o que ainda aceita pedido novo")
    tamanhos_liberados: list[TamanhoCesta] = Field(
        description="Tamanhos cujo limite cabe nos itens livres", examples=[["pequena", "media"]])
