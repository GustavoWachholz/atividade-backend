from sqlalchemy import Column, DateTime, Integer, String, func

from banco import Base


# Um pedido de cadastro de produtor, à espera do código que foi para o e-mail do administrador.
# O usuário só é criado na confirmação; até lá, nada aqui dá acesso ao sistema.
class SolicitacaoProdutor(Base):
    __tablename__ = "solicitacoes_produtor"

    # Texto aleatório (secrets.token_urlsafe), e não um número em sequência: ninguém adivinha o pedido dos outros.
    id = Column(String(64), primary_key=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    # A senha e o código ficam só como hash Argon2, como a senha do usuário.
    senha_hash = Column(String(255), nullable=False)
    codigo_hash = Column(String(255), nullable=False)
    # Em UTC, sem fuso, como o serviço grava e compara.
    expira_em = Column(DateTime, nullable=False)
    tentativas = Column(Integer, nullable=False, server_default="0")
    criado_em = Column(DateTime, nullable=False, server_default=func.current_timestamp())
