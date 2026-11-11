"""solicitacoes de produtor

Identificador da revisão: 0003
Revisão anterior: 0002
Data de criação: 2026-11-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = '0003'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Só acrescenta a tabela: os dados das outras tabelas não mudam.
def upgrade() -> None:
    """Cria a tabela dos pedidos de cadastro de produtor."""
    op.create_table('solicitacoes_produtor',
    sa.Column('id', sa.String(length=64), nullable=False),
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=100), nullable=False),
    sa.Column('senha_hash', sa.String(length=255), nullable=False),
    sa.Column('codigo_hash', sa.String(length=255), nullable=False),
    sa.Column('expira_em', sa.DateTime(), nullable=False),
    sa.Column('tentativas', sa.Integer(), server_default='0', nullable=False),
    sa.Column('criado_em', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Apaga a tabela dos pedidos de cadastro de produtor."""
    op.drop_table('solicitacoes_produtor')
