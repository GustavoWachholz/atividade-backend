from logging.config import fileConfig

from alembic import context
from banco import Base, engine
from modelos.usuario import Usuario
from modelos.cesta import Cesta
from modelos.produto_separado import ProdutoSeparado

# context é fornecido pelo Alembic e entrega a configuração do alembic.ini.
config = context.config

# O registro das mensagens acompanha os comandos executados no terminal.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Os imports registram as três tabelas para futuras revisões.
target_metadata = Base.metadata

# O modo sem conexão usa a URL para gerar comandos, sem acessar o banco.
def executar_migracoes_sem_conexao() -> None:
    """Configura a execução sem conexão do modelo inicial do Alembic."""
    url = engine.url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# Reutiliza a configuração do projeto sem gravar credenciais no INI.
def executar_migracoes_com_conexao() -> None:
    """Configura a execução com conexão do modelo inicial do Alembic."""
    with engine.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# O Alembic escolhe o modo conforme o comando recebido no terminal.
if context.is_offline_mode():
    executar_migracoes_sem_conexao()
else:
    executar_migracoes_com_conexao()
