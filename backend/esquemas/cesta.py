from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TamanhoCesta = Literal["pequena", "media", "grande"]


# O esquema não tem o dono da cesta: ele vem sempre do token, no serviço.
# extra="ignore" descarta campos a mais, como um assinante_id enviado de propósito no corpo.
class CestaCriacao(BaseModel):
    model_config = ConfigDict(extra="ignore")
    semana: date = Field(description="Segunda-feira da semana da cesta", examples=["2026-10-26"])
    tamanho: TamanhoCesta = Field(description="Define o limite de itens: 5, 8 ou 12",
                                  examples=["media"])


# Só o id e o nome de quem pediu: e-mail e senha da assinante não saem nesta resposta.
class AssinanteResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str


# from_attributes permite ler os atributos do objeto SQLAlchemy na resposta,
# inclusive o cesta.assinante, que vira o AssinanteResumo.
class CestaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assinante_id: int
    assinante: AssinanteResumo
    semana: date
    tamanho: TamanhoCesta
    situacao: Literal["pedida", "em_separacao", "concluida", "recusada"]
    criado_em: datetime


# O detalhe acrescenta os cálculos de capacidade sem persistir esses valores.
class CestaDetalheResposta(CestaResposta):
    limite_itens: int
    quantidade_ocupada: int
    quantidade_restante: int
