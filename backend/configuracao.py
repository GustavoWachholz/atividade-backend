import os
from pathlib import Path

from dotenv import load_dotenv

# A configuração é o único ponto de leitura do ambiente da máquina.
load_dotenv(Path(__file__).parent / ".env")
URL_DO_BANCO = os.getenv("URL_DO_BANCO")
# A URL de testes aponta para um banco separado, nunca para os dados do projeto.
URL_DO_BANCO_TESTE = os.getenv("URL_DO_BANCO_TESTE")
ORIGEM_FRONTEND = os.getenv("ORIGEM_FRONTEND", "http://localhost:5173")
# A chave é opcional: sem ela a API sobe normalmente, e só o pré-preenchimento fica indisponível.
CHAVE_DA_IA = os.getenv("CHAVE_DA_IA")
# O código do modo suporte, que libera o cadastro de produtor. Vazio, a rota fica desligada.
# Gere com: python -c "import secrets; print(secrets.token_urlsafe(32))"
CODIGO_DE_SUPORTE = os.getenv("CODIGO_DE_SUPORTE", "").strip()
# Os modelos tentados em ordem, separados por vírgula. Os Flash-Lite responderam em 3 a 24 s nos testes;
# o 3.8 Flash passou de 50 s e estourava o tempo. Se um estiver sobrecarregado, o seguinte é tentado.
MODELOS_DA_IA = [modelo.strip() for modelo in
                 os.getenv("MODELOS_DA_IA", "gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",")
                 if modelo.strip()]


# obter_configuracao reúne os valores que o seguranca.py precisa sem importar variáveis soltas.
def obter_configuracao():
    return {
        "chave_do_token": os.getenv("CHAVE_DO_TOKEN"),
    }
