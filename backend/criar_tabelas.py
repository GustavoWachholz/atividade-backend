from banco import Base, engine
from modelos.usuario import Usuario
from modelos.produto import Produto
from modelos.cesta import Cesta
from modelos.produto_separado import ProdutoSeparado
from modelos.estoque import Estoque

# Os imports registram os cinco modelos (o estoque e o catálogo de produtos vieram depois da cartilha).
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print(f"Tabelas criadas ou já existentes no banco {engine.url.database}.")
    # sorted_tables apresenta as tabelas na ordem das dependências das chaves estrangeiras.
    for tabela in Base.metadata.sorted_tables:
        print(f"- {tabela.name}")
