"""situações do pedido: concluida e recusada

Identificador da revisão: a1c4e7d20f35
Revisão anterior: 9ba02dc0bbc4
Data de criação: 2026-10-27

Escrita à mão, com aprovação do autor: o autogenerate não detecta mudança nos valores de um
ENUM do MySQL e geraria uma migration vazia (ver decisoes.md).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = 'a1c4e7d20f35'
down_revision: Union[str, Sequence[str], None] = '9ba02dc0bbc4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# upgrade é o nome exigido pelo Alembic para aplicar a mudança.
def upgrade() -> None:
    """Acrescenta concluida e recusada ao ENUM da situação, no fim da lista."""
    # existing_type diz ao Alembic como a coluna é hoje; type_ é como ela fica.
    op.alter_column('cestas', 'situacao',
                    existing_type=sa.Enum('pedida', 'em_separacao', name='situacao_cesta'),
                    type_=sa.Enum('pedida', 'em_separacao', 'concluida', 'recusada', name='situacao_cesta'),
                    existing_nullable=False,
                    existing_server_default='pedida')


# downgrade é o nome exigido pelo Alembic para desfazer a mudança.
# Não rode em banco com dados: cestas concluida ou recusada não cabem no ENUM antigo.
def downgrade() -> None:
    """Volta o ENUM aos dois valores antigos."""
    op.alter_column('cestas', 'situacao',
                    existing_type=sa.Enum('pedida', 'em_separacao', 'concluida', 'recusada', name='situacao_cesta'),
                    type_=sa.Enum('pedida', 'em_separacao', name='situacao_cesta'),
                    existing_nullable=False,
                    existing_server_default='pedida')
