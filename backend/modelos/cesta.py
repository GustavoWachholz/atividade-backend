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
    # O fluxo do pedido: pedida -> (produtor aprova) em_separacao -> (produtor conclui) concluida,
    # ou pedida -> (produtor reprova) recusada. Os valores novos ficam no fim da lista para as
    # cestas já gravadas continuarem válidas.
    situacao = Column(Enum("pedida", "em_separacao", "concluida", "recusada", name="situacao_cesta"),
                      nullable=False, server_default="pedida")
    # DateTime e Enum preservam as colunas existentes; não exigem alterar tabelas.
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    # relationship é o atalho Python para a filha; ForeignKey é a restrição no banco.
    produtos_separados = relationship("ProdutoSeparado")
    # O mesmo atalho no outro sentido: cesta.assinante lê o usuário dono pela assinante_id,
    # para a tela do produtor mostrar o nome, e não só o número. Não cria coluna.
    assinante = relationship("Usuario")
