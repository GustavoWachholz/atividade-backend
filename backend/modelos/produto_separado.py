from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from banco import Base
from modelos.cesta import Cesta


# O nome pertence à separação; não há um cadastro independente de produtos.
class ProdutoSeparado(Base):
    __tablename__ = "produtos_separados"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    cesta_id = Column(Integer, ForeignKey("cestas.id"), nullable=False)
    nome_produto = Column(String(100), nullable=False)
    quantidade = Column(Integer, nullable=False)
    # O padrão de criação permanece igual ao das tabelas já existentes.
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
