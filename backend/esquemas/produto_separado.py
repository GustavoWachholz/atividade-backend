from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# Quantidades inteiras positivas evitam diminuir artificialmente a ocupação.
class ProdutoSeparadoCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    nome_produto: str = Field(min_length=1, max_length=100)
    quantidade: int = Field(gt=0, strict=True)


# from_attributes lê o objeto SQLAlchemy; a resposta inclui o id e a cesta.
class ProdutoSeparadoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cesta_id: int
    nome_produto: str
    quantidade: int
    criado_em: datetime
