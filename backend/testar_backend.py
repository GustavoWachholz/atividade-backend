import unittest
from datetime import date, datetime, timedelta, timezone
from unittest.mock import Mock, patch

import jwt

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.dialects import mysql
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

# A configuração continua lendo o ambiente; a URL fictícia só permite testes sem conexão.
import configuracao

with patch.object(configuracao, "URL_DO_BANCO", configuracao.URL_DO_BANCO or
                  "mysql+mysqlconnector://teste@localhost/cesta_do_vale"):
    from banco import Base, obter_sessao
from main import app
from modelos.cesta import Cesta
from modelos.produto_separado import ProdutoSeparado
from modelos.usuario import Usuario
from esquemas.usuario import UsuarioCriacao
from repositorios import usuario as repositorio_usuario
from servicos import usuario as servico_usuario
from servicos.excecoes import (CestaIncompleta, CestaNaoEmSeparacao, CestaNaoPedida, EmailEmUso, SemanaForaDoPedido,
                               EstoqueInsuficiente, LimiteDaCestaExcedido)
import seguranca
from seguranca import criar_token, ler_token, verificar_senha
from rotas.autenticacao import obter_usuario_atual
from seguranca import GRUPOS, tem_permissao  # [NOVO · grupos]
from sqlalchemy.exc import IntegrityError
from repositorios import cesta as repositorio_cesta
from repositorios import produto_separado as repositorio_produto
from servicos import cesta as servico_cesta
from servicos import produto_separado as servico_produto
from servicos import estoque as servico_estoque


# Um MySQL vazio e exclusivo isola os testes sem trocar o banco ensinado na aula.
class TestesBackend(unittest.TestCase):
    # Cada teste começa com tabelas vazias e sessões independentes por requisição.
    def setUp(self):
        if not configuracao.URL_DO_BANCO_TESTE:
            self.skipTest("Configure URL_DO_BANCO_TESTE para validar a persistência no MySQL.")
        endereco = make_url(configuracao.URL_DO_BANCO_TESTE)
        if endereco.drivername != "mysql+mysqlconnector" or not (endereco.database or "").endswith("_teste"):
            raise RuntimeError("Os testes exigem MySQL e um banco com sufixo _teste.")
        if configuracao.URL_DO_BANCO:
            principal = make_url(configuracao.URL_DO_BANCO)
            if (endereco.host, endereco.port or 3306, endereco.database) == (
                    principal.host, principal.port or 3306, principal.database):
                raise RuntimeError("O banco de testes deve ser diferente do banco principal.")
        self.engine = create_engine(endereco)
        self.addCleanup(self.engine.dispose)
        if inspect(self.engine).get_table_names():
            raise RuntimeError("O banco de testes precisa estar vazio; nenhuma tabela será apagada.")
        # A limpeza remove somente tabelas criadas pelo próprio cenário nesse banco vazio.
        self.addCleanup(Base.metadata.drop_all, self.engine)
        Base.metadata.create_all(self.engine)
        self.Sessao = sessionmaker(bind=self.engine, expire_on_commit=False)

        # Substitui somente a conexão, mantendo rotas, serviços e repositórios reais.
        def sessao_teste():
            with self.Sessao() as sessao:
                yield sessao

        app.dependency_overrides[obter_sessao] = sessao_teste
        # Define usuário autenticado padrão (produtor) para consultas gerais
        self.usuario_atual = Usuario(id=99, nome="Vanderlei", tipo="produtor", email="produtor@example.com")
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        self.addCleanup(app.dependency_overrides.clear)
        # Os cenários usam semanas fixas do passado; a trava da semana atual tem teste próprio.
        patcher = patch.object(servico_cesta, "conferir_semana_do_pedido")
        patcher.start()
        self.addCleanup(patcher.stop)
        self.cliente = TestClient(app)
        self.addCleanup(self.cliente.close)
        # As semanas usadas pelos cenários antigos já começam com colheita de sobra,
        # para que eles continuem testando só a regra do limite.
        for semana in ["2026-10-05", "2026-10-12"]:
            self.cadastrar_estoque(semana, "Alface", 500)

    # O produtor (usuário padrão) cadastra a colheita de uma semana.
    def cadastrar_estoque(self, semana, nome_produto, quantidade):
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        resposta = self.cliente.post("/estoques", json={
            "semana": semana, "nome_produto": nome_produto, "quantidade": quantidade})
        self.assertEqual(resposta.status_code, 201)
        return resposta.json()

    # A assinante pede uma cesta numa semana qualquer e devolve a resposta, sem conferir o status.
    def pedir(self, assinante_id, semana, tamanho):
        app.dependency_overrides[obter_usuario_atual] = lambda: Usuario(
            id=assinante_id, nome="Aline", tipo="assinante", email=f"aline{assinante_id}@example.com")
        resposta = self.cliente.post("/cestas", json={"semana": semana, "tamanho": tamanho})
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        return resposta

    # O auxiliar confere o conteúdo do cadastro usado pelos cenários de cesta.
    def criar_usuario(self, tipo="assinante"):
        self.numero_usuario = getattr(self, "numero_usuario", 0) + 1
        resposta = self.cliente.post("/usuarios", json={
            "nome": "Aline", "tipo": tipo,
            "email": f"aline{self.numero_usuario}@example.com", "senha": "teste1234",
        })
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.json()["tipo"], tipo)
        return resposta.json()["id"]

    # Cria uma cesta válida. O assinante_id falso no corpo deve ser ignorado: o dono vem do token.
    # Por padrão o produtor já aprova o pedido, porque só uma cesta em separação recebe produtos.
    def criar_cesta(self, assinante_id, tamanho="pequena", aprovar=True):
        app.dependency_overrides[obter_usuario_atual] = lambda: Usuario(
            id=assinante_id, nome="Aline", tipo="assinante", email=f"aline{assinante_id}@example.com"
        )
        resposta = self.cliente.post("/cestas", json={
            "assinante_id": 999, "semana": "2026-10-05", "tamanho": tamanho
        })
        # Restaura para o produtor para os próximos passos
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.json()["situacao"], "pedida")
        self.assertEqual(resposta.json()["assinante_id"], assinante_id)
        if aprovar:
            self.assertEqual(self.decidir(resposta.json()["id"], "aprovar").status_code, 200)
        return resposta.json()["id"]

    # O produtor aprova, reprova ou conclui uma cesta pelo PATCH.
    def decidir(self, cesta_id, acao):
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        return self.cliente.patch(f"/cestas/{cesta_id}/{acao}")

    # Evita duplicar a montagem da requisição de separação.
    def separar(self, cesta_id, quantidade):
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        return self.cliente.post(f"/cestas/{cesta_id}/produtos", json={
            "nome_produto": "Alface", "quantidade": quantidade
        })

    # Tipos inválidos não podem criar usuários nem aparecer na persistência.
    def test_usuarios_e_validacao(self):
        self.criar_usuario()
        self.criar_usuario("produtor")
        resposta = self.cliente.post("/usuarios", json={"nome": "Ana", "tipo": "outro"})
        self.assertEqual(resposta.status_code, 422)
        with self.Sessao() as sessao:
            self.assertEqual(len(sessao.query(Usuario).all()), 2)
        # A lista pública de usuários foi retirada: ela expunha o e-mail de todo mundo.
        self.assertEqual(self.cliente.get("/usuarios").status_code, 405)

    def test_email_unico_e_senha_em_hash(self):
        dados = {"nome": "Ana", "tipo": "assinante", "email": "ANA@example.com", "senha": "teste1234"}
        resposta = self.cliente.post("/usuarios", json=dados)
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.json()["email"], "ana@example.com")
        self.assertNotIn("senha", resposta.json())
        self.assertNotIn("senha_hash", resposta.json())
        self.assertEqual(self.cliente.post("/usuarios", json=dados).status_code, 409)
        self.assertEqual(self.cliente.post("/usuarios", json={**dados, "email": "invalido"}).status_code, 422)
        self.assertEqual(self.cliente.post("/usuarios", json={**dados, "senha": "exemplo"}).status_code, 422)
        with self.Sessao() as sessao:
            usuario = repositorio_usuario.buscar_por_email(sessao, " ANA@example.com ")
            self.assertEqual(usuario.id, resposta.json()["id"])
            self.assertTrue(usuario.senha_hash.startswith("$argon2id$"))
            self.assertTrue(verificar_senha(dados["senha"], usuario.senha_hash))
            self.assertNotEqual(usuario.senha_hash, dados["senha"])

    # Uma recusa não deve deixar cestas salvas para produtores ou usuários ausentes.
    def test_criacao_e_recusa_de_cestas(self):
        assinante = self.criar_usuario()
        produtor = self.criar_usuario("produtor")
        cesta = self.criar_cesta(assinante, aprovar=False)
        # Testar tentativa com perfil produtor (deve retornar 403)
        app.dependency_overrides[obter_usuario_atual] = lambda: Usuario(
            id=produtor, nome="Produtor", tipo="produtor", email="produtor@example.com"
        )
        resposta = self.cliente.post("/cestas", json={"semana": "2026-10-05", "tamanho": "media"})
        self.assertEqual(resposta.status_code, 403)

        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        self.assertEqual(len(self.cliente.get("/cestas").json()), 1)
        detalhe = self.cliente.get(f"/cestas/{cesta}").json()
        self.assertEqual(detalhe["quantidade_ocupada"], 0)
        self.assertEqual(detalhe["quantidade_restante"], 5)
        # O produtor vê o nome de quem pediu, mas não o e-mail nem a senha da assinante.
        self.assertEqual(detalhe["assinante"], {"id": assinante, "nome": "Aline"})
        self.assertEqual(self.cliente.get("/cestas").json()[0]["assinante"]["nome"], "Aline")

    # A soma deve considerar produtos anteriores e preservar dados após a recusa.
    def test_soma_das_quantidades_e_situacao(self):
        cesta = self.criar_cesta(self.criar_usuario())
        self.assertEqual(self.separar(cesta, 2).status_code, 201)
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "em_separacao")
        self.assertEqual(self.separar(cesta, 2).status_code, 201)
        detalhe = self.cliente.get(f"/cestas/{cesta}").json()
        self.assertEqual(detalhe["quantidade_ocupada"], 4)
        self.assertEqual(detalhe["quantidade_restante"], 1)
        self.assertEqual(self.separar(cesta, 2).status_code, 409)
        self.assertEqual(len(self.cliente.get(f"/cestas/{cesta}/produtos").json()), 2)
        depois = self.cliente.get(f"/cestas/{cesta}").json()
        self.assertEqual(depois, detalhe)

    # Todos os tamanhos aceitam o limite exato e recusam um item adicional.
    def test_limites_de_todos_os_tamanhos(self):
        assinante = self.criar_usuario()
        for tamanho, limite in [("pequena", 5), ("media", 8), ("grande", 12)]:
            with self.subTest(tamanho=tamanho):
                cesta = self.criar_cesta(assinante, tamanho)
                self.assertEqual(self.separar(cesta, limite + 1).status_code, 409)
                self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "em_separacao")
                self.assertEqual(self.cliente.get(f"/cestas/{cesta}/produtos").json(), [])
                self.assertEqual(self.separar(cesta, limite).status_code, 201)
                detalhe = self.cliente.get(f"/cestas/{cesta}").json()
                self.assertEqual(detalhe["limite_itens"], limite)
                self.assertEqual(detalhe["quantidade_ocupada"], limite)
                self.assertEqual(detalhe["quantidade_restante"], 0)
                self.assertEqual(detalhe["situacao"], "em_separacao")
                self.assertEqual(self.separar(cesta, 1).status_code, 409)

    # Os filtros precisam atuar tanto isoladamente quanto em conjunto.
    def test_filtros_combinados(self):
        primeiro = self.criar_usuario()
        segundo = self.criar_usuario()
        pequena = self.criar_cesta(primeiro)
        media = self.criar_cesta(primeiro, "media")
        outra_media = self.criar_cesta(segundo, "media")
        for consulta, esperados in [
            ("tamanho=media", {media, outra_media}),
            (f"assinante_id={primeiro}", {pequena, media}),
            (f"tamanho=media&assinante_id={primeiro}", {media}),
            ("assinante_id=999", set()),
        ]:
            resultado = self.cliente.get(f"/cestas?{consulta}").json()
            self.assertEqual({item["id"] for item in resultado}, esperados)

    # Entradas inválidas e situação enviada pelo cliente não devem gerar dados.
    def test_entradas_invalidas(self):
        assinante = self.criar_usuario()
        app.dependency_overrides[obter_usuario_atual] = lambda: Usuario(
            id=assinante, nome="Aline", tipo="assinante", email=f"aline{assinante}@example.com"
        )
        dados = {"semana": "2026-10-05", "tamanho": "pequena"}
        for mudanca in [{"tamanho": "gigante"}, {"semana": "invalida"}]:
            self.assertEqual(self.cliente.post("/cestas", json={**dados, **mudanca}).status_code, 422)
        cesta = self.criar_cesta(assinante)
        for quantidade in [0, -1, 1.5, True, "2"]:
            self.assertEqual(self.separar(cesta, quantidade).status_code, 422)
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}/produtos").json(), [])

    # Ausência precisa ser diferente de uma cesta existente e vazia.
    def test_cesta_ausente(self):
        self.assertEqual(self.cliente.get("/cestas/999").status_code, 404)
        self.assertEqual(self.cliente.get("/cestas/999/produtos").status_code, 404)
        self.assertEqual(self.separar(999, 1).status_code, 404)

    # Uma falha antes do INSERT não pode persistir a situação alterada pelo serviço.
    def test_transacao_desfaz_inclusao_ao_falhar(self):
        cesta = self.criar_cesta(self.criar_usuario())

        # A cesta já está em separação; a falha na gravação não pode deixar produto nenhum.
        def falhar_antes_de_salvar(sessao, cesta_id, dados):
            objeto = sessao.get(Cesta, cesta_id)
            self.assertEqual(objeto.situacao, "em_separacao")
            raise RuntimeError("Falha simulada na gravação.")

        with patch.object(repositorio_produto, "salvar", side_effect=falhar_antes_de_salvar):
            with self.assertRaises(RuntimeError):
                self.separar(cesta, 1)
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}/produtos").json(), [])
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "em_separacao")

    # Mesmo depois de enviar INSERT e UPDATE, falhar antes do commit desfaz ambos.
    def test_rollback_depois_das_gravacoes(self):
        cesta = self.criar_cesta(self.criar_usuario())

        # flush é usado somente na simulação para enviar as gravações sem confirmar.
        def falhar_no_commit(sessao):
            sessao.flush()
            raise RuntimeError("Falha antes de confirmar a transação.")

        with patch.object(Session, "commit", falhar_no_commit):
            with self.assertRaises(RuntimeError):
                self.separar(cesta, 1)
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}/produtos").json(), [])
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "em_separacao")

    # Cadastrar o mesmo produto de novo na semana soma, e não cria linha repetida.
    def test_estoque_soma_o_mesmo_produto(self):
        self.cadastrar_estoque("2026-10-19", "Tomate", 6)
        segunda = self.cadastrar_estoque("2026-10-19", "Tomate", 4)
        self.assertEqual(segunda["quantidade"], 10)
        self.cadastrar_estoque("2026-10-19", "Cenoura", 3)
        resumo = self.cliente.get("/estoques?semana=2026-10-19").json()
        self.assertEqual([item["nome_produto"] for item in resumo["itens"]], ["Cenoura", "Tomate"])
        self.assertEqual(resumo["total_colhido"], 13)
        self.assertEqual(resumo["tamanhos_liberados"], ["pequena", "media", "grande"])
        # Outra semana tem o estoque dela: a colheita não passa de uma semana para outra.
        vazia = self.cliente.get("/estoques?semana=2026-10-26").json()
        self.assertEqual((vazia["itens"], vazia["tamanhos_liberados"]), ([], []))

    # O pedido não depende do estoque: sem colheita lançada ele entra como pedida.
    # A reserva só conta as cestas aprovadas (em separação).
    def test_pedido_sem_estoque_e_reserva_na_aprovacao(self):
        assinante = self.criar_usuario()
        pedido = self.pedir(assinante, "2026-10-19", "grande")
        self.assertEqual(pedido.status_code, 201)
        self.assertEqual(pedido.json()["situacao"], "pedida")
        resumo = self.cliente.get("/estoques?semana=2026-10-19").json()
        self.assertEqual((resumo["total_colhido"], resumo["total_reservado"]), (0, 0))
        # Aprovar não confere o estoque: o produtor conta com a colheita que ainda vai lançar.
        self.assertEqual(self.decidir(pedido.json()["id"], "aprovar").status_code, 200)
        self.cadastrar_estoque("2026-10-19", "Couve", 8)
        resumo = self.cliente.get("/estoques?semana=2026-10-19").json()
        self.assertEqual((resumo["total_reservado"], resumo["itens_livres"]), (12, 0))
        # Cestas recusadas ou só pedidas não reservam nada.
        recusada = self.pedir(assinante, "2026-10-19", "media").json()["id"]
        self.assertEqual(self.decidir(recusada, "reprovar").status_code, 200)
        self.assertEqual(self.cliente.get("/estoques?semana=2026-10-19").json()["total_reservado"], 12)

    # O fluxo do pedido: pedida -> aprovar -> separar -> concluir, e pedida -> reprovar.
    def test_fluxo_do_pedido(self):
        assinante = self.criar_usuario()
        cesta = self.criar_cesta(assinante, aprovar=False)
        # Cesta pedida ainda não recebe produtos nem pode ser concluída.
        self.assertEqual(self.separar(cesta, 1).status_code, 409)
        self.assertEqual(self.decidir(cesta, "concluir").status_code, 409)
        self.assertEqual(self.decidir(cesta, "aprovar").json()["situacao"], "em_separacao")
        # Aprovar de novo, ou reprovar depois de aprovada, é recusado.
        self.assertEqual(self.decidir(cesta, "aprovar").status_code, 409)
        self.assertEqual(self.decidir(cesta, "reprovar").status_code, 409)
        # Concluir exige a cesta cheia.
        self.assertEqual(self.separar(cesta, 4).status_code, 201)
        incompleta = self.decidir(cesta, "concluir")
        self.assertEqual(incompleta.status_code, 409)
        self.assertEqual(incompleta.json()["detail"], "A cesta ainda não está cheia. Faltam 1 itens.")
        self.assertEqual(self.separar(cesta, 1).status_code, 201)
        self.assertEqual(self.decidir(cesta, "concluir").json()["situacao"], "concluida")
        # Concluída não recebe produtos nem muda de situação.
        self.assertEqual(self.separar(cesta, 1).status_code, 409)
        self.assertEqual(self.decidir(cesta, "concluir").status_code, 409)
        # Reprovada fica recusada para sempre e não recebe produtos.
        outra = self.criar_cesta(assinante, aprovar=False)
        self.assertEqual(self.decidir(outra, "reprovar").json()["situacao"], "recusada")
        self.assertEqual(self.separar(outra, 1).status_code, 409)
        self.assertEqual(self.decidir(outra, "aprovar").status_code, 409)
        self.assertEqual(self.decidir(999, "aprovar").status_code, 404)

    # Na separação, o produto precisa estar no estoque da semana e ter sobrado o bastante.
    def test_separacao_confere_o_estoque(self):
        assinante = self.criar_usuario()
        self.cadastrar_estoque("2026-10-19", "Beterraba", 6)
        self.cadastrar_estoque("2026-10-19", "Rúcula", 20)
        primeira = self.pedir(assinante, "2026-10-19", "pequena").json()["id"]
        segunda = self.pedir(assinante, "2026-10-19", "media").json()["id"]
        self.decidir(primeira, "aprovar")
        self.decidir(segunda, "aprovar")

        def produto(cesta, nome, quantidade):
            return self.cliente.post(f"/cestas/{cesta}/produtos",
                                     json={"nome_produto": nome, "quantidade": quantidade})

        recusa = produto(primeira, "Abóbora", 1)
        self.assertEqual(recusa.status_code, 409)
        self.assertEqual(recusa.json()["detail"], "Esse produto não foi colhido na semana desta cesta.")
        self.assertEqual(produto(primeira, "Beterraba", 4).status_code, 201)
        # Sobraram 2 beterrabas: a segunda cesta não leva 3, mesmo cabendo 8 nela.
        recusa = produto(segunda, "Beterraba", 3)
        self.assertEqual(recusa.status_code, 409)
        self.assertIn("Restam só 2 unidades", recusa.json()["detail"])
        self.assertEqual(produto(segunda, "Beterraba", 2).status_code, 201)
        itens = {i["nome_produto"]: i for i in self.cliente.get("/estoques?semana=2026-10-19").json()["itens"]}
        self.assertEqual((itens["Beterraba"]["separado"], itens["Beterraba"]["disponivel"]), (6, 0))
        self.assertEqual(itens["Rúcula"]["disponivel"], 20)

    # Uma cesta gravada numa quinta usa o estoque da segunda-feira da mesma semana,
    # e o filtro semana traz só as cestas daquela semana.
    def test_semana_vai_de_segunda_a_domingo(self):
        assinante = self.criar_usuario()
        self.cadastrar_estoque("2026-10-19", "Tomate", 12)
        quinta = self.pedir(assinante, "2026-10-22", "pequena")
        self.assertEqual(quinta.status_code, 201)
        # O pedido mandou a quinta, e a cesta foi gravada na segunda-feira, como diz o DER.
        self.assertEqual(quinta.json()["semana"], "2026-10-19")
        outra = self.criar_cesta(assinante)  # semana 2026-10-05
        self.decidir(quinta.json()["id"], "aprovar")
        resposta = self.cliente.post(f"/cestas/{quinta.json()['id']}/produtos",
                                     json={"nome_produto": "Tomate", "quantidade": 3})
        self.assertEqual(resposta.status_code, 201)
        resumo = self.cliente.get("/estoques?semana=2026-10-25").json()  # um domingo da mesma semana
        self.assertEqual((resumo["semana"], resumo["total_reservado"]), ("2026-10-19", 5))
        self.assertEqual(resumo["itens"][0]["disponivel"], 9)
        ids = {c["id"] for c in self.cliente.get("/cestas?semana=2026-10-19").json()}
        self.assertEqual(ids, {quinta.json()["id"]})
        self.assertNotIn(outra, ids)

    # Semanas fora da ordem de criação e empates devem produzir páginas sem repetição.
    def test_paginacao_e_ordem(self):
        assinante = self.criar_usuario()
        esperados = []
        for indice in range(23):
            semana = "2026-10-12" if indice % 2 == 0 else "2026-10-05"
            app.dependency_overrides[obter_usuario_atual] = lambda: Usuario(
                id=assinante, nome="Aline", tipo="assinante", email=f"aline{assinante}@example.com"
            )
            resposta = self.cliente.post("/cestas", json={"semana": semana, "tamanho": "media"})
            self.assertEqual(resposta.status_code, 201)
            esperados.append((semana, resposta.json()["id"]))
        esperados.sort(reverse=True)  # semana mais recente primeiro, e o id maior desempata
        recebidos = []
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_atual
        for pagina, quantidade in [(1, 10), (2, 10), (3, 3), (4, 0)]:
            resposta = self.cliente.get(f"/cestas?assinante_id={assinante}&tamanho=media&pagina={pagina}")
            self.assertEqual(resposta.status_code, 200)
            self.assertEqual(len(resposta.json()), quantidade)
            recebidos.extend((item["semana"], item["id"]) for item in resposta.json())
        self.assertEqual(recebidos, esperados)


# Estes testes validam SQL e HTTP sem substituir MySQL por outro banco.
class TestesSemConexao(unittest.TestCase):
    def setUp(self):
        self.usuario_teste = Usuario(id=1, nome="Vanderlei", tipo="produtor", email="vanderlei@example.com")
        app.dependency_overrides[obter_usuario_atual] = lambda: self.usuario_teste
        self.addCleanup(app.dependency_overrides.clear)

    def test_normalizacao_email_preserva_senha(self):
        dados = UsuarioCriacao(nome=" Ana ", tipo="assinante", email=" ANA@example.com ", senha=" teste1234 ")
        self.assertEqual(dados.email, "ana@example.com")
        self.assertEqual(dados.nome, "Ana")
        self.assertEqual(dados.senha, " teste1234 ")

    def test_senha_nunca_aparece_na_resposta(self):
        usuario = Usuario(id=1, nome="Ana", tipo="assinante", email="ana@example.com",
                          senha_hash="hash-reservado", criado_em=datetime(2026, 10, 7))
        app.dependency_overrides[obter_usuario_atual] = lambda: usuario
        with TestClient(app) as cliente:
            resposta = cliente.get("/usuarios/eu")
            self.assertEqual(resposta.status_code, 200)
            self.assertNotIn("senha", resposta.json())
            self.assertNotIn("senha_hash", resposta.json())
            self.assertNotIn("hash-reservado", resposta.text)
            with patch.object(servico_usuario, "cadastrar", return_value=usuario):
                resposta = cliente.post("/usuarios", json={"nome": "Ana", "tipo": "assinante", "email": "ana@example.com", "senha": "teste1234"})
                self.assertEqual(resposta.status_code, 201)
                self.assertNotIn("senha", resposta.json())
                self.assertNotIn("senha_hash", resposta.json())

    def test_credenciais_invalidas_recusadas(self):
        with TestClient(app) as cliente:
            with patch.object(servico_usuario, "cadastrar") as cadastrar:
                base = {"nome": "Ana", "tipo": "assinante", "email": "ana@example.com", "senha": "teste1234"}
                invalidos = [{**base, **extra} for extra in [
                    {"email": "invalido"}, {"senha": "curta"}, {"senha": "x" * 73},
                    {"senha": 12345678}, {"senha_hash": "hash-enviado"}, {"nome": "A"},
                    {"tipo": "executor"}, {"email": None}, {"senha": None},
                ]]
                invalidos.extend({k: v for k, v in base.items() if k != campo} for campo in ["email", "senha"])
                for dados in invalidos:
                    resposta = cliente.post("/usuarios", json=dados)
                    self.assertEqual(resposta.status_code, 422)
                cadastrar.assert_not_called()

    def test_email_duplicado_retorna_conflito(self):
        dados = UsuarioCriacao(nome="Ana", tipo="assinante", email="ana@example.com", senha="teste1234")
        with patch.object(repositorio_usuario, "buscar_por_email", return_value=Usuario(id=1)):
            with patch.object(repositorio_usuario, "salvar") as salvar:
                with self.assertRaises(EmailEmUso):
                    servico_usuario.cadastrar(Mock(), dados)
                salvar.assert_not_called()
        with TestClient(app) as cliente:
            with patch.object(servico_usuario, "cadastrar", side_effect=EmailEmUso("E-mail já cadastrado.")):
                self.assertEqual(cliente.post("/usuarios", json=dados.model_dump()).status_code, 409)

    def test_conflito_simultaneo_desfaz_sessao(self):
        dados = UsuarioCriacao(nome="Ana", tipo="assinante", email="ana@example.com", senha="teste1234")
        origem = Exception("Duplicado")
        origem.errno = 1062
        erro = IntegrityError("INSERT", {}, origem)
        sessao = Mock()
        sessao.commit.side_effect = erro
        with patch.object(repositorio_usuario, "buscar_por_email", return_value=None):
            with self.assertRaises(EmailEmUso):
                servico_usuario.cadastrar(sessao, dados)
        sessao.rollback.assert_called_once()
        sessao.refresh.assert_not_called()

    def test_erro_de_banco_nao_e_tratado_como_email_duplicado(self):
        dados = UsuarioCriacao(nome="Ana", tipo="assinante", email="ana@example.com", senha="teste1234")
        origem = Exception("Outra falha")
        origem.errno = 1048
        erro = IntegrityError("INSERT", {}, origem)
        with patch.object(repositorio_usuario, "buscar_por_email", return_value=None):
            with patch.object(repositorio_usuario, "salvar", side_effect=erro):
                with self.assertRaises(IntegrityError):
                    servico_usuario.cadastrar(Mock(), dados)

    def test_servico_envia_apenas_hash_ao_repositorio(self):
        dados = UsuarioCriacao(nome="Ana", tipo="assinante", email="ana@example.com", senha="teste1234")
        with patch.object(repositorio_usuario, "buscar_por_email", return_value=None):
            with patch.object(repositorio_usuario, "salvar") as salvar:
                servico_usuario.cadastrar(Mock(), dados)
                enviados = salvar.call_args.args[1]
                self.assertNotIn("senha", enviados)
                self.assertTrue(enviados["senha_hash"].startswith("$argon2id$"))
                self.assertTrue(verificar_senha(dados.senha, enviados["senha_hash"]))
                self.assertFalse(verificar_senha("senha-errada", enviados["senha_hash"]))

    # A lista pública de usuários não existe mais; só o cadastro e o /usuarios/eu.
    def test_lista_publica_de_usuarios_foi_retirada(self):
        app.dependency_overrides.clear()
        with TestClient(app) as cliente:
            self.assertEqual(cliente.get("/usuarios").status_code, 405)

    # Usuário antigo, sem senha, não consegue entrar.
    def test_usuario_sem_senha_nao_autentica(self):
        antigo = Usuario(id=1, nome="Ana", tipo="assinante", email="ana@example.com", senha_hash=None)
        with patch.object(repositorio_usuario, "buscar_por_email", return_value=antigo):
            self.assertIsNone(servico_usuario.autenticar(Mock(), "ana@example.com", "teste1234"))

    def test_busca_email_normaliza_e_filtra(self):
        sessao = Mock()
        repositorio_usuario.buscar_por_email(sessao, " ANA@example.com ")
        sql = str(sessao.scalar.call_args.args[0].compile(
            dialect=mysql.dialect(), compile_kwargs={"literal_binds": True}))
        self.assertIn("usuarios.email = 'ana@example.com'", sql)

    # Compilar no dialeto MySQL confere filtro, ordem e deslocamento da página.
    def test_consulta_mysql_filtrada_e_paginada(self):
        sessao = Mock()
        sessao.scalars.return_value.all.return_value = []
        repositorio_cesta.listar(sessao, "media", 7, 3)
        consulta = sessao.scalars.call_args.args[0]
        sql = str(consulta.compile(dialect=mysql.dialect(), compile_kwargs={"literal_binds": True}))
        self.assertIn("cestas.tamanho = 'media'", sql)
        self.assertIn("cestas.assinante_id = 7", sql)
        self.assertIn("ORDER BY cestas.semana DESC, cestas.id DESC", sql)
        self.assertIn("LIMIT 20, 10", sql)

    # A primeira página sem filtros ainda deve ter limite e ordem no banco.
    def test_consulta_sem_filtro(self):
        sessao = Mock()
        repositorio_cesta.listar(sessao)
        consulta = sessao.scalars.call_args.args[0]
        sql = str(consulta.compile(dialect=mysql.dialect(), compile_kwargs={"literal_binds": True}))
        self.assertNotIn("WHERE", sql)
        self.assertIn("LIMIT 0, 10", sql)

    # Entradas inválidas devem ser recusadas antes de chegar ao serviço.
    def test_pagina_invalida(self):
        with TestClient(app) as cliente:
            with patch.object(servico_cesta, "listar") as listar:
                for pagina in ["0", "-1", "abc", "1.5"]:
                    self.assertEqual(cliente.get(f"/cestas?pagina={pagina}").status_code, 422)
                listar.assert_not_called()

    # A rota precisa repassar a página padrão e os filtros para o serviço.
    def test_rota_encaminha_pagina_e_filtros(self):
        with TestClient(app) as cliente:
            with patch.object(servico_cesta, "listar", return_value=[]) as listar:
                self.assertEqual(cliente.get("/cestas").status_code, 200)
                self.assertEqual(listar.call_args.args[1:], (self.usuario_teste, None, None, 1, None))
                self.assertEqual(cliente.get("/cestas?tamanho=media&assinante_id=7&pagina=3&semana=2026-10-22").status_code, 200)
                self.assertEqual(listar.call_args.args[1:], (self.usuario_teste, "media", 7, 3, date(2026, 10, 22)))
                self.assertEqual(cliente.get("/cestas?semana=ontem").status_code, 422)

    # O serviço decide o que cada perfil vê: a assinante não escapa do filtro com assinante_id.
    def test_servico_lista_so_as_cestas_da_assinante(self):
        assinante = Usuario(id=2, nome="Aline", tipo="assinante")
        with patch.object(repositorio_cesta, "listar", return_value=[]) as listar:
            servico_cesta.listar(Mock(), assinante, "media", 7, 1)
            self.assertEqual(listar.call_args.args[1:], ("media", 2, 1, None))
            # Uma quinta-feira vira a segunda-feira da mesma semana antes de chegar ao repositório.
            servico_cesta.listar(Mock(), self.usuario_teste, "media", 7, 1, date(2026, 10, 22))
            self.assertEqual(listar.call_args.args[1:], ("media", 7, 1, date(2026, 10, 19)))

    # A regra recusa com exceção, antes de gravar, e não muda a situação.
    def test_regra_do_limite_levanta_excecao(self):
        cesta = Cesta(id=10, tamanho="pequena", situacao="em_separacao", semana=date(2026, 10, 5))
        cesta.produtos_separados = [ProdutoSeparado(nome_produto="Alface", quantidade=4)]
        dados = Mock(quantidade=2)
        with patch.object(repositorio_produto, "salvar") as salvar:
            with self.assertRaises(LimiteDaCestaExcedido):
                servico_produto.separar(Mock(), cesta, dados)
            salvar.assert_not_called()
        self.assertEqual(cesta.situacao, "em_separacao")

    # Token com uma letra trocada ou inventado não identifica ninguém: a rota devolve 401.
    def test_token_adulterado_retorna_401(self):
        token = criar_token(1)
        self.assertEqual(ler_token(token), 1)
        trocado = token[:-3] + ("AAA" if token[-3:] != "AAA" else "BBB")
        self.assertIsNone(ler_token(trocado))
        self.assertIsNone(ler_token("inventado"))
        # Assinados com a chave certa, mas sem sub ou com sub que não é número: antes davam 500.
        validade = datetime.now(timezone.utc) + timedelta(minutes=5)
        sem_sub = jwt.encode({"exp": validade}, seguranca.configuracao["chave_do_token"], algorithm="HS256")
        sub_texto = jwt.encode({"sub": "abc", "exp": validade}, seguranca.configuracao["chave_do_token"],
                               algorithm="HS256")
        self.assertIsNone(ler_token(sem_sub))
        self.assertIsNone(ler_token(sub_texto))
        app.dependency_overrides.clear()
        with TestClient(app) as cliente:
            resposta = cliente.get("/cestas", headers={"Authorization": "Bearer inventado"})
            self.assertEqual(resposta.status_code, 401)

    # Testes específicos de autenticação e perfis da aula 08
    def test_rotas_protegidas_sem_token_retornam_401(self):
        app.dependency_overrides.clear()
        with TestClient(app) as cliente:
            self.assertEqual(cliente.get("/cestas").status_code, 401)
            self.assertEqual(cliente.get("/usuarios/eu").status_code, 401)
            self.assertEqual(cliente.post("/cestas", json={"semana": "2026-10-05", "tamanho": "pequena"}).status_code, 401)
            self.assertEqual(cliente.post("/cestas/1/produtos", json={"nome_produto": "Alface", "quantidade": 1}).status_code, 401)

    def test_login_sucesso_retorna_jwt_e_falha_retorna_401(self):
        usuario = Usuario(id=1, nome="Vanderlei", tipo="produtor", email="vanderlei@example.com")
        with patch.object(servico_usuario, "autenticar", return_value=usuario):
            with TestClient(app) as cliente:
                res = cliente.post("/login", data={"username": "vanderlei@example.com", "password": "correta"})
                self.assertEqual(res.status_code, 200)
                self.assertIn("access_token", res.json())
                self.assertEqual(res.json()["token_type"], "bearer")

        with patch.object(servico_usuario, "autenticar", return_value=None):
            with TestClient(app) as cliente:
                res = cliente.post("/login", data={"username": "vanderlei@example.com", "password": "incorreta"})
                self.assertEqual(res.status_code, 401)
                self.assertEqual(res.json()["detail"], "E-mail ou senha incorretos")

    def test_grupo_assinante_sem_permissao_de_separar_recebe_403(self):
        assinante = Usuario(id=2, nome="Aline", tipo="assinante", email="aline@example.com")
        app.dependency_overrides[obter_usuario_atual] = lambda: assinante
        with TestClient(app) as cliente:
            res = cliente.post("/cestas/1/produtos", json={"nome_produto": "Alface", "quantidade": 1})
            self.assertEqual(res.status_code, 403)
            self.assertEqual(res.json()["detail"], "Seu grupo não pode separar produtos")

    # [NOVO · grupos] A tabela GRUPOS libera para cada persona só as permissões dela.
    def test_permissoes_de_cada_grupo(self):
        assinante = Usuario(tipo="assinante")
        produtor = Usuario(tipo="produtor")
        for permissao in ["conta:ver", "cestas:pedir", "cestas:ver", "estoque:ver"]:
            self.assertTrue(tem_permissao(assinante, permissao), permissao)
        for permissao in ["cestas:ver_todas", "cestas:aprovar", "cestas:concluir",
                          "produtos:separar", "estoque:cadastrar"]:
            self.assertFalse(tem_permissao(assinante, permissao), permissao)
        for permissao in ["conta:ver", "cestas:ver", "cestas:ver_todas", "cestas:aprovar",
                          "cestas:concluir", "produtos:separar", "estoque:cadastrar", "estoque:ver"]:
            self.assertTrue(tem_permissao(produtor, permissao), permissao)
        self.assertFalse(tem_permissao(produtor, "cestas:pedir"))

    # [NOVO · grupos] Um grupo que não está na tabela não tem permissão nenhuma (negar por padrão).
    def test_grupo_desconhecido_nao_tem_permissao(self):
        intruso = Usuario(id=3, nome="X", tipo="visitante")
        self.assertEqual(GRUPOS.get("visitante"), None)
        app.dependency_overrides[obter_usuario_atual] = lambda: intruso
        with TestClient(app) as cliente:
            self.assertEqual(cliente.get("/usuarios/eu").status_code, 403)
            self.assertEqual(cliente.get("/cestas").status_code, 403)
            self.assertEqual(cliente.get("/cestas/1").status_code, 403)
            self.assertEqual(cliente.post("/cestas", json={"semana": "2026-10-05", "tamanho": "pequena"}).status_code, 403)

    # [NOVO · grupos] O grupo produtor não pede cesta: a permissão cestas:pedir é só da assinante.
    def test_grupo_produtor_sem_permissao_de_pedir_recebe_403(self):
        with TestClient(app) as cliente:
            res = cliente.post("/cestas", json={"semana": "2026-10-05", "tamanho": "pequena"})
            self.assertEqual(res.status_code, 403)
            self.assertEqual(res.json()["detail"], "Seu grupo não pode pedir cestas")

    # [NOVO · grupos] A assinante vê o estoque, mas não cadastra a colheita.
    def test_assinante_nao_cadastra_estoque(self):
        assinante = Usuario(id=2, nome="Aline", tipo="assinante", email="aline@example.com")
        app.dependency_overrides[obter_usuario_atual] = lambda: assinante
        with TestClient(app) as cliente:
            with patch.object(servico_estoque, "cadastrar") as cadastrar:
                res = cliente.post("/estoques", json={"semana": "2026-10-19", "nome_produto": "Alface", "quantidade": 3})
                self.assertEqual(res.status_code, 403)
                self.assertEqual(res.json()["detail"], "Seu grupo não pode cadastrar o estoque")
                cadastrar.assert_not_called()
            with patch.object(servico_estoque, "resumo_da_semana", return_value={
                    "semana": "2026-10-19", "itens": [], "total_colhido": 0, "total_reservado": 0,
                    "itens_livres": 0, "tamanhos_liberados": []}):
                self.assertEqual(cliente.get("/estoques?semana=2026-10-19").status_code, 200)

    # Sem a semana, ou com quantidade que não é inteiro positivo, o estoque recusa com 422.
    def test_estoque_entradas_invalidas(self):
        with TestClient(app) as cliente:
            self.assertEqual(cliente.get("/estoques").status_code, 422)
            with patch.object(servico_estoque, "cadastrar") as cadastrar:
                base = {"semana": "2026-10-19", "nome_produto": "Alface", "quantidade": 3}
                for mudanca in [{"quantidade": 0}, {"quantidade": 1.5}, {"quantidade": "2"},
                                {"nome_produto": "  "}, {"semana": "ontem"}, {"extra": 1}]:
                    self.assertEqual(cliente.post("/estoques", json={**base, **mudanca}).status_code, 422)
                cadastrar.assert_not_called()

    # As regras do pedido e do estoque recusam com exceção, antes de gravar.
    def test_regras_do_pedido_levantam_excecao(self):
        pedida = Cesta(id=10, tamanho="grande", situacao="pedida", semana=date(2026, 10, 19))
        pedida.produtos_separados = []
        with patch.object(repositorio_produto, "salvar") as salvar:
            with self.assertRaises(CestaNaoEmSeparacao):
                servico_produto.separar(Mock(), pedida, Mock(nome_produto="Alface", quantidade=1))
            with self.assertRaises(CestaNaoEmSeparacao):
                servico_cesta.concluir(Mock(), pedida)
            salvar.assert_not_called()
        em_separacao = Cesta(id=11, tamanho="pequena", situacao="em_separacao", semana=date(2026, 10, 19))
        em_separacao.produtos_separados = [ProdutoSeparado(nome_produto="Alface", quantidade=4)]
        with patch.object(repositorio_cesta, "atualizar") as atualizar:
            with self.assertRaises(CestaIncompleta):
                servico_cesta.concluir(Mock(), em_separacao)
            with self.assertRaises(CestaNaoPedida):
                servico_cesta.aprovar(Mock(), em_separacao)
            with self.assertRaises(CestaNaoPedida):
                servico_cesta.reprovar(Mock(), em_separacao)
            atualizar.assert_not_called()
        self.assertEqual(em_separacao.situacao, "em_separacao")
        cesta = Cesta(id=12, tamanho="grande", situacao="em_separacao", semana=date(2026, 10, 19))
        cesta.produtos_separados = []
        with patch.object(servico_produto, "disponivel_do_produto", return_value=(Mock(nome_produto="Alface"), 2)):
            with patch.object(repositorio_produto, "salvar") as salvar:
                with self.assertRaises(EstoqueInsuficiente):
                    servico_produto.separar(Mock(), cesta, Mock(nome_produto="Alface", quantidade=3))
                salvar.assert_not_called()

    # O pedido só vale para a semana atual: passada ou futura levanta exceção, e a atual passa.
    def test_pedido_so_vale_para_a_semana_atual(self):
        hoje = date.today()
        servico_cesta.conferir_semana_do_pedido(hoje)
        for semana in [hoje - timedelta(days=7), hoje + timedelta(days=7)]:
            with self.assertRaises(SemanaForaDoPedido):
                servico_cesta.conferir_semana_do_pedido(semana)

    # [NOVO · grupos] A assinante não aprova, reprova nem conclui: recebe 403 antes de qualquer busca.
    def test_assinante_nao_decide_o_pedido(self):
        assinante = Usuario(id=2, nome="Aline", tipo="assinante", email="aline@example.com")
        app.dependency_overrides[obter_usuario_atual] = lambda: assinante
        with TestClient(app) as cliente:
            for acao in ["aprovar", "reprovar", "concluir"]:
                self.assertEqual(cliente.patch(f"/cestas/1/{acao}").status_code, 403, acao)

    def test_assinante_acessando_cesta_alheia_retorna_403(self):
        assinante = Usuario(id=2, nome="Aline", tipo="assinante", email="aline@example.com")
        app.dependency_overrides[obter_usuario_atual] = lambda: assinante
        cesta_alheia = Cesta(id=10, assinante_id=999, tamanho="pequena", situacao="pedida")
        with patch.object(servico_cesta, "buscar_por_id", return_value=cesta_alheia):
            with TestClient(app) as cliente:
                res = cliente.get("/cestas/10")
                self.assertEqual(res.status_code, 403)
                self.assertEqual(res.json()["detail"], "Esta cesta não é sua")
                res_produtos = cliente.get("/cestas/10/produtos")
                self.assertEqual(res_produtos.status_code, 403)
                self.assertEqual(res_produtos.json()["detail"], "Esta cesta não é sua")


# unittest executa os cenários sem exigir uma biblioteca adicional de testes.
if __name__ == "__main__":
    unittest.main(verbosity=2)
