from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

TipoUsuario = Literal["assinante", "produtor"]


# Literal limita os valores aceitos; campos extras são recusados na entrada.
class UsuarioCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nome: str = Field(min_length=2, max_length=100)
    tipo: TipoUsuario
    email: EmailStr = Field(max_length=100)
    senha: str = Field(min_length=8, max_length=72, repr=False)

    @field_validator("nome", "email", mode="before")
    @classmethod
    def remover_espacos_externos(cls, valor):
        # A senha é preservada exatamente como foi digitada.
        return valor.strip() if isinstance(valor, str) else valor

    @field_validator("email")
    @classmethod
    def normalizar_email(cls, valor):
        return str(valor).lower()


# from_attributes permite construir a resposta a partir de um modelo SQLAlchemy.
class UsuarioResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    tipo: TipoUsuario
    email: EmailStr | None = None
    # Senha não integra a resposta, mesmo quando houver um hash no banco.
    criado_em: datetime
