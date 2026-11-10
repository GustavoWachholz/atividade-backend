# DER — Cesta do Vale

O desenho documenta as três tabelas da cartilha e as tabelas `estoques` e `produtos`, pedidas depois pelo autor. O `email` (único) e o `senha_hash` entraram por
migration e aceitam `NULL` no banco só por causa dos cadastros feitos antes do login. Todo cadastro
novo exige os dois: o esquema Pydantic recusa a falta deles, e a senha é guardada só como hash Argon2.
A `semana` da cesta é a segunda-feira da semana do pedido, e a do estoque é a segunda-feira da semana da colheita.

```mermaid
erDiagram
    usuarios ||--o{ cestas : possui
    cestas ||--o{ produtos_separados : recebe
    produtos ||--o{ estoques : colhido_em
    produtos ||--o{ produtos_separados : separado_como
    usuarios {
        INT id PK
        VARCHAR_100 nome
        VARCHAR_100 email UK
        VARCHAR_255 senha_hash
        ENUM tipo
        DATETIME criado_em
    }
    cestas {
        INT id PK
        INT assinante_id FK
        DATE semana
        ENUM tamanho
        ENUM situacao
        DATETIME criado_em
    }
    produtos_separados {
        INT id PK
        INT cesta_id FK
        INT produto_id FK
        INT quantidade
        DATETIME criado_em
    }
    estoques {
        INT id PK
        DATE semana UK
        INT produto_id FK, UK
        INT quantidade
        DATETIME criado_em
    }
    produtos {
        INT id PK
        VARCHAR_100 nome UK
        BOOLEAN ativo
        DATETIME criado_em
    }
```

`VARCHAR_100` representa `VARCHAR(100)`. Todas as tabelas usam InnoDB.
Um usuário pode ter nenhuma ou várias cestas; cada cesta tem um usuário.
Uma cesta pode ter nenhum ou vários produtos separados; cada produto tem uma cesta.
O `produtos` é o catálogo da horta: cada produto é cadastrado uma vez e vale para todas as semanas.
O `estoques` e o `produtos_separados` apontam para ele pela `produto_id` (chave estrangeira); o nome não é guardado
de novo nessas tabelas. O produto separado se liga ao estoque pela `produto_id` e pela `semana` da cesta, conferidas
no serviço. O par `semana` + `produto_id` é único.
O nome do produto é único sem contar maiúsculas: o índice `uq_produtos_nome` é feito sobre `lower(nome)`, então
"Alface" e "alface" não convivem. Acentos contam: "Maca" e "Maçã" são produtos diferentes.
Um produto desativado (`ativo` falso) continua na tabela, para o histórico das cestas, mas não entra numa colheita nova.

| Tabela | Coluna | Tipo MySQL | Restrição no banco |
| --- | --- | --- | --- |
| usuarios | id | INT | PK, AUTO_INCREMENT, NOT NULL |
| usuarios | nome | VARCHAR(100) | NOT NULL |
| usuarios | email | VARCHAR(100) | UNIQUE (uq_usuarios_email), NULL permitido |
| usuarios | senha_hash | VARCHAR(255) | NULL permitido; reservado para hash |
| usuarios | tipo | ENUM('assinante', 'produtor') | NOT NULL |
| usuarios | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| cestas | id | INT | PK, AUTO_INCREMENT, NOT NULL |
| cestas | assinante_id | INT | FK → usuarios.id, NOT NULL |
| cestas | semana | DATE | NOT NULL |
| cestas | tamanho | ENUM('pequena', 'media', 'grande') | NOT NULL |
| cestas | situacao | ENUM('pedida', 'em_separacao', 'concluida', 'recusada') | NOT NULL, DEFAULT 'pedida' |
| cestas | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| produtos_separados | id | INT | PK, AUTO_INCREMENT, NOT NULL |
| produtos_separados | cesta_id | INT | FK → cestas.id, NOT NULL |
| produtos_separados | produto_id | INT | FK → produtos.id, NOT NULL |
| produtos_separados | quantidade | INT | NOT NULL |
| produtos_separados | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| estoques | id | INT | PK, AUTO_INCREMENT, NOT NULL |
| estoques | semana | DATE | NOT NULL; UNIQUE com produto_id (uq_estoques_semana_produto) |
| estoques | produto_id | INT | FK → produtos.id, NOT NULL; UNIQUE com semana |
| estoques | quantidade | INT | NOT NULL |
| estoques | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| produtos | id | INT | PK, AUTO_INCREMENT, NOT NULL |
| produtos | nome | VARCHAR(100) | NOT NULL; índice único em lower(nome) (uq_produtos_nome) |
| produtos | ativo | BOOLEAN | NOT NULL, DEFAULT true |
| produtos | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

O esquema Pydantic recusa nomes vazios e quantidades que não sejam inteiros positivos.
O serviço verifica se o usuário é assinante, aplica os limites 5, 8 e 12 e muda a
situação na primeira separação. Essas validações não são restrições adicionais do banco.
Limite, ocupação e espaço restante são calculados, sem colunas correspondentes. Do mesmo jeito, o separado,
o disponível e o reservado do estoque são calculados a partir das cestas e dos produtos separados.

`ForeignKey` cria a restrição no MySQL; `Cesta.produtos_separados = relationship("ProdutoSeparado")`
permite ler os produtos no Python, sem criar outra coluna. Do mesmo jeito,
`Cesta.assinante = relationship("Usuario")` lê o dono da cesta pela `assinante_id`, e
`Estoque.produto` e `ProdutoSeparado.produto` leem o produto do catálogo pela `produto_id`. A propriedade
`nome_produto` desses dois modelos devolve `produto.nome`, para as respostas da API continuarem trazendo o nome.

Confira no MySQL depois de executar `python criar_tabelas.py`:

```sql
DESCRIBE usuarios;
DESCRIBE cestas;
DESCRIBE produtos_separados;
DESCRIBE estoques;
DESCRIBE produtos;
SHOW CREATE TABLE produtos_separados;
```

O último comando deve mostrar a chave estrangeira `cesta_id` apontando para `cestas.id`.
`create_all` cria tabelas ausentes, mas não altera as existentes. Se a estrutura já
criada for diferente, preserve os dados e trate a mudança com uma migration.
