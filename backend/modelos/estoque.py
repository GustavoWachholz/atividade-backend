from sqlalchemy import Column, Date, DateTime, Integer, String, UniqueConstraint, func

from banco import Base


# O estoque guarda o que o produtor colheu em cada semana, em unidades (não em quilos).
# Não tem chave estrangeira: o produto separado se liga ao estoque pelo nome e pela semana da cesta.
class Estoque(Base):
    __tablename__ = "estoques"
    # UniqueConstraint impede duas linhas com o mesmo produto na mesma semana:
    # cadastrar de novo soma na linha que já existe, e o banco garante isso mesmo se o serviço falhar.
    __table_args__ = (
        UniqueConstraint("semana", "nome_produto", name="uq_estoques_semana_produto"),
        {"mysql_engine": "InnoDB"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    # A segunda-feira da semana da colheita, no mesmo formato da cestas.semana.
    semana = Column(Date, nullable=False)
    nome_produto = Column(String(100), nullable=False)
    # Total colhido. O que já foi separado é calculado a partir dos produtos, sem coluna.
    quantidade = Column(Integer, nullable=False)
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
