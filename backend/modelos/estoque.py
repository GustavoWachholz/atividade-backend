from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import relationship

from banco import Base
from modelos.produto import Produto


# O estoque guarda o que o produtor colheu em cada semana, em unidades (não em quilos).
# O produto vem do catálogo pela produto_id; o nome é lido de lá, e não digitado de novo.
class Estoque(Base):
    __tablename__ = "estoques"
    # UniqueConstraint impede duas linhas com o mesmo produto na mesma semana:
    # cadastrar de novo soma na linha que já existe, e o banco garante isso mesmo se o serviço falhar.
    __table_args__ = (
        UniqueConstraint("semana", "produto_id", name="uq_estoques_semana_produto"),
        {"mysql_engine": "InnoDB"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    # A segunda-feira da semana da colheita, no mesmo formato da cestas.semana.
    semana = Column(Date, nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    # Total colhido. O que já foi separado é calculado a partir dos produtos, sem coluna.
    quantidade = Column(Integer, nullable=False)
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    # lazy="joined" traz o produto no mesmo SELECT: a lista da semana não faz uma consulta por linha.
    # innerjoin=True usa JOIN em vez de LEFT JOIN (produto_id nunca é nulo); o Postgres não aceita
    # o FOR UPDATE da trava da semana no lado opcional de um LEFT JOIN.
    produto = relationship("Produto", lazy="joined", innerjoin=True)

    # O nome continua saindo nas respostas como nome_produto, lido do catálogo, sem coluna.
    @property
    def nome_produto(self):
        return self.produto.nome
