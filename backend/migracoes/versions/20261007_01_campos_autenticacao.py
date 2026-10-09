"""Acrescenta campos para futura autenticação à estrutura inicial do projeto.

A estrutura anterior é criada por criar_tabelas.py, antes desta revisão.
"""
from alembic import op
import sqlalchemy as sa

revision = "20261007_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("usuarios", sa.Column("email", sa.String(254), nullable=True))
    op.add_column("usuarios", sa.Column("senha", sa.String(255), nullable=True))
    op.create_unique_constraint("uq_usuarios_email", "usuarios", ["email"])


def downgrade():
    op.drop_constraint("uq_usuarios_email", "usuarios", type_="unique")
    op.drop_column("usuarios", "senha")
    op.drop_column("usuarios", "email")
