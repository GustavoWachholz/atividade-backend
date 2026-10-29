"""estoque da semana

Identificador da revisão: 9ba02dc0bbc4
Revisão anterior: 9b5b85bd0880
Data de criação: 2026-10-21 21:41:46.666998

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = '9ba02dc0bbc4'
down_revision: Union[str, Sequence[str], None] = '9b5b85bd0880'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# upgrade é o nome exigido pelo Alembic para aplicar a mudança.
def upgrade() -> None:
    """Aplica a mudança na estrutura do banco."""
    # ### comandos gerados pelo Alembic ###
    # O autogenerate escreveu sa.text('CURRENT_TIMESTAMP'), e o text() não é usado no projeto.
    # sa.func.current_timestamp() gera o mesmo DEFAULT CURRENT_TIMESTAMP, igual ao modelo.
    op.create_table('estoques',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('semana', sa.Date(), nullable=False),
    sa.Column('nome_produto', sa.String(length=100), nullable=False),
    sa.Column('quantidade', sa.Integer(), nullable=False),
    sa.Column('criado_em', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('semana', 'nome_produto', name='uq_estoques_semana_produto'),
    mysql_engine='InnoDB'
    )
    # ### fim dos comandos do Alembic ###


# downgrade é o nome exigido pelo Alembic para desfazer a mudança.
def downgrade() -> None:
    """Desfaz a mudança na estrutura do banco."""
    # ### comandos gerados pelo Alembic ###
    op.drop_table('estoques')
    # ### fim dos comandos do Alembic ###
