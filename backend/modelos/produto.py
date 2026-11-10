from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, func, true

from banco import Base


# O catálogo da horta: cada produto é cadastrado uma vez e usado em todas as semanas.
# O estoque e o produto separado apontam para ele pelo id, e não mais pelo nome digitado.
class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    # Desativar tira o produto das listas novas sem apagar o histórico das cestas.
    ativo = Column(Boolean, nullable=False, server_default=true())
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # O índice único em lower(nome) faz "Alface" e "alface" contarem como o mesmo produto.
    # Ele vem depois das colunas porque usa a coluna nome.
    __table_args__ = (
        Index("uq_produtos_nome", func.lower(nome), unique=True),
    )
