"""${message}

Identificador da revisão: ${up_revision}
Revisão anterior: ${down_revision | comma,n}
Data de criação: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = ${repr(up_revision)}
down_revision: Union[str, Sequence[str], None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


# upgrade é o nome exigido pelo Alembic para aplicar a mudança.
def upgrade() -> None:
    """Aplica a mudança na estrutura do banco."""
    ${upgrades if upgrades else "pass"}


# downgrade é o nome exigido pelo Alembic para desfazer a mudança.
def downgrade() -> None:
    """Desfaz a mudança na estrutura do banco."""
    ${downgrades if downgrades else "pass"}
