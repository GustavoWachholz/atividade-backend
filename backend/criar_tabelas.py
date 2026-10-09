from banco import Base, engine
from modelos.usuario import Usuario
from modelos.cesta import Cesta
from modelos.produto_separado import ProdutoSeparado

# Os imports registram os três modelos; o banco cesta_do_vale já deve existir.
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print(f"Tabelas criadas ou já existentes no banco {engine.url.database}.")
    # sorted_tables apresenta as tabelas na ordem das dependências das chaves estrangeiras.
    for tabela in Base.metadata.sorted_tables:
        print(f"- {tabela.name}")
