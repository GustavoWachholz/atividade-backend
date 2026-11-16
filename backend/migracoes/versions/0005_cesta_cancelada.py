"""cesta cancelada pela assinante

Identificador da revisão: 0005
Revisão anterior: 0004
Data de criação: 2026-11-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Estes nomes são exigidos pelo Alembic para ordenar as revisões.
revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SITUACOES = ('pedida', 'em_separacao', 'concluida', 'recusada', 'cancelada')


# Acrescenta "cancelada" no fim do ENUM situacao_cesta: as cestas gravadas continuam válidas.
# No Postgres, o valor novo só entra com ALTER TYPE, que o Alembic não tem como operação: por isso o op.execute
# (exceção registrada no .docs/decisoes.md). O autocommit_block roda o comando fora da transação da migration.
# No MySQL, o alter_column refaz a lista, como na migration que trouxe concluida e recusada.
def upgrade() -> None:
    """Permite a situação cancelada nas cestas."""
    if op.get_bind().dialect.name == 'postgresql':
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE situacao_cesta ADD VALUE IF NOT EXISTS 'cancelada'")
    else:
        op.alter_column('cestas', 'situacao', existing_nullable=False, existing_server_default='pedida',
                        type_=sa.Enum(*SITUACOES, name='situacao_cesta'))


# O Postgres não remove valor de ENUM. Sem downgrade, como nas outras mudanças de ENUM com dados.
def downgrade() -> None:
    """Não desfaz: cestas canceladas não cabem no ENUM antigo."""
    raise NotImplementedError("O valor cancelada não pode ser retirado do ENUM com cestas gravadas.")
