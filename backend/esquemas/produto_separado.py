from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# Quantidades inteiras positivas evitam diminuir artificialmente a ocupação.
# O produto vem do catálogo pelo id; o nome digitado não é mais aceito.
class ProdutoSeparadoCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    produto_id: int = Field(gt=0, strict=True)
    quantidade: int = Field(gt=0, strict=True)


# from_attributes lê o objeto SQLAlchemy; a resposta inclui o id e a cesta.
class ProdutoSeparadoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cesta_id: int
    produto_id: int
    # Lido do catálogo pela propriedade do modelo, para a tela mostrar o nome.
    nome_produto: str
    quantidade: int
    criado_em: datetime
