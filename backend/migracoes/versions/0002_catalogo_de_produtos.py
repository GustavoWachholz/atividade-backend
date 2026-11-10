"""catalogo de produtos

Identificador da revisão: 0002
Revisão anterior: 0001
Data de criação: 2026-11-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = '0002'
down_revision: Union[str, Sequence[str], None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Escrita à mão: o autogenerate não cria o índice em lower(nome).
# Não copia dados: o banco recomeça do zero. Com linhas no estoques ou no produtos_separados,
# a coluna produto_id NOT NULL não entra e a migration para antes de apagar qualquer nome.
def upgrade() -> None:
    """Cria o catálogo e troca o nome digitado pelo produto_id no estoque e na separação."""
    op.create_table('produtos',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('ativo', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('criado_em', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('uq_produtos_nome', 'produtos', [sa.text('lower(nome)')], unique=True)

    op.drop_constraint('uq_estoques_semana_produto', 'estoques', type_='unique')
    op.add_column('estoques', sa.Column('produto_id', sa.Integer(), nullable=False))
    op.create_foreign_key('estoques_produto_id_fkey', 'estoques', 'produtos', ['produto_id'], ['id'])
    op.create_unique_constraint('uq_estoques_semana_produto', 'estoques', ['semana', 'produto_id'])
    op.drop_column('estoques', 'nome_produto')

    op.add_column('produtos_separados', sa.Column('produto_id', sa.Integer(), nullable=False))
    op.create_foreign_key('produtos_separados_produto_id_fkey', 'produtos_separados', 'produtos',
                          ['produto_id'], ['id'])
    op.drop_column('produtos_separados', 'nome_produto')


# Desfaz na ordem inversa. Também só funciona com as tabelas vazias.
def downgrade() -> None:
    """Volta ao nome digitado no estoque e na separação e apaga o catálogo."""
    op.add_column('produtos_separados', sa.Column('nome_produto', sa.String(length=100), nullable=False))
    op.drop_constraint('produtos_separados_produto_id_fkey', 'produtos_separados', type_='foreignkey')
    op.drop_column('produtos_separados', 'produto_id')

    op.add_column('estoques', sa.Column('nome_produto', sa.String(length=100), nullable=False))
    op.drop_constraint('uq_estoques_semana_produto', 'estoques', type_='unique')
    op.drop_constraint('estoques_produto_id_fkey', 'estoques', type_='foreignkey')
    op.drop_column('estoques', 'produto_id')
    op.create_unique_constraint('uq_estoques_semana_produto', 'estoques', ['semana', 'nome_produto'])

    op.drop_index('uq_produtos_nome', table_name='produtos')
    op.drop_table('produtos')
