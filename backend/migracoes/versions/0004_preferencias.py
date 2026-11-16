"""preferencias da assinante

Identificador da revisão: 0004
Revisão anterior: 0003
Data de criação: 2026-11-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Só acrescenta a tabela: os dados das outras tabelas não mudam.
def upgrade() -> None:
    """Cria a tabela do que cada assinante quer ou não quer receber."""
    op.create_table('preferencias',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('assinante_id', sa.Integer(), nullable=False),
    sa.Column('produto_id', sa.Integer(), nullable=False),
    sa.Column('quer', sa.Boolean(), nullable=False),
    sa.Column('criado_em', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
    sa.ForeignKeyConstraint(['assinante_id'], ['usuarios.id']),
    sa.ForeignKeyConstraint(['produto_id'], ['produtos.id']),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('assinante_id', 'produto_id', name='uq_preferencias_assinante_produto'),
    mysql_engine='InnoDB',
    )


def downgrade() -> None:
    """Apaga a tabela das preferências."""
    op.drop_table('preferencias')
