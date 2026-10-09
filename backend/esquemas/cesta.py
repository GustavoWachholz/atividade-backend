from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TamanhoCesta = Literal["pequena", "media", "grande"]


# A situação não faz parte da entrada e não pode ser definida pelo cliente.
class CestaCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    assinante_id: int = Field(gt=0)
    semana: date
    tamanho: TamanhoCesta


# from_attributes permite ler os atributos do objeto SQLAlchemy na resposta.
class CestaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assinante_id: int
    semana: date
    tamanho: TamanhoCesta
    situacao: Literal["pedida", "em_separacao"]
    criado_em: datetime


# O detalhe acrescenta os cálculos de capacidade sem persistir esses valores.
class CestaDetalheResposta(CestaResposta):
    limite_itens: int
    quantidade_ocupada: int
    quantidade_restante: int
