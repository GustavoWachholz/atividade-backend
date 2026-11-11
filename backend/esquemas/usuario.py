from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

TipoUsuario = Literal["assinante", "produtor"]


# O cadastro público cria só assinantes: o tipo não faz parte da entrada.
# extra="forbid" recusa com 422 quem tentar mandar "tipo": "produtor" no corpo.
class UsuarioCriacao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nome: str = Field(min_length=2, max_length=100)
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


# O cadastro de produtor do modo suporte: os mesmos campos, mais o código conferido no back.
# repr=False tira o código dos logs e das mensagens de erro do Pydantic.
class ProdutorCriacao(UsuarioCriacao):
    codigo_suporte: str = Field(min_length=1, max_length=200, repr=False)


# from_attributes permite construir a resposta a partir de um modelo SQLAlchemy.
class UsuarioResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    tipo: TipoUsuario
    email: EmailStr | None = None
    # Senha não integra a resposta, mesmo quando houver um hash no banco.
    criado_em: datetime


# O /login devolve um token JWT com esses dois campos, padrão OAuth2.
class Token(BaseModel):
    access_token: str
    token_type: str
