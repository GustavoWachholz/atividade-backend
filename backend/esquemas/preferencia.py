from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# tanto_faz é o padrão: sem marcação, o produtor monta a cesta sem restrição para o produto.
OpcaoDePreferencia = Literal["quero", "nao_quero", "tanto_faz"]


# A assinante marca um produto. O dono vem do token, e o produto vem do caminho.
class PreferenciaEdicao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    preferencia: OpcaoDePreferencia = Field(examples=["nao_quero"])


# Um produto do estoque com a marcação da assinante.
class PreferenciaResposta(BaseModel):
    produto_id: int
    nome_produto: str
    preferencia: OpcaoDePreferencia


# O que a dona de uma cesta marcou, pelos ids do catálogo. Serve ao produtor no fechamento.
class PreferenciasDaCesta(BaseModel):
    quer: list[int]
    nao_quer: list[int]
