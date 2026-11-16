from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import relationship

from banco import Base
from modelos.produto import Produto
from modelos.usuario import Usuario


# O que a assinante quer ou não quer receber na cesta. Só existe linha para quem marcou algo:
# sem linha, o produto fica como "tanto faz", e o produtor monta a cesta como antes.
class Preferencia(Base):
    __tablename__ = "preferencias"
    # Uma marcação por produto para cada assinante: marcar de novo troca a linha que já existe.
    __table_args__ = (
        UniqueConstraint("assinante_id", "produto_id", name="uq_preferencias_assinante_produto"),
        {"mysql_engine": "InnoDB"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    assinante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    # True: quero receber. False: não quero receber.
    quer = Column(Boolean, nullable=False)
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    produto = relationship("Produto", lazy="joined", innerjoin=True)
