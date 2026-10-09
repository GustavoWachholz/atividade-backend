from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import relationship

from banco import Base
from modelos.usuario import Usuario


# Capacidade e espaço restante são calculados pelo serviço, sem colunas extras.
class Cesta(Base):
    __tablename__ = "cestas"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    assinante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    semana = Column(Date, nullable=False)
    tamanho = Column(Enum("pequena", "media", "grande", name="tamanho_cesta"), nullable=False)
    situacao = Column(Enum("pedida", "em_separacao", name="situacao_cesta"),
                      nullable=False, server_default="pedida")
    # DateTime e Enum preservam as colunas existentes; não exigem alterar tabelas.
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    # relationship é o atalho Python para a filha; ForeignKey é a restrição no banco.
    produtos_separados = relationship("ProdutoSeparado")
