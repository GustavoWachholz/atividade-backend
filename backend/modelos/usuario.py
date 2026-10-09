from sqlalchemy import Column, DateTime, Enum, Integer, String, UniqueConstraint, func

from banco import Base


# As restrições da tabela mantêm os tipos de usuário previstos na cartilha.
class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        UniqueConstraint("email", name="uq_usuarios_email"),
        {"mysql_engine": "InnoDB"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    # Reservado para um hash de senha; nunca armazenar a senha em texto puro.
    # NULL mantém os cadastros anteriores até a implementação da autenticação.
    senha_hash = Column(String(255), nullable=True)
    tipo = Column(Enum("assinante", "produtor", name="tipo_usuario"), nullable=False)
    # func.current_timestamp preserva o padrão já existente, sem escrever SQL à mão.
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
