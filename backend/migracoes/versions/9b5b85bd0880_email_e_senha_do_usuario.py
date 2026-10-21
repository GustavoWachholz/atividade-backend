"""email e senha do usuario

Identificador da revisão: 9b5b85bd0880
Revisão anterior: 20261007_01
Data de criação: 2026-10-07 20:38:33.183404

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = '9b5b85bd0880'
down_revision: Union[str, Sequence[str], None] = '20261007_01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# upgrade é o nome exigido pelo Alembic para aplicar a mudança.
def upgrade() -> None:
    """Aplica a mudança na estrutura do banco."""
    # A redução de 254 para 100 caracteres pressupõe que nenhum e-mail cadastrado passe de 100.
    # Alembic detecta renomeação como criação/remoção; renomear preserva os dados.
    op.alter_column('usuarios', 'senha', new_column_name='senha_hash',
                    existing_type=mysql.VARCHAR(length=255), existing_nullable=True)
    op.alter_column('usuarios', 'email',
               existing_type=mysql.VARCHAR(length=254),
               type_=sa.String(length=100),
               existing_nullable=True)


# downgrade é o nome exigido pelo Alembic para desfazer a mudança.
def downgrade() -> None:
    """Desfaz a mudança na estrutura do banco."""
    op.alter_column('usuarios', 'senha_hash', new_column_name='senha',
                    existing_type=mysql.VARCHAR(length=255), existing_nullable=True)
    op.alter_column('usuarios', 'email',
               existing_type=sa.String(length=100),
               type_=mysql.VARCHAR(length=254),
               existing_nullable=True)
