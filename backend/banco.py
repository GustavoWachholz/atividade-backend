from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from configuracao import URL_DO_BANCO

if not URL_DO_BANCO:
    raise RuntimeError("Preencha URL_DO_BANCO no backend/.env antes de iniciar a API.")

# O engine administra as conexões; cada requisição recebe sua própria sessão.
# isolation_level="READ COMMITTED": cada consulta enxerga o que outra requisição já gravou.
# No padrão do MySQL (REPEATABLE READ), a requisição que esperou a trava da semana
# (repositorios/estoque.travar_semana) ainda leria a foto antiga dos produtos e furaria o limite.
engine = create_engine(URL_DO_BANCO, pool_pre_ping=True, isolation_level="READ COMMITTED")
Sessao = sessionmaker(bind=engine, expire_on_commit=False)


# DeclarativeBase reúne os modelos que serão usados para criar as tabelas.
class Base(DeclarativeBase):
    pass


# O fechamento desfaz transações não concluídas, inclusive quando ocorre erro.
def obter_sessao():
    with Sessao() as sessao:
        yield sessao
