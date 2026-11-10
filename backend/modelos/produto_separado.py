from sqlalchemy import Column, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import relationship

from banco import Base
from modelos.cesta import Cesta
from modelos.produto import Produto


# O produto separado aponta para o catálogo pela produto_id, como o estoque.
# Assim a soma por produto compara ids, e não nomes escritos de jeitos diferentes.
class ProdutoSeparado(Base):
    __tablename__ = "produtos_separados"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    cesta_id = Column(Integer, ForeignKey("cestas.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade = Column(Integer, nullable=False)
    # O padrão de criação permanece igual ao das tabelas já existentes.
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    # lazy="joined" traz o produto no mesmo SELECT: a lista da semana não faz uma consulta por linha.
    # innerjoin=True usa JOIN em vez de LEFT JOIN (produto_id nunca é nulo); o Postgres não aceita
    # o FOR UPDATE da trava da semana no lado opcional de um LEFT JOIN.
    produto = relationship("Produto", lazy="joined", innerjoin=True)

    # O nome continua saindo nas respostas como nome_produto, lido do catálogo, sem coluna.
    @property
    def nome_produto(self):
        return self.produto.nome
