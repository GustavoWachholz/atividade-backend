import unittest
from datetime import datetime
from unittest.mock import Mock, patch

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
from servicos.excecoes import EmailEmUso
from security import verificar_senha
from sqlalchemy.exc import IntegrityError
from repositorios import cesta as repositorio_cesta
from repositorios import produto_separado as repositorio_produto
from servicos import cesta as servico_cesta


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
        self.addCleanup(app.dependency_overrides.clear)
        self.cliente = TestClient(app)
        self.addCleanup(self.cliente.close)

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

    # Cria uma cesta válida para os testes de capacidade e consulta.
    def criar_cesta(self, assinante_id, tamanho="pequena"):
        resposta = self.cliente.post("/cestas", json={
            "assinante_id": assinante_id, "semana": "2026-10-05", "tamanho": tamanho
        })
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.json()["situacao"], "pedida")
        return resposta.json()["id"]

    # Evita duplicar a montagem da requisição de separação.
    def separar(self, cesta_id, quantidade):
        return self.cliente.post(f"/cestas/{cesta_id}/produtos", json={
            "nome_produto": "Alface", "quantidade": quantidade
        })

    # Tipos inválidos não podem criar usuários nem aparecer na persistência.
    def test_usuarios_e_validacao(self):
        self.criar_usuario()
        self.criar_usuario("produtor")
        resposta = self.cliente.post("/usuarios", json={"nome": "Ana", "tipo": "outro"})
        self.assertEqual(resposta.status_code, 422)
        usuarios = self.cliente.get("/usuarios").json()
        self.assertEqual(len(usuarios), 2)
        self.assertEqual(len(self.cliente.get("/usuarios?tipo=produtor").json()), 1)

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
        cesta = self.criar_cesta(assinante)
        for usuario_id, codigo in [(produtor, 409), (999, 404)]:
            resposta = self.cliente.post("/cestas", json={
                "assinante_id": usuario_id, "semana": "2026-10-05", "tamanho": "media"
            })
            self.assertEqual(resposta.status_code, codigo)
        self.assertEqual(len(self.cliente.get("/cestas").json()), 1)
        detalhe = self.cliente.get(f"/cestas/{cesta}").json()
        self.assertEqual(detalhe["quantidade_ocupada"], 0)
        self.assertEqual(detalhe["quantidade_restante"], 5)

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
                self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "pedida")
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
        dados = {"assinante_id": assinante, "semana": "2026-10-05", "tamanho": "pequena"}
        for mudanca in [{"tamanho": "gigante"}, {"semana": "invalida"}, {"situacao": "pedida"}]:
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

        # Confere que a regra já mudou a cesta, reproduzindo o exercício do slide.
        def falhar_antes_de_salvar(sessao, cesta_id, dados):
            objeto = sessao.get(Cesta, cesta_id)
            self.assertEqual(objeto.situacao, "em_separacao")
            raise RuntimeError("Falha simulada na gravação.")

        with patch.object(repositorio_produto, "salvar", side_effect=falhar_antes_de_salvar):
            with self.assertRaises(RuntimeError):
                self.separar(cesta, 1)
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}/produtos").json(), [])
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "pedida")

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
        self.assertEqual(self.cliente.get(f"/cestas/{cesta}").json()["situacao"], "pedida")

    # Semanas fora da ordem de criação e empates devem produzir páginas sem repetição.
    def test_paginacao_e_ordem(self):
        assinante = self.criar_usuario()
        esperados = []
        for indice in range(23):
            semana = "2026-10-12" if indice % 2 == 0 else "2026-10-05"
            resposta = self.cliente.post("/cestas", json={
                "assinante_id": assinante, "semana": semana, "tamanho": "media"
            })
            self.assertEqual(resposta.status_code, 201)
            esperados.append((semana, resposta.json()["id"]))
        esperados.sort()
        recebidos = []
        for pagina, quantidade in [(1, 10), (2, 10), (3, 3), (4, 0)]:
            resposta = self.cliente.get(f"/cestas?assinante_id={assinante}&tamanho=media&pagina={pagina}")
            self.assertEqual(resposta.status_code, 200)
            self.assertEqual(len(resposta.json()), quantidade)
            recebidos.extend((item["semana"], item["id"]) for item in resposta.json())
        self.assertEqual(recebidos, esperados)


# Estes testes validam SQL e HTTP sem substituir MySQL por outro banco.
class TestesSemConexao(unittest.TestCase):
    def test_normalizacao_email_preserva_senha(self):
        dados = UsuarioCriacao(nome=" Ana ", tipo="assinante", email=" ANA@example.com ", senha=" teste1234 ")
        self.assertEqual(dados.email, "ana@example.com")
        self.assertEqual(dados.nome, "Ana")
        self.assertEqual(dados.senha, " teste1234 ")

    def test_senha_nunca_aparece_na_resposta(self):
        usuario = Usuario(id=1, nome="Ana", tipo="assinante", email="ana@example.com",
                          senha_hash="hash-reservado", criado_em=datetime(2026, 10, 7))
        with TestClient(app) as cliente:
            with patch.object(servico_usuario, "listar", return_value=[usuario]):
                resposta = cliente.get("/usuarios")
                self.assertEqual(resposta.status_code, 200)
                self.assertNotIn("senha", resposta.json()[0])
                self.assertNotIn("senha_hash", resposta.json()[0])
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

    def test_usuarios_antigos_continuam_listados(self):
        usuario = Usuario(id=1, nome="Ana", tipo="assinante", email=None,
                          senha_hash=None, criado_em=datetime(2026, 10, 7))
        with TestClient(app) as cliente:
            with patch.object(servico_usuario, "listar", return_value=[usuario]):
                resposta = cliente.get("/usuarios")
                self.assertEqual(resposta.status_code, 200)
                self.assertIsNone(resposta.json()[0]["email"])
                self.assertNotIn("senha_hash", resposta.json()[0])

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
        self.assertIn("ORDER BY cestas.semana, cestas.id", sql)
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
                self.assertEqual(listar.call_args.args[1:], (None, None, 1))
                self.assertEqual(cliente.get("/cestas?tamanho=media&assinante_id=7&pagina=3").status_code, 200)
                self.assertEqual(listar.call_args.args[1:], ("media", 7, 3))


# unittest executa os cenários sem exigir uma biblioteca adicional de testes.
if __name__ == "__main__":
    unittest.main(verbosity=2)
