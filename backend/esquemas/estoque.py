from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from esquemas.cesta import TamanhoCesta


# O produtor informa a semana, o produto e quantas unidades colheu.
# extra="forbid" recusa campos a mais; str_strip_whitespace tira os espaços das pontas do nome.
class EstoqueCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    semana: date = Field(description="Segunda-feira da semana da colheita", examples=["2026-10-19"])
    nome_produto: str = Field(min_length=1, max_length=100, examples=["Alface crespa"])
    # strict=True recusa 1.5, "2" e True, como na quantidade do produto separado.
    quantidade: int = Field(gt=0, strict=True, description="Unidades colhidas", examples=[10])


# from_attributes lê o objeto SQLAlchemy Estoque na resposta do cadastro.
class EstoqueResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    semana: date
    nome_produto: str
    quantidade: int
    criado_em: datetime


# Um produto do estoque com as contas da semana. Nada disso é coluna: o serviço calcula.
class ItemDoEstoque(BaseModel):
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
