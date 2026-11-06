from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from configuracao import URL_DO_BANCO

if not URL_DO_BANCO:
    raise RuntimeError("Preencha URL_DO_BANCO no backend/.env antes de iniciar a API.")

# O engine administra as conexões; cada requisição recebe sua própria sessão.
# isolation_level="READ COMMITTED": cada consulta enxerga o que outra requisição já gravou.
# Assim a requisição que esperou a trava da semana (repositorios/estoque.travar_semana) lê a soma
# já com o que a anterior gravou, e não fura o limite.
# NullPool fecha a conexão no fim de cada requisição. No Vercel, cada instância guardaria as suas
# conexões paradas, e elas lotavam o limite do pooler do Supabase (erro 500 em todas as rotas).
# prepare_threshold=None desliga os prepared statements, que o modo transação do pooler não aceita.
engine = create_engine(URL_DO_BANCO, poolclass=NullPool, isolation_level="READ COMMITTED",
                       connect_args={"prepare_threshold": None})
Sessao = sessionmaker(bind=engine, expire_on_commit=False)


# DeclarativeBase reúne os modelos que serão usados para criar as tabelas.
class Base(DeclarativeBase):
    pass


# O fechamento desfaz transações não concluídas, inclusive quando ocorre erro.
def obter_sessao():
    with Sessao() as sessao:
        yield sessao
