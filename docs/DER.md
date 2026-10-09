# DER — Cesta do Vale · Aula 06

O desenho documenta as três tabelas já definidas no projeto. Os tipos, tamanhos,
restrições e nomes originais foram preservados. A preparação para autenticação
adiciona e-mail único e senha reservada para hash, ambos opcionais nesta etapa.

```mermaid
erDiagram
    usuarios ||--o{ cestas : possui
    cestas ||--o{ produtos_separados : recebe
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
        VARCHAR_100 nome_produto
        INT quantidade
        DATETIME criado_em
    }
```

`VARCHAR_100` representa `VARCHAR(100)`. Todas as tabelas usam InnoDB.
Um usuário pode ter nenhuma ou várias cestas; cada cesta tem um usuário.
Uma cesta pode ter nenhum ou vários produtos separados; cada produto tem uma cesta.

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
| cestas | situacao | ENUM('pedida', 'em_separacao') | NOT NULL, DEFAULT 'pedida' |
| cestas | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| produtos_separados | id | INT | PK, AUTO_INCREMENT, NOT NULL |
| produtos_separados | cesta_id | INT | FK → cestas.id, NOT NULL |
| produtos_separados | nome_produto | VARCHAR(100) | NOT NULL |
| produtos_separados | quantidade | INT | NOT NULL |
| produtos_separados | criado_em | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

O esquema Pydantic recusa nomes vazios e quantidades que não sejam inteiros positivos.
O serviço verifica se o usuário é assinante, aplica os limites 5, 8 e 12 e muda a
situação na primeira separação. Essas validações não são restrições adicionais do banco.
Limite, ocupação e espaço restante são calculados, sem colunas correspondentes.

`ForeignKey` cria a restrição no MySQL; `Cesta.produtos_separados = relationship("ProdutoSeparado")`
permite ler os produtos no Python, sem criar outra coluna.

Confira no MySQL depois de executar `python criar_tabelas.py`:

```sql
DESCRIBE usuarios;
DESCRIBE cestas;
DESCRIBE produtos_separados;
SHOW CREATE TABLE produtos_separados;
```

O último comando deve mostrar a chave estrangeira `cesta_id` apontando para `cestas.id`.
`create_all` cria tabelas ausentes, mas não altera as existentes. Se a estrutura já
criada for diferente, preserve os dados e trate a mudança na aula de migrations.
