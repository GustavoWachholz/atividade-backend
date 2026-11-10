from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


# O produtor cadastra o produto uma vez; ele vale para todas as semanas.
# str_strip_whitespace tira os espaços das pontas, para " Alface" não virar outro produto.
class ProdutoCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    nome: str = Field(min_length=1, max_length=100, examples=["Alface crespa"])


# Renomear, desativar ou reativar. Os dois campos são opcionais, mas pelo menos um precisa vir.
# strict=True no ativo recusa "sim", 1 e "true": só true ou false.
class ProdutoEdicao(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    nome: str | None = Field(default=None, min_length=1, max_length=100)
    ativo: bool | None = Field(default=None, strict=True)

    @model_validator(mode="after")
    def exigir_um_campo(self):
        if self.nome is None and self.ativo is None:
            raise ValueError("Envie o nome, o ativo ou os dois.")
        return self


class ProdutoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    ativo: bool
    criado_em: datetime
